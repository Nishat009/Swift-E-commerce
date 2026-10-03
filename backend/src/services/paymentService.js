const crypto = require('crypto');
const Order = require('../models/Order');
const Campaign = require('../models/Campaign');
const Ticket = require('../models/Ticket');
const TicketPurchase = require('../models/TicketPurchase');
const Notification = require('../models/Notification');
const emailService = require('./emailService');

const STRIPE_API = 'https://api.stripe.com/v1';
const BKASH_SANDBOX_URL = 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
const PURCHASE_HOLD_MINUTES = 30;

// ---------------------------------------------------------------- config ---
const backendUrl = () => (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');
const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3001').split(',')[0].trim().replace(/\/$/, '');
const bdtPerUsd = () => (Number(process.env.BDT_PER_USD) > 0 ? Number(process.env.BDT_PER_USD) : 120);
const bkashBaseUrl = () => (process.env.BKASH_BASE_URL || BKASH_SANDBOX_URL).replace(/\/$/, '');

const isBkashConfigured = () =>
  Boolean(process.env.BKASH_APP_KEY && process.env.BKASH_APP_SECRET && process.env.BKASH_USERNAME && process.env.BKASH_PASSWORD);
const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

// Mock gateway for local development / testing flows (e.g. the lucky draw) without real
// bKash or Stripe accounts. Never active in production.
const isMockMode = () => String(process.env.PAYMENT_MOCK).toLowerCase() === 'true' && ['development', 'test', undefined, ''].includes(process.env.NODE_ENV);
const isMockSession = (sessionId) => isMockMode() && /^mock_(bkash|card)_[0-9a-f]{16}$/.test(String(sessionId || ''));

const getEnabledMethods = () => ({
  cod: true,
  bkash: isMockMode() || isBkashConfigured(),
  card: isMockMode() || isStripeConfigured()
});

const isOnlineMethod = (method) => method === 'bkash' || method === 'card';
const isMethodEnabled = (method) => Boolean(getEnabledMethods()[method]);

const getPublicConfig = () => ({
  methods: getEnabledMethods(),
  mock: isMockMode(),
  bdtPerUsd: bdtPerUsd(),
  bkashSandbox: isBkashConfigured() && bkashBaseUrl() === BKASH_SANDBOX_URL,
  stripeTestMode: isStripeConfigured() && String(process.env.STRIPE_SECRET_KEY).startsWith('sk_test_')
});

// ----------------------------------------------------------------- bKash ---
let bkashTokenCache = { token: null, expiresAt: 0 };

const bkashRequest = async (path, { headers = {}, body }) => {
  const res = await fetch(`${bkashBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.statusMessage || data.message || `bKash request failed (${res.status})`);
  }
  return data;
};

const getBkashToken = async () => {
  if (bkashTokenCache.token && bkashTokenCache.expiresAt > Date.now() + 30000) return bkashTokenCache.token;
  const data = await bkashRequest('/tokenized/checkout/token/grant', {
    headers: { username: process.env.BKASH_USERNAME, password: process.env.BKASH_PASSWORD },
    body: { app_key: process.env.BKASH_APP_KEY, app_secret: process.env.BKASH_APP_SECRET }
  });
  if (!data.id_token) throw new Error(data.statusMessage || 'bKash token grant failed');
  bkashTokenCache = { token: data.id_token, expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
  return data.id_token;
};

const bkashAuthHeaders = async () => ({
  Authorization: await getBkashToken(),
  'X-APP-Key': process.env.BKASH_APP_KEY
});

const toBdt = (usd) => (Math.round(usd * bdtPerUsd() * 100) / 100).toFixed(2);

const createBkashPayment = async ({ amountUsd, invoiceNumber, reference }) => {
  const data = await bkashRequest('/tokenized/checkout/create', {
    headers: await bkashAuthHeaders(),
    body: {
      mode: '0011',
      payerReference: String(reference).slice(0, 50),
      callbackURL: `${backendUrl()}/api/payments/bkash/callback`,
      amount: toBdt(amountUsd),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: String(invoiceNumber).slice(0, 255)
    }
  });
  if (!data.paymentID || !data.bkashURL) throw new Error(data.statusMessage || 'bKash could not start the payment');
  return { sessionId: data.paymentID, redirectUrl: data.bkashURL };
};

// Execute (finalise) the payment, falling back to a status query if execute was already done.
const verifyBkashPayment = async (paymentID) => {
  const headers = await bkashAuthHeaders();
  let data = await bkashRequest('/tokenized/checkout/execute', { headers, body: { paymentID } });
  if (data.statusCode !== '0000' || data.transactionStatus !== 'Completed') {
    // Execute may already have been run (page refresh): ask the gateway for the real state
    const query = await bkashRequest('/tokenized/checkout/payment/status', { headers, body: { paymentID } });
    if (query.statusCode === '0000' && query.transactionStatus === 'Completed') data = query;
  }
  const paid = data.statusCode === '0000' && data.transactionStatus === 'Completed' && Boolean(data.trxID);
  return { paid, transactionId: data.trxID || '', amountBdt: Number(data.amount) || 0 };
};

// ---------------------------------------------------------------- Stripe ---
const stripeRequest = async (method, path, form) => {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {})
    },
    body: form ? new URLSearchParams(form).toString() : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data.error && data.error.message) || `Stripe request failed (${res.status})`);
  return data;
};

const createStripeSession = async ({ amountUsd, name, reference, email }) => {
  const form = {
    mode: 'payment',
    success_url: `${backendUrl()}/api/payments/card/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${backendUrl()}/api/payments/card/return?session_id={CHECKOUT_SESSION_ID}&cancelled=1`,
    client_reference_id: String(reference),
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(Math.round(amountUsd * 100)),
    'line_items[0][price_data][product_data][name]': name
  };
  if (email) form.customer_email = email;
  const session = await stripeRequest('POST', '/checkout/sessions', form);
  if (!session.id || !session.url) throw new Error('Stripe could not start the payment');
  return { sessionId: session.id, redirectUrl: session.url };
};

const verifyStripeSession = async (sessionId) => {
  const session = await stripeRequest('GET', `/checkout/sessions/${encodeURIComponent(sessionId)}`);
  const intent = session.payment_intent;
  return {
    paid: session.payment_status === 'paid',
    expired: session.status === 'expired',
    transactionId: typeof intent === 'string' ? intent : (intent && intent.id) || session.id,
    amountCents: Number(session.amount_total) || 0
  };
};

// Verifies Stripe-Signature (t=...,v1=...) against the raw body; returns parsed event or null.
const verifyStripeWebhook = (rawBody, signatureHeader) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !rawBody || !signatureHeader) return null;
  const parts = {};
  String(signatureHeader).split(',').forEach((kv) => {
    const i = kv.indexOf('=');
    if (i > 0 && !parts[kv.slice(0, i)]) parts[kv.slice(0, i)] = kv.slice(i + 1);
  });
  if (!parts.t || !parts.v1) return null;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return null;
  const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${rawBody.toString('utf8')}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(rawBody.toString('utf8'));
  } catch {
    return null;
  }
};

// --------------------------------------------------------------- generic ---
const startGatewayPayment = async ({ method, amountUsd, invoiceNumber, name, reference, email }) => {
  if (!isOnlineMethod(method) || !isMethodEnabled(method)) throw new Error('This payment method is not available');
  if (isMockMode()) {
    const sessionId = `mock_${method}_${crypto.randomBytes(8).toString('hex')}`;
    return {
      sessionId,
      redirectUrl: `${backendUrl()}/api/payments/mock/checkout?session=${sessionId}`
    };
  }
  if (method === 'bkash') return createBkashPayment({ amountUsd, invoiceNumber, reference });
  return createStripeSession({ amountUsd, name, reference, email });
};

// Ask the gateway for the truth and check the amount we expected.
const verifyGatewayPayment = async (method, sessionId, expectedUsd) => {
  if (isMockSession(sessionId)) {
    return { paid: true, transactionId: `MOCK-${String(sessionId).slice(-10).toUpperCase()}` };
  }
  if (method === 'bkash') {
    const r = await verifyBkashPayment(sessionId);
    const amountOk = r.paid && Math.abs(r.amountBdt - Number(toBdt(expectedUsd))) < 0.02;
    return { paid: amountOk, transactionId: r.transactionId };
  }
  const r = await verifyStripeSession(sessionId);
  const amountOk = r.paid && r.amountCents === Math.round(expectedUsd * 100);
  return { paid: amountOk, transactionId: r.transactionId, expired: r.expired };
};

const notify = async (userId, title, message, extra = {}) => {
  try {
    await Notification.create({ user: userId, title, message, type: 'system', ...extra });
  } catch (err) {
    console.error('Payment notification failed:', err.message);
  }
};

// ---------------------------------------------------------------- orders ---
// Idempotent: a paid order is never touched again; a failure never overwrites Paid.
const settleOrderPayment = async (order, { paid, transactionId }) => {
  if (paid) {
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $in: ['Pending', 'Failed'] }, orderStatus: { $nin: ['Cancelled', 'Returned'] } },
      { paymentStatus: 'Paid', paymentTransactionId: transactionId || '', paidAt: new Date() },
      { new: true }
    );
    if (updated) {
      // A paid online order is confirmed automatically
      const confirmed = await Order.findOneAndUpdate({ _id: order._id, orderStatus: 'Pending' }, { orderStatus: 'Confirmed' }, { new: true });
      await notify(order.user, 'Payment received', `Payment for order ${order.orderNumber} was successful. Thank you!`, { type: 'delivery_update', relatedOrder: order._id });
      if (confirmed) emailService.fire(emailService.emailOrderEvent(confirmed, 'status'));
      return { ok: true };
    }
    const fresh = await Order.findById(order._id);
    if (fresh && fresh.paymentStatus === 'Paid') return { ok: true };
    // Money arrived for an order that was already cancelled (e.g. the payment window expired)
    if (fresh && ['Pending', 'Failed'].includes(fresh.paymentStatus)) {
      await Order.updateOne(
        { _id: fresh._id, paymentStatus: { $in: ['Pending', 'Failed'] } },
        { paymentStatus: 'Refund Needed', paymentTransactionId: transactionId || '', paidAt: new Date() }
      );
      await notify(order.user, 'Payment will be refunded', `Your payment for order ${order.orderNumber} arrived after the order was cancelled. It will be refunded.`, { type: 'delivery_update', relatedOrder: order._id });
    }
    console.error(`[payments] Order ${order.orderNumber} was paid (${transactionId}) but is ${fresh && fresh.orderStatus}. Refund needed.`);
    return { ok: false };
  }
  const failed = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: 'Pending' },
    { paymentStatus: 'Failed' },
    { new: true }
  );
  if (failed) {
    await notify(order.user, 'Payment failed', `Payment for order ${order.orderNumber} did not complete. You can retry from your orders page.`);
  }
  return { ok: false };
};

// --------------------------------------------------------------- tickets ---
const releasePurchase = async (purchaseId, newStatus) => {
  const purchase = await TicketPurchase.findOneAndUpdate(
    { _id: purchaseId, status: 'pending' },
    { status: newStatus },
    { new: true }
  );
  if (!purchase) return null;
  const campaign = await Campaign.findByIdAndUpdate(purchase.campaign, { $inc: { ticketsSold: -purchase.quantity } }, { new: true });
  if (campaign && campaign.status === 'sold-out' && campaign.ticketsSold < campaign.ticketLimit) {
    await Campaign.updateOne({ _id: campaign._id, status: 'sold-out' }, { status: 'active' });
  }
  return purchase;
};

const expireStalePurchases = async () => {
  const stale = await TicketPurchase.find({ status: 'pending', expiresAt: { $lt: new Date() } }).select('_id');
  for (const p of stale) await releasePurchase(p._id, 'expired');
};

const fulfillTicketPurchase = async (purchase, { transactionId }) => {
  // Claim (idempotent): only one caller can move pending/expired -> fulfilling
  const claimed = await TicketPurchase.findOneAndUpdate(
    { _id: purchase._id, status: { $in: ['pending', 'expired'] } },
    { status: 'fulfilling', paymentTransactionId: transactionId || '' },
    { new: false }
  );
  if (!claimed) {
    const fresh = await TicketPurchase.findById(purchase._id);
    return { ok: Boolean(fresh && (fresh.status === 'paid' || fresh.status === 'fulfilling')) };
  }

  // Hold had expired and was released: re-reserve atomically, else the money needs a refund
  if (claimed.status === 'expired') {
    const reserved = await Campaign.findOneAndUpdate(
      { _id: claimed.campaign, status: 'active', $expr: { $lte: [{ $add: ['$ticketsSold', claimed.quantity] }, '$ticketLimit'] } },
      { $inc: { ticketsSold: claimed.quantity } }
    );
    if (!reserved) {
      await TicketPurchase.updateOne({ _id: claimed._id }, { status: 'refund_needed' });
      await notify(claimed.user, 'Ticket purchase needs a refund', 'Your payment arrived after the ticket hold expired and the tickets are no longer available. Please contact support for a refund.');
      console.error(`[payments] TicketPurchase ${claimed._id} paid (${transactionId}) but unavailable. Manual refund needed.`);
      return { ok: false };
    }
  }

  const campaign = await Campaign.findById(claimed.campaign);
  const existing = await Ticket.countDocuments({ purchase: claimed._id });
  for (let i = existing; i < claimed.quantity; i++) {
    const suffix = `${String(claimed.campaign).slice(18, 24).toUpperCase()}-${crypto.randomInt(100000, 1000000)}`;
    await Ticket.create({
      ticketNumber: `SWIFT-TKT-${suffix}`,
      user: claimed.user,
      campaign: claimed.campaign,
      purchase: claimed._id,
      purchaseAmount: claimed.unitPrice,
      paymentMethod: claimed.paymentMethod,
      paymentTransactionId: transactionId || '',
      status: 'active'
    });
  }

  await TicketPurchase.updateOne({ _id: claimed._id }, { status: 'paid', paidAt: new Date() });
  const after = await Campaign.findById(claimed.campaign);
  if (after && after.ticketsSold >= after.ticketLimit) {
    await Campaign.updateOne({ _id: after._id, status: 'active' }, { status: 'sold-out' });
  }
  await notify(
    claimed.user,
    'Tickets Earned!',
    `Payment confirmed. You earned ${claimed.quantity} ticket(s) for the "${campaign ? campaign.title : 'lucky draw'}" campaign. Good luck in the draw!`,
    { type: 'campaign_purchase', relatedCampaign: claimed.campaign }
  );
  return { ok: true };
};

const failTicketPurchase = async (purchase) => {
  const released = await releasePurchase(purchase._id, 'failed');
  if (released) await notify(purchase.user, 'Ticket payment failed', 'Your ticket payment did not complete and the reserved tickets were released.');
  return { ok: false };
};

module.exports = {
  PURCHASE_HOLD_MINUTES,
  frontendUrl,
  getEnabledMethods,
  getPublicConfig,
  isOnlineMethod,
  isMethodEnabled,
  isMockMode,
  isMockSession,
  startGatewayPayment,
  verifyGatewayPayment,
  verifyStripeWebhook,
  settleOrderPayment,
  fulfillTicketPurchase,
  failTicketPurchase,
  releasePurchase,
  expireStalePurchases
};
