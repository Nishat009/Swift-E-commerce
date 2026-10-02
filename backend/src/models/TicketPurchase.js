const mongoose = require('mongoose');

// A pending/settled payment for lucky-draw tickets. Tickets are created only
// after the gateway payment is verified server-side.
const TicketPurchaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['bkash', 'card'], required: true },
    paymentSessionId: { type: String, default: '', index: true },
    paymentTransactionId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'fulfilling', 'paid', 'failed', 'expired', 'refund_needed'],
      default: 'pending'
    },
    expiresAt: { type: Date, required: true },
    paidAt: { type: Date, default: null }
  },
  { timestamps: true }
);

TicketPurchaseSchema.index({ status: 1, expiresAt: 1 });
TicketPurchaseSchema.index({ user: 1, campaign: 1, status: 1 });

TicketPurchaseSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('TicketPurchase', TicketPurchaseSchema);
