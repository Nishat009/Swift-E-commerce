const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:3001';
process.env.GOOGLE_CLIENT_ID = 'swiftcart-test.apps.googleusercontent.com';
process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.JWT_REFRESH_SECRET = crypto.randomBytes(32).toString('hex');

const User = require('../src/models/User');
const AuthChallenge = require('../src/models/AuthChallenge');
const dbName = `swiftcart_google_test_${process.pid}_${Date.now()}`;
const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const wrongKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const originalCerts = OAuth2Client.prototype.getFederatedSignonCertsAsync;
let server;
let baseURL;

// Only the provider key download is substituted. Google's real verifier checks
// signatures, audience, issuer, expiry and token format for every request.
before(async () => {
  await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017', {
    dbName, serverSelectionTimeoutMS: 5000,
  });
  await Promise.all([User.init(), AuthChallenge.init()]);
  OAuth2Client.prototype.getFederatedSignonCertsAsync = async () => ({
    certs: { 'test-key': keys.publicKey.export({ type: 'spki', format: 'pem' }) }, format: 'PEM',
  });
  const app = require('../src/app');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  OAuth2Client.prototype.getFederatedSignonCertsAsync = originalCerts;
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1) {
    assert.equal(mongoose.connection.name, dbName);
    assert.match(dbName, /^swiftcart_google_test_\d+_\d+$/);
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

async function request(path, { body, cookie, token, origin = process.env.FRONTEND_URL, method = 'POST' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  if (cookie) headers.Cookie = cookie;
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseURL}${path}`, {
    method, headers, ...(method !== 'GET' ? { body: JSON.stringify(body || {}) } : {}),
  });
  return { status: response.status, data: await response.json(), cookies: response.headers.getSetCookie() };
}

function cookieFor(response, name) {
  return response.cookies.find(value => value.startsWith(`${name}=`))?.split(';')[0];
}

async function challenge() {
  const response = await request('/auth/google/challenge');
  assert.equal(response.status, 200, JSON.stringify(response.data));
  assert.match(response.cookies.join(';'), /HttpOnly/);
  return { nonce: response.data.data.nonce, cookie: cookieFor(response, 'googleChallenge') };
}

function credential(nonce, overrides = {}, privateKey = keys.privateKey) {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({
    sub: 'google-customer', email: 'google-customer@gmail.com', name: 'Google Customer',
    email_verified: true, nonce, aud: process.env.GOOGLE_CLIENT_ID,
    iss: 'https://accounts.google.com', iat: now, exp: now + 3600,
    ...overrides,
  }, privateKey, { algorithm: 'RS256', keyid: 'test-key' });
}

async function googleSignIn(overrides = {}, extra = {}) {
  const c = await challenge();
  return request('/auth/google', { cookie: c.cookie, body: { credential: credential(c.nonce, overrides), ...extra } });
}

test('Google configuration and origin are required', async () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_ID;
  assert.equal((await request('/auth/google/challenge')).status, 422);
  process.env.GOOGLE_CLIENT_ID = clientId;
  assert.equal((await request('/auth/google/challenge', { origin: '' })).status, 422);
});

test('local password reset token can be used once', async () => {
  process.env.ALLOW_DEV_AUTH_CODES = 'true';
  try {
    const email = `reset-${Date.now()}@example.com`;
    const registered = await request('/auth/register', { body: { name: 'Reset User', email, password: 'OriginalPass123!' } });
    assert.equal(registered.status, 200, JSON.stringify(registered.data));
    const requested = await request('/auth/forgot-password', { body: { email } });
    assert.equal(requested.status, 200);
    const token = requested.data.data.resetToken;
    assert.equal(typeof token, 'string');
    const reset = await request('/auth/reset-password', { body: { token, newPassword: 'ChangedPass123!' } });
    assert.equal(reset.status, 200, JSON.stringify(reset.data));
    assert.equal((await request('/auth/reset-password', { body: { token, newPassword: 'AgainPass123!' } })).status, 422);
    assert.equal((await request('/auth/login', { body: { email, password: 'ChangedPass123!' } })).status, 200);
  } finally {
    delete process.env.ALLOW_DEV_AUTH_CODES;
  }
});

test('new Google customer receives existing app session; profile, cart, refresh and logout work', async () => {
  const response = await googleSignIn({}, { role: 'admin', email: 'forged@example.com', rememberMe: true });
  assert.equal(response.status, 200, JSON.stringify(response.data));
  const { user, accessToken, refreshToken } = response.data.data;
  assert.equal(user.role, 'customer');
  assert.equal(user.email, 'google-customer@gmail.com');
  assert.equal(user.googleConnected, true);
  assert.equal(refreshToken, undefined);
  assert.equal(user.googleId, undefined);
  const stored = await User.findById(user.id).select('+password');
  assert.equal(stored.password, undefined);
  assert.equal(await stored.matchPassword('anything'), false);
  assert.equal(stored.googleId, 'google-customer');
  assert.match(response.cookies.join(';'), /HttpOnly/);
  assert.match(response.cookies.join(';'), /Max-Age=604800/);
  const profile = await request('/auth/profile', { method: 'GET', token: accessToken });
  assert.equal(profile.status, 200);
  assert.equal(profile.data.data.user.id, user.id);
  assert.equal(profile.data.data.user.googleId, undefined);
  assert.equal((await request('/cart', { method: 'GET', token: accessToken })).status, 200);
  const refresh = await request('/auth/refresh', { cookie: cookieFor(response, 'refreshToken') });
  assert.equal(refresh.status, 200);
  assert.ok(refresh.data.data.accessToken);
  const logout = await request('/auth/logout', { cookie: cookieFor(refresh, 'refreshToken') });
  assert.equal(logout.status, 200);
  assert.match(logout.cookies.join(';'), /refreshToken=;/);
  assert.equal((await request('/auth/profile', { method: 'GET' })).status, 422);
  assert.equal((await request('/auth/refresh')).status, 422);
});

test('returning Google identity reuses the user by sub, even when provider email changes', async () => {
  const before = await User.findOne({ googleId: 'google-customer' });
  const response = await googleSignIn({ email: 'new-google-email@gmail.com' });
  assert.equal(response.status, 200);
  assert.equal(response.data.data.user.id, before.id);
  assert.equal(await User.countDocuments({ googleId: 'google-customer' }), 1);
  const refreshCookie = response.cookies.find(value => value.startsWith('refreshToken='));
  assert.ok(!refreshCookie.includes('Max-Age'));
});

test('rejects forged signatures, wrong audience/issuer, expired tokens, bad nonce and unverified email', async () => {
  for (const overrides of [
    { aud: 'another-app.apps.googleusercontent.com' },
    { iss: 'https://attacker.example' },
    { exp: Math.floor(Date.now() / 1000) - 600 },
    { nonce: 'another-browser' },
    { email_verified: false },
    { sub: '' },
  ]) {
    const response = await googleSignIn(overrides);
    assert.equal(response.status, 422, JSON.stringify(overrides));
    assert.equal(cookieFor(response, 'refreshToken'), undefined);
  }
  const c = await challenge();
  const response = await request('/auth/google', { cookie: c.cookie, body: { credential: credential(c.nonce, {}, wrongKeys.privateKey) } });
  assert.equal(response.status, 422);
});

test('nonce is bound to browser cookie, expires, and cannot be replayed', async () => {
  const c = await challenge();
  const body = { credential: credential(c.nonce) };
  assert.equal((await request('/auth/google', { body })).status, 422);
  assert.equal((await request('/auth/google', { body, cookie: c.cookie })).status, 200);
  assert.equal((await request('/auth/google', { body, cookie: c.cookie })).status, 422);
  const expired = await challenge();
  await AuthChallenge.updateOne({ nonce: expired.nonce }, { expiresAt: new Date(Date.now() - 1000) });
  assert.equal((await request('/auth/google', { cookie: expired.cookie, body: { credential: credential(expired.nonce) } })).status, 422);
});

test('existing email cannot be taken over; authenticated linking preserves account ID and role', async () => {
  const existing = await User.create({ name: 'Existing Admin', email: 'existing@gmail.com', password: 'existing-pass-123', role: 'admin' });
  const claims = { sub: 'google-existing', email: existing.email };
  const rejected = await googleSignIn(claims);
  assert.equal(rejected.status, 422);
  assert.equal((await User.findById(existing.id)).googleId, undefined);
  const login = await request('/auth/login', { body: { email: existing.email, password: 'existing-pass-123' } });
  assert.equal(login.status, 200);
  const c = await challenge();
  const body = { credential: credential(c.nonce, claims) };
  assert.equal((await request('/auth/google/link', { cookie: c.cookie, body })).status, 422);
  const linked = await request('/auth/google/link', { cookie: c.cookie, body, token: login.data.data.accessToken });
  assert.equal(linked.status, 200);
  const googleLogin = await googleSignIn(claims);
  assert.equal(googleLogin.status, 200);
  assert.equal(googleLogin.data.data.user.id, existing.id);
  assert.equal(googleLogin.data.data.user.role, 'admin');
});

test('2FA requires first-factor challenge, checks code, consumes recovery once, and blocks replay', async () => {
  const user = await User.findOneAndUpdate({ googleId: 'google-customer' }, {
    twoFactorEnabled: true, twoFactorSecret: 'JBSWY3DPEHPK3PXP', twoFactorRecoveryCodes: ['ABCDEFGH'],
  }, { new: true });
  const body = { userId: user.id, code: 'ABCDEFGH' };
  assert.equal((await request('/auth/verify-2fa', { body })).status, 422);
  const first = await googleSignIn({}, { rememberMe: true });
  assert.equal(first.status, 200);
  assert.equal(first.data.data.require2FA, true);
  assert.equal(first.data.data.accessToken, undefined);
  assert.equal(cookieFor(first, 'refreshToken'), undefined);
  const cookie = cookieFor(first, 'twoFactorChallenge');
  assert.equal((await request('/auth/verify-2fa', { cookie, body: { ...body, code: 'ZZZZZZZZ' } })).status, 422);
  const second = await request('/auth/verify-2fa', { cookie, body: { ...body, rememberMe: false } });
  assert.equal(second.status, 200);
  assert.ok(second.data.data.accessToken);
  assert.match(second.cookies.join(';'), /Max-Age=604800/);
  assert.equal(second.data.data.recoveryUsed, true);
  assert.equal((await User.findById(user.id).select('+twoFactorRecoveryCodes')).twoFactorRecoveryCodes.length, 0);
  assert.equal((await request('/auth/verify-2fa', { cookie, body })).status, 422);
});
