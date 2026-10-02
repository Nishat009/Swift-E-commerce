const Wishlist = require('../models/Wishlist');
const Notification = require('../models/Notification');
const { discounted } = require('../utils/pricing');

const effectivePrice = (p) => discounted(Number(p.price) || 0, p.discountPercentage);

// Snapshot the fields alerts depend on (call before applying an admin update)
const snapshotForAlerts = (product) => ({
  price: effectivePrice(product),
  stock: Number(product.stock) || 0
});

// Notify customers who wishlisted the product: price dropped / back in stock.
// Best-effort - never throws into the admin update.
const sendProductAlerts = async (before, product) => {
  try {
    const now = snapshotForAlerts(product);
    const dropped = before.price > 0 && now.price < before.price - 0.005;
    const restocked = before.stock <= 0 && now.stock > 0;
    if (!dropped && !restocked) return { priceDrop: false, restock: false, notified: 0 };

    const lists = await Wishlist.find({ products: product._id }).select('user');
    if (!lists.length) return { priceDrop: dropped, restock: restocked, notified: 0 };

    const docs = [];
    lists.forEach((w) => {
      if (dropped) {
        docs.push({
          user: w.user,
          title: 'Price drop on your wishlist',
          message: `"${product.title}" dropped from $${before.price.toFixed(2)} to $${now.price.toFixed(2)}.`,
          type: 'price_drop',
          relatedProduct: product._id
        });
      }
      if (restocked) {
        docs.push({
          user: w.user,
          title: 'Back in stock',
          message: `"${product.title}" is back in stock. Grab it before it sells out again!`,
          type: 'restock',
          relatedProduct: product._id
        });
      }
    });
    await Notification.insertMany(docs);
    return { priceDrop: dropped, restock: restocked, notified: lists.length };
  } catch (err) {
    console.error('Product alerts failed:', err.message);
    return { priceDrop: false, restock: false, notified: 0 };
  }
};

module.exports = { snapshotForAlerts, sendProductAlerts };
