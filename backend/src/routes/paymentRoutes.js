const express = require('express');
const router = express.Router();
const {
  getMethods,
  initiateOrderPayment,
  bkashCallback,
  cardReturn,
  stripeWebhook,
  mockCheckout
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/methods', getMethods);
router.post('/orders/:orderId/initiate', protect, initiateOrderPayment);

// Gateway redirects / webhooks (public; every result is verified with the gateway)
router.get('/bkash/callback', bkashCallback);
router.get('/card/return', cardReturn);
router.post('/stripe/webhook', stripeWebhook);
router.get('/mock/checkout', mockCheckout); // dev-only: 404 unless PAYMENT_MOCK=true

module.exports = router;
