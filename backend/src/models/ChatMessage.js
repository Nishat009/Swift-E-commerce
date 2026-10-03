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
    ip: { type: String, default: '' },
  },
  { timestamps: true },
);

ChatMessageSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.ip;
    return ret;
  },
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
