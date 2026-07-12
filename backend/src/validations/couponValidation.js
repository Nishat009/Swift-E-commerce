const { body } = require('express-validator');

const couponRules = [
  body('code')
    .notEmpty()
    .withMessage('Coupon code is required')
    .trim()
    .toUpperCase(),
  body('percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage discount must be between 0 and 100'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  body('expiry')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Expiry must be a valid ISO8601 date format')
];

module.exports = {
  couponRules,
};
