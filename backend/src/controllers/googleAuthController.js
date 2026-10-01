const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const AuthChallenge = require('../models/AuthChallenge');
const { sendSuccess, sendError } = require('../utils/response');
const { createChallenge, clearChallenge, challengeQuery, sendSession, requestSecondFactor, publicUser } = require('../utils/authSession');

const googleClient = new OAuth2Client();

// GIS uses a JS callback, so we enforce our own origin + browser-bound nonce checks.
const requireGoogleOrigin = (req, res, next) => {
  const origins = (process.env.FRONTEND_URL || 'http://localhost:3001').split(',').map(value => value.trim().replace(/\/$/, ''));
  if (!req.get('origin') || !origins.includes(req.get('origin'))) {
    return sendError(res, 'Google sign-in must be started from this website.', 403);
  }
  res.set('Cache-Control', 'no-store');
  next();
};

const googleChallenge = async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId || !clientId.endsWith('.apps.googleusercontent.com')) {
      return sendError(res, 'Google sign-in is not available yet. Please use email sign-in.', 503);
    }
    const nonce = crypto.randomBytes(32).toString('hex');
    await createChallenge(req, res, 'google', { nonce });
    return sendSuccess(res, 'Google sign-in ready', { clientId, nonce });
  } catch (error) {
    next(error);
  }
};

const verifyGoogleCredential = async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId || !clientId.endsWith('.apps.googleusercontent.com')) {
      return sendError(res, 'Google sign-in is not available yet. Please use email sign-in.', 503);
    }
    if (typeof req.body.credential !== 'string' || req.body.credential.length > 10000 ||
        (req.body.rememberMe !== undefined && typeof req.body.rememberMe !== 'boolean')) {
      return sendError(res, 'A valid Google credential is required.', 400);
    }
    // Consume once, including failed attempts; a retry gets a fresh nonce.
    const challenge = await AuthChallenge.findOneAndDelete(challengeQuery(req, 'google'));
    clearChallenge(res, 'google');
    if (!challenge) return sendError(res, 'Google sign-in expired. Please try again.', 401);

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: clientId });
      payload = ticket.getPayload();
    } catch {
      return sendError(res, 'Google could not verify your sign-in. Please try again.', 401);
    }
    if (!payload || payload.nonce !== challenge.nonce || payload.email_verified !== true ||
        typeof payload.sub !== 'string' || !payload.sub ||
        typeof payload.email !== 'string' || !payload.email.includes('@')) {
      return sendError(res, 'A verified Google account and a fresh sign-in are required.', 401);
    }
    req.googleIdentity = {
      sub: payload.sub,
      email: payload.email.trim().toLowerCase(),
      name: typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : payload.email.split('@')[0],
      // Only store a provider-hosted HTTPS picture, never a client-supplied avatar.
      avatar: typeof payload.picture === 'string' && /^https:\/\/[^/]*googleusercontent\.com\//.test(payload.picture) ? payload.picture : undefined,
    };
    next();
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const identity = req.googleIdentity;
    let user = await User.findOne({ googleId: identity.sub });
    if (!user) {
      const existing = await User.findOne({ email: identity.email });
      if (existing) {
        return sendError(res, 'This email already has an account. Sign in with your existing method, then connect Google in Security Settings.', 409);
      }
      user = await User.create({
        name: identity.name,
        email: identity.email,
        googleId: identity.sub,
        avatar: identity.avatar,
        role: 'customer',
      });
    }
    if (user.twoFactorEnabled) return await requestSecondFactor(req, res, user, req.body.rememberMe === true);
    return sendSession(res, user, req.body.rememberMe === true, 'Signed in with Google');
  } catch (error) {
    if (error.code === 11000) return sendError(res, 'This account was just updated. Please try signing in again.', 409);
    next(error);
  }
};

const linkGoogle = async (req, res, next) => {
  try {
    const identity = req.googleIdentity;
    // Linking requires an authenticated session (including existing 2FA) and matching email.
    if (req.user.email.toLowerCase() !== identity.email) {
      return sendError(res, 'Choose the Google account with the same email as your SwiftCart account.', 409);
    }
    if (req.user.googleId && req.user.googleId !== identity.sub) {
      return sendError(res, 'A different Google account is already connected.', 409);
    }
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, $or: [{ googleId: { $exists: false } }, { googleId: identity.sub }] },
      { $set: { googleId: identity.sub } },
      { new: true, runValidators: true },
    );
    if (!user) return sendError(res, 'This account was just updated. Please reload and try again.', 409);
    return sendSuccess(res, 'Google account connected. You can now sign in with Google.', { user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return sendError(res, 'This Google account is already connected to another account.', 409);
    next(error);
  }
};

module.exports = { requireGoogleOrigin, googleChallenge, verifyGoogleCredential, googleLogin, linkGoogle };
