const mongoose = require('mongoose');

// Store only a digest of the browser's secret; MongoDB also removes expired records.
const AuthChallengeSchema = new mongoose.Schema({
  digest: { type: String, required: true, unique: true },
  purpose: { type: String, enum: ['google', 'two-factor'], required: true },
  nonce: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rememberMe: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

module.exports = mongoose.model('AuthChallenge', AuthChallengeSchema);
