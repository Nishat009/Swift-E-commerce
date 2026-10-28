const mongoose = require('mongoose');

// One document (key 'default') holding the payment gateways the admin manages from the panel.
// Credentials are stored encrypted (services/paymentSettings.js) and never sent back to the browser;
// any credential left empty here falls back to the matching environment variable.
const credentialsField = (names) => Object.fromEntries(names.map((name) => [name, { type: String, default: '' }]));

const PaymentSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    cod: {
      enabled: { type: Boolean, default: true },
    },
    bkash: {
      enabled: { type: Boolean, default: true },
      // '' = use BKASH_BASE_URL (sandbox when unset)
      mode: { type: String, enum: ['', 'sandbox', 'live'], default: '' },
      credentials: credentialsField(['appKey', 'appSecret', 'username', 'password']),
    },
    card: {
      enabled: { type: Boolean, default: true },
      credentials: credentialsField(['secretKey', 'webhookSecret']),
    },
    // null = use BDT_PER_USD
    bdtPerUsd: { type: Number, default: null, min: 1 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentSettings', PaymentSettingsSchema);
