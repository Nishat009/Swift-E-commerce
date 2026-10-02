const express = require('express');
const router = express.Router();
const {
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
  deleteAddress
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { registerRules, loginRules, profileRules, forgotPasswordRules, resetPasswordRules } = require('../validations/authValidation');
const rateLimit = require('express-rate-limit');
const { requireGoogleOrigin, googleChallenge, verifyGoogleCredential, googleLogin, linkGoogle } = require('../controllers/googleAuthController');

const signInLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many sign-in attempts. Please try again in ten minutes.' },
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification attempts. Please try again later.' },
});

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

router.post('/google/challenge', signInLimiter, requireGoogleOrigin, googleChallenge);
router.post('/google', signInLimiter, requireGoogleOrigin, verifyGoogleCredential, googleLogin);
router.post('/google/link', signInLimiter, requireGoogleOrigin, protect, verifyGoogleCredential, linkGoogle);

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', otpRequestLimiter, forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password', verifyLimiter, resetPasswordRules, validate, resetPassword);

// 2FA & OTP verification routes (Public)
router.post('/verify-2fa', verifyLimiter, verify2FA);
router.post('/request-otp', otpRequestLimiter, requestOTP);
router.post('/verify-otp', verifyLimiter, verifyOTP);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, profileRules, validate, updateProfile);
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/enable', verifyLimiter, protect, verifyAndEnable2FA);
router.post('/2fa/disable', verifyLimiter, protect, disable2FA);
router.post('/2fa/recovery-codes', verifyLimiter, protect, regenerateRecoveryCodes);

// Addresses CRUD routes
router.post('/addresses', protect, addAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

module.exports = router;
