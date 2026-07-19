const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const { sendSuccess, sendError } = require('../utils/response');
const jwt = require('jsonwebtoken');
const { generateSecret, verifyTOTP, generateRecoveryCodes } = require('../utils/totp');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User already exists', 400);
    }

    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return sendSuccess(res, 'User registered successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        twoFactorEnabled: false
      },
      accessToken
    }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get tokens
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return sendSuccess(res, '2FA code required to login', {
        require2FA: true,
        userId: user.id
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, 'User logged in successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  return sendSuccess(res, 'Logged out successfully');
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, 'User profile retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;

    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return sendError(res, 'Email already in use', 400);
      }
      user.email = req.body.email;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    return sendSuccess(res, 'User profile updated successfully', {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return sendError(res, 'No refresh token provided', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkey987654!@#');
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 'Invalid refresh token', 401);
    }

    const accessToken = generateAccessToken(user);
    return sendSuccess(res, 'Access token refreshed successfully', { accessToken });
  } catch (error) {
    return sendError(res, 'Invalid or expired refresh token', 401);
  }
};

// @desc    Forgot password request
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'No user found with that email address', 404);
    }
    // Simulate email send
    return sendSuccess(res, 'Reset password instructions sent to your email.');
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 'Password reset successful. Please login with your new password.');
  } catch (error) {
    next(error);
  }
};

// @desc    Setup 2FA for user
// @route   POST /api/auth/2fa/setup
// @access  Private
const setup2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const secret = generateSecret();
    user.twoFactorSecret = secret;
    await user.save();

    const otpauthUrl = `otpauth://totp/SwiftCart:${user.email}?secret=${secret}&issuer=SwiftCart`;

    return sendSuccess(res, '2FA setup initiated', {
      secret,
      otpauthUrl
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify and enable 2FA
// @route   POST /api/auth/2fa/enable
// @access  Private
const verifyAndEnable2FA = async (req, res, next) => {
  const { code } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const isValid = verifyTOTP(code, user.twoFactorSecret);
    if (!isValid) {
      return sendError(res, 'Invalid verification code', 400);
    }

    user.twoFactorEnabled = true;
    const recoveryCodes = generateRecoveryCodes(8, 8);
    user.twoFactorRecoveryCodes = recoveryCodes;
    await user.save();

    return sendSuccess(res, 'Two-Factor Authentication enabled successfully', {
      recoveryCodes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
const disable2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = '';
    user.twoFactorRecoveryCodes = [];
    await user.save();

    return sendSuccess(res, 'Two-Factor Authentication disabled successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 2FA TOTP or Recovery Code
// @route   POST /api/auth/verify-2fa
// @access  Public
const verify2FA = async (req, res, next) => {
  const { userId, code } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    let isVerified = false;
    let isRecoveryUsed = false;

    if (/^\d{6}$/.test(code)) {
      isVerified = verifyTOTP(code, user.twoFactorSecret);
    }

    if (!isVerified) {
      const cleanCode = code.toUpperCase().trim();
      const codeIndex = user.twoFactorRecoveryCodes.indexOf(cleanCode);
      if (codeIndex !== -1) {
        isVerified = true;
        isRecoveryUsed = true;
        user.twoFactorRecoveryCodes.splice(codeIndex, 1);
        await user.save();
      }
    }

    if (!isVerified) {
      return sendError(res, 'Invalid verification code or recovery code', 400);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, 'Logged in successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled
      },
      accessToken,
      recoveryUsed: isRecoveryUsed
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request login OTP code
// @route   POST /api/auth/request-otp
// @access  Public
const requestOTP = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'User not found with this email', 404);
    }

    if (user.role !== 'customer') {
      return sendError(res, 'OTP Login is only available for customers', 403);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    console.log(`[EMAIL OTP] Generated OTP for customer email ${email}: ${otp}`);

    return sendSuccess(res, `OTP sent successfully. (Test mode code is: ${otp})`, {
      testOtp: otp
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify login OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (!user.otpCode || user.otpCode !== otp.trim()) {
      return sendError(res, 'Invalid OTP code', 400);
    }

    if (Date.now() > user.otpExpires) {
      return sendError(res, 'OTP code expired. Please request a new one', 400);
    }

    user.otpCode = '';
    user.otpExpires = null;
    await user.save();

    if (user.twoFactorEnabled) {
      return sendSuccess(res, '2FA code required to login', {
        require2FA: true,
        userId: user.id
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, 'Logged in successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  refreshToken,
  forgotPassword,
  resetPassword,
  setup2FA,
  verifyAndEnable2FA,
  disable2FA,
  verify2FA,
  requestOTP,
  verifyOTP,
};
