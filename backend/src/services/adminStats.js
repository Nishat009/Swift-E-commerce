// Queries behind the admin dashboard. They are independent of each other, so they run in parallel.
// Order aggregations use the { orderStatus: 1, createdAt: -1 } and { createdAt: -1 } indexes on Order.
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

const NOT_CANCELLED = { orderStatus: { $ne: 'Cancelled' } };
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const round2 = (n) => Number(Number(n || 0).toFixed(2));

// First day of the month five months ago, so the chart covers the last six months
const sixMonthsAgo = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 5);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

// The five best-selling products, with their details loaded in one query instead of one per product
const topSellingProducts = async () => {
  const top = await Order.aggregate([
    { $match: NOT_CANCELLED },
    { $unwind: '$products' },
    {
      $group: {
        _id: '$products.product',
        totalQuantity: { $sum: '$products.quantity' },
        totalSales: { $sum: { $multiply: ['$products.quantity', '$products.price'] } },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 },
  ]);
  const products = await Product.find({ _id: { $in: top.map((item) => item._id) } }).select('title price thumbnail brand category');
  const byId = new Map(products.map((product) => [String(product._id), product]));
  return top
    .filter((item) => byId.has(String(item._id)))
    .map((item) => ({ product: byId.get(String(item._id)), totalQuantity: item.totalQuantity, totalSales: round2(item.totalSales) }));
};

const getDashboardData = async () => {
  const [
    activeOrdersCount,
    totalOrdersCount,
    customersCount,
    productsCount,
    revenueAgg,
    statusAgg,
    lowStockProducts,
    recentOrders,
    monthlyAgg,
    topProducts,
  ] = await Promise.all([
    Order.countDocuments(NOT_CANCELLED),
    Order.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ active: true }),
    Order.aggregate([{ $match: NOT_CANCELLED }, { $group: { _id: null, totalRevenue: { $sum: '$total' } } }]),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Product.find({ stock: { $lte: 5 }, active: true }).select('title stock price thumbnail SKU').limit(10),
    Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5),
    Order.aggregate([
      { $match: { ...NOT_CANCELLED, createdAt: { $gte: sixMonthsAgo() } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$total' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    topSellingProducts(),
  ]);

  const revenue = revenueAgg.length ? round2(revenueAgg[0].totalRevenue) : 0;

  return {
    stats: {
      totalSales: revenue,
      revenue,
      ordersCount: totalOrdersCount,
      activeOrdersCount,
      customersCount,
      productsCount,
    },
    ordersByStatus: statusAgg
      .map((s) => ({ status: s._id || 'Unknown', count: s.count }))
      .sort((a, b) => b.count - a.count),
    monthlyRevenue: monthlyAgg.map((item) => ({
      month: `${MONTH_NAMES[item._id.month - 1]} ${item._id.year}`,
      revenue: round2(item.revenue),
    })),
    topSellingProducts: topProducts,
    recentOrders,
    lowStockProducts,
  };
};

module.exports = { getDashboardData };
