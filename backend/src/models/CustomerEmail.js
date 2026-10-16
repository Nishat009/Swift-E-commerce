const mongoose = require('mongoose');

// A message staff wrote to a customer from the admin panel (kept so the team can see what was already said)
const CustomerEmailSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    to: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    includeOrder: { type: Boolean, default: false },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sentByName: { type: String, default: '' },
    // false when the mail server refused it or email is not set up; the in-app copy may still have gone out
    delivered: { type: Boolean, default: false },
    inApp: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CustomerEmailSchema.index({ user: 1, createdAt: -1 });
CustomerEmailSchema.index({ order: 1, createdAt: -1 });

CustomerEmailSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('CustomerEmail', CustomerEmailSchema);
