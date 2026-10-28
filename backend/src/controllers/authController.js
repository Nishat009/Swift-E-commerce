// Sign-in and session: register, password login, email-code login, refresh and logout.
// Profile, password reset and two-factor settings live in their own controllers.
const User = require('../models/User');
const { generateAccessToken } = require('../utils/generateTokens');
const { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } = require('../services/refreshSessions');
const { sendSuccess, sendError } = require('../utils/response');
const crypto = require('crypto');
const AuthChallenge = require('../models/AuthChallenge');
const { noteSignIn, cookieOptions, publicUser, requestSecondFactor, challengeQuery, clearChallenge } = require('../utils/authSession');
const { fire: fireEmail, sendWelcome, sendLoginOtp } = require('../services/emailService');
const { LOGIN_MAX_FAILURES, LOGIN_LOCK_MS, devCodesAllowed } = require('../config/security');

const recordFailedLogin = async (userId) => {
  const updated = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { failedLoginAttempts: 1 } },
    { new: true, projection: { failedLoginAttempts: 1 } }
  );
  if (updated && updated.failedLoginAttempts >= LOGIN_MAX_FAILURES) {
    await User.updateOne(
      { _id: userId },
      { $set: { failedLoginAttempts: 0, lockUntil: new Date(Date.now() + LOGIN_LOCK_MS) } }
    );
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User already exists', 400);
    }

    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    noteSignIn(res, user, 'Registered');
    const accessToken = generateAccessToken(user);
    const refreshToken = await issueRefreshToken(user, true, req);

    // Store refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, cookieOptions(true));
    fireEmail(sendWelcome(user));

    return sendSuccess(res, 'User registered successfully', {
      user: publicUser(user),
      accessToken,
      // Refresh token is intentionally only stored in the HttpOnly cookie.
    }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get tokens
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { email, password, rememberMe } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password +twoFactorSecret +twoFactorRecoveryCodes +lockUntil');
    if (user && user.lockUntil && user.lockUntil > new Date()) {
      const seconds = Math.ceil((user.lockUntil - Date.now()) / 1000);
      return sendError(res, `Too many failed attempts. Try again in ${seconds} seconds.`, 429, { retryAfter: seconds });
    }
    if (!user || !(await user.matchPassword(password))) {
      if (user) await recordFailedLogin(user._id);
      return sendError(res, 'Invalid email or password', 401);
    }
    await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } });

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return await requestSecondFactor(req, res, user, !!rememberMe);
    }

    noteSignIn(res, user, 'Signed in with password');
    const accessToken = generateAccessToken(user);
    const refreshToken = await issueRefreshToken(user, !!rememberMe, req);

    // Store refresh token in HttpOnly cookie
    // Only set maxAge when "Remember Me" is checked; otherwise use a session cookie
    res.cookie('refreshToken', refreshToken, cookieOptions(!!rememberMe));

    return sendSuccess(res, 'User logged in successfully', {
      user: publicUser(user),
      accessToken,
      // Refresh token is intentionally only stored in the HttpOnly cookie.
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  try {
    await AuthChallenge.deleteOne(challengeQuery(req, 'two-factor'));
    await AuthChallenge.deleteOne(challengeQuery(req, 'google'));
    clearChallenge(res, 'two-factor');
    clearChallenge(res, 'google');
    // The server-side session ends too, so a copied refresh cookie stops working
    await revokeRefreshToken(req.cookies.refreshToken || req.body?.refreshToken);
  } catch (error) {
    return next(error);
  }
  res.clearCookie('refreshToken', cookieOptions());
  res.clearCookie('accessToken', cookieOptions());
  return sendSuccess(res, 'Logged out successfully');
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    return sendError(res, 'No refresh token provided', 401);
  }

  try {
    // Rotates the session secret; null for an invalid, expired, revoked or replayed token
    const session = await rotateRefreshToken(token);
    if (!session) {
      res.clearCookie('refreshToken', cookieOptions());
      return sendError(res, 'Invalid refresh token', 401);
    }

    // Same lifetime as the original sign-in: persistent only when "remember me" was ticked
    res.cookie('refreshToken', session.token, cookieOptions(session.rememberMe));

    return sendSuccess(res, 'Access token refreshed successfully', { accessToken: generateAccessToken(session.user) });
  } catch (error) {
    return next(error);
  }
};

// @desc    Request login OTP code
// @route   POST /api/auth/request-otp
// @access  Public
const requestOTP = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email }).select('+otpCode +otpExpires +otpAttempts +otpRequestedAt');
    const genericMessage = 'If an eligible account exists, an OTP has been sent to its email.';
    if (!user) return sendSuccess(res, genericMessage);

    if (user.role !== 'customer') return sendSuccess(res, genericMessage);

    if (user.otpRequestedAt && Date.now() - user.otpRequestedAt.getTime() < 60 * 1000) {
      return sendError(res, 'Please wait one minute before requesting another OTP', 429);
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    user.otpCode = crypto.createHash('sha256').update(otp).digest('hex');
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.otpAttempts = 0;
    user.otpRequestedAt = new Date();
    await user.save();

    fireEmail(sendLoginOtp(user, otp));

    const data = {};
    if (devCodesAllowed()) {
      data.developmentCode = otp;
    }
    return sendSuccess(res, genericMessage, data);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify login OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
  const { email, otp, rememberMe } = req.body;
  try {
    const user = await User.findOne({ email }).select('+otpCode +otpExpires +otpAttempts');
    if (!user) {
      return sendError(res, 'Invalid OTP code', 400);
    }

    if ((user.otpAttempts || 0) >= 5) {
      return sendError(res, 'Too many invalid OTP attempts. Request a new code.', 429);
    }

    const otpHash = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
    if (!user.otpCode || user.otpCode !== otpHash) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save({ validateBeforeSave: false });
      return sendError(res, 'Invalid OTP code', 400);
    }

    if (Date.now() > user.otpExpires) {
      return sendError(res, 'OTP code expired. Please request a new one', 400);
    }

    user.otpCode = '';
    user.otpExpires = null;
    user.otpAttempts = 0;
    await user.save();

    if (user.twoFactorEnabled) {
      return await requestSecondFactor(req, res, user, !!rememberMe);
    }

    noteSignIn(res, user, 'Signed in with email code');
    const accessToken = generateAccessToken(user);
    const refreshToken = await issueRefreshToken(user, !!rememberMe, req);

    res.cookie('refreshToken', refreshToken, cookieOptions(!!rememberMe));

    return sendSuccess(res, 'Logged in successfully', {
      user: publicUser(user),
      accessToken,
      // Refresh token is intentionally only stored in the HttpOnly cookie.
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  requestOTP,
  verifyOTP,
};
