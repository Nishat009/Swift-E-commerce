// Two-factor authentication: setup, enable/disable, recovery codes and the sign-in check.
const User = require('../models/User');
const { generateAccessToken } = require('../utils/generateTokens');
const { issueRefreshToken } = require('../services/refreshSessions');
const { sendSuccess, sendError } = require('../utils/response');
const crypto = require('crypto');
const { generateSecret, verifyTOTP, generateRecoveryCodes } = require('../utils/totp');
const AuthChallenge = require('../models/AuthChallenge');
const { cookieOptions, publicUser, challengeQuery, clearChallenge } = require('../utils/authSession');

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
    const refreshToken = await issueRefreshToken(user, challenge.rememberMe, req);

    res.cookie('refreshToken', refreshToken, cookieOptions(challenge.rememberMe));

    return sendSuccess(res, 'Logged in successfully', {
      user: publicUser(user),
      accessToken,
      recoveryUsed: isRecoveryUsed
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setup2FA,
  verifyAndEnable2FA,
  disable2FA,
  regenerateRecoveryCodes,
  verify2FA,
};
