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
  verify2FA,
  requestOTP,
  verifyOTP
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { registerRules, loginRules, profileRules } = require('../validations/authValidation');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// 2FA & OTP verification routes (Public)
router.post('/verify-2fa', verify2FA);
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, profileRules, validate, updateProfile);
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/enable', protect, verifyAndEnable2FA);
router.post('/2fa/disable', protect, disable2FA);

module.exports = router;
