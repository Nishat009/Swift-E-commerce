const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const CustomerEmail = require('../models/CustomerEmail');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity } = require('../utils/activityLog');
const emailService = require('../services/emailService');
const { isDemoAccount } = require('./demoAuthController');

// Anyone can sign in as the shared demo admin, so it may not send real email to customers.
// With no SMTP set up, mail only reaches the Ethereal test inbox, so the demo admin can still try it.
const canEmailCustomers = (user) => Boolean(user) && user.role === 'admin' && !(isDemoAccount(user) && emailService.isConfigured());

const IN_APP_LIMIT = 280;

// @desc    Email a customer from the admin panel (optionally about one of their orders)
// @route   POST /api/admin/users/:id/email   body: { subject, message, orderId?, includeOrder?, notifyInApp? }
// @access  Private/Admin
const sendCustomerEmail = async (req, res, next) => {
  try {
    if (!canEmailCustomers(req.user)) {
      return sendError(res, 'The shared demo admin cannot email customers while real email is switched on.', 403);
    }
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Customer not found', 404);
    const customer = await User.findById(req.params.id).select('name email');
    if (!customer) return sendError(res, 'Customer not found', 404);

    const subject = typeof req.body?.subject === 'string' ? req.body.subject.replace(/\s+/g, ' ').trim().slice(0, 150) : '';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 5000) : '';
    if (subject.length < 3) return sendError(res, 'Add a subject (at least 3 characters).', 400);
    if (message.length < 10) return sendError(res, 'Write a message (at least 10 characters).', 400);

    let order = null;
    if (req.body?.orderId) {
      if (mongoose.isValidObjectId(req.body.orderId)) order = await Order.findById(req.body.orderId).populate('products.product');
      if (!order || String(order.user) !== String(customer._id)) return sendError(res, 'That order does not belong to this customer.', 400);
    }
    const includeOrder = Boolean(order && req.body?.includeOrder);
    const inApp = req.body?.notifyInApp !== false;

    const { ok, previewUrl } = await emailService.sendCustomerMessage({
      user: customer,
      order,
      subject,
      message,
      includeOrder,
      replyTo: process.env.CONTACT_EMAIL || req.user.email,
    });

    if (inApp) {
      try {
        await Notification.create({
          user: customer._id,
          title: subject,
          message: message.length > IN_APP_LIMIT ? `${message.slice(0, IN_APP_LIMIT - 3)}...` : message,
          type: 'store_message',
          relatedOrder: order?._id || null,
        });
      } catch (err) {
        console.error('Customer message notification failed:', err.message);
      }
    }

    const record = await CustomerEmail.create({
      user: customer._id,
      order: order?._id || null,
      to: customer.email,
      subject,
      message,
      includeOrder,
      sentBy: req.user._id || req.user.id,
      sentByName: req.user.name || '',
      delivered: ok,
      inApp,
    });
    await logActivity(req, 'Customer Emailed', `${customer.email}: "${subject}"${order ? ` (order ${order.orderNumber})` : ''}${ok ? '' : ' - email not delivered'}`);

    if (!ok && !inApp) return sendError(res, 'The email could not be sent. Check the SMTP settings (see backend/EMAIL.md).', 502);
    return sendSuccess(
      res,
      ok ? 'Email sent' : 'The email could not be sent, but the customer got the message as an in-app notification.',
      { email: record, delivered: ok, previewUrl },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Messages already sent to a customer (newest first), optionally only about one order
// @route   GET /api/admin/users/:id/emails?order=<orderId>
// @access  Private/Admin
const listCustomerEmails = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Customer not found', 404);
    const filter = { user: req.params.id };
    if (req.query.order) {
      if (!mongoose.isValidObjectId(req.query.order)) return sendSuccess(res, 'Customer emails retrieved', []);
      filter.order = req.query.order;
    }
    const emails = await CustomerEmail.find(filter).sort({ createdAt: -1 }).limit(30);
    return sendSuccess(res, 'Customer emails retrieved', emails, 200, { canEmailCustomers: canEmailCustomers(req.user) });
  } catch (error) {
    next(error);
  }
};

module.exports = { canEmailCustomers, sendCustomerEmail, listCustomerEmails };
