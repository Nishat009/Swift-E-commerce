const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');
const { getRequiredSecret } = require('../utils/generateTokens');

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Not authorized, no token provided', 401);
  }

  try {
    const decoded = jwt.verify(token, getRequiredSecret('JWT_SECRET'));
    
    // Attach user to request, excluding password
    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 'User no longer exists', 401);
    }
    // Password changed since this token was issued
    if ((decoded.v || 0) !== (user.tokenVersion || 0)) {
      return sendError(res, 'Session expired. Please sign in again.', 401, { expired: true });
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
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const decoded = jwt.verify(header.slice(7), getRequiredSecret('JWT_SECRET'));
      const user = await User.findById(decoded.id);
      if (user && (decoded.v || 0) === (user.tokenVersion || 0)) req.user = user;
    }
  } catch {
    // Public routes must keep working for guests with a stale token.
  }
  next();
};

const isAdmin = (req) => req.user?.role === 'admin';

module.exports = { protect, optionalAuth, isAdmin };
