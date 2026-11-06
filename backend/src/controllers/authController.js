// Sign-in and session: register, password login, email-code login, refresh and logout.
// Profile, password reset and two-factor settings live in their own controllers; the
// email-code (OTP) logic lives in services/otpService.js.
const User = require('../models/User');
const { generateAccessToken } = require('../utils/generateTokens');
const { rotateRefreshToken, revokeRefreshToken, getRefreshTokenFromRequest } = require('../services/refreshSessions');
const { issueLoginOtp, checkLoginOtp } = require('../services/otpService');
const { sendSuccess, sendError } = require('../utils/response');
const AuthChallenge = require('../models/AuthChallenge');
const { cookieOptions, requestSecondFactor, challengeQuery, clearChallenge, sendSession } = require('../utils/authSession');
const { fire: fireEmail, sendWelcome, sendLoginOtp } = require('../services/emailService');
const { LOGIN_MAX_FAILURES, LOGIN_LOCK_MS, devCodesAllowed } = require('../config/security');

// One atomic update: count the failure and, on reaching the limit, set the lock and reset the
// counter in the same write, so concurrent failures can never leave a half-applied state.
const recordFailedLogin = (userId) => {
  const attempts = { $add: [{ $ifNull: ['$failedLoginAttempts', 0] }, 1] };
  const reachedLimit = { $gte: [attempts, LOGIN_MAX_FAILURES] };
  return User.updateOne({ _id: userId }, [{
    $set: {
      failedLoginAttempts: { $cond: [reachedLimit, 0, attempts] },
      lockUntil: { $cond: [reachedLimit, new Date(Date.now() + LOGIN_LOCK_MS), '$lockUntil'] },
    },
  }]);
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  const { name, password, phone } = req.body;
  // String() so a {$ne: ...} object can never reach a Mongo filter
  const email = String(req.body.email || '');

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      // Generic wording: confirming "this email is taken" lets an attacker enumerate accounts.
      return sendError(res, 'Unable to create an account with this information. If you already have one, try signing in instead.', 409);
    }

    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    fireEmail(sendWelcome(user));

    return sendSession(res, user, true, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get tokens
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { password, rememberMe } = req.body;
  const email = String(req.body.email || '');

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

    return sendSession(res, user, !!rememberMe, 'User logged in successfully');
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
    await revokeRefreshToken(getRefreshTokenFromRequest(req));
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
  const token = getRefreshTokenFromRequest(req);

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
  const email = String(req.body.email || '');
  try {
    const genericMessage = 'If an eligible account exists, an OTP has been sent to its email.';
    const { user, otp, tooSoon } = await issueLoginOtp(email);
    if (tooSoon) return sendError(res, 'Please wait one minute before requesting another OTP', 429);
    if (!user) return sendSuccess(res, genericMessage);

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
  const { otp, rememberMe } = req.body;
  const email = String(req.body.email || '');
  try {
    const { user, error, status } = await checkLoginOtp(email, otp);
    if (error) return sendError(res, error, status);

    if (user.twoFactorEnabled) {
      return await requestSecondFactor(req, res, user, !!rememberMe);
    }

    return sendSession(res, user, !!rememberMe, 'Logged in successfully');
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
