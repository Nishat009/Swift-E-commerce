const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    terms: { type: String, default: '', trim: true },
    bannerImage: { type: String, default: '' },

    // Product details to buy (embedded — backward compatible)
    productTitle: { type: String, required: true, trim: true },
    productPrice: { type: Number, required: true, min: 0 },
    productDescription: { type: String, required: true, trim: true },
    productImage: { type: String, required: true },

    // Linked products for auto-ticket on checkout
    linkedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // Prize details to win
    prizeName: { type: String, required: true, trim: true },
    prizeDescription: { type: String, required: true, trim: true },
    prizeImage: { type: String, required: true },

    // Draw configuration
    drawDate: { type: Date, default: null },
    ticketLimit: { type: Number, required: true, min: 1 },
    ticketsSold: { type: Number, default: 0 },
    ticketsPerPurchase: { type: Number, default: 1, min: 1 },
    maxTicketsPerUser: { type: Number, default: 10, min: 1 },

    // State
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'sold-out', 'completed', 'archived'],
      default: 'active'
    },

    // Visibility
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },

    // Winner
    winnerUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    winnerTicket: { type: String, default: null },
    winnerVideoUrl: { type: String, default: null },

    // Prize delivery proof (admin fills this in after the draw)
    delivery: {
      status: { type: String, enum: ['pending', 'shipped', 'delivered'], default: 'pending' },
      courier: { type: String, default: '' },
      trackingNumber: { type: String, default: '' },
      proofImage: { type: String, default: '' },
      note: { type: String, default: '' },
      shippedAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    }
  },
  { timestamps: true }
);

CampaignSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Campaign', CampaignSchema);
