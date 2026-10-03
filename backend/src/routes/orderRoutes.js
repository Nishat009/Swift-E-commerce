const express = require('express');
const router = express.Router();
const {
  getOrderQuote,
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { orderRules, quoteRules } = require('../validations/orderValidation');

router.use(protect); // All order routes require authentication

router.post('/quote', quoteRules, validate, getOrderQuote);
router.post('/', orderRules, validate, createOrder);
router.get('/', getMyOrders);
router.get('/admin/all', authorize('admin'), getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

// Admin routes
router.put('/:id/status', authorize('admin'), updateOrderStatus);

module.exports = router;
