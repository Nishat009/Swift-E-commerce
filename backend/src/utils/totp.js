const crypto = require('crypto');

/**
 * Decodes a base32 string into a binary buffer.
 * @param {string} base32 - Base32 encoded string.
 * @returns {Buffer} - Decoded binary buffer.
 */
function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.replace(/=+$/, '').toUpperCase().replace(/\s/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) {
      throw new Error('Invalid base32 character');
    }
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Generates a random base32 secret.
 * @param {number} length - Length of secret bytes.
 * @returns {string} - Base32 encoded random secret key.
 */
function generateSecret(length = 20) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const randomBytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < randomBytes.length; i++) {
    secret += alphabet[randomBytes[i] % 32];
  }
  return secret;
}

/**
 * Generates a 6-digit TOTP code for a secret and counter.
 * @param {string} secret - Base32 encoded secret.
 * @param {number} counter - Time-step counter (floor of time / 30s).
 * @returns {string} - 6-digit code.
 */
function generateTOTP(secret, counter) {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(0, 0);
  buffer.writeUInt32BE(counter, 4);

  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code against a secret key, using a clock drift window.
 * @param {string} token - The user input code.
 * @param {string} secret - Base32 encoded secret.
 * @param {number} window - Drift window size (1 window = +/-30s).
 * @returns {boolean} - True if code is valid.
 */
function verifyTOTP(token, secret, window = 1) {
  if (!token || !secret) return false;
  const cleanToken = token.trim();
  if (cleanToken.length !== 6) return false;

  try {
    const counter = Math.floor(Date.now() / 30000);
    for (let i = -window; i <= window; i++) {
      if (generateTOTP(secret, counter + i) === cleanToken) {
        return true;
      }
    }
  } catch (error) {
    console.error('Error verifying TOTP:', error);
  }
  return false;
}

/**
 * Generates a set of temporary recovery codes.
 * @param {number} count - Amount of codes to generate.
 * @param {number} length - Character length of each code.
 * @returns {string[]} - Array of alphanumeric recovery codes.
 */
function generateRecoveryCodes(count = 8, length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: count }, () => {
    let code = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  });
}

module.exports = {
  generateSecret,
  verifyTOTP,
  generateRecoveryCodes,
};
