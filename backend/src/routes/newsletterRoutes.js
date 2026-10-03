const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { fire: fireEmail, sendNewsletterConfirmation } = require('../services/emailService');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const rateLimit = require('express-rate-limit');

const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Same answer whether or not the email was already on the list, so the list cannot be probed
const SUBSCRIBED = { success: true, message: 'Thanks! You are subscribed to our newsletter.' };

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
router.post('/subscribe', subscribeLimiter, async (req, res, next) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required' });
  }

  try {
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      return res.status(200).json(SUBSCRIBED);
    }

    const subscription = await Newsletter.create({ email });
    fireEmail(sendNewsletterConfirmation(email, subscription.unsubscribeToken));
    return res.status(201).json(SUBSCRIBED);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }
    if (err.code === 11000) {
      return res.status(200).json(SUBSCRIBED);
    }
    next(err);
  }
});

// @desc    One-click unsubscribe from the link in newsletter emails
// @route   GET /api/newsletter/unsubscribe?token=
// @access  Public
router.get('/unsubscribe', async (req, res, next) => {
  try {
    const token = String(req.query.token || '');
    const removed = /^[0-9a-f]{32}$/.test(token) ? await Newsletter.findOneAndDelete({ unsubscribeToken: token }) : null;
    const message = removed ? 'You have been unsubscribed from the SwiftCart newsletter.' : 'This unsubscribe link is no longer valid. You may already be unsubscribed.';
    res.status(removed ? 200 : 404).type('html').send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Newsletter</title><body style="font-family:Helvetica,Arial,sans-serif;max-width:480px;margin:80px auto;padding:0 16px;text-align:center;color:#2b2622"><h1 style="font-family:Georgia,serif;color:#8b6f47;font-weight:normal">SwiftCart</h1><p>${message}</p></body>`);
  } catch (err) {
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
