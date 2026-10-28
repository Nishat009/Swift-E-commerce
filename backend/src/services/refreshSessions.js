// Server-side refresh sessions behind the httpOnly refresh cookie.
//
// The cookie is a signed JWT naming a RefreshSession (sid) plus a random one-time secret (jti).
// Only the secret's SHA-256 is stored. Each refresh rotates the secret; logout revokes the session.
// A cookie with a valid signature but an old secret means it was copied and replayed, so every
// session of that user is revoked and their access tokens stop working too (tokenVersion).
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const RefreshSession = require('../models/RefreshSession');
const User = require('../models/User');
const { getRequiredSecret } = require('../utils/generateTokens');

const SESSION_DAYS = 7;
// Two tabs can refresh with the same cookie at the same moment; the loser still gets through
const ROTATION_GRACE_MS = 60 * 1000;

const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const newSecret = () => crypto.randomBytes(32).toString('hex');

const sign = (user, session, secret) => jwt.sign(
  { id: String(user._id || user.id), sid: String(session._id), jti: secret, v: user.tokenVersion || 0, rm: session.rememberMe },
  getRequiredSecret('JWT_REFRESH_SECRET'),
  { expiresIn: `${SESSION_DAYS}d` }
);

const verify = (token) => {
  try {
    const decoded = jwt.verify(String(token || ''), getRequiredSecret('JWT_REFRESH_SECRET'));
    return decoded.sid && decoded.jti && mongoose.isValidObjectId(decoded.sid) ? decoded : null;
  } catch {
    return null;
  }
};

/** Start a session for a sign-in; returns the refresh token for the cookie. */
const issueRefreshToken = async (user, rememberMe = false, req = null) => {
  const secret = newSecret();
  const session = await RefreshSession.create({
    user: user._id || user.id,
    tokenHash: hash(secret),
    rememberMe: Boolean(rememberMe),
    userAgent: String(req?.headers?.['user-agent'] || '').slice(0, 200),
    expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
  });
  return sign(user, session, secret);
};

/** End every session of a user; with bumpTokenVersion their access tokens stop working as well. */
const revokeAllSessions = async (userId, reason, { bumpTokenVersion = false } = {}) => {
  await RefreshSession.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date(), revokedReason: reason });
  if (bumpTokenVersion) await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
};

/**
 * Exchange a refresh token for a new one. Returns { user, token, rememberMe }, or null when the
 * token is invalid, expired, revoked or replayed (the caller answers 401).
 */
const rotateRefreshToken = async (token) => {
  const decoded = verify(token);
  if (!decoded) return null;
  const user = await User.findById(decoded.id);
  // Unknown user, or the password changed after this session started
  if (!user || (decoded.v || 0) !== (user.tokenVersion || 0)) return null;

  const presented = hash(decoded.jti);
  const secret = newSecret();
  const live = { _id: decoded.sid, user: user._id, revokedAt: null, expiresAt: { $gt: new Date() } };
  const rotate = { $set: { tokenHash: hash(secret), previousTokenHash: presented, rotatedAt: new Date() } };

  // Only the holder of the current secret can rotate (atomic, so a race cannot rotate twice)
  let session = await RefreshSession.findOneAndUpdate({ ...live, tokenHash: presented }, rotate, { new: true });
  if (!session) {
    // The secret that was just replaced, within the grace window: a second tab, not an attacker
    session = await RefreshSession.findOneAndUpdate(
      { ...live, previousTokenHash: presented, rotatedAt: { $gt: new Date(Date.now() - ROTATION_GRACE_MS) } },
      { $set: { tokenHash: hash(secret), rotatedAt: new Date() } },
      { new: true }
    );
  }
  if (!session) {
    // A correctly signed cookie for a session that has moved on or was revoked: it was replayed
    if (await RefreshSession.exists({ _id: decoded.sid, user: user._id })) {
      await revokeAllSessions(user._id, 'reuse detected', { bumpTokenVersion: true });
    }
    return null;
  }
  return { user, token: sign(user, session, secret), rememberMe: session.rememberMe };
};

/** Logout: revoke the session named by this refresh token (an invalid token is ignored). */
const revokeRefreshToken = async (token) => {
  const decoded = verify(token);
  if (!decoded) return;
  await RefreshSession.updateOne({ _id: decoded.sid, revokedAt: null }, { revokedAt: new Date(), revokedReason: 'logout' });
};

module.exports = { issueRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllSessions };
