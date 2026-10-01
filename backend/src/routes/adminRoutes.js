const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserCart,
  getUserWishlist
} = require('../controllers/adminController');
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Secure all admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/users/:id/cart', getUserCart);
router.get('/users/:id/wishlist', getUserWishlist);

// Admin orders management routes
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;
