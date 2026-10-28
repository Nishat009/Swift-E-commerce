const mongoose = require('mongoose');

// One signed-in browser. The refresh cookie names this session and carries a one-time secret; only
// its SHA-256 is stored. Every refresh replaces the secret (the previous hash is kept briefly so two
// tabs refreshing at the same moment do not look like a stolen cookie).
const RefreshSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    previousTokenHash: { type: String, default: '' },
    rotatedAt: { type: Date, default: null },
    rememberMe: { type: Boolean, default: false },
    userAgent: { type: String, default: '', maxlength: 200 },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: '' },
    // MongoDB removes the session once it has expired
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RefreshSession', RefreshSessionSchema);
