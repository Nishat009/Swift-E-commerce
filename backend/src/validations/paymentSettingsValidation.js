const { body } = require('express-validator');

// A credential is a new value (string), null to clear it, or left out to keep it
const credential = (path, pattern, message) =>
  body(path)
    .optional({ values: 'null' })
    .isString()
    .withMessage('Must be text')
    .bail()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Too long')
    .bail()
    .custom((value) => !value || !pattern || pattern.test(value))
    .withMessage(message || 'Invalid value');

const paymentSettingsRules = [
  body('cod.enabled').optional().isBoolean().withMessage('Must be true or false'),
  body('bkash.enabled').optional().isBoolean().withMessage('Must be true or false'),
  body('card.enabled').optional().isBoolean().withMessage('Must be true or false'),
  body('bkash.mode').optional().isIn(['', 'sandbox', 'live']).withMessage('Mode must be sandbox or live'),
  credential('bkash.credentials.appKey'),
  credential('bkash.credentials.appSecret'),
  credential('bkash.credentials.username'),
  credential('bkash.credentials.password'),
  credential('card.credentials.secretKey', /^(sk|rk)_(test|live)_/, 'A Stripe secret key starts with sk_test_ or sk_live_'),
  credential('card.credentials.webhookSecret', /^whsec_/, 'A Stripe webhook secret starts with whsec_'),
  body('bdtPerUsd')
    .optional({ values: 'null' })
    .isFloat({ min: 1, max: 10000 })
    .withMessage('The Taka rate must be a number between 1 and 10000'),
];

module.exports = { paymentSettingsRules };
