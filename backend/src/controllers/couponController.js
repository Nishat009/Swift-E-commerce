const Coupon = require('../models/Coupon');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity, logAudit } = require('../utils/activityLog');
const { CouponError, evaluateCoupon } = require('./../services/couponService');

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return sendSuccess(res, 'Coupons retrieved successfully', coupons);
  } catch (error) {
    next(error);
  }
};

// @desc    Get / validate a single coupon code
// @route   GET /api/coupons/:code
// @access  Private
const getCouponByCode = async (req, res, next) => {
  const { code } = req.params;
  try {
    // Optional ?subtotal= lets the cart check minimum spend and preview the discount
    const subtotal = req.query.subtotal !== undefined ? Number(req.query.subtotal) : undefined;
    const { coupon, discount } = await evaluateCoupon(code, req.user.id, Number.isFinite(subtotal) ? subtotal : undefined);
    return sendSuccess(res, 'Coupon code validated successfully', { ...coupon.toJSON(), discount });
  } catch (error) {
    if (error instanceof CouponError) return sendError(res, error.message, error.status);
    next(error);
  }
};

// @desc    Create a coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res, next) => {
  const { code, percentage, amount, expiry, active, minSpend, usageLimit, perUserLimit } = req.body;
  try {
    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return sendError(res, 'Coupon code already exists', 400);
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      percentage,
      amount,
      expiry,
      minSpend,
      usageLimit,
      perUserLimit,
      active: active !== undefined ? !!active : true
    });

    await logActivity(req, 'Coupon Created', `Created coupon ${coupon.code}`);
    return sendSuccess(res, 'Coupon created successfully', coupon, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a coupon (Admin)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res, next) => {
  const { id } = req.params;
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return sendError(res, 'Coupon not found', 404);
    }

    const { usedCount, ...changes } = req.body; // usage counter is server-managed
    const updatedCoupon = await Coupon.findByIdAndUpdate(id, changes, {
      new: true,
      runValidators: true
    });

    await logActivity(req, 'Coupon Updated', `Updated coupon ${updatedCoupon.code}`);
    return sendSuccess(res, 'Coupon updated successfully', updatedCoupon);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res, next) => {
  const { id } = req.params;
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return sendError(res, 'Coupon not found', 404);
    }

    await Coupon.findByIdAndDelete(id);
    await logActivity(req, 'Coupon Deleted', `Deleted coupon ${coupon.code}`);
    return sendSuccess(res, 'Coupon deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCoupons,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
