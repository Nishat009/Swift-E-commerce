const express = require('express');
const { contactLimiter } = require('../config/rateLimits');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { honeypot, submitContactMessage, getContactMessages, updateContactMessageStatus, deleteContactMessage } = require('../controllers/contactController');

const { contactRules } = require('../validations/contactValidation');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/', contactLimiter, honeypot, contactRules, validate, submitContactMessage);

router.get('/', protect, authorize('admin'), getContactMessages);

router.put('/:id', protect, authorize('admin'), updateContactMessageStatus);

router.delete('/:id', protect, authorize('admin'), deleteContactMessage);

module.exports = router;
