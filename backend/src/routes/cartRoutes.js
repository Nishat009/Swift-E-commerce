const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  mergeCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  saveForLater,
  moveSavedToCart,
  removeSaved,
  mergeSaved
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All cart routes require authentication

router.get('/', getCart);
router.post('/', addToCart);
router.put('/', updateCartItem);
router.delete('/:productId', removeFromCart);
router.post('/merge', mergeCart);
router.post('/clear', clearCart);

// Saved for later (stored on the account, not in the browser)
router.post('/saved', saveForLater);
router.post('/saved/merge', mergeSaved);
router.post('/saved/:productId/move', moveSavedToCart);
router.delete('/saved/:productId', removeSaved);

module.exports = router;
