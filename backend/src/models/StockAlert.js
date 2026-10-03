const mongoose = require('mongoose');

// FR-1.15: "email me when this is back in stock" sign-ups. One pending sign-up per email and product.
const StockAlertSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    pending: { type: Boolean, default: true },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

StockAlertSchema.index({ product: 1, email: 1 }, { unique: true, partialFilterExpression: { pending: true } });

module.exports = mongoose.model('StockAlert', StockAlertSchema);
