const mongoose = require('mongoose');
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

const userUses = (userId) => ({
  $size: { $filter: { input: { $ifNull: ['$usedBy', []] }, cond: { $eq: ['$this', new mongoose.Types.ObjectId(String(userId))] } } },
});

// Atomically take one use (total and per-user limits). Returns false if a limit was reached meanwhile.
const redeemCoupon = async (coupon, userId) => {
  const limits = [];
  if (coupon.usageLimit > 0) limits.push({ $lt: ['$usedCount', '$usageLimit'] });
  if (coupon.perUserLimit > 0 && userId) limits.push({ $lt: [userUses(userId), '$perUserLimit'] });
  const filter = { _id: coupon._id, ...(limits.length ? { $expr: { $and: limits } } : {}) };
  const update = { $inc: { usedCount: 1 }, ...(userId ? { $push: { usedBy: userId } } : {}) };
  return Boolean(await Coupon.findOneAndUpdate(filter, update));
};

// Give one use back; removes a single usedBy entry for that user.
const releaseCouponUse = async (code, userId) => {
  if (!code) return;
  const set = { usedCount: { $max: [0, { $subtract: ['$usedCount', 1] }] } };
  if (userId) {
    const list = { $ifNull: ['$usedBy', []] };
    const idx = { $indexOfArray: [list, new mongoose.Types.ObjectId(String(userId))] };
    set.usedBy = {
      $cond: [
        { $lt: [idx, 0] }, list,
        { $concatArrays: [{ $slice: [list, idx] }, { $slice: [list, { $add: [idx, 1] }, { $max: [1, { $size: list }] }] }] },
      ],
    };
  }
  await Coupon.updateOne({ code: String(code).toUpperCase() }, [{ $set: set }]);
};

module.exports = { CouponError, evaluateCoupon, redeemCoupon, releaseCouponUse };
