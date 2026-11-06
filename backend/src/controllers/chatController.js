// Style-assistant chat. Routes (routes/chatRoutes.js):
//   POST   /api/chat        public, rate-limited, optionalAuth (identity only from a verified token)
//   GET    /api/chat/mine   optionalAuth, returns 401 without a signed-in user
//   GET    /api/chat        protect + authorize('admin')
//   PUT    /api/chat/:id    protect + authorize('admin')
//   DELETE /api/chat/:id    protect + authorize('admin')
const mongoose = require('mongoose');
const crypto = require('crypto');
const ChatMessage = require('../models/ChatMessage');
const { advise } = require('../services/stylistService');
const { sendSuccess, sendError } = require('../utils/response');
const { getRequiredSecret } = require('../utils/generateTokens');
const { parsePage, pageMeta } = require('../utils/pagination');

const statuses = ['unread', 'read', 'archived'];
const clean = (value) => (typeof value === 'string' ? value.trim() : '');

// Keyed hash, so the stored value cannot be turned back into the address. CHAT_HASH_KEY keeps it
// separate from the token secret; without it JWT_SECRET is used, which startup has checked exists.
const ipHashKey = () => process.env.CHAT_HASH_KEY || getRequiredSecret('JWT_SECRET');
const hashIp = (ip) => (ip ? crypto.createHmac('sha256', ipHashKey()).update(String(ip)).digest('hex').slice(0, 32) : '');

// @desc    Ask the style assistant; a signed-in customer's identity comes from the verified token,
//          never from the request body
// @route   POST /api/chat
// @access  Public (rate-limited)
const sendChatMessage = async (req, res, next) => {
  try {
    const message = clean(req.body.message);
    const sessionId = clean(req.body.sessionId);
    if (!sessionId || sessionId.length > 100 || message.length < 1 || message.length > 2000) {
      return sendError(res, 'Invalid chat message.', 400);
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
    return sendSuccess(res, 'Chat message sent', { ...doc.toJSON(), reply }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    The signed-in customer's own chat history
// @route   GET /api/chat/mine
// @access  Private (optionalAuth, 401 without a user)
const getMyChatHistory = async (req, res, next) => {
  try {
    if (!req.user) return sendError(res, 'Sign in to sync chat history.', 401);
    const messages = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: 1 }).limit(100);
    return sendSuccess(res, 'Chat history loaded', messages);
  } catch (error) { next(error); }
};

// @desc    List chat messages, newest first (?status, ?page, ?limit)
// @route   GET /api/chat
// @access  Private/Admin
const getChatMessages = async (req, res, next) => {
  try {
    const filter = statuses.includes(req.query.status) ? { status: req.query.status } : {};
    const paging = parsePage(req.query, { defaultLimit: 100, maxLimit: 200 });
    const [messages, total, unreadCount] = await Promise.all([
      ChatMessage.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit),
      ChatMessage.countDocuments(filter),
      ChatMessage.countDocuments({ status: 'unread' }),
    ]);
    return sendSuccess(res, 'Chat messages loaded', messages, 200, { unreadCount, pagination: pageMeta(paging, total) });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a chat message read, unread or archived
// @route   PUT /api/chat/:id
// @access  Private/Admin
const updateChatMessageStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !statuses.includes(req.body.status)) {
      return sendError(res, 'Invalid message or status.', 400);
    }
    const message = await ChatMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!message) return sendError(res, 'Chat message not found.', 404);
    return sendSuccess(res, 'Chat message updated', message);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a chat message
// @route   DELETE /api/chat/:id
// @access  Private/Admin
const deleteChatMessage = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Chat message not found.', 404);
    const message = await ChatMessage.findByIdAndDelete(req.params.id);
    if (!message) return sendError(res, 'Chat message not found.', 404);
    return sendSuccess(res, 'Chat message deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = { sendChatMessage, getMyChatHistory, getChatMessages, updateChatMessageStatus, deleteChatMessage };
