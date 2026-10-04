const { body } = require('express-validator');

const orderRules = [
  body('products')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one product'),
  body('products.*.product')
    .notEmpty()
    .withMessage('Product ID is required for each item')
    .isMongoId()
    .withMessage('Invalid Product ID'),
  body('products.*.quantity')
    .isInt({ min: 1, max: 50 })
    .withMessage('Quantity must be between 1 and 50'),
  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required'),
  body('shippingAddress.street')
    .notEmpty()
    .withMessage('Street is required')
    .trim(),
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('City is required')
    .trim(),
  body('shippingAddress.state')
    .notEmpty()
    .withMessage('State is required')
    .trim(),
  body('shippingAddress.zipCode')
    .notEmpty()
    .withMessage('Zip code is required')
    .trim(),
  body('shippingAddress.country')
    .notEmpty()
    .withMessage('Country is required')
    .trim(),
  body('paymentMethod')
    .isIn(['cod', 'bkash', 'card'])
    .withMessage('Choose cash on delivery, bKash or card'),
  body('couponCode')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ max: 40 })
];

const quoteRules = [
  body('products')
    .isArray({ min: 1, max: 100 })
    .withMessage('Your cart is empty'),
  body('couponCode')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ max: 40 })
];

module.exports = {
  orderRules,
  quoteRules,
};
