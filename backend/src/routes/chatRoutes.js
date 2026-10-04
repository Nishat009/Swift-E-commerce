const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getRequiredSecret } = require('../utils/generateTokens');
const { advise } = require('../services/stylistService');

const router = express.Router();
const statuses = ['unread', 'read', 'archived'];
const clean = (value) => (typeof value === 'string' ? value.trim() : '');

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many chat messages. Please wait a moment and try again.' },
});

// Authentication is optional for customers: logged-in identity is recorded when available.
const optionalUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
    if (token) {
      const decoded = jwt.verify(token, getRequiredSecret('JWT_SECRET'));
      req.chatUser = await User.findById(decoded.id).select('name email');
    }
  } catch {
    // An expired optional token must not stop a guest from using the assistant.
  }
  next();
};

router.post('/', chatLimiter, optionalUser, async (req, res, next) => {
  try {
    const message = clean(req.body.message);
    const sessionId = clean(req.body.sessionId);
    if (!sessionId || sessionId.length > 100 || message.length < 1 || message.length > 2000) {
      return res.status(400).json({ success: false, message: 'Invalid chat message.' });
    }
    const reply = await advise(message);
    const doc = await ChatMessage.create({
      sessionId,
      user: req.chatUser?._id || null,
      name: req.chatUser?.name || 'Guest',
      email: req.chatUser?.email || '',
      message,
      assistantReply: reply.text,
      suggestedProducts: reply.products,
      ip: req.ip || '',
    });
    res.status(201).json({ success: true, data: { ...doc.toJSON(), reply } });
  } catch (error) {
    next(error);
  }
});

router.get('/mine', optionalUser, async (req, res, next) => {
  try {
    if (!req.chatUser) return res.status(401).json({ success: false, message: 'Sign in to sync chat history.' });
    const messages = await ChatMessage.find({ user: req.chatUser._id }).sort({ createdAt: 1 }).limit(100);
    res.json({ success: true, data: messages });
  } catch (error) { next(error); }
});

router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const filter = statuses.includes(req.query.status) ? { status: req.query.status } : {};
    const [messages, unreadCount] = await Promise.all([
      ChatMessage.find(filter).sort({ createdAt: -1 }).limit(500),
      ChatMessage.countDocuments({ status: 'unread' }),
    ]);
    res.json({ success: true, data: messages, unreadCount });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !statuses.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid message or status.' });
    }
    const message = await ChatMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!message) return res.status(404).json({ success: false, message: 'Chat message not found.' });
    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Chat message not found.' });
    const message = await ChatMessage.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Chat message not found.' });
    res.json({ success: true, message: 'Chat message deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
