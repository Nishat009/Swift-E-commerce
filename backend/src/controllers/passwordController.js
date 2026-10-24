// Forgotten password: emailed reset token, then a new password.
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');
const crypto = require('crypto');
const { fire: fireEmail, sendPasswordReset } = require('../services/emailService');
const { isDemoAccount } = require('./demoAuthController');
const { devCodesAllowed } = require('../config/security');

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
    if (isDemoAccount(user)) {
      return sendError(res, 'The demo account password cannot be changed.', 403);
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

module.exports = {
  forgotPassword,
  resetPassword,
};
