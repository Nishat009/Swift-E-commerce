const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

class CouponError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Orders that still count against a coupon (cancelled / returned ones free the use again)
const ACTIVE_ORDER = { orderStatus: { $nin: ['Cancelled', 'Returned'] } };

// Validate a code for a user and subtotal; returns { coupon, discount }. Throws CouponError.
const evaluateCoupon = async (code, userId, subtotal) => {
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  if (!coupon) throw new CouponError('Coupon code invalid or not found', 404);
  if (!coupon.active) throw new CouponError('Coupon is inactive');
  if (coupon.expiry < new Date()) throw new CouponError('Coupon has expired');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new CouponError('This coupon has reached its usage limit');
  }
  if (coupon.minSpend > 0 && subtotal !== undefined && subtotal < coupon.minSpend) {
    throw new CouponError(`Minimum spend of $${coupon.minSpend.toFixed(2)} required to use this coupon`);
  }
  if (coupon.perUserLimit > 0 && userId) {
    const used = await Order.countDocuments({ user: userId, coupon: coupon.code, ...ACTIVE_ORDER });
    if (used >= coupon.perUserLimit) throw new CouponError('You have already used this coupon the maximum number of times');
  }

  let discount = 0;
  if (subtotal !== undefined) {
    if (coupon.percentage > 0) discount = subtotal * (coupon.percentage / 100);
    else if (coupon.amount > 0) discount = coupon.amount;
    discount = Number(Math.min(discount, subtotal).toFixed(2));
  }
  return { coupon, discount };
};

// Atomically take one use. Returns false if the limit was reached meanwhile.
const redeemCoupon = async (coupon) => {
  const filter = { _id: coupon._id };
  if (coupon.usageLimit > 0) filter.$expr = { $lt: ['$usedCount', '$usageLimit'] };
  const updated = await Coupon.findOneAndUpdate(filter, { $inc: { usedCount: 1 } }, { new: true });
  return Boolean(updated);
};

const releaseCouponUse = async (code) => {
  if (!code) return;
  await Coupon.updateOne({ code: String(code).toUpperCase(), usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
};

module.exports = { CouponError, evaluateCoupon, redeemCoupon, releaseCouponUse };
