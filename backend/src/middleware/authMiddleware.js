const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');
const { getRequiredSecret } = require('../utils/generateTokens');

const bearerToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
};

// Verifies an access token and loads its user. Throws when the token is invalid or expired.
// `stale` means the password changed after the token was issued.
const loadTokenUser = async (token) => {
  const decoded = jwt.verify(token, getRequiredSecret('JWT_SECRET'));
  const user = await User.findById(decoded.id);
  if (!user) return { user: null, stale: false };
  if ((decoded.v || 0) !== (user.tokenVersion || 0)) return { user: null, stale: true };
  return { user, stale: false };
};

const protect = async (req, res, next) => {
  const token = bearerToken(req);
  if (!token) {
    return sendError(res, 'Not authorized, no token provided', 401);
  }

  try {
    const { user, stale } = await loadTokenUser(token);
    if (stale) {
      return sendError(res, 'Session expired. Please sign in again.', 401, { expired: true });
    }
    if (!user) {
      return sendError(res, 'User no longer exists', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired', 401, { expired: true });
    }
    return sendError(res, 'Not authorized, token invalid', 401);
  }
};

// Attaches req.user when a valid Bearer token is sent; guests and expired tokens pass through.
const optionalAuth = async (req, res, next) => {
  try {
    const token = bearerToken(req);
    if (token) {
      const { user } = await loadTokenUser(token);
      if (user) req.user = user;
    }
  } catch {
    // Public routes must keep working for guests with a stale token.
  }
  next();
};

const isAdmin = (req) => req.user?.role === 'admin';

module.exports = { protect, optionalAuth, isAdmin };
