const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, trim: true, maxlength: 100, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, trim: true, maxlength: 100, default: 'Guest' },
    email: { type: String, trim: true, lowercase: true, maxlength: 200, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    assistantReply: { type: String, required: true, trim: true, maxlength: 5000 },
    suggestedProducts: [{ type: mongoose.Schema.Types.Mixed }],
    status: { type: String, enum: ['unread', 'read', 'archived'], default: 'unread', index: true },
    // Keyed SHA-256 of the sender's IP (to spot abuse without storing the address itself)
    ipHash: { type: String, default: '' },
  },
  { timestamps: true },
);

ChatMessageSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.ipHash;
    return ret;
  },
});

// A signed-in customer's history (GET /api/chat/mine)
ChatMessageSchema.index({ user: 1, createdAt: 1 });
// Chat logs are deleted automatically after CHAT_RETENTION_DAYS (default 180)
const retentionDays = Number(process.env.CHAT_RETENTION_DAYS) > 0 ? Number(process.env.CHAT_RETENTION_DAYS) : 180;
ChatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: retentionDays * 24 * 60 * 60 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
