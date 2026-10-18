const mongoose = require('mongoose');

// A business event anywhere in the system: staff actions, customer actions and automatic jobs.
// `adminUser` is whoever did it (empty for the system itself); the name is kept for older entries.
const ActivityLogSchema = new mongoose.Schema(
  {
    adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorRole: { type: String, enum: ['admin', 'customer', 'system'], default: 'admin' },
    category: { type: String, enum: ['order', 'refund', 'wallet', 'product', 'user', 'auth', 'campaign', 'marketing', 'system', 'other'], default: 'other' },
    action: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String, default: '127.0.0.1' }
  },
  { timestamps: true }
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ actorRole: 1, createdAt: -1 });
ActivityLogSchema.index({ category: 1, createdAt: -1 });

ActivityLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
