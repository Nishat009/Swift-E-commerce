// Contact form. Routes (routes/contactRoutes.js): POST /api/contact is public and rate-limited;
// GET, PUT /:id and DELETE /:id use protect + authorize('admin').
const mongoose = require('mongoose');
const ContactMessage = require('../models/ContactMessage');
const { sendSuccess, sendError } = require('../utils/response');
const { parsePage, pageMeta } = require('../utils/pagination');

const STATUSES = ['unread', 'read', 'replied', 'archived'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v) => (typeof v === 'string' ? v.trim() : '');

// Honeypot: bots fill the hidden "website" field. Pretend success without storing anything.
// Runs before validation so a bot never learns which field it got wrong.
const honeypot = (req, res, next) => {
  if (str(req.body.website)) return sendSuccess(res, 'Thanks! Your message has been sent.', {}, 201);
  next();
};

// @desc    Submit a contact message (fields checked by validations/contactValidation.js)
// @route   POST /api/contact
// @access  Public (rate-limited)
const submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    const doc = await ContactMessage.create({ name, email, subject, message, ip: req.ip || '' });

    try {
      const emailService = require('../services/emailService');
      if (emailService && typeof emailService.sendContactNotification === 'function') {
        await emailService.sendContactNotification(doc);
      }
    } catch (mailErr) {
      console.error('[contact] notification email failed:', mailErr.message);
    }

    return sendSuccess(res, 'Thanks! Your message has been sent. We usually reply within 1-2 business days.', {}, 201);
  } catch (err) {
    next(err);
  }
};

// @desc    List contact messages, newest first (?status, ?page, ?limit)
// @route   GET /api/contact
// @access  Private/Admin
const getContactMessages = async (req, res, next) => {
  try {
    const filter = STATUSES.includes(req.query.status) ? { status: req.query.status } : {};
    const paging = parsePage(req.query, { defaultLimit: 100, maxLimit: 200 });
    const [messages, total, unreadCount] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit),
      ContactMessage.countDocuments(filter),
      ContactMessage.countDocuments({ status: 'unread' })
    ]);
    return sendSuccess(res, 'Contact messages loaded', messages, 200, { unreadCount, pagination: pageMeta(paging, total) });
  } catch (err) {
    next(err);
  }
};

// @desc    Update message status
// @route   PUT /api/contact/:id
// @access  Private/Admin
const updateContactMessageStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendError(res, 'Message not found', 404);
    }
    if (!STATUSES.includes(req.body.status)) {
      return sendError(res, 'Invalid status', 400);
    }
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!msg) return sendError(res, 'Message not found', 404);
    return sendSuccess(res, 'Message updated', msg);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
const deleteContactMessage = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendError(res, 'Message not found', 404);
    }
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) return sendError(res, 'Message not found', 404);
    return sendSuccess(res, 'Message deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { honeypot, submitContactMessage, getContactMessages, updateContactMessageStatus, deleteContactMessage };
