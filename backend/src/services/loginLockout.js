// Password sign-in lockout: after LOGIN_MAX_FAILURES wrong passwords the account is locked for
// LOGIN_LOCK_MS. The controller only asks these questions; the rules live here.
const User = require('../models/User');
const { LOGIN_MAX_FAILURES, LOGIN_LOCK_MS } = require('../config/security');

// Seconds left on the lock, or 0 when the account is not locked. The user must be loaded with +lockUntil.
const lockedForSeconds = (user) => {
  if (!user || !user.lockUntil || user.lockUntil <= new Date()) return 0;
  return Math.ceil((user.lockUntil - Date.now()) / 1000);
};

// One atomic update: count the failure and, on reaching the limit, set the lock and reset the
// counter in the same write, so concurrent failures can never leave a half-applied state.
const recordFailedLogin = (userId) => {
  const attempts = { $add: [{ $ifNull: ['$failedLoginAttempts', 0] }, 1] };
  const reachedLimit = { $gte: [attempts, LOGIN_MAX_FAILURES] };
  return User.updateOne({ _id: userId }, [{
    $set: {
      failedLoginAttempts: { $cond: [reachedLimit, 0, attempts] },
      lockUntil: { $cond: [reachedLimit, new Date(Date.now() + LOGIN_LOCK_MS), '$lockUntil'] },
    },
  }]);
};

// A correct password clears the counter and any expired lock
const clearFailedLogins = (userId) => User.updateOne({ _id: userId }, { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } });

module.exports = { lockedForSeconds, recordFailedLogin, clearFailedLogins };
