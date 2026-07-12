const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { reviewRules } = require('../validations/reviewValidation');

// Public route to view product reviews
router.get('/product/:productId', getProductReviews);

// Protected routes to submit/edit reviews
router.post('/', protect, reviewRules, validate, createReview);
router.put('/:id', protect, reviewRules, validate, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
