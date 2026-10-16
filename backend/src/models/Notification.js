const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['campaign_purchase', 'draw_result', 'campaign_update', 'winner_announcement', 'price_drop', 'restock', 'delivery_update', 'admin_alert', 'store_message', 'system'],
      default: 'system'
    },
    relatedCampaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
    relatedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    // Where clicking the notification goes, when it is not the customer's own order page (e.g. staff alerts)
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

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
