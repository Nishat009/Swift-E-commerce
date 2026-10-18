const mongoose = require('mongoose');

// The store's own money account (admin side only). There is one document, key 'store'.
// Sales add to it, refunds are paid out of it; every change is a WalletTransaction.
const StoreWalletSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'store' },
    balance: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD' },
  },
  { timestamps: true }
);

StoreWalletSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('StoreWallet', StoreWalletSchema);
