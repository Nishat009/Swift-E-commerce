const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please fill a valid email address']
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  // Secret for the one-click unsubscribe link in newsletter emails
  unsubscribeToken: {
    type: String,
    default: () => require('crypto').randomBytes(16).toString('hex'),
    index: true
  }
});

module.exports = mongoose.model('Newsletter', newsletterSchema);
