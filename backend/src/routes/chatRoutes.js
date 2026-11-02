const express = require('express');
const { chatLimiter } = require('../config/rateLimits');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { sendChatMessage, getMyChatHistory, getChatMessages, updateChatMessageStatus, deleteChatMessage } = require('../controllers/chatController');

const router = express.Router();

router.post('/', chatLimiter, optionalAuth, sendChatMessage);

router.get('/mine', optionalAuth, getMyChatHistory);

router.get('/', protect, authorize('admin'), getChatMessages);

router.put('/:id', protect, authorize('admin'), updateChatMessageStatus);

router.delete('/:id', protect, authorize('admin'), deleteChatMessage);

module.exports = router;
