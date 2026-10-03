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
  body('minSpend').optional().isFloat({ min: 0 }).withMessage('Minimum spend must be 0 or more'),
  body('usageLimit').optional().isInt({ min: 0 }).withMessage('Usage limit must be a whole number (0 = unlimited)'),
  body('perUserLimit').optional().isInt({ min: 0 }).withMessage('Per-user limit must be a whole number (0 = unlimited)'),
  // Exactly one kind of discount: a percentage or a fixed amount
  body('amount').custom((amount, { req }) => {
    const hasPercent = Number(req.body.percentage) > 0;
    const hasAmount = Number(amount) > 0;
    if (hasPercent === hasAmount) throw new Error('Set either a percentage or a fixed amount discount (not both)');
    return true;
  }),
  body('expiry')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Expiry must be a valid ISO8601 date format')
];

module.exports = {
  couponRules,
};
