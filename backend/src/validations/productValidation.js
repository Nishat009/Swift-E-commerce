const { body } = require('express-validator');

const productRules = [
  body('title')
    .notEmpty()
    .withMessage('Product title is required')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Product description is required'),
  body('category')
    .notEmpty()
    .withMessage('Product category is required')
    .trim(),
  body('brand')
    .notEmpty()
    .withMessage('Product brand is required')
    .trim(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('salePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Sale price must be a positive number')
    .custom((value, { req }) => {
      if (value && parseFloat(value) >= parseFloat(req.body.price)) {
        throw new Error('Sale price must be lower than original price');
      }
      return true;
    }),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('SKU')
    .optional()
    .trim(),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array of image urls'),
  body('thumbnail')
    .optional()
    .isString()
    .withMessage('Thumbnail must be a string url'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of strings')
];

module.exports = {
  productRules,
};
