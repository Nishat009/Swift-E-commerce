const { body } = require('express-validator');

// Public contact form (POST /api/contact). Messages match the frontend form's own checks.
const contactRules = [
  body('name')
    .isString().withMessage('Please enter your name (2-100 characters).')
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Please enter your name (2-100 characters).'),
  body('email')
    .isString().withMessage('Please enter a valid email address.')
    .bail()
    .trim()
    .isLength({ max: 200 }).withMessage('Please enter a valid email address.')
    .bail()
    .isEmail().withMessage('Please enter a valid email address.')
    .bail()
    .toLowerCase(),
  body('subject')
    .isString().withMessage('Please enter a subject (3-200 characters).')
    .bail()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Please enter a subject (3-200 characters).'),
  body('message')
    .isString().withMessage('Message must be between 10 and 5000 characters.')
    .bail()
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage('Message must be between 10 and 5000 characters.'),
];

module.exports = { contactRules };
