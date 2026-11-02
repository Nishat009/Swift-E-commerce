// Sign-in security settings shared by the auth controllers.

// FR-2.6: after LOGIN_MAX_FAILURES wrong passwords in a row the account is locked briefly.
const LOGIN_MAX_FAILURES = 3;
const LOGIN_LOCK_MS = 30 * 1000;

// Lifetime of a pending 2FA / Google sign-in challenge, and of a "remember me" session cookie.
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const REMEMBER_ME_MS = 7 * 24 * 60 * 60 * 1000;

// Wrong email-code (OTP) guesses allowed before a new code must be requested.
const OTP_MAX_ATTEMPTS = 5;

// Local testing only: return login and reset codes in the API response instead of needing email.
const devCodesAllowed = () => process.env.ALLOW_DEV_AUTH_CODES === 'true' && process.env.NODE_ENV !== 'production';

module.exports = { LOGIN_MAX_FAILURES, LOGIN_LOCK_MS, CHALLENGE_TTL_MS, REMEMBER_ME_MS, OTP_MAX_ATTEMPTS, devCodesAllowed };
