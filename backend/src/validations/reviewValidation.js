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

// Editing a review: every field optional, but whatever is sent must be valid
const reviewUpdateRules = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('review')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Review content cannot be empty'),
  body('images')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Up to 5 images')
];

module.exports = {
  reviewRules,
  reviewUpdateRules,
};
