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
const { blockDemoAdmin } = require('../controllers/demoAuthController');
const { getInsights } = require('../controllers/insightController');

// Secure all admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/insights', getInsights);
router.post('/copy-draft', (req, res) => {
  const fields = ['category', 'material', 'color', 'brand'];
  const values = Object.fromEntries(fields.map((field) => [field, typeof req.body[field] === 'string' ? req.body[field].trim().slice(0, 80) : '']));
  if (fields.some((field) => !values[field])) return res.status(400).json({ success: false, message: 'Category, material, color and brand are required.' });
  const title = `${values.color} ${values.material} ${values.category} by ${values.brand}`;
  const shortDescription = `${values.brand} ${values.category} in ${values.color}, made with ${values.material}. Review fit and care details before publishing.`;
  res.json({ success: true, data: {
    title,
    shortDescription,
    seoDescription: `Explore the ${title}. See product details, available sizes and delivery information at SwiftCart.`,
    highlights: [`Material: ${values.material}`, `Color: ${values.color}`, `Category: ${values.category}`],
    tags: [values.category, values.material, values.color, values.brand].map((value) => value.toLowerCase()),
    metaKeywords: [values.category, values.material, values.color, values.brand].map((value) => value.toLowerCase()),
  } });
});
router.get('/users', getAllUsers);
router.put('/users/:id/role', blockDemoAdmin, updateUserRole);
router.delete('/users/:id', blockDemoAdmin, deleteUser);
router.get('/users/:id/cart', getUserCart);
router.get('/users/:id/wishlist', getUserWishlist);

// Admin orders management routes
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;
