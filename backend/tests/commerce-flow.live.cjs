// Live check of the admin product -> cart -> checkout -> delivery flow against a running local
// development server only. Start the API first, then from backend/:
//   TEST_API_URL=http://127.0.0.1:5099/api node tests/commerce-flow.live.cjs   (default http://localhost:5000/api)
// Signs in as the admin (TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD), restores the admin's cart and
// removes the product, order, notifications and logs it created when it finishes.
const assert = require('node:assert/strict');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Cart = require('../src/models/Cart');
const Notification = require('../src/models/Notification');
const AuditTrail = require('../src/models/AuditTrail');
const ActivityLog = require('../src/models/ActivityLog');

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

// The admin's cart may hold other items, so look only at this product's line
const lineFor = (cart) => cart.products.find((item) => String(item.product?.id || item.product) === productId);

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
  const title = `Commerce flow test ${marker}`;
  try {
    await check('product create', async () => {
      // Cart and checkout only accept storefront products: published, public, active, in stock
      const product = await request('POST', '/products', {
        title, slug: `commerce-flow-test-${marker}`,
        description: 'Temporary integration test product', category: 'test', brand: 'Test',
        price: 25, stock: 5, thumbnail: '/test.png', status: 'published', visibility: 'public', active: true,
      });
      productId = product.id;
      assert.ok(productId);
      assert.equal(product.status, 'published');
      assert.equal(product.visibility, 'public');
      assert.equal(product.active, true);
    });
    await check('product read and update', async () => {
      const updated = await request('PUT', `/products/${productId}`, { price: 30, stock: 6 });
      assert.equal(updated.price, 30);
      const fetched = await request('GET', `/products/${productId}`);
      assert.equal(fetched.stock, 6);
    });
    await check('cart add, update, remove and re-add', async () => {
      let cart = await request('POST', '/cart', { productId, quantity: 1 });
      assert.equal(lineFor(cart)?.quantity, 1);
      cart = await request('PUT', '/cart', { productId, quantity: 2 });
      assert.equal(lineFor(cart)?.quantity, 2);
      cart = await request('DELETE', `/cart/${productId}`);
      assert.equal(lineFor(cart), undefined);
      cart = await request('POST', '/cart', { productId, quantity: 2 });
      assert.equal(lineFor(cart)?.quantity, 2);
    });
    await check('checkout and inventory decrement', async () => {
      const order = await request('POST', '/orders', {
        products: [{ product: productId, quantity: 2 }],
        shippingAddress: { street: 'Test St', city: 'Dhaka', state: 'Dhaka', zipCode: '1200', country: 'Bangladesh' },
        paymentMethod: 'cod',
        deliveryZone: 'inside_dhaka',
      });
      orderId = order.id;
      assert.equal(order.orderStatus, 'Pending');
      assert.equal(order.subtotal, 60);
      assert.equal((await request('GET', `/products/${productId}`)).stock, 4);
      // Placing an order empties the cart
      assert.equal((await request('GET', '/cart')).products.length, 0);
    });
    await check('delivery status', async () => {
      for (const status of ['Processing', 'Shipped', 'Delivered']) {
        const order = await request('PUT', `/orders/${orderId}/status`, { status });
        assert.equal(order.orderStatus, status);
      }
      const delivered = await request('GET', `/orders/${orderId}`);
      assert.equal(delivered.orderStatus, 'Delivered');
      assert.equal(delivered.paymentStatus, 'Paid', 'cash on delivery is marked paid once delivered');
    });
    await check('product delete', async () => {
      await request('DELETE', `/products/${productId}`);
      const archived = await Product.findById(productId).lean();
      assert.equal(archived.active, false);
      assert.equal(archived.status, 'archived');
    });
  } finally {
    // Remove only records created by this script, including on assertion failure.
    if (productId) {
      const orders = await Order.find({ user: userId, 'products.product': productId }).select('orderNumber').lean();
      const orderIds = orders.map((order) => order._id);
      await Order.deleteMany({ _id: { $in: orderIds } });
      await Notification.deleteMany({ user: userId, relatedOrder: { $in: orderIds } });
      await AuditTrail.deleteMany({ entityId: { $in: [productId, ...orderIds] } });
      for (const { orderNumber } of orders) await ActivityLog.deleteMany({ details: { $regex: orderNumber } });
      await Product.deleteOne({ _id: productId, title });
    }
    await ActivityLog.deleteMany({ details: { $regex: title } });
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
