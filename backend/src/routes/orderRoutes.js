const express = require('express');
const router = express.Router();
const {
  getOrderQuote,
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  overrideOrderStatus,
  refundOrder,
  requestReturn,
  decideReturn,
  respondToRefundOffer,
  getRefundQuote,
  getAllOrders
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, requireSuperAdmin } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { orderRules, quoteRules } = require('../validations/orderValidation');

router.use(protect); // All order routes require authentication

router.post('/quote', quoteRules, validate, getOrderQuote);
router.post('/', orderRules, validate, createOrder);
router.get('/', getMyOrders);
router.get('/admin/all', authorize('admin'), getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
// Customer asks to return a delivered order; staff approve or reject it
router.post('/:id/return-request', requestReturn);
router.put('/:id/return-request', authorize('admin'), decideReturn);
// Staff offer a refund amount; the customer accepts or declines it
router.get('/:id/refund-quote', authorize('admin'), getRefundQuote);
router.post('/:id/return-request/respond', respondToRefundOffer);

// Admin routes
router.put('/:id/status', authorize('admin'), updateOrderStatus);
// Super admin only: set any status at any stage, and refund a cancelled / returned paid order
router.put('/:id/override-status', authorize('admin'), requireSuperAdmin, overrideOrderStatus);
router.post('/:id/refund', authorize('admin'), requireSuperAdmin, refundOrder);

module.exports = router;
