// Phase 1 hardening: login lockout, OTP input validation, product/campaign visibility, real status codes.
// Runs against a throwaway database, never your real data.
//   node --test tests/security.test.js
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:3001';
process.env.PAYMENT_MOCK = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_at_least_32_characters';

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const TEST_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart_security_test';
const BASE = 'http://localhost:5056';

let server;
const tokens = {};
const products = {};

const api = async (method, path, token, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};

const productFields = (title, extra) => ({
  title, description: 'x', category: 'tops', brand: 'Test', price: 10, stock: 5,
  images: ['x.png'], thumbnail: 'x.png', ...extra,
});

test.before(async () => {
  await mongoose.connect(TEST_URI);
  await mongoose.connection.dropDatabase();
  const User = require('../src/models/User');
  const Product = require('../src/models/Product');
  const { generateAccessToken } = require('../src/utils/generateTokens');
  for (const [key, role] of [['admin', 'admin'], ['alice', 'customer']]) {
    const user = await User.create({ name: key, email: `${key}@test.dev`, password: 'Password123!', role });
    tokens[key] = generateAccessToken(user);
  }
  products.live = await Product.create(productFields('Live Tee'));
  products.draft = await Product.create(productFields('Draft Tee', { status: 'draft' }));
  products.hidden = await Product.create(productFields('Hidden Tee', { visibility: 'private' }));
  const app = require('../src/app');
  await new Promise((resolve) => { server = app.listen(5056, resolve); });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('errors use real HTTP status codes', async () => {
  assert.equal((await api('GET', '/api/auth/profile')).status, 401);
  assert.equal((await api('GET', '/api/admin/users', tokens.alice)).status, 403);
  assert.equal((await api('GET', '/api/no-such-route')).status, 404);
});

test('three wrong passwords lock the account for 30 seconds', async () => {
  const login = (password) => api('POST', '/api/auth/login', null, { email: 'alice@test.dev', password });
  for (let i = 0; i < 3; i++) assert.equal((await login('wrong-password')).status, 401);
  const locked = await login('Password123!');
  assert.equal(locked.status, 429, 'correct password is refused while locked');
  assert.ok(locked.json.errors.retryAfter > 0);

  const User = require('../src/models/User');
  await User.updateOne({ email: 'alice@test.dev' }, { $set: { lockUntil: new Date(Date.now() - 1000) } });
  assert.equal((await login('Password123!')).status, 200, 'login works again once the lock expires');
});

test('OTP and 2FA endpoints reject query operators instead of passing them to MongoDB', async () => {
  assert.equal((await api('POST', '/api/auth/request-otp', null, { email: { $ne: null } })).status, 422);
  assert.equal((await api('POST', '/api/auth/verify-otp', null, { email: { $regex: '.*' }, otp: '123456' })).status, 422);
  assert.equal((await api('POST', '/api/auth/verify-otp', null, { email: 'alice@test.dev', otp: { $gt: '' } })).status, 422);
  assert.equal((await api('POST', '/api/auth/verify-2fa', null, { code: { $ne: null } })).status, 422);
});

test('storefront never exposes draft or private products', async () => {
  for (const query of ['', '?all=true', '?visibility=private', '?all=true&status=draft']) {
    const titles = (await api('GET', `/api/products${query}`)).json.data.map((p) => p.title);
    assert.deepEqual(titles, ['Live Tee'], `guest query "${query}"`);
  }
  assert.equal((await api('GET', `/api/products/${products.draft.id}`)).status, 404);
  assert.equal((await api('GET', `/api/products/${products.hidden.id}`, tokens.alice)).status, 404);
  assert.equal((await api('GET', `/api/products/${products.live.id}`)).status, 200);
});

test('admins still see every product', async () => {
  const all = await api('GET', '/api/products?all=true', tokens.admin);
  assert.equal(all.json.data.length, 3);
  assert.equal((await api('GET', `/api/products/${products.draft.id}`, tokens.admin)).status, 200);
  assert.equal((await api('GET', '/api/products?limit=999999')).json.limit, 500, 'page size is capped');
});

test('draft campaigns are hidden from guests, private ones are unlisted, sales close at the draw date', async () => {
  const create = (overrides) => api('POST', '/api/campaigns/admin/create', tokens.admin, {
    title: 'Draw', productTitle: 'Tee', productPrice: 10, productDescription: 'x', productImage: 'x.png',
    prizeName: 'Watch', prizeDescription: 'x', prizeImage: 'x.png', ticketLimit: 10, ...overrides,
  }).then((r) => r.json.data);
  const draft = await create({ title: 'Draft Draw', status: 'draft' });
  const unlisted = await create({ title: 'Private Draw', visibility: 'private' });
  const closed = await create({ title: 'Closed Draw', drawDate: new Date(Date.now() - 60000) });

  const guestTitles = (await api('GET', '/api/campaigns?status=draft&visibility=private')).json.data.map((c) => c.title);
  assert.deepEqual(guestTitles, ['Closed Draw']);
  assert.equal((await api('GET', `/api/campaigns/${draft.id}`)).status, 404);
  assert.equal((await api('GET', `/api/campaigns/${unlisted.id}`)).status, 200, 'private = reachable by direct link');

  const adminTitles = (await api('GET', '/api/campaigns', tokens.admin)).json.data.map((c) => c.title);
  assert.equal(adminTitles.length, 3);

  const buy = await api('POST', `/api/campaigns/${closed.id}/buy`, tokens.alice, { quantity: 1, paymentMethod: 'card' });
  assert.equal(buy.status, 400);
  assert.match(buy.json.message, /closed/);
});

test('demo login: off by default, signs in to fixed demo accounts only when enabled', async () => {
  const off = await api('POST', '/api/auth/demo-login', null, { role: 'admin' });
  assert.equal(off.status, 404);
  assert.deepEqual((await api('GET', '/api/auth/demo-login')).json.data.roles, []);

  process.env.DEMO_LOGIN_ENABLED = 'true';
  process.env.DEMO_LOGIN_ROLES = 'customer';
  try {
    assert.deepEqual((await api('GET', '/api/auth/demo-login')).json.data.roles, ['customer']);
    assert.equal((await api('POST', '/api/auth/demo-login', null, { role: 'admin' })).status, 404, 'admin not enabled');
    assert.equal((await api('POST', '/api/auth/demo-login', null, { role: { $ne: '' } })).status, 404);
    const guest = await api('POST', '/api/auth/demo-login', null, { role: 'customer' });
    assert.equal(guest.status, 200);
    assert.equal(guest.json.data.user.role, 'customer');
    assert.equal(guest.json.data.user.email, 'guest@swiftcart.demo');
    assert.equal((await api('GET', '/api/auth/profile', guest.json.data.accessToken)).status, 200);

    process.env.DEMO_LOGIN_ROLES = 'customer,admin';
    const admin = await api('POST', '/api/auth/demo-login', null, { role: 'admin' });
    assert.equal(admin.json.data.user.role, 'admin');
  } finally {
    delete process.env.DEMO_LOGIN_ENABLED;
    delete process.env.DEMO_LOGIN_ROLES;
  }
});

test('operator-shaped query strings get 400 (not 500) and oversized bodies get 413', async () => {
  assert.equal((await api('GET', '/api/products?category[$ne]=zzz')).status, 400);
  assert.equal((await api('GET', '/api/products?rating[$gt]=0')).status, 400);
  const list = await api('GET', '/api/products?brand[]=Test&brand[]=Other');
  assert.equal(list.status, 200, 'repeated params become a comma list');
  const big = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(3 * 1024 * 1024) }),
  });
  assert.equal(big.status, 413);
  const bad = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{not json' });
  assert.equal(bad.status, 400);
});

test('OTP endpoints do not reveal which emails exist or belong to staff; reset token must be a string', async () => {
  const unknown = await api('POST', '/api/auth/verify-otp', null, { email: 'nobody@test.dev', otp: '123456' });
  const wrong = await api('POST', '/api/auth/verify-otp', null, { email: 'alice@test.dev', otp: '123456' });
  assert.equal(unknown.status, wrong.status);
  assert.equal(unknown.json.message, wrong.json.message);

  const staff = await api('POST', '/api/auth/request-otp', null, { email: 'admin@test.dev' });
  const nobody = await api('POST', '/api/auth/request-otp', null, { email: 'ghost@test.dev' });
  assert.equal(staff.status, 200);
  assert.equal(staff.json.message, nobody.json.message);

  assert.equal((await api('POST', '/api/auth/reset-password', null, { token: ['abc'], newPassword: 'LongEnough123' })).status, 422);
  assert.equal((await api('POST', '/api/auth/register', null, { name: 'Short', email: 'short@test.dev', password: '1234567' })).status, 422);
});

test('the demo admin can browse but cannot change roles, delete users or touch demo accounts', async () => {
  process.env.DEMO_LOGIN_ENABLED = 'true';
  try {
    const demo = (await api('POST', '/api/auth/demo-login', null, { role: 'admin' })).json.data;
    const guest = (await api('POST', '/api/auth/demo-login', null, { role: 'customer' })).json.data;
    assert.equal((await api('GET', '/api/admin/users', demo.accessToken)).status, 200);
    const User = require('../src/models/User');
    const alice = await User.findOne({ email: 'alice@test.dev' });
    assert.equal((await api('PUT', `/api/admin/users/${alice.id}/role`, demo.accessToken, { role: 'admin' })).status, 403);
    assert.equal((await api('DELETE', `/api/admin/users/${alice.id}`, demo.accessToken)).status, 403);
    // A real admin cannot break the shared demo accounts either
    assert.equal((await api('PUT', `/api/admin/users/${guest.user.id}/role`, tokens.admin, { role: 'admin' })).status, 403);
    assert.equal((await api('POST', '/api/auth/2fa/setup', guest.accessToken)).status, 403);
    assert.equal((await api('PUT', '/api/auth/profile', guest.accessToken, { password: 'Hijacked123!' })).status, 403);
    assert.equal((await api('PUT', '/api/auth/profile', guest.accessToken, { name: 'Renamed Guest' })).status, 200, 'harmless edits are fine');
  } finally {
    delete process.env.DEMO_LOGIN_ENABLED;
  }
});
