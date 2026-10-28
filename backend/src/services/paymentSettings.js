const crypto = require('crypto');
const PaymentSettings = require('../models/PaymentSettings');

// Payment gateway settings managed from the admin panel. The payment code reads them synchronously,
// so the document is cached in memory: loaded at startup, reloaded by housekeeping and after every save.
// A credential saved here wins over its environment variable; an empty one falls back to it.

const BKASH_URLS = {
  sandbox: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
  live: 'https://tokenized.pay.bka.sh/v1.2.0-beta',
};

// gateway -> credential field -> environment variable it replaces
const CREDENTIALS = {
  bkash: { appKey: 'BKASH_APP_KEY', appSecret: 'BKASH_APP_SECRET', username: 'BKASH_USERNAME', password: 'BKASH_PASSWORD' },
  card: { secretKey: 'STRIPE_SECRET_KEY', webhookSecret: 'STRIPE_WEBHOOK_SECRET' },
};
const GATEWAYS = ['cod', 'bkash', 'card'];

let cache = null;

// ------------------------------------------------------------ encryption ---
// AES-256-GCM with a random IV and a key derived from PAYMENT_SETTINGS_KEY. Production needs that
// dedicated secret, so one leaked JWT_SECRET cannot also unlock gateway keys; in development and
// tests JWT_SECRET stands in. If the secret changes, stored credentials can no longer be read and
// count as empty, so the env values take over.
const MIN_KEY_LENGTH = 32;
const encryptionSecret = () => {
  if (process.env.PAYMENT_SETTINGS_KEY) return process.env.PAYMENT_SETTINGS_KEY;
  return process.env.NODE_ENV === 'production' ? '' : String(process.env.JWT_SECRET || '');
};

/** Whether gateway keys can be saved from the admin panel (an encryption secret is configured). */
const canStoreCredentials = () => encryptionSecret().length >= MIN_KEY_LENGTH;

const encryptionKey = () => crypto.createHash('sha256').update(encryptionSecret()).digest();

const encrypt = (plain) => {
  if (!canStoreCredentials()) throw new Error('PAYMENT_SETTINGS_KEY is not set');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
};

const decrypt = (stored) => {
  if (!stored || !canStoreCredentials()) return '';
  try {
    const [version, iv, tag, data] = String(stored).split(':');
    if (version !== 'v1') return '';
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
};

// --------------------------------------------------------------- reading ---
const load = async () => {
  cache = await PaymentSettings.findOne({ key: 'default' }).lean();
  return cache;
};

const savedCredential = (gateway, field) => decrypt(cache?.[gateway]?.credentials?.[field]);

/** A gateway credential: the admin-saved value, else the environment variable. */
const credential = (gateway, field) => savedCredential(gateway, field) || process.env[CREDENTIALS[gateway][field]] || '';

/** The admin switch for a gateway (on unless turned off in the panel). */
const isGatewayEnabled = (gateway) => cache?.[gateway]?.enabled !== false;

const bkashBaseUrl = () => {
  const mode = cache?.bkash?.mode;
  if (mode && BKASH_URLS[mode]) return BKASH_URLS[mode];
  return (process.env.BKASH_BASE_URL || BKASH_URLS.sandbox).replace(/\/$/, '');
};

const bdtPerUsd = () => {
  if (Number(cache?.bdtPerUsd) > 0) return Number(cache.bdtPerUsd);
  return Number(process.env.BDT_PER_USD) > 0 ? Number(process.env.BDT_PER_USD) : 120;
};

// Last four characters only, so the admin can recognise a key without it ever leaving the server
const hint = (value) => (value.length > 8 ? `••••${value.slice(-4)}` : '••••');

/** What the admin panel shows: switches, modes and which credentials are set (never their values). */
const adminView = () => {
  const view = { bdtPerUsd: bdtPerUsd(), bdtPerUsdSource: Number(cache?.bdtPerUsd) > 0 ? 'admin' : 'env' };
  for (const gateway of GATEWAYS) {
    view[gateway] = { enabled: isGatewayEnabled(gateway) };
    if (!CREDENTIALS[gateway]) continue;
    view[gateway].credentials = Object.fromEntries(Object.entries(CREDENTIALS[gateway]).map(([field, envName]) => {
      const saved = savedCredential(gateway, field);
      const value = saved || process.env[envName] || '';
      return [field, { set: Boolean(value), source: saved ? 'admin' : (value ? 'env' : ''), hint: value ? hint(value) : '', envName }];
    }));
  }
  view.bkash.mode = cache?.bkash?.mode || '';
  view.bkash.effectiveMode = bkashBaseUrl() === BKASH_URLS.live ? 'live' : (bkashBaseUrl() === BKASH_URLS.sandbox ? 'sandbox' : 'custom');
  view.card.testMode = credential('card', 'secretKey').startsWith('sk_test_');
  view.canStoreCredentials = canStoreCredentials();
  view.updatedAt = cache?.updatedAt || null;
  view.updatedByName = cache?.updatedByName || '';
  return view;
};

// --------------------------------------------------------------- writing ---
/**
 * Apply a partial update. For each credential: a non-empty string replaces it, null clears it
 * (back to the env value), and a missing key leaves it unchanged.
 */
const update = async (changes, user) => {
  const doc = (await PaymentSettings.findOne({ key: 'default' })) || new PaymentSettings({ key: 'default' });
  for (const gateway of GATEWAYS) {
    const patch = changes[gateway];
    if (!patch) continue;
    if (typeof patch.enabled === 'boolean') doc.set(`${gateway}.enabled`, patch.enabled);
    if (gateway === 'bkash' && patch.mode !== undefined) doc.set('bkash.mode', patch.mode || '');
    if (!CREDENTIALS[gateway] || !patch.credentials) continue;
    for (const field of Object.keys(CREDENTIALS[gateway])) {
      const value = patch.credentials[field];
      if (value === null) doc.set(`${gateway}.credentials.${field}`, '');
      else if (typeof value === 'string' && value.trim()) doc.set(`${gateway}.credentials.${field}`, encrypt(value.trim()));
    }
  }
  if (changes.bdtPerUsd !== undefined) doc.bdtPerUsd = Number(changes.bdtPerUsd) > 0 ? Number(changes.bdtPerUsd) : null;
  doc.updatedBy = user?._id;
  doc.updatedByName = user?.name || '';
  await doc.save();
  await load();
  return adminView();
};

module.exports = {
  BKASH_URLS,
  CREDENTIALS,
  load,
  credential,
  isGatewayEnabled,
  bkashBaseUrl,
  bdtPerUsd,
  canStoreCredentials,
  adminView,
  update,
  encrypt,
  decrypt,
};
