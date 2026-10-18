const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { redeemCoupon, releaseCouponUse } = require('../services/couponService');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity, logAudit } = require('../utils/activityLog');
const wallet = require('../services/wallet');
const payments = require('../services/paymentService');
const inventory = require('../services/inventory');
const { emailOrderEvent, sendStaffOrderAlert, fire: fireEmail } = require('../services/emailService');
const { quoteOrder, publicQuote, QuoteError, isDhakaCity } = require('../services/orderQuote');
const { isSuperAdmin } = require('../middleware/roleMiddleware');
const { canEmailCustomers } = require('./customerEmailController');
const {
  CUSTOMER_CANCELLABLE, CLOSED, NEEDS_PAYMENT_FIRST, RETURN_REASONS, RETURN_WINDOW_DAYS, isOnline, canTransition, closeOrder,
  expireUnpaidOrders, notifyOrderUser, notifyStaff, returnDeadline, customerView, refundQuote, OPEN_RETURN, RETURN_NEEDS_STAFF,
  FULL_REFUND_DAYS,
} = require('../services/orderLifecycle');

const newOrderNumber = () => `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
const METHOD_LABELS = { cod: 'cash on delivery', bkash: 'bKash', card: 'card' };
const staffId = (req) => req.user._id || req.user.id;

// Marking an order Returned settles a return request that is still waiting, as approved
const approvePendingReturn = async (order, req) => {
  if (order.orderStatus !== 'Returned' || !OPEN_RETURN.includes(order.returnRequest?.status)) return order;
  const approved = await Order.findOneAndUpdate(
    { _id: order._id, 'returnRequest.status': { $in: OPEN_RETURN } },
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
    // Cash collected (COD delivered or marked paid): book it into the store wallet
    if (updated.paymentStatus === 'Paid' && prevOrderState.paymentStatus !== 'Paid') await wallet.recordSale(updated, req.user);

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
    if (after.paymentStatus === 'Paid' && prev.paymentStatus !== 'Paid') await wallet.recordSale(updated, req.user);
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

    // Pay it out of the store wallet; put the order back to "Refund Needed" if the wallet cannot cover it
    let txn;
    try {
      txn = await wallet.debit({ category: 'refund', amount, description: `Refund for ${updated.orderNumber} (${order.orderStatus.toLowerCase()} order)${note ? `: ${note}` : ''}`, order: updated, ref: `refund:${updated._id}`, user: req.user });
    } catch (err) {
      await Order.updateOne({ _id: order._id, paymentStatus: 'Refunded' }, { $set: { paymentStatus: 'Refund Needed' }, $unset: { refund: 1 } });
      if (err instanceof wallet.WalletError) return sendError(res, err.message, err.status);
      throw err;
    }
    if (txn) await Order.updateOne({ _id: updated._id }, { $set: { 'refund.walletTransaction': txn._id } });

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

const cleanText = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const money = (n) => `$${Number(n || 0).toFixed(2)}`;

// @desc    What a return of this order can refund (product price, delivery charge kept back,
//          whether the full-refund period has passed and the suggested handling charge)
// @route   GET /api/orders/:id/refund-quote
// @access  Private/Admin
const getRefundQuote = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Order not found', 404);
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'Order not found', 404);
    return sendSuccess(res, 'Refund quote', { ...refundQuote(order), walletBalance: await wallet.getBalance() });
  } catch (error) {
    next(error);
  }
};

// Put a claimed return request back the way it was when a later step fails
const restoreReturn = (orderId, status) => Order.updateOne(
  { _id: orderId },
  { $set: { 'returnRequest.status': status, 'returnRequest.decidedByName': '' }, $unset: { 'returnRequest.decidedAt': 1, 'returnRequest.decidedBy': 1 } }
);

// @desc    Staff handle a customer's return request:
//          propose  { deduction?, remarks?, response? }  offer a refund of the product price (Requested / Declined / Proposed)
//          confirm                                        pay the accepted offer out of the store wallet (super admin)
//          reject   { response }                          refuse the return (any open request)
//          approve  { response? }                         accept a return that has nothing to refund (unpaid order)
// @route   PUT /api/orders/:id/return-request
// @access  Private/Admin
const decideReturn = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Order not found', 404);
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'Order not found', 404);

    const decision = req.body?.decision;
    const response = cleanText(req.body?.response, 1000);
    const current = order.returnRequest?.status || '';
    if (!['propose', 'confirm', 'approve', 'reject'].includes(decision)) return sendError(res, 'Decision must be "propose", "confirm", "approve" or "reject".', 400);
    if (!OPEN_RETURN.includes(current)) return sendError(res, 'This order has no open return request.', 400);
    if (decision === 'reject' && response.length < 5) return sendError(res, 'Tell the customer why the return is not approved.', 400);
    if (decision !== 'reject' && order.orderStatus !== 'Delivered') {
      return sendError(res, `The order is ${order.orderStatus} now, so the return cannot go ahead. Reject it with a note instead.`, 400);
    }
    const paid = order.paymentStatus === 'Paid';
    const before = { orderStatus: order.orderStatus, paymentStatus: order.paymentStatus, returnRequest: current };
    const decidedBy = { 'returnRequest.decidedAt': new Date(), 'returnRequest.decidedBy': staffId(req), 'returnRequest.decidedByName': req.user.name || '' };

    if (decision === 'propose') {
      if (!paid) return sendError(res, 'Nothing was paid for this order, so there is no refund to offer. Approve the return instead.', 400);
      if (!['Requested', 'Declined', 'Proposed'].includes(current)) return sendError(res, 'The customer already accepted the offer. Confirm the refund instead.', 400);
      const q = refundQuote(order);
      const deduction = wallet.round(Number(req.body?.deduction || 0));
      const remarks = cleanText(req.body?.remarks, 500);
      if (!Number.isFinite(deduction) || deduction < 0) return sendError(res, 'The charge cannot be negative.', 400);
      if (!q.late && deduction > 0) {
        return sendError(res, `The return was asked for within ${q.fullRefundDays} days of delivery, so the full product price is refunded with no charge.`, 400);
      }
      if (q.late && deduction <= 0) {
        return sendError(res, `The return was asked for ${q.daysAfterDelivery} days after delivery (more than ${q.fullRefundDays}), so a handling charge applies. Enter the charge and why.`, 400);
      }
      if (deduction >= q.productAmount) return sendError(res, `The charge must be less than the product price (${money(q.productAmount)}).`, 400);
      if (deduction > 0 && remarks.length < 5) return sendError(res, 'Explain the charge to the customer in the remarks.', 400);

      const amount = wallet.round(q.productAmount - deduction);
      const proposal = {
        productAmount: q.productAmount,
        shippingExcluded: q.shippingExcluded,
        deduction,
        amount,
        remarks,
        late: q.late,
        daysAfterDelivery: q.daysAfterDelivery,
        proposedAt: new Date(),
        proposedBy: staffId(req),
        proposedByName: req.user.name || '',
      };
      const updated = await Order.findOneAndUpdate(
        { _id: order._id, 'returnRequest.status': current },
        { $set: { 'returnRequest.status': 'Proposed', 'returnRequest.proposal': proposal, 'returnRequest.response': response } },
        { new: true }
      );
      if (!updated) return sendError(res, 'Someone else just updated this return. Please refresh.', 409);

      const charge = deduction > 0 ? ` after a ${money(deduction)} handling charge (${remarks})` : '';
      await logAudit(req, 'Order', updated._id, `Order ${updated.orderNumber} refund offered`, before, { returnRequest: 'Proposed', refundOffer: amount, deduction });
      await logActivity(req, 'Refund Proposed', `Order ${updated.orderNumber}: offered ${money(amount)} of product price ${money(q.productAmount)}${charge}; delivery ${money(q.shippingExcluded)} not refunded`, 'refund');
      await notifyOrderUser(updated, 'Refund offer', `We can refund ${money(amount)} for order ${updated.orderNumber}${charge}. Delivery charges are not refundable. Please accept or decline the offer in My Orders.`);
      fireEmail(emailOrderEvent(updated, 'refund_offer'));
      return sendSuccess(res, 'Refund offer sent to the customer', updated);
    }

    if (decision === 'confirm') {
      if (!isSuperAdmin(req.user)) return sendError(res, 'Only a super admin can pay out a refund.', 403);
      if (current !== 'Accepted') return sendError(res, 'The customer has not accepted a refund offer yet.', 400);
      if (!paid) return sendError(res, 'This order is not marked as paid, so there is nothing to refund.', 400);
      const amount = Number(order.returnRequest.proposal?.amount);
      if (!(amount > 0)) return sendError(res, 'The accepted offer has no amount. Send a new offer.', 400);

      let updated = await Order.findOneAndUpdate(
        { _id: order._id, 'returnRequest.status': 'Accepted' },
        { $set: { 'returnRequest.status': 'Approved', 'returnRequest.response': response || order.returnRequest.response || '', ...decidedBy } },
        { new: true }
      );
      if (!updated) return sendError(res, 'Someone else already handled this return. Please refresh.', 409);

      let txn;
      try {
        txn = await wallet.debit({ category: 'refund', amount, description: `Refund for returned order ${order.orderNumber}`, order, ref: `refund:${order._id}`, user: req.user });
      } catch (err) {
        await restoreReturn(order._id, 'Accepted');
        if (err instanceof wallet.WalletError) return sendError(res, err.message, err.status);
        throw err;
      }

      const returned = await closeOrder(updated, 'Returned', ['Delivered']);
      if (!returned) {
        await wallet.reverse(txn, `order ${order.orderNumber} changed before the refund was confirmed`);
        await restoreReturn(order._id, 'Accepted');
        return sendError(res, 'This order was changed by someone else. Please refresh.', 409);
      }
      const p = order.returnRequest.proposal;
      updated = await Order.findByIdAndUpdate(returned._id, {
        $set: {
          paymentStatus: 'Refunded',
          refund: {
            amount,
            at: new Date(),
            by: staffId(req),
            byName: req.user.name || '',
            reference: txn ? `wallet:${txn._id}` : 'wallet',
            note: p.deduction > 0 ? `Product price ${money(p.productAmount)} less ${money(p.deduction)} handling charge: ${p.remarks}` : 'Full product price refunded. Delivery charge is not refundable.',
            walletTransaction: txn?._id,
          },
        },
      }, { new: true });

      await logAudit(req, 'Order', updated._id, `Order ${updated.orderNumber} returned and refunded`, before, { orderStatus: 'Returned', paymentStatus: 'Refunded', refundAmount: amount });
      await logActivity(req, 'Refund Paid', `Order ${updated.orderNumber}: ${money(amount)} paid out of the store wallet (balance now ${money(txn?.balanceAfter)})`, 'refund');
      await notifyOrderUser(updated, 'Refund confirmed', `Your refund of ${money(amount)} for order ${updated.orderNumber} has been sent.`);
      fireEmail(emailOrderEvent(updated, 'refund'));
      return sendSuccess(res, 'Refund paid and order marked Returned', updated);
    }

    if (decision === 'approve') {
      if (paid) return sendError(res, 'This order was paid. Send the customer a refund offer instead.', 400);
      let updated = await Order.findOneAndUpdate(
        { _id: order._id, 'returnRequest.status': current },
        { $set: { 'returnRequest.status': 'Approved', 'returnRequest.response': response, ...decidedBy } },
        { new: true }
      );
      if (!updated) return sendError(res, 'Someone else already handled this return. Please refresh.', 409);
      const returned = await closeOrder(updated, 'Returned', ['Delivered']);
      if (!returned) {
        await restoreReturn(order._id, current);
        return sendError(res, 'This order was changed by someone else. Please refresh.', 409);
      }
      updated = returned;
      await logAudit(req, 'Order', updated._id, `Order ${updated.orderNumber} return approved`, before, { orderStatus: updated.orderStatus, returnRequest: 'Approved' });
      await logActivity(req, 'Return Approved', `Order ${updated.orderNumber}${response ? `: ${response.slice(0, 160)}` : ''}`);
      await notifyOrderUser(updated, 'Return approved', `Your return for order ${updated.orderNumber} was approved.`);
      fireEmail(emailOrderEvent(updated, 'return_decision'));
      return sendSuccess(res, 'Return approved', updated);
    }

    // reject
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, 'returnRequest.status': current },
      { $set: { 'returnRequest.status': 'Rejected', 'returnRequest.response': response, ...decidedBy } },
      { new: true }
    );
    if (!updated) return sendError(res, 'Someone else already handled this return. Please refresh.', 409);
    await logAudit(req, 'Order', updated._id, `Order ${updated.orderNumber} return rejected`, before, { returnRequest: 'Rejected' });
    await logActivity(req, 'Return Rejected', `Order ${updated.orderNumber}: ${response.slice(0, 160)}`);
    await notifyOrderUser(updated, 'Return not approved', `Your return request for order ${updated.orderNumber} was not approved: ${response}`);
    fireEmail(emailOrderEvent(updated, 'return_decision'));
    return sendSuccess(res, 'Return rejected', updated);
  } catch (error) {
    next(error);
  }
};

// @desc    The customer accepts or declines the refund offer
// @route   POST /api/orders/:id/return-request/respond   body: { accept: boolean, note? }
// @access  Private (the customer who placed the order)
const respondToRefundOffer = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Order not found', 404);
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'Order not found', 404);
    if (order.user.toString() !== req.user.id) return sendError(res, 'Only the customer who placed this order can answer the offer.', 403);
    if (order.returnRequest?.status !== 'Proposed') return sendError(res, 'There is no refund offer waiting for your answer.', 400);
    if (typeof req.body?.accept !== 'boolean') return sendError(res, 'Say whether you accept the offer.', 400);

    const accept = req.body.accept;
    const note = cleanText(req.body?.note, 500);
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, 'returnRequest.status': 'Proposed', 'returnRequest.proposal.proposedAt': order.returnRequest.proposal.proposedAt },
      { $set: { 'returnRequest.status': accept ? 'Accepted' : 'Declined', 'returnRequest.proposal.respondedAt': new Date(), 'returnRequest.proposal.customerNote': note } },
      { new: true }
    );
    if (!updated) return sendError(res, 'The offer was just changed. Please refresh to see the latest one.', 409);

    const amount = money(updated.returnRequest.proposal.amount);
    await logActivity(req, accept ? 'Refund Offer Accepted' : 'Refund Offer Declined', `Order ${updated.orderNumber}: ${amount}${note ? ` - "${note.slice(0, 160)}"` : ''}`, 'refund');
    await notifyStaff(updated, accept ? 'Refund offer accepted' : 'Refund offer declined',
      accept
        ? `${updated.orderNumber}: the customer accepted ${amount}. Confirm it to pay the refund.`
        : `${updated.orderNumber}: the customer declined ${amount}.${note ? ` "${note}"` : ''} Send a new offer or reject the return.`);
    await notifyOrderUser(updated, accept ? 'Refund offer accepted' : 'Refund offer declined',
      accept ? `Thanks. We will send ${amount} for order ${updated.orderNumber} shortly.` : `We let our team know you declined the offer for order ${updated.orderNumber}.`);
    return sendSuccess(res, accept ? 'Offer accepted' : 'Offer declined', customerView(updated));
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
    const returnRequests = await Order.countDocuments({ 'returnRequest.status': { $in: RETURN_NEEDS_STAFF } });
    return sendSuccess(res, 'All orders retrieved successfully', orders, 200, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      // Lets the admin screen show the super-admin controls (the server enforces them again)
      canOverrideStatus: isSuperAdmin(req.user),
      canEmailCustomers: canEmailCustomers(req.user),
      refundsNeeded,
      returnRequests,
      returnWindowDays: RETURN_WINDOW_DAYS,
      fullRefundDays: FULL_REFUND_DAYS,
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
  respondToRefundOffer,
  getRefundQuote,
  getAllOrders,
};
