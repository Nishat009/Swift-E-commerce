// Accounts and passwords shared by the seed scripts, so no fixed password ships with the code.
// SEED_PASSWORD (8+ characters, in backend/.env) sets the password of the admin and customer
// accounts. Without it each run picks a random one and prints it once.
const crypto = require('crypto');

const ADMIN_EMAIL = 'admin@email.com';
const CUSTOMER_EMAIL = 'user@email.com';

let generated = '';

const seedPassword = () => {
  const fromEnv = process.env.SEED_PASSWORD || '';
  if (fromEnv) {
    if (fromEnv.length < 8) throw new Error('SEED_PASSWORD must be at least 8 characters.');
    return fromEnv;
  }
  if (!generated) generated = crypto.randomBytes(12).toString('base64url');
  return generated;
};

// For filler accounts nobody signs in to (sample customers, simulated buyers)
const randomPassword = () => crypto.randomBytes(24).toString('hex');

// What to print after seeding: never echo a password that came from .env
const passwordHint = () => (process.env.SEED_PASSWORD
  ? 'the SEED_PASSWORD from backend/.env'
  : `"${seedPassword()}" (random; set SEED_PASSWORD in backend/.env to choose your own)`);

module.exports = { ADMIN_EMAIL, CUSTOMER_EMAIL, seedPassword, randomPassword, passwordHint };
