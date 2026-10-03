const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const { sendSuccess } = require('../utils/response');
const { logActivity, logAudit } = require('../utils/activityLog');
const { isDemoAccount } = require('./demoAuthController');

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

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password -twoFactorSecret -twoFactorRecoveryCodes -otpCode -otpExpires -otpAttempts -otpRequestedAt -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    return sendSuccess(res, 'Users list loaded successfully', users, 200, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  const { role } = req.body;
  if (!['admin', 'customer'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid user role' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (isDemoAccount(user)) {
      return res.status(403).json({ success: false, message: 'Demo accounts cannot be changed' });
    }
    if (user.id === req.user.id && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot remove your own admin role' });
    }
    const previousRole = user.role;
    user.role = role;
    await user.save();
    await logAudit(req, 'User', user._id, `Role of ${user.email}: ${previousRole} -> ${role}`, { role: previousRole }, { role });
    await logActivity(req, 'User Role Changed', `${user.email} is now "${role}"`);
    return sendSuccess(res, 'User role updated successfully', user);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (isDemoAccount(user)) {
      return res.status(403).json({ success: false, message: 'Demo accounts cannot be deleted' });
    }
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Demote this admin to customer before deleting the account' });
    }
    await Promise.all([
      Cart.deleteMany({ user: user._id }),
      Wishlist.deleteMany({ user: user._id })
    ]);
    await user.deleteOne();
    await logAudit(req, 'User', user._id, `Deleted account ${user.email}`, { email: user.email, name: user.name, role: user.role }, { deleted: true });
    await logActivity(req, 'User Deleted', `Deleted account ${user.email}`);
    return sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getUserCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.params.id }).populate('products.product');
    return sendSuccess(res, 'User cart loaded successfully', cart || { products: [], subtotal: 0 });
  } catch (error) {
    next(error);
  }
};

const getUserWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.params.id }).populate('products');
    return sendSuccess(res, 'User wishlist loaded successfully', wishlist || { products: [] });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserCart,
  getUserWishlist,
};
