const crypto = require('crypto');
const AuthChallenge = require('../models/AuthChallenge');
const { generateAccessToken } = require('./generateTokens');
const { issueRefreshToken } = require('../services/refreshSessions');
const { sendSuccess, sendError } = require('./response');
const { CHALLENGE_TTL_MS, REMEMBER_ME_MS } = require('../config/security');

const allowedOrigins = () => (process.env.FRONTEND_URL || 'http://localhost:3001')
  .split(',').map((value) => value.trim().replace(/\/$/, ''));

// CSRF guard for cookie-authenticated mutating routes (refresh, logout): the refresh cookie is
// sent cross-site, so a forged <form> POST from another origin must be rejected. Non-browser
// clients that pass the token in the body (no cookie set) are unaffected and skip this check.
const requireOriginForCookieAuth = (req, res, next) => {
  if (!req.cookies?.refreshToken) return next();
  if (!req.get('origin') || !allowedOrigins().includes(req.get('origin'))) {
    return sendError(res, 'This request must come from the SwiftCart website.', 403);
  }
  next();
};

const cookieOptions = (rememberMe = false) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  path: '/',
  ...(rememberMe ? { maxAge: REMEMBER_ME_MS } : {}),
});

const challengeCookie = (purpose) => purpose === 'google' ? 'googleChallenge' : 'twoFactorChallenge';
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const challengeQuery = (req, purpose) => {
  const secret = req.cookies?.[challengeCookie(purpose)];
  return {
    digest: digest(typeof secret === 'string' ? secret : ''),
    purpose,
    expiresAt: { $gt: new Date() },
  };
};

const createChallenge = async (req, res, purpose, data = {}) => {
  await AuthChallenge.deleteOne(challengeQuery(req, purpose));
  const secret = crypto.randomBytes(32).toString('hex');
  await AuthChallenge.create({
    ...data,
    purpose,
    digest: digest(secret),
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
  });
  res.cookie(challengeCookie(purpose), secret, { ...cookieOptions(), maxAge: CHALLENGE_TTL_MS });
};

const clearChallenge = (res, purpose) => res.clearCookie(challengeCookie(purpose), cookieOptions());

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  role: user.role,
  addresses: user.addresses,
  twoFactorEnabled: user.twoFactorEnabled,
  googleConnected: Boolean(user.googleId),
});

// System log for a sign-in: an activity entry, and the request trail learns who it was
const noteSignIn = (res, user, message) => {
  res.locals.sessionUser = user;
  require('./activityLog').logActivity({ user, ip: res.req?.ip }, 'Signed In', `${user.email}: ${message}`, 'auth');
};

const sendSession = async (res, user, rememberMe, message = 'Logged in successfully', statusCode = 200) => {
  const refreshToken = await issueRefreshToken(user, rememberMe, res.req);
  res.set('Cache-Control', 'no-store');
  noteSignIn(res, user, message);
  res.cookie('refreshToken', refreshToken, cookieOptions(rememberMe));
  return sendSuccess(res, message, { user: publicUser(user), accessToken: generateAccessToken(user) }, statusCode);
};

const requestSecondFactor = async (req, res, user, rememberMe) => {
  await createChallenge(req, res, 'two-factor', { user: user._id, rememberMe });
  res.set('Cache-Control', 'no-store');
  return sendSuccess(res, '2FA code required to login', { require2FA: true, userId: user.id });
};

module.exports = { noteSignIn, cookieOptions, publicUser, sendSession, createChallenge, clearChallenge, challengeQuery, requestSecondFactor, requireOriginForCookieAuth };
