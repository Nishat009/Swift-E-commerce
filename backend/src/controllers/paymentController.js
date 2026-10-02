const Order = require('../models/Order');
const TicketPurchase = require('../models/TicketPurchase');
const { sendSuccess, sendError } = require('../utils/response');
const payments = require('../services/paymentService');

// @desc    Which payment methods are enabled
// @route   GET /api/payments/methods
// @access  Public
const getMethods = (req, res) => sendSuccess(res, 'Payment methods retrieved', payments.getPublicConfig());

// @desc    Start an online payment for an existing order
// @route   POST /api/payments/orders/:orderId/initiate
// @access  Private (order owner)
const initiateOrderPayment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order || order.user.toString() !== req.user.id) {
      return sendError(res, 'Order not found', 404);
    }
    if (['Cancelled', 'Returned'].includes(order.orderStatus)) {
      return sendError(res, 'This order is cancelled and cannot be paid', 400);
    }
    if (order.paymentStatus === 'Paid') {
      return sendError(res, 'This order is already paid', 400);
    }

    const method = (req.body && req.body.method) || order.paymentMethod;
    if (!payments.isOnlineMethod(method)) {
      return sendError(res, 'This order uses cash on delivery; no online payment is needed', 400);
    }
    if (!payments.isMethodEnabled(method)) {
      return sendError(res, 'This payment method is currently unavailable', 400);
    }

    const session = await payments.startGatewayPayment({
      method,
      amountUsd: order.total,
      invoiceNumber: order.orderNumber,
      name: `Order ${order.orderNumber}`,
      reference: order.id,
      email: req.user.email
    });

    order.paymentMethod = method;
    order.paymentGateway = method === 'bkash' ? 'bkash' : 'stripe';
    order.paymentSessionId = session.sessionId;
    order.paymentStatus = 'Pending';
    await order.save();

    return sendSuccess(res, 'Payment started', { redirectUrl: session.redirectUrl, method });
  } catch (error) {
    console.error('[payments] initiate failed:', error.message);
    return sendError(res, `Could not start the payment: ${error.message}`, 502);
  }
};

// Find what a gateway session belongs to (an order or a ticket purchase)
const resolveTarget = async (gateway, sessionId) => {
  if (!sessionId) return null;
  const order = await Order.findOne({ paymentGateway: gateway, paymentSessionId: sessionId });
  if (order) return { kind: 'order', doc: order };
  const purchase = await TicketPurchase.findOne({
    paymentMethod: gateway === 'bkash' ? 'bkash' : 'card',
    paymentSessionId: sessionId
  });
  if (purchase) return { kind: 'ticket', doc: purchase };
  return null;
};

const redirectUrlFor = (target, ok) => {
  const base = payments.frontendUrl();
  const state = ok ? 'success' : 'failed';
  if (!target) return `${base}/orders?payment=failed`;
  if (target.kind === 'order') return `${base}/orders?payment=${state}&order=${target.doc.id}`;
  return `${base}/campaigns/my-tickets?payment=${state}&campaign=${target.doc.campaign}`;
};

// Verify with the gateway (never trust the browser) and settle the order / ticket purchase.
// forceFail is used when the gateway itself says the customer cancelled or failed.
const verifyAndSettle = async (target, method, sessionId, forceFail) => {
  const expected = target.kind === 'order' ? target.doc.total : target.doc.amount;
  let result = { paid: false, transactionId: '' };
  if (!forceFail) {
    result = await payments.verifyGatewayPayment(method, sessionId, expected);
  }
  if (target.kind === 'order') return payments.settleOrderPayment(target.doc, result);
  return result.paid
    ? payments.fulfillTicketPurchase(target.doc, result)
    : payments.failTicketPurchase(target.doc);
};

// @desc    bKash redirects the customer here after the payment page
// @route   GET /api/payments/bkash/callback?paymentID=&status=success|failure|cancel
// @access  Public (gateway redirect; result is verified server-side)
const bkashCallback = async (req, res) => {
  const { paymentID, status } = req.query;
  let target = null;
  try {
    target = await resolveTarget('bkash', String(paymentID || ''));
    if (!target) return res.redirect(redirectUrlFor(null, false));
    const result = await verifyAndSettle(target, 'bkash', String(paymentID), status !== 'success');
    return res.redirect(redirectUrlFor(target, result.ok));
  } catch (error) {
    console.error('[payments] bKash callback error:', error.message);
    return res.redirect(redirectUrlFor(target, false));
  }
};

// @desc    Stripe Checkout redirects the customer here (success and cancel)
// @route   GET /api/payments/card/return?session_id=
// @access  Public (gateway redirect; result is verified server-side)
const cardReturn = async (req, res) => {
  const sessionId = String(req.query.session_id || '');
  let target = null;
  try {
    target = await resolveTarget('stripe', sessionId);
    if (!target) return res.redirect(redirectUrlFor(null, false));
    // Only the mock gateway reports "cancelled" via the URL; real Stripe is always verified
    const mockCancelled = req.query.cancelled === '1' && payments.isMockSession(sessionId);
    const result = await verifyAndSettle(target, 'card', sessionId, mockCancelled);
    return res.redirect(redirectUrlFor(target, result.ok));
  } catch (error) {
    console.error('[payments] Card return error:', error.message);
    return res.redirect(redirectUrlFor(target, false));
  }
};

// @desc    Stripe webhook (optional safety net when the customer closes the tab)
// @route   POST /api/payments/stripe/webhook
// @access  Public (signature verified)
const stripeWebhook = async (req, res) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(404).json({ success: false, message: 'Webhook not configured' });
  }
  const event = payments.verifyStripeWebhook(req.rawBody, req.headers['stripe-signature']);
  if (!event) return res.status(400).json({ success: false, message: 'Invalid signature' });

  try {
    const session = event.data && event.data.object;
    if (session && session.id) {
      const target = await resolveTarget('stripe', session.id);
      if (target) {
        if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
          // Re-fetch from Stripe instead of trusting the payload
          await verifyAndSettle(target, 'card', session.id, false);
        } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
          await verifyAndSettle(target, 'card', session.id, true);
        }
      }
    }
    return res.json({ received: true });
  } catch (error) {
    console.error('[payments] Webhook error:', error.message);
    return res.status(500).json({ success: false, message: 'Webhook handling failed' });
  }
};

const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// @desc    Fake gateway page (development only): choose Pay or Fail for a mock payment session
// @route   GET /api/payments/mock/checkout?session=
// @access  Public, only when PAYMENT_MOCK=true and not production
const mockCheckout = async (req, res) => {
  const sessionId = String(req.query.session || '');
  if (!payments.isMockSession(sessionId)) {
    return res.status(404).send('Mock payments are not enabled');
  }
  const isBkash = sessionId.startsWith('mock_bkash_');
  const gateway = isBkash ? 'bkash' : 'stripe';
  const target = await resolveTarget(gateway, sessionId);
  if (!target) return res.status(404).send('Unknown payment session');

  const amount = target.kind === 'order' ? target.doc.total : target.doc.amount;
  const label = target.kind === 'order' ? `Order ${target.doc.orderNumber}` : `Lucky draw tickets x${target.doc.quantity}`;
  const base = '/api/payments';
  const payUrl = isBkash
    ? `${base}/bkash/callback?paymentID=${sessionId}&status=success`
    : `${base}/card/return?session_id=${sessionId}`;
  const failUrl = isBkash
    ? `${base}/bkash/callback?paymentID=${sessionId}&status=failure`
    : `${base}/card/return?session_id=${sessionId}&cancelled=1`;

  res.set('Content-Type', 'text/html; charset=utf-8').send(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mock payment</title>
<style>body{font-family:system-ui,sans-serif;background:#f4f4f5;display:grid;place-items:center;min-height:100vh;margin:0}
.card{background:#fff;border-radius:16px;padding:32px;max-width:380px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,.1);text-align:center}
.tag{display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:4px 10px;border-radius:99px}
.amt{font-size:34px;font-weight:800;margin:12px 0 4px}a{display:block;padding:12px;border-radius:10px;margin-top:12px;font-weight:700;text-decoration:none}
.pay{background:#16a34a;color:#fff}.fail{background:#fee2e2;color:#b91c1c}</style></head>
<body><div class="card"><span class="tag">TEST MODE - no real money</span>
<h2>${isBkash ? 'bKash' : 'Card'} mock payment</h2><div>${escapeHtml(label)}</div>
<div class="amt">$${Number(amount).toFixed(2)}</div>
<a class="pay" href="${payUrl}">Pay successfully</a><a class="fail" href="${failUrl}">Fail / cancel payment</a></div></body></html>`);
};

module.exports = { getMethods, initiateOrderPayment, bkashCallback, cardReturn, stripeWebhook, mockCheckout };
