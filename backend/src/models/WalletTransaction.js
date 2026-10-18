const mongoose = require('mongoose');

// One line of the store account statement
const WalletTransactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['credit', 'debit'], required: true },
    category: { type: String, enum: ['opening_balance', 'sale', 'refund', 'adjustment'], required: true },
    amount: { type: Number, required: true, min: 0 },
    // Wallet balance right after this line was applied
    balanceAfter: { type: Number, default: null },
    description: { type: String, default: '' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    orderNumber: { type: String, default: '' },
    // Idempotency key (e.g. "sale:<orderId>"), so the same event is never booked twice
    ref: { type: String, default: undefined },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    byName: { type: String, default: '' },
  },
  { timestamps: true }
);

WalletTransactionSchema.index({ ref: 1 }, { unique: true, sparse: true });
WalletTransactionSchema.index({ createdAt: -1 });
WalletTransactionSchema.index({ category: 1, createdAt: -1 });
WalletTransactionSchema.index({ order: 1 });

WalletTransactionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
