const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Wishlist = require('../models/Wishlist');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/', protect, async (req, res, next) => {
  try {
    const [orders, wishlist, trending] = await Promise.all([
      Order.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20).populate('products.product', 'category'),
      Wishlist.findOne({ user: req.user.id }).populate('products', 'category'),
      Product.find({ active: true, status: 'published', visibility: 'public', stock: { $gt: 0 } })
        .sort({ bestSeller: -1, trending: -1, rating: -1 }).limit(8),
    ]);
    const viewed = orders.flatMap((order) => order.products.map((line) => line.product)).concat(wishlist?.products || []).filter(Boolean);
    const favorite = viewed.map((product) => product.category).filter(Boolean);
    const counts = favorite.reduce((map, category) => map.set(category, (map.get(category) || 0) + 1), new Map());
    const category = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const preferred = category
      ? await Product.find({ active: true, status: 'published', visibility: 'public', stock: { $gt: 0 }, category })
        .sort({ rating: -1 }).limit(8)
      : trending;
    const complements = await Product.find({ active: true, status: 'published', visibility: 'public', stock: { $gt: 0 }, category: { $in: ['shoes', 'bag', 'jacket', 'jewelry'] } }).limit(4);
    res.json({ success: true, data: {
      recommendedForYou: preferred.length ? preferred : trending,
      completeTheLook: complements,
      becauseYouViewed: preferred.slice(0, 4),
      trendingForStyle: trending.slice(0, 4),
      similarProducts: preferred.slice(0, 4),
    } });
  } catch (error) { next(error); }
});

module.exports = router;
