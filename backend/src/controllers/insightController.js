const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');

const getInsights = async (req, res, next) => {
  try {
    const [lowStock, topSold, reviewTotals] = await Promise.all([
      Product.find({ active: true, stock: { $lte: 5 } }).sort({ stock: 1 }).limit(3).select('title stock'),
      Order.aggregate([
        { $match: { orderStatus: { $nin: ['Cancelled', 'Returned'] } } },
        { $unwind: '$products' },
        { $group: { _id: '$products.product', units: { $sum: '$products.quantity' } } },
        { $sort: { units: -1 } }, { $limit: 1 },
      ]),
      Review.aggregate([{ $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } }]),
    ]);
    const insights = lowStock.map((product) => ({
      id: `stock-${product.id}`, type: 'inventory_warning', title: `Low stock: ${product.title}`,
      description: `${product.stock} units remain in the live catalog.`,
      actionRecommendation: 'Review demand and replenish inventory if needed.', impactScore: product.stock === 0 ? 'high' : 'medium',
    }));
    if (topSold.length) {
      const product = await Product.findById(topSold[0]._id).select('title');
      if (product) insights.push({
        id: `sales-${product.id}`, type: 'trending', title: `Top seller: ${product.title}`,
        description: `${topSold[0].units} units sold across active orders.`,
        actionRecommendation: 'Check current stock before promoting this product.', impactScore: 'medium',
      });
    }
    if (reviewTotals.length) insights.push({
      id: 'reviews', type: 'pricing_tip', title: 'Customer review health',
      description: `${reviewTotals[0].count} reviews with an average rating of ${reviewTotals[0].average.toFixed(1)}/5.`,
      actionRecommendation: 'Read recent low-rated reviews for concrete improvement opportunities.', impactScore: 'medium',
    });
    res.json({ success: true, data: insights });
  } catch (error) { next(error); }
};

module.exports = { getInsights };
