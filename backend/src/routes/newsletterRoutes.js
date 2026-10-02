const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { fire: fireEmail, sendNewsletterConfirmation } = require('../services/emailService');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
router.post('/subscribe', async (req, res, next) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required' });
  }

  try {
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      return res.status(200).json({ success: true, message: 'You are already subscribed to our newsletter!' });
    }

    await Newsletter.create({ email });
    fireEmail(sendNewsletterConfirmation(email));
    return res.status(201).json({ success: true, message: 'Successfully subscribed to our newsletter!' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }
    if (err.code === 11000) {
      return res.status(200).json({ success: true, message: 'You are already subscribed to our newsletter!' });
    }
    next(err);
  }
});

// @desc    Get all subscriptions
// @route   GET /api/newsletter/subscriptions
// @access  Private/Admin
router.get('/subscriptions', protect, authorize('admin'), async (req, res, next) => {
  try {
    const subscriptions = await Newsletter.find().sort({ subscribedAt: -1 });
    res.status(200).json({ success: true, data: subscriptions });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a subscription
// @route   DELETE /api/newsletter/subscriptions/:id
// @access  Private/Admin
router.delete('/subscriptions/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const sub = await Newsletter.findById(req.params.id);
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    await sub.deleteOne();
    res.status(200).json({ success: true, message: 'Subscription removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
