const Coupon = require('../models/Coupon');
const { sendSuccess, sendError } = require('../utils/response');

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
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return sendError(res, 'Coupon code invalid or not found', 404);
    }

    if (!coupon.active) {
      return sendError(res, 'Coupon is inactive', 400);
    }

    const now = new Date();
    if (coupon.expiry < now) {
      return sendError(res, 'Coupon has expired', 400);
    }

    return sendSuccess(res, 'Coupon code validated successfully', coupon);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res, next) => {
  const { code, percentage, amount, expiry } = req.body;
  try {
    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return sendError(res, 'Coupon code already exists', 400);
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      percentage,
      amount,
      expiry
    });

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

    const updatedCoupon = await Coupon.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

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
