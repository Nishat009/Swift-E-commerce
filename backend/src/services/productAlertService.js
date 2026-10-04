const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const Notification = require('../models/Notification');
const StockAlert = require('../models/StockAlert');
const { discounted } = require('../utils/pricing');

const effectivePrice = (p) => discounted(Number(p.price) || 0, p.discountPercentage);

// Snapshot the fields alerts depend on (call before a change that may lower the price or restock)
const snapshotForAlerts = (product) => ({
  price: effectivePrice(product),
  stock: Number(product.stock) || 0
});

const isLive = (p) => p.active !== false && p.status === 'published' && p.visibility === 'public';

// Wishlist owners get alerts unless they switched that alert off for this product (FR-1.18)
const wantsAlert = (wishlist, productId, kind) => {
  const pref = (wishlist.alerts || []).find((a) => String(a.product) === String(productId));
  return pref ? pref[kind] !== false : true;
};

// FR-1.15: email everyone who asked to hear when this product is back in stock (once each)
const emailBackInStock = async (product) => {
  const { sendEmail, fire } = require('./emailService');
  const pending = await StockAlert.find({ product: product._id, pending: true }).limit(500);
  if (!pending.length) return 0;
  await StockAlert.updateMany({ _id: { $in: pending.map((a) => a._id) } }, { pending: false, notifiedAt: new Date() });
  const frontend = (process.env.FRONTEND_URL || 'http://localhost:3001').split(',')[0].trim().replace(/\/$/, '');
  const url = `${frontend}/products/${product.slug || product._id}`;
  for (const alert of pending) {
    fire(sendEmail({
      to: alert.email,
      subject: `${product.title} is back in stock`,
      text: `Good news: "${product.title}" is back in stock. Get it here: ${url}`,
      html: `<p>Good news: <strong>${String(product.title).replace(/[<>&]/g, '')}</strong> is back in stock.</p><p><a href="${url}">Shop it now</a> before it sells out again.</p>`,
    }));
  }
  return pending.length;
};

// Notify customers: price dropped / back in stock. Best-effort - never throws into the caller.
const sendProductAlerts = async (before, product) => {
  try {
    if (!isLive(product)) return { priceDrop: false, restock: false, notified: 0, emailed: 0 };
    const now = snapshotForAlerts(product);
    const dropped = before.price > 0 && now.price < before.price - 0.005;
    const restocked = before.stock <= 0 && now.stock > 0;
    if (!dropped && !restocked) return { priceDrop: false, restock: false, notified: 0, emailed: 0 };

    const emailed = restocked ? await emailBackInStock(product) : 0;

    const lists = await Wishlist.find({ products: product._id }).select('user alerts');
    const docs = [];
    lists.forEach((w) => {
      if (dropped && wantsAlert(w, product._id, 'priceDrop')) {
        docs.push({
          user: w.user,
          title: 'Price drop on your wishlist',
          message: `"${product.title}" dropped from $${before.price.toFixed(2)} to $${now.price.toFixed(2)}.`,
          type: 'price_drop',
          relatedProduct: product._id
        });
      }
      if (restocked && wantsAlert(w, product._id, 'backInStock')) {
        docs.push({
          user: w.user,
          title: 'Back in stock',
          message: `"${product.title}" is back in stock. Grab it before it sells out again!`,
          type: 'restock',
          relatedProduct: product._id
        });
      }
    });
    if (docs.length) await Notification.insertMany(docs);
    return { priceDrop: dropped, restock: restocked, notified: new Set(docs.map((d) => String(d.user))).size, emailed };
  } catch (err) {
    console.error('Product alerts failed:', err.message);
    return { priceDrop: false, restock: false, notified: 0, emailed: 0 };
  }
};

// Run alerts after stock changed outside the product editor (cancelled / returned orders, bulk edits)
const alertAfterStockChange = async (snapshots) => {
  for (const [productId, before] of snapshots) {
    const product = await Product.findById(productId);
    if (product) await sendProductAlerts(before, product);
  }
};

const snapshotProducts = async (productIds) => {
  const products = await Product.find({ _id: { $in: productIds } });
  return new Map(products.map((p) => [String(p._id), snapshotForAlerts(p)]));
};

module.exports = { snapshotForAlerts, sendProductAlerts, snapshotProducts, alertAfterStockChange };
