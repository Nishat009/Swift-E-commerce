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
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
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
    .notEmpty()
    .withMessage('Payment method is required')
];

module.exports = {
  orderRules,
};
