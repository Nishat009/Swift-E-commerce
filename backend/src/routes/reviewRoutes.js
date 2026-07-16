const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getAllReviews
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { reviewRules } = require('../validations/reviewValidation');

// Public route to view product reviews
router.get('/product/:productId', getProductReviews);

// Admin route to retrieve all reviews
router.get('/', protect, authorize('admin'), getAllReviews);

// Protected routes to submit/edit reviews
router.post('/', protect, reviewRules, validate, createReview);
router.put('/:id', protect, reviewRules, validate, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
