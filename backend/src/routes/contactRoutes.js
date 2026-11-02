const express = require('express');
const { contactLimiter } = require('../config/rateLimits');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { submitContactMessage, getContactMessages, updateContactMessageStatus, deleteContactMessage } = require('../controllers/contactController');

const router = express.Router();

router.post('/', contactLimiter, submitContactMessage);

router.get('/', protect, authorize('admin'), getContactMessages);

router.put('/:id', protect, authorize('admin'), updateContactMessageStatus);

router.delete('/:id', protect, authorize('admin'), deleteContactMessage);

module.exports = router;
