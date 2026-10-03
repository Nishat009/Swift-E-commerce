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

// rememberMe is kept in the token so a refresh keeps the same cookie lifetime
const generateRefreshToken = (user, rememberMe = false) => {
  return jwt.sign(
    { id: user.id || user._id, v: user.tokenVersion || 0, rm: Boolean(rememberMe) },
    getRequiredSecret('JWT_REFRESH_SECRET'),
    { expiresIn: '7d' }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  getRequiredSecret,
};
