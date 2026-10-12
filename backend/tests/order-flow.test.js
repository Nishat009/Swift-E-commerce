// Orders, cart and payments: promotions, variant stock, atomic cancel, status rules,
// unpaid-order expiry and payment confirmation. Runs against a throwaway database.
//   node --test tests/order-flow.test.js
// The API listens on a free port picked by the OS, so a busy port can never block or hang the run.
process.env.NODE_ENV = 'test';
process.env.PAYMENT_MOCK = 'true';
process.env.FRONTEND_URL = 'http://localhost:3001';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_at_least_32_characters';

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const TEST_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart_order_test';
const HOOK_TIMEOUT = 30000;
let BASE; // set once the server is listening
let server;

// Resolve with the listening server, or reject on any server error (never wait forever)
const listen = (app) => new Promise((resolve, reject) => {
  const srv = app.listen(0, '127.0.0.1');
  const onError = (err) => reject(err);
  srv.once('error', onError);
  srv.once('listening', () => {
    srv.off('error', onError);
    resolve(srv);
  });
});

const stopServer = async () => {
  if (!server || !server.listening) return;
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(() => resolve()));
};

const closeDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    // Let background index builds finish first, or they re-create collections after the drop
    await Promise.all(Object.values(mongoose.connection.models).map((model) => model.init().catch(() => {})));
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
};

let Product;
let Order;
const tokens = {};
const address = { street: '1 Road', city: 'Dhaka', state: 'DH', zipCode: '1200', country: 'Bangladesh' };

const api = async (method, path, token, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* html */ }
  return { status: res.status, json, headers: res.headers, text };
};

const makeProduct = (title, price, stock, extra = {}) => Product.create({
  title, description: 'x', category: 'tops', brand: 'Test', price, stock, images: ['x.png'], thumbnail: 'x.png', ...extra,
});

const order = (token, products, extra = {}) => api('POST', '/api/orders', token, {
  products, shippingAddress: address, paymentMethod: 'cod', deliveryZone: 'inside_dhaka', ...extra,
});

test.before(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 10000 });
    await mongoose.connection.dropDatabase();
    const User = require('../src/models/User');
    Product = require('../src/models/Product');
    Order = require('../src/models/Order');
    const { generateAccessToken } = require('../src/utils/generateTokens');
    for (const [key, role] of [['admin', 'admin'], ['alice', 'customer'], ['bob', 'customer']]) {
      const user = await User.create({ name: key, email: `${key}@test.dev`, password: 'Password123!', role });
      tokens[key] = generateAccessToken(user);
    }
    const app = require('../src/app');
    server = await listen(app);
    BASE = `http://127.0.0.1:${server.address().port}`;
    process.env.BACKEND_URL = BASE; // mock gateway redirect links point back at this server
  } catch (err) {
    // Release everything here too, so a failed start ends the run instead of keeping it open
    await stopServer().catch(() => {});
    await mongoose.disconnect().catch(() => {});
    throw err;
  }
}, { timeout: HOOK_TIMEOUT });

test.after(async () => {
  try {
    await stopServer();
  } finally {
    await closeDatabase();
  }
}, { timeout: HOOK_TIMEOUT });

test('FR-1.20: $30 off at $300+, free shipping at exactly $100, quote matches the placed order', async () => {
  const p = await makeProduct('Coat', 100, 20);
  const small = (await api('POST', '/api/orders/quote', tokens.alice, { products: [{ product: p.id, quantity: 1 }] })).json.data;
  assert.equal(small.shipping, 0, '$100 exactly ships free');
  assert.equal(small.promoDiscount, 0);

  const quote = (await api('POST', '/api/orders/quote', tokens.alice, { products: [{ product: p.id, quantity: 3 }] })).json.data;
  assert.equal(quote.subtotal, 300);
  assert.equal(quote.promoDiscount, 30);
  assert.equal(quote.tax, 27);
  assert.equal(quote.total, 297);
  assert.equal(quote.lines[0].stockTargets, undefined, 'internal stock data is not exposed');

  const placed = await order(tokens.alice, [{ product: p.id, quantity: 3 }]);
  assert.equal(placed.status, 201, JSON.stringify(placed.json));
  assert.equal(placed.json.data.total, quote.total);
  assert.equal(placed.json.data.promoDiscount, 30);
  const after = await Product.findById(p.id);
  assert.equal(after.stock, 17);
  assert.equal(after.soldCount, 3);
});

test('duplicate lines are checked against stock together and bad quantities are rejected', async () => {
  const p = await makeProduct('Scarf', 10, 3);
  const twice = await order(tokens.alice, [{ product: p.id, quantity: 2 }, { product: p.id, quantity: 2 }]);
  assert.equal(twice.status, 400);
  assert.match(twice.json.message, /Insufficient stock/);
  for (const quantity of [0, -1, 1.5, 51]) {
    assert.equal((await order(tokens.alice, [{ product: p.id, quantity }])).status, 422, `quantity ${quantity}`);
  }
  assert.equal((await Product.findById(p.id)).stock, 3, 'nothing was reserved');
});

test('variant option stock is enforced, reserved on order and restored on cancel', async () => {
  const p = await makeProduct('Tee', 20, 10, {
    variants: [{ id: 'size', name: 'Size', options: [{ id: 'm', name: 'M', stock: 2 }, { id: 'l', name: 'L', stock: 5 }] }],
  });
  const medium = { attributes: { Size: 'm' } };
  const tooMany = await order(tokens.alice, [{ product: p.id, quantity: 3, variant: medium }]);
  assert.equal(tooMany.status, 400);
  assert.match(tooMany.json.message, /selected option/);

  const placed = await order(tokens.alice, [{ product: p.id, quantity: 2, variant: medium }]);
  assert.equal(placed.status, 201, JSON.stringify(placed.json));
  let doc = await Product.findById(p.id);
  assert.equal(doc.variants[0].options[0].stock, 0);
  assert.equal(doc.stock, 8);

  assert.equal((await api('PUT', `/api/orders/${placed.json.data.id}/cancel`, tokens.alice)).status, 200);
  doc = await Product.findById(p.id);
  assert.equal(doc.variants[0].options[0].stock, 2);
  assert.equal(doc.stock, 10);
  assert.equal(doc.soldCount, 0);
});

test('two simultaneous cancels give the stock back only once', async () => {
  const p = await makeProduct('Bag', 50, 5);
  const placed = await order(tokens.bob, [{ product: p.id, quantity: 2 }]);
  const id = placed.json.data.id;
  const results = await Promise.all([1, 2, 3].map(() => api('PUT', `/api/orders/${id}/cancel`, tokens.bob)));
  assert.equal(results.filter((r) => r.status === 200).length, 1);
  assert.equal((await Product.findById(p.id)).stock, 5);
});

test('admin status changes follow the allowed transitions', async () => {
  const p = await makeProduct('Hat', 15, 5);
  const id = (await order(tokens.alice, [{ product: p.id, quantity: 1 }])).json.data.id;
  const setStatus = (status, extra = {}) => api('PUT', `/api/orders/${id}/status`, tokens.admin, { status, ...extra });

  assert.equal((await setStatus('Delivered')).status, 400, 'cannot skip from Pending to Delivered');
  assert.equal((await setStatus('Shipped')).status, 400, 'Pending cannot ship directly');
  assert.equal((await setStatus('Confirmed')).status, 200);
  assert.equal((await setStatus('Shipped')).status, 200);
  const delivered = await setStatus('Delivered');
  assert.equal(delivered.status, 200);
  assert.equal(delivered.json.data.paymentStatus, 'Paid', 'COD is paid on delivery');
  assert.equal((await setStatus('Pending')).status, 400, 'cannot reopen a delivered order');
  assert.equal((await api('PUT', `/api/orders/${id}/status`, tokens.alice, { status: 'Cancelled' })).status, 403);
});

test('unpaid online orders are cancelled after the payment window and their stock is freed', async () => {
  const p = await makeProduct('Ring', 40, 4);
  const placed = await order(tokens.alice, [{ product: p.id, quantity: 2 }], { paymentMethod: 'card' });
  assert.equal(placed.status, 201);
  assert.equal((await Product.findById(p.id)).stock, 2);

  // createdAt is immutable in Mongoose, so age the order through the driver
  await Order.collection.updateOne({ _id: new mongoose.Types.ObjectId(placed.json.data.id) }, { $set: { createdAt: new Date(Date.now() - 31 * 60 * 1000) } });
  const { expireUnpaidOrders } = require('../src/services/orderLifecycle');
  await expireUnpaidOrders();

  const expired = await Order.findById(placed.json.data.id);
  assert.equal(expired.orderStatus, 'Cancelled');
  assert.equal((await Product.findById(p.id)).stock, 4);
  const pay = await api('POST', `/api/payments/orders/${placed.json.data.id}/initiate`, tokens.alice, {});
  assert.equal(pay.status, 400, 'an expired order cannot be paid');
});

test('a successful online payment confirms the order; COD cannot be switched to online', async () => {
  const p = await makeProduct('Watch', 120, 3);
  const placed = await order(tokens.bob, [{ product: p.id, quantity: 1 }], { paymentMethod: 'card' });
  const start = await api('POST', `/api/payments/orders/${placed.json.data.id}/initiate`, tokens.bob, {});
  assert.equal(start.status, 200, JSON.stringify(start.json));

  const page = await fetch(start.json.data.redirectUrl);
  const href = (await page.text()).match(/class="pay" href="([^"]+)"/)[1].replace(/&amp;/g, '&');
  await fetch(`${BASE}${href}`, { redirect: 'manual' });

  const paid = await Order.findById(placed.json.data.id);
  assert.equal(paid.paymentStatus, 'Paid');
  assert.equal(paid.orderStatus, 'Confirmed');

  const cod = await order(tokens.bob, [{ product: p.id, quantity: 1 }]);
  const switchAttempt = await api('POST', `/api/payments/orders/${cod.json.data.id}/initiate`, tokens.bob, { method: 'card' });
  assert.equal(switchAttempt.status, 400);
});

test('cart: quantity validation, stock including what is already in the cart, idempotent guest merge', async () => {
  const p = await makeProduct('Belt', 25, 4);
  const add = (quantity) => api('POST', '/api/cart', tokens.bob, { productId: p.id, quantity });
  assert.equal((await add(-2)).status, 400);
  assert.equal((await add('abc')).status, 400);
  assert.equal((await add(3)).status, 200);
  const over = await add(2);
  assert.equal(over.status, 400, 'existing 3 + 2 exceeds the 4 in stock');
  assert.match(over.json.message, /already have 3/);

  const merge = () => api('POST', '/api/cart/merge', tokens.bob, { items: [{ productId: p.id, quantity: 2 }] });
  await merge();
  const twice = await merge();
  assert.equal(twice.status, 200);
  const line = twice.json.data.products.find((item) => item.product.id === p.id);
  assert.equal(line.quantity, 3, 'merge keeps max(server, guest), never adds twice');

  const draft = await makeProduct('Draft Belt', 25, 4, { status: 'draft' });
  assert.equal((await api('POST', '/api/cart', tokens.bob, { productId: draft.id, quantity: 1 })).status, 404);
});

test('invoice email shows product titles, variant, discounts, promotion and address (FR-3.3)', () => {
  const { renderOrderInvoice } = require('../src/services/emailService');
  const html = renderOrderInvoice({
    products: [{ product: { title: 'Silk Dress', thumbnail: 'https://img.test/a.jpg' }, quantity: 1, price: 320, variant: { options: { Size: 'M' } } }],
    subtotal: 320, discount: 10, coupon: 'SAVE10', promoDiscount: 30, tax: 28, shipping: 0, total: 308,
    paymentMethod: 'cod', paymentStatus: 'Pending', shippingAddress: address,
  });
  for (const expected of ['Silk Dress', 'Size: M', 'https://img.test/a.jpg', 'SAVE10', 'Promotion', 'Free', 'Dhaka', '$308.00']) {
    assert.ok(html.includes(expected), `invoice should contain "${expected}"`);
  }
});

test('COD needs a delivery zone; the server sets the charge (60 / 120 Taka) and rejects a wrong zone', async () => {
  const p = await makeProduct('Cap', 20, 20);
  const lines = [{ product: p.id, quantity: 1 }];
  const noZone = await api('POST', '/api/orders', tokens.alice, { products: lines, shippingAddress: address, paymentMethod: 'cod' });
  assert.equal(noZone.status, 422, 'COD without a zone is rejected');
  const badZone = await order(tokens.alice, lines, { deliveryZone: 'mars' });
  assert.equal(badZone.status, 422);

  const quote = (zone, method = 'cod') => api('POST', '/api/orders/quote', tokens.alice, { products: lines, paymentMethod: method, deliveryZone: zone });
  assert.equal((await quote('inside_dhaka')).json.data.shipping, 0.5, '60 Taka at 120 per USD');
  assert.equal((await quote('outside_dhaka')).json.data.shipping, 1);
  assert.equal((await quote(undefined)).json.data.shipping, 10, 'no zone: standard flat fee');
  assert.equal((await quote('outside_dhaka', 'card')).json.data.shipping, 10, 'card keeps the flat fee');
  const options = (await quote('inside_dhaka')).json.data.deliveryOptions;
  assert.deepEqual(options.map((o) => [o.zone, o.charge]), [['inside_dhaka', 0.5], ['outside_dhaka', 1]]);

  const inside = await order(tokens.alice, lines, { deliveryZone: 'inside_dhaka', shipping: 0 });
  assert.equal(inside.status, 201, JSON.stringify(inside.json));
  assert.equal(inside.json.data.shipping, 0.5, 'a client-sent shipping value is ignored');
  assert.equal(inside.json.data.deliveryZone, 'inside_dhaka');
  assert.equal(inside.json.data.total, 22.5);

  const outside = await order(tokens.alice, lines, { deliveryZone: 'outside_dhaka', shippingAddress: { ...address, city: 'Chattogram' } });
  assert.equal(outside.json.data.shipping, 1);
  assert.equal(outside.json.data.deliveryZone, 'outside_dhaka');

  const faked = await order(tokens.alice, lines, { deliveryZone: 'inside_dhaka', shippingAddress: { ...address, city: 'Chattogram' } });
  assert.equal(faked.status, 400, 'Inside Dhaka needs a Dhaka address');

  const card = await order(tokens.alice, lines, { paymentMethod: 'card', deliveryZone: 'inside_dhaka' });
  assert.equal(card.json.data.shipping, 10);
  assert.equal(card.json.data.deliveryZone, '', 'the zone is only kept for COD');

  const big = await makeProduct('Jacket', 150, 5);
  const free = await order(tokens.alice, [{ product: big.id, quantity: 1 }], { deliveryZone: 'outside_dhaka' });
  assert.equal(free.json.data.shipping, 0, 'free shipping over $100 still applies');
});

test('super admin can set any status; staff and demo admins cannot; closed orders stay closed', async () => {
  const User = require('../src/models/User');
  const { generateAccessToken } = require('../src/utils/generateTokens');
  const ActivityLog = require('../src/models/ActivityLog');
  const Notification = require('../src/models/Notification');
  const demo = await User.create({ name: 'Demo Admin', email: 'admin@swiftcart.demo', password: 'Password123!', role: 'admin' });
  const demoToken = generateAccessToken(demo);
  const p = await makeProduct('Gloves', 30, 6);
  const id = (await order(tokens.alice, [{ product: p.id, quantity: 2 }])).json.data.id;
  const set = (token, status) => api('PUT', `/api/orders/${id}/override-status`, token, { status });

  assert.equal((await set(tokens.alice, 'Shipped')).status, 403, 'customers cannot');
  assert.equal((await set(demoToken, 'Shipped')).status, 403, 'demo admin cannot');
  process.env.SUPER_ADMIN_EMAILS = 'someone.else@test.dev';
  assert.equal((await set(tokens.admin, 'Shipped')).status, 403, 'an admin outside SUPER_ADMIN_EMAILS cannot');
  assert.equal((await api('GET', '/api/orders/admin/all', tokens.admin)).json.canOverrideStatus, false);
  delete process.env.SUPER_ADMIN_EMAILS;
  assert.equal((await api('GET', '/api/orders/admin/all', tokens.admin)).json.canOverrideStatus, true);

  assert.equal((await set(tokens.admin, 'Nonsense')).status, 400);
  assert.equal((await set(tokens.admin, 'Pending')).status, 400, 'already Pending');
  assert.equal((await set(tokens.admin, 'Delivered')).status, 200, 'Pending jumps straight to Delivered');
  assert.equal((await Order.findById(id)).paymentStatus, 'Paid', 'COD delivered is paid');
  assert.equal((await set(tokens.admin, 'Packed')).status, 200, 'and can go back');
  assert.equal((await Product.findById(p.id)).stock, 4, 'stock stays reserved while open');
  assert.ok(await ActivityLog.findOne({ action: 'Order Status Override' }));
  assert.ok(await Notification.findOne({ relatedOrder: id, message: /now: Packed/ }), 'customer is notified');

  assert.equal((await set(tokens.admin, 'Returned')).status, 200);
  assert.equal((await Product.findById(p.id)).stock, 6, 'returning gives stock back');
  assert.equal((await set(tokens.admin, 'Processing')).status, 400, 'a closed order cannot be reopened');
  assert.equal((await Product.findById(p.id)).stock, 6);

  const online = (await order(tokens.alice, [{ product: p.id, quantity: 1 }], { paymentMethod: 'card' })).json.data.id;
  assert.equal((await api('PUT', `/api/orders/${online}/override-status`, tokens.admin, { status: 'Shipped' })).status, 400, 'unpaid online order cannot ship');
});

test('refunds: customer cancel of a paid order flags Refund Needed; only a super admin can mark it Refunded', async () => {
  const p = await makeProduct('Boots', 60, 5);
  const id = (await order(tokens.bob, [{ product: p.id, quantity: 1 }], { paymentMethod: 'card' })).json.data.id;
  const refund = (token, body = {}) => api('POST', `/api/orders/${id}/refund`, token, body);

  assert.equal((await refund(tokens.admin)).status, 400, 'an open unpaid order has nothing to refund');
  await Order.updateOne({ _id: id }, { paymentStatus: 'Paid', orderStatus: 'Confirmed', paymentTransactionId: 'tx_1' });
  const cancelled = await api('PUT', `/api/orders/${id}/cancel`, tokens.bob);
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.json.data.paymentStatus, 'Refund Needed');
  assert.equal((await Product.findById(p.id)).stock, 5);

  assert.equal((await refund(tokens.bob)).status, 403, 'customers cannot refund');
  const done = await refund(tokens.admin, { note: 'sent via bKash' });
  assert.equal(done.status, 200, JSON.stringify(done.json));
  assert.equal(done.json.data.paymentStatus, 'Refunded');
  assert.equal(done.json.data.refund.amount, done.json.data.total);
  assert.equal(done.json.data.refund.byName, 'admin');
  assert.equal((await refund(tokens.admin)).status, 400, 'cannot refund twice');

  const mine = (await api('GET', '/api/orders', tokens.bob)).json.data.find((o) => o.id === id);
  assert.equal(mine.paymentStatus, 'Refunded');
  assert.ok(mine.refund.at && mine.refund.amount);
  assert.equal(mine.refund.by, undefined, 'staff identity is not shown to the customer');

  const cod = (await order(tokens.bob, [{ product: p.id, quantity: 1 }])).json.data.id;
  const codCancel = await api('PUT', `/api/orders/${cod}/cancel`, tokens.bob);
  assert.equal(codCancel.json.data.paymentStatus, 'Pending', 'unpaid COD needs no refund');
  assert.equal((await api('POST', `/api/orders/${cod}/refund`, tokens.admin)).status, 400);
});
