const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id || user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'supersecretjwtkey123456!@#',
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id || user._id },
    process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkey987654!@#',
    { expiresIn: '7d' }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
