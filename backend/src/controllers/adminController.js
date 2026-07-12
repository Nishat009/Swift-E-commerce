const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { sendSuccess } = require('../utils/response');

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Core counters
    const activeOrdersCount = await Order.countDocuments({ orderStatus: { $ne: 'Cancelled' } });
    const totalOrdersCount = await Order.countDocuments();
    const customersCount = await User.countDocuments({ role: 'customer' });
    const productsCount = await Product.countDocuments({ active: true });

    // 2. Revenue calculation (Sum totals of non-cancelled orders)
    const revenueAggregation = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);
    const revenue = revenueAggregation.length > 0 ? Number(revenueAggregation[0].totalRevenue.toFixed(2)) : 0;

    // 3. Low stock products (stock <= 5)
    const lowStockProducts = await Product.find({ stock: { $lte: 5 }, active: true })
      .select('title stock price thumbnail SKU')
      .limit(10);

    // 4. Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Monthly Revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of month

    const monthlyRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          orderStatus: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = monthlyRevenueAgg.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: Number(item.revenue.toFixed(2))
    }));

    // 6. Top Selling Products
    const topProductsAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.product',
          totalQuantity: { $sum: '$products.quantity' },
          totalSales: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // Populate top products details
    const topSellingProducts = [];
    for (const item of topProductsAgg) {
      const product = await Product.findById(item._id).select('title price thumbnail brand category');
      if (product) {
        topSellingProducts.push({
          product,
          totalQuantity: item.totalQuantity,
          totalSales: Number(item.totalSales.toFixed(2))
        });
      }
    }

    return sendSuccess(res, 'Dashboard statistics loaded successfully', {
      stats: {
        totalSales: revenue, // Total sales revenue
        revenue,
        ordersCount: totalOrdersCount,
        customersCount,
        productsCount
      },
      monthlyRevenue,
      topSellingProducts,
      recentOrders,
      lowStockProducts
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
