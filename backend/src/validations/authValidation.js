const { body } = require('express-validator');

const registerRules = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('phone')
    .optional()
    .trim()
];

const loginRules = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isString()
    .notEmpty()
    .withMessage('Password is required'),
  body('rememberMe').optional().isBoolean()
];

const profileRules = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim(),
  body('password')
    .optional()
    .isString()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
  body('currentPassword')
    .optional()
    .isString()
];

// Public OTP / 2FA endpoints: force plain strings so no query operators reach MongoDB
const requestOtpRules = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

const verifyOtpRules = [
  ...requestOtpRules,
  body('otp')
    .isString()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Enter the 6-digit code from your email'),
  body('rememberMe').optional().isBoolean()
];

const verify2FARules = [
  body('code')
    .isString()
    .trim()
    .matches(/^(\d{6}|[A-Za-z0-9]{8})$/)
    .withMessage('Enter a six-digit authenticator code or an eight-character recovery code.'),
  body('userId').optional({ values: 'falsy' }).isString(),
  body('rememberMe').optional().isBoolean()
];

const forgotPasswordRules = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

const resetPasswordRules = [
  body('token')
    .isString()
    .withMessage('Reset token is required')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
];

module.exports = {
  registerRules,
  loginRules,
  profileRules,
  forgotPasswordRules,
  resetPasswordRules,
  requestOtpRules,
  verifyOtpRules,
  verify2FARules,
};
