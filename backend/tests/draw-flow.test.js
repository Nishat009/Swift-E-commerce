// NOTE: errors use real HTTP status codes (400 bad request, 401, 403, 404, 409 conflict).
// End-to-end check of the lucky-draw flow using the MOCK payment gateway.
// Runs against a throwaway database (swiftcart_test), never your real data.
//   node --test tests/draw-flow.test.js
process.env.NODE_ENV = 'test';
process.env.PAYMENT_MOCK = 'true';
process.env.BACKEND_URL = 'http://localhost:5055';
process.env.FRONTEND_URL = 'http://localhost:3001';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_at_least_32_characters';

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const TEST_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart_test';
const BASE = 'http://localhost:5055';

let server;
const users = {};
const tokens = {};

const api = async (method, path, token, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual'
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* html / redirect */ }
  return { status: res.status, json, headers: res.headers, text };
};

// Follow the mock gateway: open its page, then "click" Pay or Fail
const completeMockPayment = async (redirectUrl, outcome) => {
  const page = await fetch(redirectUrl);
  assert.equal(page.status, 200, 'mock checkout page should load');
  const html = await page.text();
  const href = html.match(new RegExp(`class="${outcome}" href="([^"]+)"`))[1].replace(/&amp;/g, '&');
  return fetch(`${BASE}${href}`, { redirect: 'manual' });
};

test.before(async () => {
  await mongoose.connect(TEST_URI);
  await mongoose.connection.dropDatabase();
  const User = require('../src/models/User');
  const { generateAccessToken } = require('../src/utils/generateTokens');
  for (const [key, role] of [['admin', 'admin'], ['alice', 'customer'], ['bob', 'customer']]) {
    users[key] = await User.create({ name: key, email: `${key}@test.dev`, password: 'Password123!', role });
    tokens[key] = generateAccessToken(users[key]);
  }
  const app = require('../src/app');
  await new Promise((resolve) => { server = app.listen(5055, resolve); });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

const makeCampaign = async (overrides = {}) => {
  const r = await api('POST', '/api/campaigns/admin/create', tokens.admin, {
    title: 'Test Draw', productTitle: 'Tee', productPrice: 10, productDescription: 'x', productImage: 'x.png',
    prizeName: 'Watch', prizeDescription: 'x', prizeImage: 'x.png', ticketLimit: 10, maxTicketsPerUser: 5,
    ...overrides
  });
  assert.ok([200, 201].includes(r.status), JSON.stringify(r.json));
  return r.json.data;
};

const buy = async (who, campaignId, quantity, outcome = 'pay') => {
  const start = await api('POST', `/api/campaigns/${campaignId}/buy`, tokens[who], { quantity, paymentMethod: 'card' });
  if (start.status !== 200) return { start };
  const done = await completeMockPayment(start.json.data.redirectUrl, outcome);
  return { start, done };
};

test('mock gateway is advertised as enabled', async () => {
  const r = await api('GET', '/api/payments/methods');
  assert.equal(r.json.data.mock, true);
  assert.equal(r.json.data.methods.card, true);
  assert.equal(r.json.data.methods.bkash, true);
});

test('paid purchase issues tickets, failed purchase releases the hold', async () => {
  const c = await makeCampaign();
  const ok = await buy('alice', c.id, 2, 'pay');
  assert.match(ok.done.headers.get('location'), /payment=success/);
  const mine = await api('GET', '/api/campaigns/my-tickets', tokens.alice);
  assert.equal(mine.json.data.length, 2);

  const bad = await buy('bob', c.id, 3, 'fail');
  assert.match(bad.done.headers.get('location'), /payment=failed/);
  const after = await api('GET', `/api/campaigns/${c.id}`);
  assert.equal(after.json.data.ticketsSold, 2, 'failed payment must free its reserved tickets');
  const bobTickets = await api('GET', '/api/campaigns/my-tickets', tokens.bob);
  assert.equal(bobTickets.json.data.length, 0);
});

test('per-user ticket cap and pool limit are enforced', async () => {
  const c = await makeCampaign({ ticketLimit: 3, maxTicketsPerUser: 2 });
  const over = await buy('alice', c.id, 3);
  assert.equal(over.start.status, 400);
  await buy('alice', c.id, 2);
  const bobTooMany = await buy('bob', c.id, 2);
  assert.equal(bobTooMany.start.status, 400, 'only 1 ticket left in the pool');
  await buy('bob', c.id, 1);
  const state = await api('GET', `/api/campaigns/${c.id}`);
  assert.equal(state.json.data.status, 'sold-out');
});

test('draw: blocked without tickets, picks one winner, cannot be repeated', async () => {
  const c = await makeCampaign();
  const empty = await api('POST', `/api/campaigns/admin/${c.id}/draw`, tokens.admin);
  assert.equal(empty.status, 400);

  await buy('alice', c.id, 2);
  await buy('bob', c.id, 1);

  const nonAdmin = await api('POST', `/api/campaigns/admin/${c.id}/draw`, tokens.alice);
  assert.equal(nonAdmin.status, 403);

  // Two simultaneous draws: exactly one may succeed
  const [d1, d2] = await Promise.all([
    api('POST', `/api/campaigns/admin/${c.id}/draw`, tokens.admin),
    api('POST', `/api/campaigns/admin/${c.id}/draw`, tokens.admin)
  ]);
  const wins = [d1, d2].filter((d) => d.status === 200);
  assert.equal(wins.length, 1, `expected exactly one successful draw, got ${d1.status}/${d2.status}`);

  const Ticket = require('../src/models/Ticket');
  const tickets = await Ticket.find({ campaign: c.id });
  assert.equal(tickets.filter((t) => t.status === 'won').length, 1);
  assert.equal(tickets.filter((t) => t.status === 'lost').length, 2);

  const camp = (await api('GET', `/api/campaigns/${c.id}`)).json.data;
  assert.equal(camp.status, 'completed');
  assert.ok(camp.winnerUser && camp.winnerTicket);

  const again = await api('POST', `/api/campaigns/admin/${c.id}/draw`, tokens.admin);
  assert.equal(again.status, 400);

  // Winner + every other participant got exactly one notification
  const Notification = require('../src/models/Notification');
  const winnerNotes = await Notification.find({ user: camp.winnerUser.id, relatedCampaign: c.id, type: 'winner_announcement' });
  assert.equal(winnerNotes.length, 1);

  // Audit trail has create + draw entries
  const AuditTrail = require('../src/models/AuditTrail');
  const audits = await AuditTrail.find({ entityType: 'Campaign', entityId: c.id });
  assert.ok(audits.length >= 2);
  assert.ok(audits.some((a) => /winner/i.test(a.changeSummary)));
});

test('draw is blocked while a ticket payment is still in flight', async () => {
  const c = await makeCampaign();
  await buy('alice', c.id, 1);
  const start = await api('POST', `/api/campaigns/${c.id}/buy`, tokens.bob, { quantity: 1, paymentMethod: 'bkash' });
  assert.equal(start.status, 200); // started, not paid yet
  const blocked = await api('POST', `/api/campaigns/admin/${c.id}/draw`, tokens.admin);
  assert.equal(blocked.status, 409);
});

test('winner delivery proof: needs proof image to mark delivered, notifies winner, is audited', async () => {
  const c = await makeCampaign();
  await buy('alice', c.id, 1);
  const notDrawn = await api('PUT', `/api/campaigns/admin/${c.id}/delivery`, tokens.admin, { status: 'shipped' });
  assert.equal(notDrawn.status, 400);

  await api('POST', `/api/campaigns/admin/${c.id}/draw`, tokens.admin);
  const noProof = await api('PUT', `/api/campaigns/admin/${c.id}/delivery`, tokens.admin, { status: 'delivered' });
  assert.equal(noProof.status, 400);

  const shipped = await api('PUT', `/api/campaigns/admin/${c.id}/delivery`, tokens.admin, { status: 'shipped', courier: 'Pathao', trackingNumber: 'PT123' });
  assert.equal(shipped.status, 200);
  assert.equal(shipped.json.data.delivery.status, 'shipped');

  const delivered = await api('PUT', `/api/campaigns/admin/${c.id}/delivery`, tokens.admin, { status: 'delivered', proofImage: 'https://img/proof.jpg', note: 'Signed by winner' });
  assert.equal(delivered.status, 200);
  assert.equal(delivered.json.data.delivery.proofImage, 'https://img/proof.jpg');
  assert.ok(delivered.json.data.delivery.deliveredAt);

  const Notification = require('../src/models/Notification');
  const notes = await Notification.find({ user: users.alice.id, type: 'delivery_update' });
  assert.equal(notes.length, 2);
  const winners = await api('GET', '/api/campaigns/winners');
  assert.equal(winners.json.data.find((w) => w.id === c.id).delivery.status, 'delivered');
});

test('campaign status change is audited and a completed campaign cannot be reopened', async () => {
  const c = await makeCampaign();
  await api('PUT', `/api/campaigns/admin/${c.id}/status`, tokens.admin, { status: 'paused' });
  const AuditTrail = require('../src/models/AuditTrail');
  assert.ok(await AuditTrail.findOne({ entityId: c.id, changeSummary: /paused/ }));

  await api('PUT', `/api/campaigns/admin/${c.id}/status`, tokens.admin, { status: 'active' });
  await buy('alice', c.id, 1);
  await api('POST', `/api/campaigns/admin/${c.id}/draw`, tokens.admin);
  const reopen = await api('PUT', `/api/campaigns/admin/${c.id}/status`, tokens.admin, { status: 'active' });
  assert.equal(reopen.status, 400);
});

test('coupon: minimum spend, usage limit, per-user limit and release on cancel', async () => {
  const Product = require('../src/models/Product');
  const p = await Product.create({
    title: 'Coupon Tee', description: 'd', category: 'top', brand: 'B', price: 100, stock: 50, thumbnail: 't.png',
    variants: [{ id: 'g1', name: 'Size', options: [
      { id: 'sz-m', name: 'M', value: 'M', priceDelta: 0, stock: 10 },
      { id: 'sz-xl', name: 'XL', value: 'XL', priceDelta: 25, stock: 10 }
    ] }]
  });
  const mk = await api('POST', '/api/coupons', tokens.admin, {
    code: 'SAVE10', percentage: 10, expiry: new Date(Date.now() + 86400000).toISOString(), minSpend: 150, usageLimit: 1
  });
  assert.ok([200, 201].includes(mk.status), JSON.stringify(mk.json));

  const address = { street: 's', city: 'c', state: 'st', zipCode: '1', country: 'BD' };
  const place = (who, items, couponCode) => api('POST', '/api/orders', tokens[who], { products: items, shippingAddress: address, paymentMethod: 'cod', couponCode });

  // below min spend ($100 < $150)
  const low = await place('alice', [{ product: p.id, quantity: 1 }], 'SAVE10');
  assert.equal(low.status, 400);
  assert.match(low.json.message, /Minimum spend/);

  // validate endpoint also checks min spend
  const chk = await api('GET', '/api/coupons/SAVE10?subtotal=200', tokens.alice);
  assert.equal(chk.json.data.discount, 20);

  // 2 x $100 = $200 -> ok, $20 off
  const okOrder = await place('alice', [{ product: p.id, quantity: 2 }], 'SAVE10');
  assert.ok([200, 201].includes(okOrder.status), JSON.stringify(okOrder.json));
  assert.equal(okOrder.json.data.discount, 20);

  // usage limit (1) is used up
  const used = await place('bob', [{ product: p.id, quantity: 2 }], 'SAVE10');
  assert.equal(used.status, 400);
  assert.match(used.json.message, /usage limit/);

  // cancelling frees the use
  const cancel = await api('PUT', `/api/orders/${okOrder.json.data.id}/cancel`, tokens.alice);
  assert.equal(cancel.status, 200);
  const again = await place('bob', [{ product: p.id, quantity: 2 }], 'SAVE10');
  assert.ok([200, 201].includes(again.status), JSON.stringify(again.json));

  // unknown code is rejected instead of silently ignored
  const bogus = await place('bob', [{ product: p.id, quantity: 1 }], 'NOPE');
  assert.equal(bogus.status, 404);

  // ---- variant price is computed on the server, client "price" is ignored ----
  const xl = await place('bob', [{ product: p.id, quantity: 1, variant: { id: 'sz-xl', price: 1, attributes: { Size: { id: 'sz-xl', priceDelta: 0 } } } }]);
  assert.ok([200, 201].includes(xl.status), JSON.stringify(xl.json));
  assert.equal(xl.json.data.products[0].price, 125, 'XL = 100 base + 25 delta, regardless of client price');
  assert.equal(xl.json.data.subtotal, 125);

  const cartAdd = await api('POST', '/api/cart', tokens.bob, { productId: p.id, quantity: 2, variant: { id: 'sz-xl', attributes: { Size: { id: 'sz-xl' } } } });
  assert.equal(cartAdd.status, 200, JSON.stringify(cartAdd.json));
  assert.equal(cartAdd.json.data.subtotal, 250);
});

test('price-drop and restock alerts reach customers who wishlisted the product', async () => {
  const Product = require('../src/models/Product');
  const Wishlist = require('../src/models/Wishlist');
  const Notification = require('../src/models/Notification');
  const p = await Product.create({ title: 'Alert Tee', description: 'd', category: 'top', brand: 'B', price: 80, stock: 0, thumbnail: 't.png' });
  await Wishlist.create({ user: users.alice.id, products: [p.id] });

  await api('PUT', `/api/products/${p.id}`, tokens.admin, { stock: 5 });
  assert.equal(await Notification.countDocuments({ user: users.alice.id, type: 'restock' }), 1);

  await api('PUT', `/api/products/${p.id}`, tokens.admin, { price: 60 });
  assert.equal(await Notification.countDocuments({ user: users.alice.id, type: 'price_drop' }), 1);

  await api('PUT', `/api/products/${p.id}`, tokens.admin, { price: 70 }); // price rise: no alert
  assert.equal(await Notification.countDocuments({ user: users.alice.id, type: 'price_drop' }), 1);
  assert.equal(await Notification.countDocuments({ user: users.bob.id, type: { $in: ["price_drop", "restock"] } }), 0);
});
