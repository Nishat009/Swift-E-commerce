const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    
    // Product details to buy
    productTitle: { type: String, required: true, trim: true },
    productPrice: { type: Number, required: true, min: 0 },
    productDescription: { type: String, required: true, trim: true },
    productImage: { type: String, required: true },

    // Prize details to win
    prizeName: { type: String, required: true, trim: true },
    prizeDescription: { type: String, required: true, trim: true },
    prizeImage: { type: String, required: true },

    // Draw limits
    ticketLimit: { type: Number, required: true, min: 1 },
    ticketsSold: { type: Number, default: 0 },

    // State
    status: {
      type: String,
      enum: ['active', 'sold-out', 'completed'],
      default: 'active'
    },

    // Winner
    winnerUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    winnerTicket: { type: String, default: null },
    winnerVideoUrl: { type: String, default: null } // Simulated video preview URL
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
