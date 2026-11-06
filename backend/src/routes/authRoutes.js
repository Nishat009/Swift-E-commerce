const express = require('express');
const router = express.Router();
const { register, login, logout, refreshToken, requestOTP, verifyOTP } = require('../controllers/authController');
const { getProfile, updateProfile, addAddress, updateAddress, deleteAddress } = require('../controllers/profileController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');
const { setup2FA, verifyAndEnable2FA, disable2FA, regenerateRecoveryCodes, verify2FA } = require('../controllers/twoFactorController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  registerRules, loginRules, profileRules, forgotPasswordRules, resetPasswordRules,
  requestOtpRules, verifyOtpRules, verify2FARules
} = require('../validations/authValidation');
const { signInLimiter, verifyLimiter, otpRequestLimiter, sessionLimiter, accountWriteLimiter } = require('../config/rateLimits');
const { getDemoLoginStatus, demoLogin, blockDemoAdmin } = require('../controllers/demoAuthController');
const { blockDemoCredentialChange } = require('../middleware/demoPrivacy');
const { requireOriginForCookieAuth } = require('../utils/authSession');
const { requireGoogleOrigin, googleChallenge, verifyGoogleCredential, googleLogin, linkGoogle } = require('../controllers/googleAuthController');

// Shared middleware chains
const signedIn = [protect];
const signedInNotDemo = [protect, blockDemoAdmin];            // the shared demo accounts may not change these
const twoFactorChange = [verifyLimiter, ...signedInNotDemo];  // 2FA changes also check a code: rate-limited
const addressWrite = [accountWriteLimiter, ...signedIn];          // address handlers look the id up inside req.user's own list

router.post('/google/challenge', signInLimiter, requireGoogleOrigin, googleChallenge);
router.post('/google', signInLimiter, requireGoogleOrigin, verifyGoogleCredential, googleLogin);
router.post('/google/link', signInLimiter, requireGoogleOrigin, ...signedIn, verifyGoogleCredential, linkGoogle);

router.get('/demo-login', getDemoLoginStatus);
router.post('/demo-login', signInLimiter, demoLogin);

router.post('/register', signInLimiter, registerRules, validate, register);
router.post('/login', signInLimiter, loginRules, validate, login);
router.post('/logout', sessionLimiter, requireOriginForCookieAuth, logout);
router.post('/refresh', sessionLimiter, requireOriginForCookieAuth, refreshToken);
router.post('/forgot-password', otpRequestLimiter, forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password', verifyLimiter, resetPasswordRules, validate, resetPassword);

// 2FA & OTP verification routes (Public). verify-2fa finds the pending sign-in by the challenge
// cookie only; a userId in the body can never pick a different account.
router.post('/verify-2fa', verifyLimiter, verify2FARules, validate, verify2FA);
router.post('/request-otp', otpRequestLimiter, requestOtpRules, validate, requestOTP);
router.post('/verify-otp', verifyLimiter, verifyOtpRules, validate, verifyOTP);

// Protected routes
router.get('/profile', signedIn, getProfile);
router.put('/profile', signedIn, blockDemoCredentialChange, profileRules, validate, updateProfile);
router.post('/2fa/setup', signedInNotDemo, setup2FA);
router.post('/2fa/enable', twoFactorChange, verifyAndEnable2FA);
router.post('/2fa/disable', twoFactorChange, disable2FA);
router.post('/2fa/recovery-codes', twoFactorChange, regenerateRecoveryCodes);

// Addresses CRUD routes
router.post('/addresses', addressWrite, addAddress);
router.put('/addresses/:addressId', addressWrite, updateAddress);
router.delete('/addresses/:addressId', addressWrite, deleteAddress);

module.exports = router;
