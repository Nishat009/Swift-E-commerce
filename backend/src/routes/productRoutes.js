const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  duplicateProduct,
  bulkActionProducts,
  deleteProduct,
  importProducts,
  searchSuggestions,
  trendingSearches,
  subscribeBackInStock
} = require('../controllers/productController');
const { notifyLimiter } = require('../config/rateLimits');

const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', optionalAuth, getProducts);
router.get('/search/suggest', searchSuggestions);
router.get('/search/trending', trendingSearches);
router.get('/:id', optionalAuth, getProductById);

router.post('/', protect, authorize('admin'), createProduct);
router.post('/bulk', protect, authorize('admin'), bulkActionProducts);
router.post('/import', protect, authorize('admin'), importProducts);
router.post('/:id/notify-me', notifyLimiter, optionalAuth, subscribeBackInStock);
router.post('/:id/duplicate', protect, authorize('admin'), duplicateProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
