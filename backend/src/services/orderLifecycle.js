// Order status rules shared by the customer cancel, admin status update and the unpaid-order sweep.
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const inventory = require('./inventory');
const { releaseCouponUse } = require('./couponService');
const { snapshotProducts, alertAfterStockChange } = require('./productAlertService');

const CLOSED = ['Cancelled', 'Returned'];
const UNPAID_HOLD_MINUTES = Number(process.env.ORDER_PAYMENT_HOLD_MINUTES) || 30;

// Allowed admin moves. Closed orders are final: their stock and coupon were already given back.
const TRANSITIONS = {
  Pending: ['Processing', 'Confirmed', 'Cancelled'],
  Processing: ['Confirmed', 'Packed', 'Shipped', 'Cancelled'],
  Confirmed: ['Processing', 'Packed', 'Shipped', 'Cancelled'],
  Packed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Returned'],
  Delivered: ['Returned'],
  Cancelled: [],
  Returned: [],
};

const CUSTOMER_CANCELLABLE = ['Pending', 'Processing', 'Confirmed'];
const NEEDS_PAYMENT_FIRST = ['Packed', 'Shipped', 'Delivered'];

const isOnline = (order) => order.paymentMethod === 'bkash' || order.paymentMethod === 'card';

const canTransition = (order, next) => {
  if (!(TRANSITIONS[order.orderStatus] || []).includes(next)) {
    return `An order that is ${order.orderStatus} cannot be moved to ${next}.`;
  }
  if (NEEDS_PAYMENT_FIRST.includes(next) && isOnline(order) && order.paymentStatus !== 'Paid') {
    return 'This order has not been paid online yet, so it cannot be packed or shipped.';
  }
  return null;
};

// Best-effort in-app notification for the order owner (never blocks the order flow)
const notifyOrderUser = async (order, title, message) => {
  try {
    await Notification.create({ user: order.user?._id || order.user, title, message, type: 'delivery_update', relatedOrder: order._id });
  } catch (err) {
    console.error('Order notification failed:', err.message);
  }
};

const inventoryLines = (order) => order.products.map((p) => ({
  product: p.product?._id || p.product,
  quantity: p.quantity,
  stockTargets: p.stockTargets || [],
}));

// Atomically close an order (Cancelled / Returned) from one of the allowed statuses, then give
// back its stock and coupon use. Returns the updated order, or null if another request got there first.
const closeOrder = async (order, status, fromStatuses) => {
  const set = { orderStatus: status, couponReleased: true };
  if (order.paymentStatus === 'Paid') set.paymentStatus = 'Refund Needed';
  const closed = await Order.findOneAndUpdate(
    { _id: order._id, orderStatus: { $in: fromStatuses || Object.keys(TRANSITIONS).filter((s) => !CLOSED.includes(s)) } },
    { $set: set },
    { new: true }
  );
  if (!closed) return null;

  const lines = inventoryLines(closed);
  const before = await snapshotProducts(lines.map((l) => l.product));
  await inventory.release(lines);
  // Stock that comes back can restock a sold-out product: tell wishlisters and email sign-ups
  await alertAfterStockChange(before);
  if (closed.coupon && !order.couponReleased) await releaseCouponUse(closed.coupon, closed.user);
  return closed;
};

// Online orders that were never paid hold stock; cancel them after the payment window.
const expireUnpaidOrders = async () => {
  const cutoff = new Date(Date.now() - UNPAID_HOLD_MINUTES * 60 * 1000);
  const stale = await Order.find({
    paymentMethod: { $in: ['bkash', 'card'] },
    paymentStatus: { $in: ['Pending', 'Failed'] },
    orderStatus: 'Pending',
    createdAt: { $lt: cutoff },
  }).limit(200);
  for (const order of stale) {
    const closed = await closeOrder(order, 'Cancelled', ['Pending']);
    if (closed) {
      await notifyOrderUser(closed, 'Order cancelled', `Order ${closed.orderNumber} was cancelled because the payment was not completed within ${UNPAID_HOLD_MINUTES} minutes.`);
    }
  }
  return stale.length;
};

module.exports = {
  CLOSED,
  CUSTOMER_CANCELLABLE,
  TRANSITIONS,
  UNPAID_HOLD_MINUTES,
  canTransition,
  closeOrder,
  expireUnpaidOrders,
  inventoryLines,
  notifyOrderUser,
};
