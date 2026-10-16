const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { redeemCoupon, releaseCouponUse } = require('../services/couponService');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity, logAudit } = require('../utils/activityLog');
const payments = require('../services/paymentService');
const inventory = require('../services/inventory');
const { emailOrderEvent, sendStaffOrderAlert, fire: fireEmail } = require('../services/emailService');
const { quoteOrder, publicQuote, QuoteError, isDhakaCity } = require('../services/orderQuote');
const { isSuperAdmin } = require('../middleware/roleMiddleware');
const { canEmailCustomers } = require('./customerEmailController');
const {
  CUSTOMER_CANCELLABLE, CLOSED, NEEDS_PAYMENT_FIRST, RETURN_REASONS, RETURN_WINDOW_DAYS, isOnline, canTransition, closeOrder,
  expireUnpaidOrders, notifyOrderUser, notifyStaff, returnDeadline, customerView,
} = require('../services/orderLifecycle');

const newOrderNumber = () => `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
const METHOD_LABELS = { cod: 'cash on delivery', bkash: 'bKash', card: 'card' };
const staffId = (req) => req.user._id || req.user.id;

// Marking an order Returned settles a return request that is still waiting, as approved
const approvePendingReturn = async (order, req) => {
  if (order.orderStatus !== 'Returned' || order.returnRequest?.status !== 'Requested') return order;
  const approved = await Order.findOneAndUpdate(
    { _id: order._id, 'returnRequest.status': 'Requested' },
    { $set: { 'returnRequest.status': 'Approved', 'returnRequest.decidedAt': new Date(), 'returnRequest.decidedBy': staffId(req), 'returnRequest.decidedByName': req.user.name || '' } },
    { new: true }
  );
  return approved || order;
};

// Email for a status change; an order returned through a return request gets the return decision instead
const emailStatusChange = (order) => {
  const kind = order.orderStatus === 'Returned' && order.returnRequest?.status === 'Approved' ? 'return_decision' : 'status';
  fireEmail(emailOrderEvent(order, kind));
};

// @desc    Price preview for the cart / checkout (same calculation as createOrder)
// @route   POST /api/orders/quote
// @access  Private
const getOrderQuote = async (req, res, next) => {
  try {
    const quote = await quoteOrder(req.body.products, req.user.id, req.body.couponCode, {
      paymentMethod: req.body.paymentMethod,
      deliveryZone: req.body.deliveryZone,
    });
    return sendSuccess(res, 'Order quote calculated', publicQuote(quote));
  } catch (error) {
    if (error instanceof QuoteError) return sendError(res, error.message, error.status);
    next(error);
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  const { products, shippingAddress, paymentMethod, couponCode, deliveryZone } = req.body;

  try {
    if (!payments.isMethodEnabled(paymentMethod)) {
      return sendError(res, 'Selected payment method is not available', 400);
    }

    // Cash on delivery: the customer must say where it is going, and "Inside Dhaka" needs a Dhaka address
    if (paymentMethod === 'cod' && deliveryZone === 'inside_dhaka' && !isDhakaCity(shippingAddress?.city)) {
      return sendError(res, 'Inside Dhaka delivery is only for addresses in Dhaka. Choose Outside Dhaka for this address.', 400);
    }

    // 1. Prices, promotions, coupon, delivery charge and stock are all computed server-side
    let quote;
    try {
      quote = await quoteOrder(products, req.user.id, couponCode, { paymentMethod, deliveryZone });
    } catch (err) {
      if (err instanceof QuoteError) return sendError(res, err.message, err.status);
      throw err;
    }

    // 2. Reserve stock (product and variant) atomically, all lines or none
    const reserved = await inventory.reserve(quote.lines);
    if (!reserved.ok) {
      return sendError(res, `Stock changed for ${reserved.failedLine.title}. Please review your cart.`, 409);
    }

    // 3. Take one coupon use atomically (total and per-customer limits)
    const appliedCoupon = quote.couponDoc;
    if (appliedCoupon && !(await redeemCoupon(appliedCoupon, req.user.id))) {
      await inventory.release(quote.lines);
      return sendError(res, 'This coupon has reached its usage limit', 409);
    }

    try {
      const orderData = {
        user: req.user.id,
        products: quote.lines.map((line) => ({
          product: line.product,
          quantity: line.quantity,
          price: line.unitPrice,
          variant: line.variant,
          stockTargets: line.stockTargets,
        })),
        subtotal: quote.subtotal,
        shipping: quote.shipping,
        deliveryZone: quote.deliveryZone,
        tax: quote.tax,
        coupon: appliedCoupon ? appliedCoupon.code : '',
        discount: quote.discount,
        promoDiscount: quote.promoDiscount,
        total: quote.total,
        paymentMethod,
        paymentStatus: 'Pending',
        orderStatus: 'Pending',
        shippingAddress,
      };

      let order;
      for (let attempt = 0; !order; attempt++) {
        try {
          order = await Order.create({ ...orderData, orderNumber: newOrderNumber() });
        } catch (err) {
          if (err.code !== 11000 || attempt >= 2) throw err;
        }
      }

      await Cart.updateOne({ user: req.user.id }, { $set: { products: [], subtotal: 0 } });

      await order.populate('products.product');
      await notifyOrderUser(order, 'Order placed', `Your order ${order.orderNumber} was placed successfully. Total: $${order.total.toFixed(2)}.`);
      const awaitingPayment = isOnline(order) ? ', waiting for online payment' : '';
      const alert = `${order.orderNumber} from ${req.user.name || 'a customer'}: $${order.total.toFixed(2)} by ${METHOD_LABELS[order.paymentMethod] || order.paymentMethod}${awaitingPayment}.`;
      await notifyStaff(order, 'New order received', alert);
      fireEmail(emailOrderEvent(order, 'confirmation'));
      fireEmail(sendStaffOrderAlert(order, { subject: `New order ${order.orderNumber} ($${order.total.toFixed(2)})`, title: 'New order received', intro: alert }));
      return sendSuccess(res, 'Order created successfully', customerView(order), 201);
    } catch (orderErr) {
      // Give back the stock and coupon use if the order could not be saved
      if (appliedCoupon) await releaseCouponUse(appliedCoupon.code, req.user.id);
      await inventory.release(quote.lines);
      throw orderErr;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    await expireUnpaidOrders();
    const orders = await Order.find({ user: req.user.id })
      .populate('products.product')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 'Orders retrieved successfully', orders.map(customerView));
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Order not found', 404);
    const order = await Order.findById(req.params.id).populate('products.product').populate('user', 'name email');
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    const ownerId = order.user?._id ? order.user._id.toString() : String(order.user || '');
    if (ownerId !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to view this order', 403);
    }

    // Customers see the refund amount and date, not which staff member issued it
    return sendSuccess(res, 'Order retrieved successfully', req.user.role === 'admin' ? order : customerView(order));
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Order not found', 404);
    const order = await Order.findById(req.params.id);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to cancel this order', 403);
    }

    if (!CUSTOMER_CANCELLABLE.includes(order.orderStatus)) {
      const reason = order.orderStatus === 'Cancelled' ? 'Order is already cancelled' : `An order that is ${order.orderStatus} cannot be cancelled`;
      return sendError(res, reason, 400);
    }

    // Atomic: two simultaneous cancels can never give the stock back twice
    const cancelled = await closeOrder(order, 'Cancelled', CUSTOMER_CANCELLABLE);
    if (!cancelled) return sendError(res, 'This order was already updated. Please refresh.', 409);

    const refundNote = cancelled.paymentStatus === 'Refund Needed' ? ' Your payment will be refunded.' : '';
    await notifyOrderUser(cancelled, 'Order cancelled', `Your order ${cancelled.orderNumber} has been cancelled.${refundNote}`);
    if (refundNote) await logActivity(req, 'Refund Needed', `Paid order ${cancelled.orderNumber} was cancelled by the customer and needs a refund`);
    if (order.user.toString() === req.user.id) {
      await notifyStaff(cancelled, 'Order cancelled by customer', `${cancelled.orderNumber} ($${cancelled.total.toFixed(2)}) was cancelled by the customer.${refundNote ? ' It was paid, so it needs a refund.' : ''}`);
    }
    fireEmail(emailOrderEvent(cancelled, 'status'));
    return sendSuccess(res, 'Order cancelled successfully', customerView(cancelled));
  } catch (error) {
    next(error);
  }
};

// Manual payment changes an admin may make
const allowedPaymentChange = (order, next) => {
  if (next === order.paymentStatus) return null;
  if (next === 'Paid' && order.paymentMethod === 'cod' && !CLOSED.includes(order.orderStatus)) return null;
  return `Payment status cannot be changed from ${order.paymentStatus} to ${next} manually.`;
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  const { status, paymentStatus } = req.body;

  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Order not found', 404);
    const order = await Order.findById(req.params.id);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    const validStatuses = Order.schema.path('orderStatus').enumValues;
    const validPayments = Order.schema.path('paymentStatus').enumValues;
    if (status && !validStatuses.includes(status)) {
      return sendError(res, `Invalid order status. Allowed: ${validStatuses.join(', ')}`, 400);
    }
    if (paymentStatus && !validPayments.includes(paymentStatus)) {
      return sendError(res, `Invalid payment status. Allowed: ${validPayments.join(', ')}`, 400);
    }

    const statusChange = status && status !== order.orderStatus;
    if (statusChange) {
      const problem = canTransition(order, status);
      if (problem) return sendError(res, problem, 400);
    }
    if (paymentStatus) {
      const problem = allowedPaymentChange(order, paymentStatus);
      if (problem) return sendError(res, problem, 400);
    }

    const prevOrderState = { orderStatus: order.orderStatus, paymentStatus: order.paymentStatus };
    let updated;
    if (statusChange && CLOSED.includes(status)) {
      updated = await closeOrder(order, status, [order.orderStatus]);
      if (updated) updated = await approvePendingReturn(updated, req);
    } else {
      const set = {};
      if (statusChange) set.orderStatus = status;
      if (statusChange && status === 'Delivered') set.deliveredAt = new Date();
      if (statusChange && status === 'Delivered' && order.paymentMethod === 'cod' && !paymentStatus) set.paymentStatus = 'Paid';
      updated = await Order.findOneAndUpdate({ _id: order._id, orderStatus: order.orderStatus }, { $set: set }, { new: true });
    }
    if (!updated) return sendError(res, 'This order was changed by someone else. Please refresh.', 409);
    if (paymentStatus && paymentStatus !== updated.paymentStatus) {
      updated = await Order.findByIdAndUpdate(updated._id, { paymentStatus, ...(paymentStatus === 'Paid' ? { paidAt: new Date() } : {}) }, { new: true });
    }

    const newState = { orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus };
    await logAudit(req, 'Order', updated._id, `Order ${updated.orderNumber} updated`, prevOrderState, newState);
    await logActivity(req, 'Order Updated', `Order ${updated.orderNumber}: ${prevOrderState.orderStatus} -> ${newState.orderStatus}, payment ${prevOrderState.paymentStatus} -> ${newState.paymentStatus}`);
    if (newState.orderStatus !== prevOrderState.orderStatus) {
      await notifyOrderUser(updated, 'Order update', `Your order ${updated.orderNumber} is now: ${updated.orderStatus}.`);
      emailStatusChange(updated);
    }
    return sendSuccess(res, 'Order status updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Set an order to any status at any stage (super admin only)
// @route   PUT /api/orders/:id/override-status
// @access  Private/SuperAdmin
// Open statuses can be swapped freely. Moving to Cancelled / Returned gives the stock and coupon use
// back (and flags a paid order 'Refund Needed'). Cancelled / Returned orders cannot be reopened: their
// stock was already released and may have been sold again, so the customer should place a new order.
const overrideOrderStatus = async (req, res, next) => {
  const { status } = req.body;
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Order not found', 404);
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'Order not found', 404);

    const validStatuses = Order.schema.path('orderStatus').enumValues;
    if (!validStatuses.includes(status)) return sendError(res, `Invalid order status. Allowed: ${validStatuses.join(', ')}`, 400);
    if (status === order.orderStatus) return sendError(res, `The order is already ${status}.`, 400);
    if (CLOSED.includes(order.orderStatus)) {
      return sendError(res, `A ${order.orderStatus} order cannot be reopened because its stock was already released. Ask the customer to place a new order.`, 400);
    }
    if (NEEDS_PAYMENT_FIRST.includes(status) && isOnline(order) && order.paymentStatus !== 'Paid') {
      return sendError(res, 'This order has not been paid online yet, so it cannot be packed, shipped or delivered.', 400);
    }

    const prev = { orderStatus: order.orderStatus, paymentStatus: order.paymentStatus };
    let updated;
    if (CLOSED.includes(status)) {
      updated = await closeOrder(order, status, [order.orderStatus]);
      if (updated) updated = await approvePendingReturn(updated, req);
    } else {
      const set = { orderStatus: status };
      if (status === 'Delivered') set.deliveredAt = new Date();
      if (status === 'Delivered' && order.paymentMethod === 'cod') {
        set.paymentStatus = 'Paid';
        if (order.paymentStatus !== 'Paid') set.paidAt = new Date();
      }
      updated = await Order.findOneAndUpdate({ _id: order._id, orderStatus: order.orderStatus }, { $set: set }, { new: true });
    }
    if (!updated) return sendError(res, 'This order was changed by someone else. Please refresh.', 409);

    const after = { orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus };
    await logAudit(req, 'Order', updated._id, `Order ${updated.orderNumber} status set by super admin`, prev, after);
    await logActivity(req, 'Order Status Override', `Order ${updated.orderNumber}: ${prev.orderStatus} -> ${after.orderStatus}, payment ${prev.paymentStatus} -> ${after.paymentStatus}`);
    const refundNote = after.paymentStatus === 'Refund Needed' && prev.paymentStatus !== 'Refund Needed' ? ' Your payment will be refunded.' : '';
    await notifyOrderUser(updated, 'Order update', `Your order ${updated.orderNumber} is now: ${updated.orderStatus}.${refundNote}`);
    emailStatusChange(updated);
    return sendSuccess(res, 'Order status updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a cancelled / returned paid order as refunded (super admin only)
// @route   POST /api/orders/:id/refund   body: { amount?, reference?, note? }
// @access  Private/SuperAdmin
// No gateway refund API is wired up (the mock gateway has none, and card / bKash refunds are issued from
// the Stripe / bKash dashboard), so this records the refund: who, when, how much (default: the order total)
// and the payout reference (e.g. the bKash TrxID).
const refundOrder = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Order not found', 404);
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'Order not found', 404);
    if (order.paymentStatus === 'Refunded') return sendError(res, 'This order has already been refunded.', 400);
    if (!CLOSED.includes(order.orderStatus) || order.paymentStatus !== 'Refund Needed') {
      return sendError(res, 'Only a cancelled or returned order that was paid and still needs a refund can be refunded.', 400);
    }

    const raw = req.body?.amount;
    const amount = raw === undefined || raw === null || raw === '' ? order.total : Math.round(Number(raw) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0 || amount > order.total) {
      return sendError(res, `The refund must be more than $0 and at most the order total ($${order.total.toFixed(2)}).`, 400);
    }
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 300) : '';
    const reference = typeof req.body?.reference === 'string' ? req.body.reference.trim().slice(0, 120) : '';
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: 'Refund Needed' },
      {
        $set: {
          paymentStatus: 'Refunded',
          refund: {
            amount,
            at: new Date(),
            by: staffId(req),
            byName: req.user.name || '',
            reference: reference || `${order.paymentGateway || 'manual'}:${order.paymentTransactionId || ''}`,
            note,
          },
        },
      },
      { new: true }
    );
    if (!updated) return sendError(res, 'This order was already refunded. Please refresh.', 409);

    const partial = amount < order.total ? ` (partial, order total $${order.total.toFixed(2)})` : '';
    await logAudit(req, 'Order', updated._id, `Order ${updated.orderNumber} refunded`, { paymentStatus: 'Refund Needed' }, { paymentStatus: 'Refunded', refundAmount: amount });
    await logActivity(req, 'Order Refunded', `Order ${updated.orderNumber}: refund of $${amount.toFixed(2)}${partial} recorded${note ? ` (${note})` : ''}`);
    await notifyOrderUser(updated, 'Payment refunded', `Your payment of $${amount.toFixed(2)} for order ${updated.orderNumber} has been refunded.`);
    fireEmail(emailOrderEvent(updated, 'refund'));
    return sendSuccess(res, 'Refund recorded', updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Ask to return a delivered order (and get a refund)
// @route   POST /api/orders/:id/return-request   body: { reason, details? }
// @access  Private (the customer who placed the order)
const requestReturn = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Order not found', 404);
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'Order not found', 404);
    if (order.user.toString() !== req.user.id) return sendError(res, 'Only the customer who placed this order can ask to return it.', 403);

    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    const details = typeof req.body?.details === 'string' ? req.body.details.trim().slice(0, 1000) : '';
    if (!RETURN_REASONS.includes(reason)) return sendError(res, `Choose a reason: ${RETURN_REASONS.join(', ')}`, 400);
    if (reason === 'Other' && details.length < 10) return sendError(res, 'Please tell us a little more about why you are returning this order.', 400);

    if (order.returnRequest?.status) return sendError(res, 'A return was already requested for this order.', 400);
    if (order.orderStatus !== 'Delivered') return sendError(res, 'Only a delivered order can be returned.', 400);
    const deadline = returnDeadline(order);
    if (deadline && deadline < new Date()) {
      return sendError(res, `The ${RETURN_WINDOW_DAYS}-day return window for this order ended on ${deadline.toDateString()}.`, 400);
    }

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, orderStatus: 'Delivered', 'returnRequest.status': { $in: ['', null] } },
      { $set: { returnRequest: { status: 'Requested', reason, details, requestedAt: new Date() } } },
      { new: true }
    );
    if (!updated) return sendError(res, 'This order was just updated. Please refresh.', 409);

    await logActivity(req, 'Return Requested', `Order ${updated.orderNumber}: ${reason}${details ? ` - ${details.slice(0, 120)}` : ''}`);
    await notifyOrderUser(updated, 'Return requested', `We received your return request for order ${updated.orderNumber}. We will review it within 2 business days.`);
    const alert = `${updated.orderNumber} ($${updated.total.toFixed(2)}): ${reason}.`;
    await notifyStaff(updated, 'Return requested', alert);
    fireEmail(emailOrderEvent(updated, 'return_requested'));
    fireEmail(sendStaffOrderAlert(updated, { subject: `Return requested for ${updated.orderNumber}`, title: 'Return requested', intro: `${req.user.name || 'A customer'} asked to return ${alert}${details ? ` "${details}"` : ''}` }));
    return sendSuccess(res, 'Return requested', customerView(updated));
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject a customer's return request (approving marks the order Returned,
//          puts the items back in stock and flags a paid order for a refund)
// @route   PUT /api/orders/:id/return-request   body: { decision: 'approve' | 'reject', response? }
// @access  Private/Admin
const decideReturn = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Order not found', 404);
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'Order not found', 404);

    const decision = req.body?.decision;
    const response = typeof req.body?.response === 'string' ? req.body.response.trim().slice(0, 1000) : '';
    if (!['approve', 'reject'].includes(decision)) return sendError(res, 'Decision must be "approve" or "reject".', 400);
    if (decision === 'reject' && response.length < 5) return sendError(res, 'Tell the customer why the return is not approved.', 400);
    if (order.returnRequest?.status !== 'Requested') return sendError(res, 'This order has no return request waiting for a decision.', 400);
    if (decision === 'approve' && order.orderStatus !== 'Delivered') {
      return sendError(res, `The order is ${order.orderStatus} now, so the return cannot be approved. Reject it with a note instead.`, 400);
    }

    const decided = {
      'returnRequest.status': decision === 'approve' ? 'Approved' : 'Rejected',
      'returnRequest.decidedAt': new Date(),
      'returnRequest.decidedBy': staffId(req),
      'returnRequest.decidedByName': req.user.name || '',
      'returnRequest.response': response,
    };
    let updated = await Order.findOneAndUpdate({ _id: order._id, 'returnRequest.status': 'Requested' }, { $set: decided }, { new: true });
    if (!updated) return sendError(res, 'Someone else already handled this return. Please refresh.', 409);

    const before = { orderStatus: order.orderStatus, paymentStatus: order.paymentStatus, returnRequest: 'Requested' };
    if (decision === 'approve') {
      const returned = await closeOrder(updated, 'Returned', ['Delivered']);
      if (!returned) {
        // The order moved on while we were deciding: put the request back so it can be handled again
        await Order.updateOne(
          { _id: order._id },
          {
            $set: { 'returnRequest.status': 'Requested', 'returnRequest.decidedByName': '', 'returnRequest.response': '' },
            $unset: { 'returnRequest.decidedAt': 1, 'returnRequest.decidedBy': 1 },
          }
        );
        return sendError(res, 'This order was changed by someone else. Please refresh.', 409);
      }
      updated = returned;
    }

    const after = { orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus, returnRequest: updated.returnRequest.status };
    await logAudit(req, 'Order', updated._id, `Order ${updated.orderNumber} return ${after.returnRequest.toLowerCase()}`, before, after);
    await logActivity(req, decision === 'approve' ? 'Return Approved' : 'Return Rejected', `Order ${updated.orderNumber}${response ? `: ${response.slice(0, 160)}` : ''}`);
    const refundNote = updated.paymentStatus === 'Refund Needed' ? ' Your refund will be processed soon.' : '';
    await notifyOrderUser(updated, decision === 'approve' ? 'Return approved' : 'Return not approved',
      decision === 'approve'
        ? `Your return for order ${updated.orderNumber} was approved.${refundNote}`
        : `Your return request for order ${updated.orderNumber} was not approved: ${response}`);
    fireEmail(emailOrderEvent(updated, 'return_decision'));
    return sendSuccess(res, decision === 'approve' ? 'Return approved' : 'Return rejected', updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    await expireUnpaidOrders();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 50), 500);
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('products.product')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments();

    const refundsNeeded = await Order.countDocuments({ paymentStatus: 'Refund Needed' });
    const returnRequests = await Order.countDocuments({ 'returnRequest.status': 'Requested' });
    return sendSuccess(res, 'All orders retrieved successfully', orders, 200, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      // Lets the admin screen show the super-admin controls (the server enforces them again)
      canOverrideStatus: isSuperAdmin(req.user),
      canEmailCustomers: canEmailCustomers(req.user),
      refundsNeeded,
      returnRequests,
      returnWindowDays: RETURN_WINDOW_DAYS,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrderQuote,
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  overrideOrderStatus,
  refundOrder,
  requestReturn,
  decideReturn,
  getAllOrders,
};
