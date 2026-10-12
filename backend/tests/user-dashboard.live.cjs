// Live check of the customer dashboard APIs against a running local development backend.
// Start the API first, then from backend/:
//   TEST_API_URL=http://127.0.0.1:5099/api node tests/user-dashboard.live.cjs   (default http://localhost:5000/api)
// Signs in as the admin (TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD) to create one temporary product,
// registers a throwaway customer, and removes everything it created when it finishes.
const assert = require('node:assert/strict');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Cart = require('../src/models/Cart');
const Wishlist = require('../src/models/Wishlist');
const Notification = require('../src/models/Notification');
const AuditTrail = require('../src/models/AuditTrail');
const ActivityLog = require('../src/models/ActivityLog');
const base = process.env.TEST_API_URL || 'http://localhost:5000/api';
const marker = Date.now();
const title = `Dashboard test ${marker}`;
const email = `dashboard-test-${marker}@example.com`;
const password = `Testpass${marker}!`;
const address = { street: 'Test St', city: 'Dhaka', state: 'Dhaka', zipCode: '1200', country: 'Bangladesh' };
let token, userId, productId;

async function api(method, route, body, auth = token) {
  const response = await fetch(base + route, {
    method,
    headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${auth}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${JSON.stringify(json)}`);
  return json.data;
}

async function check(name, run) { await run(); console.log(`PASS ${name}`); }

async function main() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart');
  try {
    const admin = await api('POST', '/auth/login', {
      email: process.env.TEST_ADMIN_EMAIL || 'admin@email.com',
      password: process.env.TEST_ADMIN_PASSWORD || '12345678',
    }, null);
    // Wishlist, cart and checkout only accept storefront products: published, public, active, in stock
    const product = await api('POST', '/products', {
      title, slug: `dashboard-test-${marker}`,
      description: 'Temporary dashboard test product', category: 'test', brand: 'Test',
      price: 25, stock: 5, thumbnail: '/test.png', status: 'published', visibility: 'public', active: true,
    }, admin.accessToken);
    productId = product.id;
    assert.equal(product.stockStatus, 'in_stock');
    const registered = await api('POST', '/auth/register', { name: 'Dashboard Test', email, password }, null);
    userId = registered.user?.id || registered.user?._id;
    const login = await api('POST', '/auth/login', { email, password }, null);
    token = login.accessToken;
    userId = login.user.id;

    await check('profile read and edit', async () => {
      assert.equal((await api('GET', '/auth/profile')).user.email, email);
      assert.equal((await api('PUT', '/auth/profile', { name: 'Dashboard Updated', phone: '01700000000' })).user.name, 'Dashboard Updated');
    });
    await check('address add, edit, delete', async () => {
      let addresses = (await api('POST', '/auth/addresses', address)).addresses;
      assert.equal(addresses.length, 1);
      const id = addresses[0]._id;
      addresses = (await api('PUT', `/auth/addresses/${id}`, { city: 'Chattogram' })).addresses;
      assert.equal(addresses[0].city, 'Chattogram');
      addresses = (await api('DELETE', `/auth/addresses/${id}`)).addresses;
      assert.equal(addresses.length, 0);
    });
    await check('wishlist add and remove', async () => {
      assert.equal((await api('POST', '/wishlist', { productId })).length, 1);
      assert.equal((await api('GET', '/wishlist')).length, 1);
      assert.equal((await api('DELETE', `/wishlist/${productId}`)).length, 0);
    });
    await check('dashboard counts and notifications sources', async () => {
      assert.ok(Array.isArray(await api('GET', '/orders')));
      assert.ok(Array.isArray(await api('GET', '/wishlist')));
      assert.ok(Array.isArray((await api('GET', '/cart')).products));
      assert.ok(Array.isArray(await api('GET', '/notifications')));
      assert.equal(typeof (await api('GET', '/notifications/unread-count')).count, 'number');
    });
    await check('order history, detail and cancellation', async () => {
      const order = await api('POST', '/orders', {
        products: [{ product: productId, quantity: 1 }],
        shippingAddress: address,
        paymentMethod: 'cod',
        deliveryZone: 'inside_dhaka',
      });
      assert.equal(order.orderStatus, 'Pending');
      assert.equal((await Product.findById(productId)).stock, 4);
      assert.ok((await api('GET', '/orders')).some(item => item.id === order.id));
      assert.equal((await api('GET', `/orders/${order.id}`)).id, order.id);
      assert.equal((await api('PUT', `/orders/${order.id}/cancel`)).orderStatus, 'Cancelled');
      assert.equal((await Product.findById(productId)).stock, 5);
    });
    await check('password change and new login', async () => {
      const nextPassword = `Changed${marker}!`;
      const oldToken = token;
      const changed = await api('PUT', '/auth/profile', { currentPassword: password, password: nextPassword });
      assert.ok(changed.accessToken, 'password change returns a fresh token for this session');
      // A new password signs out every earlier session
      await assert.rejects(api('GET', '/auth/profile', undefined, oldToken), /: 401 /);
      token = (await api('POST', '/auth/login', { email, password: nextPassword }, null)).accessToken;
      assert.ok(token);
    });
    await check('2FA setup endpoint', async () => {
      const setup = await api('POST', '/auth/2fa/setup');
      assert.ok(setup.secret && setup.otpauthUrl);
    });
  } finally {
    // Remove only what this script created, also after a failed check
    if (userId && productId) await Order.deleteMany({ user: userId, 'products.product': productId });
    if (userId) {
      await Promise.all([
        Cart.deleteOne({ user: userId }), Wishlist.deleteOne({ user: userId }),
        Notification.deleteMany({ user: userId }), User.deleteOne({ _id: userId, email }),
      ]);
    }
    if (productId) {
      await Product.deleteOne({ _id: productId, title });
      await AuditTrail.deleteMany({ entityType: 'Product', entityId: productId });
    }
    await ActivityLog.deleteMany({ details: { $regex: title } });
    await mongoose.disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
