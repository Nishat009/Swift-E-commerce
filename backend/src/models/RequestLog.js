const mongoose = require('mongoose');

// Every API call that changes something (POST / PUT / PATCH / DELETE), and every failed call:
// who made it, what it hit and how it ended. Request bodies are never stored.
const RequestLogSchema = new mongoose.Schema(
  {
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    durationMs: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userEmail: { type: String, default: '' },
    userRole: { type: String, default: 'guest' },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const RETENTION_DAYS = Math.max(1, Number(process.env.REQUEST_LOG_RETENTION_DAYS) || 90);
RequestLogSchema.index({ createdAt: -1 }, { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 });
RequestLogSchema.index({ user: 1, createdAt: -1 });
RequestLogSchema.index({ statusCode: 1, createdAt: -1 });

RequestLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('RequestLog', RequestLogSchema);
