const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    purchaseAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'simulated_wallet' },
    status: {
      type: String,
      enum: ['active', 'won', 'lost'],
      default: 'active'
    }
  },
  { timestamps: true }
);

TicketSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Ticket', TicketSchema);
