// Sign-in security settings shared by the auth controllers.

// FR-2.6: after LOGIN_MAX_FAILURES wrong passwords in a row the account is locked briefly.
const LOGIN_MAX_FAILURES = 3;
const LOGIN_LOCK_MS = 30 * 1000;

// Local testing only: return login and reset codes in the API response instead of needing email.
const devCodesAllowed = () => process.env.ALLOW_DEV_AUTH_CODES === 'true' && process.env.NODE_ENV !== 'production';

module.exports = { LOGIN_MAX_FAILURES, LOGIN_LOCK_MS, devCodesAllowed };
