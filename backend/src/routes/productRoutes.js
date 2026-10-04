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
const rateLimit = require('express-rate-limit');

const notifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
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
