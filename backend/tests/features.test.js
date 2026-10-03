// SRS features: back-in-stock sign-ups (FR-1.15), wishlist collections / alerts / sharing (FR-1.18),
// fuzzy search and trending (FR-1.19), CSV/JSON import (FR-1.4) and the admin audit trail.
//   node --test tests/features.test.js
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:3001';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_at_least_32_characters';

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const TEST_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart_features_test';
const BASE = 'http://localhost:5058';

let server;
let Product;
const tokens = {};
const users = {};

const api = async (method, path, token, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};

const makeProduct = (title, extra = {}) => Product.create({
  title, description: 'x', category: 'outerwear', brand: 'Northwind', price: 80, stock: 5,
  images: ['x.png'], thumbnail: 'x.png', ...extra,
});

test.before(async () => {
  await mongoose.connect(TEST_URI);
  await mongoose.connection.dropDatabase();
  const User = require('../src/models/User');
  Product = require('../src/models/Product');
  await Promise.all([require('../src/models/StockAlert').init(), require('../src/models/Review').init()]);
  const { generateAccessToken } = require('../src/utils/generateTokens');
  for (const [key, role] of [['admin', 'admin'], ['alice', 'customer'], ['bob', 'customer']]) {
    users[key] = await User.create({ name: `${key} Tester`, email: `${key}@test.dev`, password: 'Password123!', role });
    tokens[key] = generateAccessToken(users[key]);
  }
  const app = require('../src/app');
  await new Promise((resolve) => { server = app.listen(5058, resolve); });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('FR-1.15: back-in-stock sign-up is stored once and fires when the product is restocked', async () => {
  const StockAlert = require('../src/models/StockAlert');
  const soldOut = await makeProduct('Wool Parka', { stock: 0 });
  const inStock = await makeProduct('Rain Jacket');

  assert.equal((await api('POST', `/api/products/${inStock.id}/notify-me`, null, { email: 'guest@test.dev' })).status, 400);
  assert.equal((await api('POST', `/api/products/${soldOut.id}/notify-me`, null, { email: 'not-an-email' })).status, 422);
  assert.equal((await api('POST', `/api/products/${soldOut.id}/notify-me`, null, { email: 'Guest@Test.dev' })).status, 201);
  assert.equal((await api('POST', `/api/products/${soldOut.id}/notify-me`, null, { email: 'guest@test.dev' })).status, 201, 'repeat sign-up is fine');
  assert.equal((await api('POST', `/api/products/${soldOut.id}/notify-me`, tokens.alice, {})).status, 201, 'signed-in users can omit the email');
  assert.equal(await StockAlert.countDocuments({ product: soldOut._id, pending: true }), 2);

  const restock = await api('PUT', `/api/products/${soldOut.id}`, tokens.admin, { stock: 4 });
  assert.equal(restock.status, 200);
  assert.equal(await StockAlert.countDocuments({ product: soldOut._id, pending: true }), 0, 'everyone was notified once');
});

test('FR-1.18: wishlist collections, alert toggles and a public share link', async () => {
  const Notification = require('../src/models/Notification');
  const coat = await makeProduct('Camel Coat', { price: 200 });
  const boots = await makeProduct('Chelsea Boots');

  assert.equal((await api('POST', '/api/wishlist', tokens.bob, { productId: coat.id })).status, 200);
  assert.equal((await api('POST', '/api/wishlist', tokens.bob, { productId: coat.id })).status, 409);

  const created = await api('POST', '/api/wishlist/collections', tokens.bob, { name: 'Winter' });
  assert.equal(created.status, 201);
  const winter = created.json.data.collections[0];
  assert.equal((await api('POST', '/api/wishlist/collections', tokens.bob, { name: 'winter' })).status, 409);

  // Add straight into a collection, and move an existing item in
  assert.equal((await api('POST', '/api/wishlist', tokens.bob, { productId: boots.id, collectionId: winter.id })).status, 200);
  const moved = await api('PUT', `/api/wishlist/collections/${winter.id}/products`, tokens.bob, { productId: coat.id, action: 'add' });
  assert.deepEqual(moved.json.data.collections[0].productIds.sort(), [boots.id, coat.id].sort());

  // Price-drop alert switched off for the coat: no notification when its price falls
  const toggled = await api('PUT', `/api/wishlist/alerts/${coat.id}`, tokens.bob, { priceDrop: false });
  assert.equal(toggled.json.data.alerts[coat.id].priceDrop, false);
  assert.equal(toggled.json.data.alerts[boots.id].priceDrop, true, 'default is on');
  await api('PUT', `/api/products/${coat.id}`, tokens.admin, { price: 150 });
  await api('PUT', `/api/products/${boots.id}`, tokens.admin, { price: 60 });
  const drops = await Notification.find({ user: users.bob._id, type: 'price_drop' });
  assert.deepEqual(drops.map((n) => String(n.relatedProduct)), [boots.id]);

  // Share link: public read-only view, then switched off
  const share = await api('POST', '/api/wishlist/share', tokens.bob, { enabled: true });
  const token = share.json.data.path.split('/').pop();
  const shared = await api('GET', `/api/wishlist/shared/${token}`);
  assert.equal(shared.status, 200);
  assert.equal(shared.json.data.owner, 'bob');
  assert.equal(shared.json.data.products.length, 2);
  assert.equal(shared.json.data.products[0].email, undefined);
  await api('POST', '/api/wishlist/share', tokens.bob, { enabled: false });
  assert.equal((await api('GET', `/api/wishlist/shared/${token}`)).status, 404);

  // Removing from the wishlist also removes it from collections
  const removed = await api('DELETE', `/api/wishlist/${coat.slug}`, tokens.bob);
  assert.equal(removed.status, 200, 'slug works for removal too');
  const details = await api('GET', '/api/wishlist/details', tokens.bob);
  assert.deepEqual(details.json.data.collections[0].productIds, [boots.id]);
});

test('FR-1.19: "did you mean" for misspelled searches, autocomplete and trending terms', async () => {
  await makeProduct('Leather Bomber Jacket', { brand: 'Aviator', tags: ['leather'] });
  const miss = await api('GET', '/api/products?search=lether%20jaket');
  assert.equal(miss.json.total, 0);
  assert.equal(miss.json.didYouMean, 'leather jacket');

  const suggest = await api('GET', '/api/products/search/suggest?q=bomb');
  assert.equal(suggest.json.data.suggestions[0].title, 'Leather Bomber Jacket');
  assert.equal((await api('GET', '/api/products/search/suggest?q=bombr')).json.data.didYouMean, 'bomber');

  for (let i = 0; i < 3; i++) await api('GET', '/api/products?search=jacket');
  await api('GET', '/api/products?search=coat');
  await api('GET', '/api/products?search=boots');
  await new Promise((r) => setTimeout(r, 100));
  const trending = (await api('GET', '/api/products/search/trending')).json.data;
  assert.equal(trending[0], 'jacket');
  assert.ok(!trending.includes('lether jaket'), 'searches without results are not trending');
});

test('FR-1.4: CSV and JSON import, with server-managed fields ignored', async () => {
  const csv = [
    'title,description,category,brand,price,stock,images,tags,rating',
    '"Linen Shirt, White",Breathable linen,tops,Coastal,45,10,https://img.test/a.jpg|https://img.test/b.jpg,summer|linen,5',
    'Broken Row,,tops,Coastal,abc,1,,,',
  ].join('\n');
  const result = await api('POST', '/api/products/import', tokens.admin, { csv });
  assert.equal(result.status, 201);
  assert.equal(result.json.data.created, 1);
  assert.equal(result.json.data.failed[0].row, 2);

  const shirt = await Product.findOne({ title: 'Linen Shirt, White' });
  assert.deepEqual(shirt.images, ['https://img.test/a.jpg', 'https://img.test/b.jpg']);
  assert.equal(shirt.thumbnail, 'https://img.test/a.jpg');
  assert.equal(shirt.status, 'draft', 'imports wait for review');
  assert.notEqual(shirt.rating, 5, 'rating cannot be imported');

  const json = await api('POST', '/api/products/import', tokens.admin, {
    products: [{ title: 'Silk Scarf', description: 'x', category: 'accessories', brand: 'Luna', price: 30, stock: 3, images: ['s.png'], status: 'published', soldCount: 999 }],
  });
  assert.equal(json.json.data.created, 1);
  assert.equal((await Product.findOne({ title: 'Silk Scarf' })).soldCount, 0);
  assert.equal((await api('POST', '/api/products/import', tokens.alice, { products: [] })).status, 403);
});

test('product create/update ignore rating and sales counters sent by the client', async () => {
  const created = await api('POST', '/api/products', tokens.admin, {
    title: 'Denim Jacket', description: 'x', category: 'outerwear', brand: 'Blue', price: 90, stock: 2,
    images: ['d.png'], thumbnail: 'd.png', rating: 5, soldCount: 500, reviewCount: 99,
  });
  assert.equal(created.status, 201);
  assert.equal(created.json.data.soldCount, 0);
  const updated = await api('PUT', `/api/products/${created.json.data.id}`, tokens.admin, { rating: 1, wishlistCount: 1000 });
  assert.equal(updated.json.data.wishlistCount, 0);
});

test('audit trail records before/after for user, category and coupon changes', async () => {
  const AuditTrail = require('../src/models/AuditTrail');
  await api('PUT', `/api/admin/users/${users.alice.id}/role`, tokens.admin, { role: 'admin' });
  const roleAudit = await AuditTrail.findOne({ entityType: 'User', entityId: users.alice._id });
  assert.equal(roleAudit.previousState.get('role'), 'customer');
  assert.equal(roleAudit.newState.get('role'), 'admin');
  await api('PUT', `/api/admin/users/${users.alice.id}/role`, tokens.admin, { role: 'customer' });

  const cat = await api('POST', '/api/categories', tokens.admin, { name: 'Knitwear', image: 'k.png' });
  await api('PUT', `/api/categories/${cat.json.data.id}`, tokens.admin, { name: 'Knits' });
  const catAudit = await AuditTrail.find({ entityType: 'Category' }).sort({ createdAt: 1 });
  assert.equal(catAudit.length, 2);
  assert.equal(catAudit[1].previousState.get('name'), 'Knitwear');

  const expiry = new Date(Date.now() + 86400000).toISOString();
  assert.equal((await api('POST', '/api/coupons', tokens.admin, { code: 'BOTH', percentage: 10, amount: 5, expiry })).status, 422);
  const coupon = await api('POST', '/api/coupons', tokens.admin, { code: 'TEN', percentage: 10, expiry });
  assert.equal(coupon.status, 201);
  await api('PUT', `/api/coupons/${coupon.json.data.id}`, tokens.admin, { code: 'TEN', percentage: 15, expiry, usedCount: 50 });
  const couponAudit = await AuditTrail.findOne({ entityType: 'Coupon', changeSummary: /Updated/ });
  assert.equal(couponAudit.previousState.get('percentage'), 10);
  assert.equal(couponAudit.newState.get('percentage'), 15);

  const lookup = await api('GET', '/api/coupons/TEN', tokens.bob);
  assert.equal(lookup.json.data.usedCount, undefined, 'customers do not see usage counters');
});

test('changing the password signs out other sessions but keeps this one signed in', async () => {
  const login = async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@test.dev', password: 'Password123!' }),
    });
    const json = await res.json();
    return { token: json.data.accessToken, cookie: res.headers.get('set-cookie').split(';')[0] };
  };
  const laptop = await login();
  const phone = await login();

  const change = await fetch(`${BASE}/api/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${laptop.token}`, Cookie: laptop.cookie },
    body: JSON.stringify({ password: 'NewPassword456!', currentPassword: 'Password123!' }),
  });
  const changed = await change.json();
  assert.equal(change.status, 200);
  assert.ok(changed.data.accessToken, 'this session receives a fresh token');

  assert.equal((await api('GET', '/api/auth/profile', phone.token)).status, 401, 'old access token is rejected');
  const phoneRefresh = await fetch(`${BASE}/api/auth/refresh`, { method: 'POST', headers: { Cookie: phone.cookie } });
  assert.equal(phoneRefresh.status, 401, 'old refresh token is rejected');
  assert.equal((await api('GET', '/api/auth/profile', changed.data.accessToken)).status, 200);
});

test('refresh keeps a session cookie a session cookie when "remember me" was off', async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.dev', password: 'Password123!', rememberMe: false }),
  });
  const cookie = res.headers.get('set-cookie').split(';')[0];
  const refreshed = await fetch(`${BASE}/api/auth/refresh`, { method: 'POST', headers: { Cookie: cookie } });
  assert.equal(refreshed.status, 200);
  assert.doesNotMatch(refreshed.headers.get('set-cookie'), /Max-Age/i);
});

test('newsletter accepts long TLDs, does not reveal existing subscribers, and unsubscribes by link', async () => {
  const Newsletter = require('../src/models/Newsletter');
  const first = await api('POST', '/api/newsletter/subscribe', null, { email: 'reader@example.store' });
  assert.equal(first.status, 201);
  const again = await api('POST', '/api/newsletter/subscribe', null, { email: 'reader@example.store' });
  assert.equal(again.json.message, first.json.message);

  const { unsubscribeToken } = await Newsletter.findOne({ email: 'reader@example.store' });
  const out = await fetch(`${BASE}/api/newsletter/unsubscribe?token=${unsubscribeToken}`);
  assert.equal(out.status, 200);
  assert.equal(await Newsletter.countDocuments({ email: 'reader@example.store' }), 0);
  assert.equal((await fetch(`${BASE}/api/newsletter/unsubscribe?token=${unsubscribeToken}`)).status, 404);
});

test('a second review of the same product is refused', async () => {
  const p = await makeProduct('Review Me');
  // Bob changed his password in an earlier test, so his old token is (correctly) invalid now
  const post = () => api('POST', '/api/reviews', tokens.alice, { product: p.id, rating: 5, review: 'Lovely' });
  const results = await Promise.all([post(), post()]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  const edit = await api('PUT', `/api/reviews/${results.find((r) => r.status === 201).json.data.id}`, tokens.alice, { rating: 4 });
  assert.equal(edit.status, 200, 'rating-only edit is allowed');
});
