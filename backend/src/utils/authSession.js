const crypto = require('crypto');
const AuthChallenge = require('../models/AuthChallenge');
const { generateAccessToken, generateRefreshToken } = require('./generateTokens');
const { sendSuccess } = require('./response');

const cookieOptions = (rememberMe = false) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  path: '/',
  ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}),
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
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  res.cookie(challengeCookie(purpose), secret, { ...cookieOptions(), maxAge: 10 * 60 * 1000 });
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

const sendSession = (res, user, rememberMe, message = 'Logged in successfully') => {
  res.set('Cache-Control', 'no-store');
  res.cookie('refreshToken', generateRefreshToken(user, rememberMe), cookieOptions(rememberMe));
  return sendSuccess(res, message, { user: publicUser(user), accessToken: generateAccessToken(user) });
};

const requestSecondFactor = async (req, res, user, rememberMe) => {
  await createChallenge(req, res, 'two-factor', { user: user._id, rememberMe });
  res.set('Cache-Control', 'no-store');
  return sendSuccess(res, '2FA code required to login', { require2FA: true, userId: user.id });
};

module.exports = { cookieOptions, publicUser, sendSession, createChallenge, clearChallenge, challengeQuery, requestSecondFactor };
