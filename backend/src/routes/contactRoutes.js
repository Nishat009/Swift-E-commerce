const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const STATUSES = ['unread', 'read', 'replied', 'archived'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages sent. Please try again in an hour.' }
});

const str = (v) => (typeof v === 'string' ? v.trim() : '');

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
router.post('/', contactLimiter, async (req, res, next) => {
  try {
    // Honeypot: bots fill the hidden "website" field. Pretend success.
    if (str(req.body.website)) {
      return res.status(201).json({ success: true, message: 'Thanks! Your message has been sent.' });
    }

    const name = str(req.body.name);
    const email = str(req.body.email).toLowerCase();
    const subject = str(req.body.subject);
    const message = str(req.body.message);

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ success: false, message: 'Please enter your name (2-100 characters).' });
    }
    if (!EMAIL_RE.test(email) || email.length > 200) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (subject.length < 3 || subject.length > 200) {
      return res.status(400).json({ success: false, message: 'Please enter a subject (3-200 characters).' });
    }
    if (message.length < 10 || message.length > 5000) {
      return res.status(400).json({ success: false, message: 'Message must be between 10 and 5000 characters.' });
    }

    const doc = await ContactMessage.create({ name, email, subject, message, ip: req.ip || '' });

    try {
      const emailService = require('../services/emailService');
      if (emailService && typeof emailService.sendContactNotification === 'function') {
        await emailService.sendContactNotification(doc);
      }
    } catch (mailErr) {
      console.error('[contact] notification email failed:', mailErr.message);
    }

    res.status(201).json({ success: true, message: 'Thanks! Your message has been sent. We usually reply within 1-2 business days.' });
  } catch (err) {
    next(err);
  }
});

// @desc    List contact messages
// @route   GET /api/contact?status=unread
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status && STATUSES.includes(req.query.status)) filter.status = req.query.status;
    const [messages, unreadCount] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).limit(500),
      ContactMessage.countDocuments({ status: 'unread' })
    ]);
    res.status(200).json({ success: true, data: messages, unreadCount });
  } catch (err) {
    next(err);
  }
});

// @desc    Update message status
// @route   PUT /api/contact/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    if (!STATUSES.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.status(200).json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
});

// @desc    Delete message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
