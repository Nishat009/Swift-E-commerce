const jwt = require('jsonwebtoken');

const getRequiredSecret = (name) => {
  const secret = process.env[name];
  if (!secret || secret.length < 32) {
    throw new Error(`${name} must be configured with at least 32 characters`);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`${name} must be configured with at least 32 characters in production`);
    }
    return `dev_fallback_secret_for_${name}_at_least_32_characters_long`;
  }
  return secret;
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id || user._id, role: user.role, email: user.email },
    getRequiredSecret('JWT_SECRET'),
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id || user._id },
    getRequiredSecret('JWT_REFRESH_SECRET'),
    { expiresIn: '7d' }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  getRequiredSecret,
};
