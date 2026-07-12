const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    amount: { type: Number, min: 0, default: 0 },
    expiry: { type: Date, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

CouponSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Coupon', CouponSchema);
