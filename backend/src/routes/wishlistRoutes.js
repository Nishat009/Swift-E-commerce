const express = require('express');
const router = express.Router();
const {
  getWishlist,
  getWishlistDetails,
  addToWishlist,
  removeFromWishlist,
  createCollection,
  renameCollection,
  deleteCollection,
  moveInCollection,
  updateAlerts,
  setSharing,
  getSharedWishlist,
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

// Public: read-only shared wishlist link
router.get('/shared/:token', getSharedWishlist);

router.use(protect); // Everything else requires authentication

router.get('/', getWishlist);
router.get('/details', getWishlistDetails);
router.post('/', addToWishlist);
router.post('/share', setSharing);
router.post('/collections', createCollection);
router.put('/collections/:collectionId', renameCollection);
router.delete('/collections/:collectionId', deleteCollection);
router.put('/collections/:collectionId/products', moveInCollection);
router.put('/alerts/:productId', updateAlerts);
router.delete('/:productId', removeFromWishlist);

module.exports = router;
