const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { subscribeLimiter } = require('../config/rateLimits');
const { subscribe, unsubscribe, getSubscriptions, deleteSubscription } = require('../controllers/newsletterController');

const router = express.Router();

router.post('/subscribe', subscribeLimiter, subscribe);

router.get('/unsubscribe', unsubscribe);

router.get('/subscriptions', protect, authorize('admin'), getSubscriptions);

router.delete('/subscriptions/:id', protect, authorize('admin'), deleteSubscription);

module.exports = router;
