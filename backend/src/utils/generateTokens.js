const jwt = require('jsonwebtoken');

const getRequiredSecret = (name) => {
  const secret = process.env[name];
  if (!secret || secret.length < 32) {
    throw new Error(`${name} must be configured with at least 32 characters`);
  }
  return secret;
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id || user._id, role: user.role, email: user.email, v: user.tokenVersion || 0 },
    getRequiredSecret('JWT_SECRET'),
    { expiresIn: '15m' }
  );
};

// Refresh tokens are issued by services/refreshSessions.js (server-side, rotated, revocable)
module.exports = {
  generateAccessToken,
  getRequiredSecret,
};
