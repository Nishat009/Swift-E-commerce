const { body } = require('express-validator');

const reviewRules = [
  body('product')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid Product ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('review')
    .notEmpty()
    .withMessage('Review content is required')
    .trim()
];

module.exports = {
  reviewRules,
};
