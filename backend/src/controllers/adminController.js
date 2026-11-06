// Admin dashboard and user management. Every handler here is mounted in routes/adminRoutes.js after
// router.use(protect) and router.use(authorize('admin')), so only a signed-in admin reaches them.
const mongoose = require('mongoose');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Notification = require('../models/Notification');
const StockAlert = require('../models/StockAlert');
const Wardrobe = require('../models/Wardrobe');
const AuthChallenge = require('../models/AuthChallenge');
const RefreshSession = require('../models/RefreshSession');
const { sendSuccess } = require('../utils/response');
const { logActivity, logAudit } = require('../utils/activityLog');
const { isDemoAccount } = require('./demoAuthController');
const { withTransaction } = require('../utils/transaction');
const { getDashboardData } = require('../services/adminStats');

// Product fields the admin customer view shows for cart and wishlist items
const PRODUCT_SUMMARY = 'title brand price thumbnail SKU';
const userNotFound = (res) => res.status(404).json({ success: false, message: 'User not found' });

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Dashboard statistics loaded successfully', await getDashboardData());
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
    if (!mongoose.isValidObjectId(req.params.id)) return userNotFound(res);
    const user = await User.findById(req.params.id);
    if (!user) return userNotFound(res);
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
    if (!mongoose.isValidObjectId(req.params.id)) return userNotFound(res);
    const user = await User.findById(req.params.id);
    if (!user) return userNotFound(res);
    if (isDemoAccount(user)) {
      return res.status(403).json({ success: false, message: 'Demo accounts cannot be deleted' });
    }
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Demote this admin to customer before deleting the account' });
    }
    // MongoDB has no foreign keys, so remove the account's personal data here. Orders, lucky-draw
    // tickets, reviews, chat logs and audit logs are kept on purpose: they are store records
    // (sales, refunds, product ratings) and the UI shows a missing customer as "Deleted user".
    // Every filter is this account's id only, and all of it is one transaction where the server
    // supports transactions (Atlas), so a failure part-way never leaves a half-deleted account.
    await withTransaction(async (options) => {
      for (const Model of [Cart, Wishlist, Notification, StockAlert, Wardrobe, AuthChallenge, RefreshSession]) {
        await Model.deleteMany({ user: user._id }, options);
      }
      await user.deleteOne(options);
    });
    await logAudit(req, 'User', user._id, `Deleted account ${user.email}`, { email: user.email, name: user.name, role: user.role }, { deleted: true });
    await logActivity(req, 'User Deleted', `Deleted account ${user.email}`);
    return sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getUserCart = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return userNotFound(res);
    const cart = await Cart.findOne({ user: req.params.id }).populate({ path: 'products.product', select: PRODUCT_SUMMARY });
    return sendSuccess(res, 'User cart loaded successfully', cart || { products: [], subtotal: 0 });
  } catch (error) {
    next(error);
  }
};

const getUserWishlist = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return userNotFound(res);
    const wishlist = await Wishlist.findOne({ user: req.params.id }).populate({ path: 'products', select: PRODUCT_SUMMARY });
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
