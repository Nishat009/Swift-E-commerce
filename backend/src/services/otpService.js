// Email-code (OTP) sign-in for customers: issuing a code and checking it.
// authController only turns these results into HTTP responses.
const crypto = require('crypto');
const User = require('../models/User');
const { OTP_MAX_ATTEMPTS } = require('../config/security');

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp).trim()).digest('hex');

// Issues a new six-digit code for a customer account.
// Returns { user, otp } when a code was issued, { tooSoon: true } inside the resend window, and
// {} when there is no eligible account (staff accounts never sign in by email code).
const issueLoginOtp = async (email) => {
  const user = await User.findOne({ email: String(email) }).select('+otpCode +otpExpires +otpAttempts +otpRequestedAt');
  if (!user || user.role !== 'customer') return {};

  if (user.otpRequestedAt && Date.now() - user.otpRequestedAt.getTime() < OTP_RESEND_MS) {
    return { tooSoon: true };
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  user.otpCode = hashOtp(otp);
  user.otpExpires = Date.now() + OTP_TTL_MS;
  user.otpAttempts = 0;
  user.otpRequestedAt = new Date();
  await user.save();
  return { user, otp };
};

// Checks a code and uses it up. Returns { user } on success, or { error, status } on failure.
// Unknown emails and wrong codes get the same answer, so the endpoint does not reveal accounts.
const checkLoginOtp = async (email, otp) => {
  const user = await User.findOne({ email: String(email) }).select('+otpCode +otpExpires +otpAttempts');
  if (!user) return { error: 'Invalid OTP code', status: 400 };

  if ((user.otpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
    return { error: 'Too many invalid OTP attempts. Request a new code.', status: 429 };
  }

  if (!user.otpCode || user.otpCode !== hashOtp(otp)) {
    // Atomic, so parallel guesses can't each read the same count and slip past the limit
    await User.updateOne({ _id: user._id }, { $inc: { otpAttempts: 1 } });
    return { error: 'Invalid OTP code', status: 400 };
  }

  if (Date.now() > user.otpExpires) {
    return { error: 'OTP code expired. Please request a new one', status: 400 };
  }

  user.otpCode = '';
  user.otpExpires = null;
  user.otpAttempts = 0;
  await user.save();
  return { user };
};

module.exports = { issueLoginOtp, checkLoginOtp };
