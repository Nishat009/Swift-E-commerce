const mongoose = require('mongoose');
const crypto = require('crypto');
const ChatMessage = require('../models/ChatMessage');
const { advise } = require('../services/stylistService');

const statuses = ['unread', 'read', 'archived'];
const clean = (value) => (typeof value === 'string' ? value.trim() : '');
// Keyed hash, so the stored value cannot be turned back into the address
const hashIp = (ip) => (ip ? crypto.createHmac('sha256', String(process.env.JWT_SECRET)).update(String(ip)).digest('hex').slice(0, 32) : '');

// Sign-in is optional: a signed-in customer's identity is recorded with the message
const sendChatMessage = async (req, res, next) => {
  try {
    const message = clean(req.body.message);
    const sessionId = clean(req.body.sessionId);
    if (!sessionId || sessionId.length > 100 || message.length < 1 || message.length > 2000) {
      return res.status(400).json({ success: false, message: 'Invalid chat message.' });
    }
    const reply = await advise(message);
    const doc = await ChatMessage.create({
      sessionId,
      user: req.user?._id || null,
      name: req.user?.name || 'Guest',
      email: req.user?.email || '',
      message,
      assistantReply: reply.text,
      suggestedProducts: reply.products,
      ipHash: hashIp(req.ip),
    });
    res.status(201).json({ success: true, data: { ...doc.toJSON(), reply } });
  } catch (error) {
    next(error);
  }
};

const getMyChatHistory = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Sign in to sync chat history.' });
    const messages = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: 1 }).limit(100);
    res.json({ success: true, data: messages });
  } catch (error) { next(error); }
};

const getChatMessages = async (req, res, next) => {
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
};

const updateChatMessageStatus = async (req, res, next) => {
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
};

const deleteChatMessage = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Chat message not found.' });
    const message = await ChatMessage.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Chat message not found.' });
    res.json({ success: true, message: 'Chat message deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendChatMessage, getMyChatHistory, getChatMessages, updateChatMessageStatus, deleteChatMessage };
