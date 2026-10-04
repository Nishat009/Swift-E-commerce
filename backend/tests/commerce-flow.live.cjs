// Run against a local development server only: node backend/tests/commerce-flow.live.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Cart = require('../src/models/Cart');

const base = process.env.TEST_API_URL || 'http://localhost:5000/api';
let token;
let productId;
let orderId;
let userId;
let originalCart;
const results = [];

async function request(method, route, body) {
  const response = await fetch(base + route, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${JSON.stringify(data)}`);
  return data.data;
}

async function check(name, action) {
  await action();
  results.push(name);
  console.log(`PASS ${name}`);
}

async function main() {
  const login = await request('POST', '/auth/login', {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@email.com',
    password: process.env.TEST_ADMIN_PASSWORD || '12345678',
  });
  token = login.accessToken;
  userId = login.user.id;
  assert.equal(login.user.role, 'admin');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart');
  originalCart = await Cart.findOne({ user: userId }).lean();
  const marker = Date.now();
  try {
    await check('product create', async () => {
      const product = await request('POST', '/products', {
        title: `Commerce flow test ${marker}`, slug: `commerce-flow-test-${marker}`,
        description: 'Temporary integration test product', category: 'test', brand: 'Test',
        price: 25, stock: 5, thumbnail: '/test.png', status: 'draft', visibility: 'private',
      });
      productId = product.id;
      assert.ok(productId);
    });
    await check('product read and update', async () => {
      const updated = await request('PUT', `/products/${productId}`, { price: 30, stock: 6 });
      assert.equal(updated.price, 30);
      const fetched = await request('GET', `/products/${productId}`);
      assert.equal(fetched.stock, 6);
    });
    await check('cart add, update, remove and re-add', async () => {
      let cart = await request('POST', '/cart', { productId, quantity: 1 });
      assert.equal(cart.products.length, 1);
      cart = await request('PUT', '/cart', { productId, quantity: 2 });
      assert.equal(cart.products[0].quantity, 2);
      cart = await request('DELETE', `/cart/${productId}`);
      assert.equal(cart.products.length, 0);
      cart = await request('POST', '/cart', { productId, quantity: 2 });
      assert.equal(cart.products[0].quantity, 2);
    });
    await check('checkout and inventory decrement', async () => {
      const order = await request('POST', '/orders', {
        products: [{ product: productId, quantity: 2 }],
        shippingAddress: { street: 'Test St', city: 'Dhaka', state: 'Dhaka', zipCode: '1200', country: 'Bangladesh' },
        paymentMethod: 'cash_on_delivery',
      });
      orderId = order.id;
      assert.equal(order.orderStatus, 'Pending');
      assert.equal((await request('GET', `/products/${productId}`)).stock, 4);
      assert.equal((await request('GET', '/cart')).products.length, 0);
    });
    await check('delivery status', async () => {
      for (const status of ['Processing', 'Shipped', 'Delivered']) {
        const order = await request('PUT', `/orders/${orderId}/status`, { status });
        assert.equal(order.orderStatus, status);
      }
      assert.equal((await request('GET', `/orders/${orderId}`)).orderStatus, 'Delivered');
    });
    await check('product delete', async () => {
      await request('DELETE', `/products/${productId}`);
      const archived = await Product.findById(productId).lean();
      assert.equal(archived.active, false);
      assert.equal(archived.status, 'archived');
    });
  } finally {
    // Remove only records created by this script, including on assertion failure.
    if (orderId) await Order.deleteOne({ _id: orderId, user: userId });
    if (productId) await Product.deleteOne({ _id: productId, title: `Commerce flow test ${marker}` });
    if (originalCart) {
      await Cart.updateOne({ user: userId }, { $set: { products: originalCart.products, subtotal: originalCart.subtotal } });
    } else {
      await Cart.deleteOne({ user: userId });
    }
    await mongoose.disconnect();
  }
  console.log(`${results.length} checks passed`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
