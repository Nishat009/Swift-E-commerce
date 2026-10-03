const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    amount: { type: Number, min: 0, default: 0 },
    expiry: { type: Date, required: true },
    minSpend: { type: Number, min: 0, default: 0 },       // minimum cart subtotal (0 = none)
    usageLimit: { type: Number, min: 0, default: 0 },     // total redemptions allowed (0 = unlimited)
    perUserLimit: { type: Number, min: 0, default: 0 },   // redemptions per customer (0 = unlimited)
    usedCount: { type: Number, min: 0, default: 0 },
    // One entry per redemption, so the per-user limit can be enforced atomically
    usedBy: { type: [mongoose.Schema.Types.ObjectId], default: [], select: false },
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
    delete ret.usedBy;
    return ret;
  }
});

module.exports = mongoose.model('Coupon', CouponSchema);
