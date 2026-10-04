const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const { sendSuccess, sendError } = require('../utils/response');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateSecret, verifyTOTP, generateRecoveryCodes } = require('../utils/totp');
const { getRequiredSecret } = require('../utils/generateTokens');
const AuthChallenge = require('../models/AuthChallenge');
const { cookieOptions, publicUser, requestSecondFactor, challengeQuery, clearChallenge } = require('../utils/authSession');
const { fire: fireEmail, sendWelcome, sendPasswordReset, sendLoginOtp } = require('../services/emailService');

const devCodesAllowed = () => process.env.ALLOW_DEV_AUTH_CODES === 'true' && process.env.NODE_ENV !== 'production';
const hashCode = (code) => crypto.createHash('sha256').update(String(code).toUpperCase().trim()).digest('hex');

// Checks a TOTP or single-use recovery code. Returns { ok, recoveryHash } (does not consume the recovery code).
const checkSecondFactorCode = (user, rawCode) => {
  const code = typeof rawCode === 'string' ? rawCode.trim() : '';
  if (/^\d{6}$/.test(code)) {
    return { ok: verifyTOTP(code, user.twoFactorSecret), recoveryHash: null };
  }
  if (/^[A-Za-z0-9]{8}$/.test(code)) {
    const h = hashCode(code);
    if ((user.twoFactorRecoveryCodes || []).includes(h)) return { ok: true, recoveryHash: h };
  }
  return { ok: false, recoveryHash: null };
};

const newRecoveryCodes = () => {
  const plain = generateRecoveryCodes(10, 8);
  return { plain, hashed: plain.map(hashCode) };
};

// FR-2.6: after LOGIN_MAX_FAILURES wrong passwords in a row the account is locked briefly.
const LOGIN_MAX_FAILURES = 3;
const LOGIN_LOCK_MS = 30 * 1000;
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

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, true);

    // Store refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, cookieOptions(true));
    fireEmail(sendWelcome(user));

    return sendSuccess(res, 'User registered successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        twoFactorEnabled: false
      },
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

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, !!rememberMe);

    // Store refresh token in HttpOnly cookie
    // Only set maxAge when "Remember Me" is checked; otherwise use a session cookie
    res.cookie('refreshToken', refreshToken, cookieOptions(!!rememberMe));

    return sendSuccess(res, 'User logged in successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        googleConnected: Boolean(user.googleId)
      },
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
  } catch (error) {
    return next(error);
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  return sendSuccess(res, 'Logged out successfully');
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, 'User profile retrieved successfully', { user: { ...user.toJSON(), hasPassword: Boolean(user.password) } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;

    const passwordUser = await User.findById(req.user.id).select('+password');
    const hasPassword = Boolean(passwordUser && passwordUser.password);

    if (req.body.email && req.body.email !== user.email) {
      if (hasPassword && !(await passwordUser.matchPassword(req.body.currentPassword))) {
        return sendError(res, 'Enter your current password to change your email address', 401);
      }
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return sendError(res, 'Email already in use', 400);
      }
      user.email = req.body.email;
    }

    let passwordChanged = false;
    if (req.body.password) {
      // Google-only accounts have no password yet, so they can set one without a current password.
      if (hasPassword) {
        if (!req.body.currentPassword) {
          return sendError(res, 'Current password is required to set a new password', 400);
        }
        if (!(await passwordUser.matchPassword(req.body.currentPassword))) {
          return sendError(res, 'Current password is incorrect', 401);
        }
      }
      user.password = req.body.password;
      passwordChanged = true;
    }

    // Address updates
    if (
      req.body.address !== undefined ||
      req.body.city !== undefined ||
      req.body.state !== undefined ||
      req.body.zipCode !== undefined
    ) {
      let defaultAddress = user.addresses.find(addr => addr.isDefault);
      if (!defaultAddress && user.addresses.length > 0) {
        defaultAddress = user.addresses[0];
      }

      if (defaultAddress) {
        defaultAddress.street = req.body.address !== undefined ? req.body.address : defaultAddress.street;
        defaultAddress.city = req.body.city !== undefined ? req.body.city : defaultAddress.city;
        defaultAddress.state = req.body.state !== undefined ? req.body.state : defaultAddress.state;
        defaultAddress.zipCode = req.body.zipCode !== undefined ? req.body.zipCode : defaultAddress.zipCode;
        if (req.body.country !== undefined) {
          defaultAddress.country = req.body.country;
        }
      } else if (req.body.address && req.body.city && req.body.state && req.body.zipCode) {
        user.addresses.push({
          street: req.body.address || '',
          city: req.body.city || '',
          state: req.body.state || '',
          zipCode: req.body.zipCode || '',
          country: req.body.country || 'United States',
          isDefault: true
        });
      }
    }

    const updatedUser = await user.save();

    // A new password signs out other devices; this one gets fresh tokens to stay signed in
    let accessToken;
    if (passwordChanged) {
      const remember = Boolean(jwt.decode(req.cookies?.refreshToken || '')?.rm);
      res.cookie('refreshToken', generateRefreshToken(updatedUser, remember), cookieOptions(remember));
      accessToken = generateAccessToken(updatedUser);
    }

    return sendSuccess(res, 'User profile updated successfully', {
      ...(accessToken ? { accessToken } : {}),
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        addresses: updatedUser.addresses,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        googleConnected: Boolean(updatedUser.googleId),
        hasPassword: hasPassword || Boolean(req.body.password)
      }
    });
  } catch (error) {
    next(error);
  }
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
    const decoded = jwt.verify(token, getRequiredSecret('JWT_REFRESH_SECRET'));
    const user = await User.findById(decoded.id);

    // Unknown user, or the password changed after this session started
    if (!user || (decoded.v || 0) !== (user.tokenVersion || 0)) {
      res.clearCookie('refreshToken', cookieOptions());
      return sendError(res, 'Invalid refresh token', 401);
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user, decoded.rm);

    // Same lifetime as the original sign-in: persistent only when "remember me" was ticked
    res.cookie('refreshToken', newRefreshToken, cookieOptions(Boolean(decoded.rm)));

    return sendSuccess(res, 'Access token refreshed successfully', { accessToken });
  } catch (error) {
    return sendError(res, 'Invalid or expired refresh token', 401);
  }
};

// @desc    Forgot password request (Generates OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    const genericMessage = 'If an account exists for that email, password reset instructions have been sent.';
    if (!user) return sendSuccess(res, genericMessage);

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    fireEmail(sendPasswordReset(user, resetToken));

    return sendSuccess(res, genericMessage, devCodesAllowed() ? { resetToken } : {});
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using verified OTP code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;
  try {
    if (!token || typeof newPassword !== 'string' || newPassword.length < 8) {
      return sendError(res, 'A valid reset token and an 8 character password are required', 400);
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');
    if (!user) {
      return sendError(res, 'Reset token is invalid or expired', 400);
    }

    user.password = newPassword;
    user.passwordResetToken = '';
    user.passwordResetExpires = null;
    await user.save();

    return sendSuccess(res, 'Password reset successful. Please login with your new password.');
  } catch (error) {
    next(error);
  }
};

// @desc    Setup 2FA for user
// @route   POST /api/auth/2fa/setup
// @access  Private
const setup2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    if (user.twoFactorEnabled) {
      return sendError(res, 'Two-Factor Authentication is already enabled. Disable it first to set it up again.', 400);
    }

    const secret = generateSecret();
    user.twoFactorSecret = secret;
    await user.save();

    const otpauthUrl = `otpauth://totp/SwiftCart:${encodeURIComponent(user.email)}?secret=${secret}&issuer=SwiftCart&algorithm=SHA1&digits=6&period=30`;

    return sendSuccess(res, '2FA setup initiated', {
      secret,
      otpauthUrl
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify and enable 2FA
// @route   POST /api/auth/2fa/enable
// @access  Private
const verifyAndEnable2FA = async (req, res, next) => {
  const { code } = req.body;
  try {
    const user = await User.findById(req.user.id).select('+twoFactorSecret +twoFactorRecoveryCodes');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    if (user.twoFactorEnabled) {
      return sendError(res, 'Two-Factor Authentication is already enabled', 400);
    }
    if (!user.twoFactorSecret) {
      return sendError(res, 'Start 2FA setup first', 400);
    }

    const isValid = verifyTOTP(String(code || ''), user.twoFactorSecret);
    if (!isValid) {
      return sendError(res, 'Invalid verification code', 400);
    }

    user.twoFactorEnabled = true;
    const { plain, hashed } = newRecoveryCodes();
    user.twoFactorRecoveryCodes = hashed;
    await user.save();

    return sendSuccess(res, 'Two-Factor Authentication enabled successfully', {
      recoveryCodes: plain
    });
  } catch (error) {
    next(error);
  }
};

// Re-authenticates a sensitive 2FA change: password (if the account has one) AND a valid TOTP/recovery code.
const reauthForTwoFactorChange = async (req, res) => {
  const { code, currentPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password +twoFactorSecret +twoFactorRecoveryCodes');
  if (!user) { sendError(res, 'User not found', 404); return null; }
  if (!user.twoFactorEnabled) { sendError(res, 'Two-Factor Authentication is not enabled', 400); return null; }
  if (user.password && !(typeof currentPassword === 'string' && await user.matchPassword(currentPassword))) {
    sendError(res, 'Current password is incorrect', 401);
    return null;
  }
  const check = checkSecondFactorCode(user, code);
  if (!check.ok) {
    sendError(res, 'A valid authenticator code or recovery code is required', 401);
    return null;
  }
  return user;
};

// @desc    Regenerate recovery codes (requires password + current code)
// @route   POST /api/auth/2fa/recovery-codes
// @access  Private
const regenerateRecoveryCodes = async (req, res, next) => {
  try {
    const user = await reauthForTwoFactorChange(req, res);
    if (!user) return;
    const { plain, hashed } = newRecoveryCodes();
    user.twoFactorRecoveryCodes = hashed;
    await user.save();
    return sendSuccess(res, 'New recovery codes generated. Old codes no longer work.', { recoveryCodes: plain });
  } catch (error) {
    next(error);
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
const disable2FA = async (req, res, next) => {
  try {
    const user = await reauthForTwoFactorChange(req, res);
    if (!user) return;

    user.twoFactorEnabled = false;
    user.twoFactorSecret = '';
    user.twoFactorRecoveryCodes = [];
    await user.save();

    return sendSuccess(res, 'Two-Factor Authentication disabled successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 2FA TOTP or Recovery Code
// @route   POST /api/auth/verify-2fa
// @access  Public
const verify2FA = async (req, res, next) => {
  const { userId, code } = req.body;
  try {
    if (typeof code !== 'string' || !/^(?:\d{6}|[A-Za-z0-9]{8})$/.test(code.trim())) {
      return sendError(res, 'Enter a six-digit authenticator code or an eight-character recovery code.', 400);
    }
    // A user ID and TOTP alone must never bypass the Google/password first factor.
    const challenge = await AuthChallenge.findOneAndUpdate(
      { ...challengeQuery(req, 'two-factor'), attempts: { $lt: 5 } },
      { $inc: { attempts: 1 } },
      { new: true },
    );
    if (!challenge || (userId && String(challenge.user) !== userId)) {
      return sendError(res, 'Sign-in expired or too many attempts. Please sign in again.', 401);
    }
    const user = await User.findById(challenge.user).select('+twoFactorSecret +twoFactorRecoveryCodes');
    if (!user || !user.twoFactorEnabled) {
      return sendError(res, 'Please sign in again.', 401);
    }

    const check = checkSecondFactorCode(user, code);
    const isVerified = check.ok;
    const isRecoveryUsed = Boolean(check.recoveryHash);

    if (!isVerified) {
      return sendError(res, 'Invalid verification code or recovery code', 400);
    }

    const consumed = await AuthChallenge.findOneAndDelete({ _id: challenge._id, expiresAt: { $gt: new Date() } });
    if (!consumed) return sendError(res, 'This sign-in has already been used. Please sign in again.', 401);
    clearChallenge(res, 'two-factor');
    if (isRecoveryUsed) {
      const used = await User.updateOne(
        { _id: user._id, twoFactorRecoveryCodes: check.recoveryHash },
        { $pull: { twoFactorRecoveryCodes: check.recoveryHash } },
      );
      if (!used.modifiedCount) return sendError(res, 'Recovery code has already been used.', 400);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, challenge.rememberMe);

    res.cookie('refreshToken', refreshToken, cookieOptions(challenge.rememberMe));

    return sendSuccess(res, 'Logged in successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        googleConnected: Boolean(user.googleId)
      },
      accessToken,
      recoveryUsed: isRecoveryUsed
    });
  } catch (error) {
    next(error);
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

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, !!rememberMe);

    res.cookie('refreshToken', refreshToken, cookieOptions(!!rememberMe));

    return sendSuccess(res, 'Logged in successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        googleConnected: Boolean(user.googleId)
      },
      accessToken,
      // Refresh token is intentionally only stored in the HttpOnly cookie.
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new user address
// @route   POST /api/auth/addresses
// @access  Private
const addAddress = async (req, res, next) => {
  const { street, city, state, zipCode, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      street,
      city,
      state,
      zipCode,
      country: country || 'United States',
      isDefault: user.addresses.length === 0 ? true : !!isDefault
    });

    const updatedUser = await user.save();
    return sendSuccess(res, 'Address added successfully', { addresses: updatedUser.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a specific user address
// @route   PUT /api/auth/addresses/:addressId
// @access  Private
const updateAddress = async (req, res, next) => {
  const { addressId } = req.params;
  const { street, city, state, zipCode, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);

    const address = user.addresses.id(addressId);
    if (!address) return sendError(res, 'Address not found', 404);

    if (isDefault && !address.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    address.street = street !== undefined ? street : address.street;
    address.city = city !== undefined ? city : address.city;
    address.state = state !== undefined ? state : address.state;
    address.zipCode = zipCode !== undefined ? zipCode : address.zipCode;
    address.country = country !== undefined ? country : address.country;
    address.isDefault = isDefault !== undefined ? !!isDefault : address.isDefault;

    const updatedUser = await user.save();
    return sendSuccess(res, 'Address updated successfully', { addresses: updatedUser.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a specific user address
// @route   DELETE /api/auth/addresses/:addressId
// @access  Private
const deleteAddress = async (req, res, next) => {
  const { addressId } = req.params;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);

    const address = user.addresses.id(addressId);
    if (!address) return sendError(res, 'Address not found', 404);

    const wasDefault = address.isDefault;
    user.addresses.pull({ _id: addressId });

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    const updatedUser = await user.save();
    return sendSuccess(res, 'Address deleted successfully', { addresses: updatedUser.addresses });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  refreshToken,
  forgotPassword,
  resetPassword,
  setup2FA,
  verifyAndEnable2FA,
  disable2FA,
  regenerateRecoveryCodes,
  verify2FA,
  requestOTP,
  verifyOTP,
  addAddress,
  updateAddress,
  deleteAddress,
};
