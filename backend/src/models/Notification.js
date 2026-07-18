const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['campaign_purchase', 'draw_result', 'campaign_update', 'winner_announcement', 'system'],
      default: 'system'
    },
    relatedCampaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

NotificationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);
