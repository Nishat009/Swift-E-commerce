const { body } = require('express-validator');
const { validateAddress } = require('../utils/address');

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
    .isObject()
    .withMessage('Shipping address is required'),
  ...['street', 'city', 'state', 'zipCode', 'country'].map((field) =>
    body(`shippingAddress.${field}`)
      .custom((value, { req }) => {
        const message = validateAddress(req.body.shippingAddress)[field];
        if (message) throw new Error(message);
        return true;
      })
      .trim()
  ),
  body('paymentMethod')
    .isIn(['cod', 'bkash', 'card'])
    .withMessage('Choose cash on delivery, bKash or card'),
  body('couponCode')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ max: 40 }),
  body('deliveryZone')
    .optional({ values: 'falsy' })
    .isIn(['inside_dhaka', 'outside_dhaka'])
    .withMessage('Choose Inside Dhaka or Outside Dhaka for delivery'),
  body('deliveryZone')
    .if(body('paymentMethod').equals('cod'))
    .notEmpty()
    .withMessage('Choose Inside Dhaka or Outside Dhaka for cash on delivery')
];

const quoteRules = [
  body('paymentMethod')
    .optional({ values: 'falsy' })
    .isIn(['cod', 'bkash', 'card']),
  body('deliveryZone')
    .optional({ values: 'falsy' })
    .isIn(['inside_dhaka', 'outside_dhaka'])
    .withMessage('Choose Inside Dhaka or Outside Dhaka for delivery'),
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
