const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String, default: '127.0.0.1' }
  },
  { timestamps: true }
);

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
