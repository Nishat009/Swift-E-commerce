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
      accessToken,
      refreshToken
    }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get tokens
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { email, password, rememberMe } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Auto-promote admin@email.com to admin role (useful for live environments where seed script wasn't run)
    if (user.email === 'admin@email.com' && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
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
    // Only set maxAge when "Remember Me" is checked; otherwise use a session cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };
    if (rememberMe) {
      cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    }
    res.cookie('refreshToken', refreshToken, cookieOptions);

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
      accessToken,
      refreshToken
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
      if (req.body.currentPassword) {
        const isMatch = await user.matchPassword(req.body.currentPassword);
        if (!isMatch) {
          return sendError(res, 'Current password is incorrect', 400);
        }
      }
      user.password = req.body.password;
    }

    // Address updates
    if (
      req.body.address !== undefined ||
      req.body.city !== undefined ||
      req.body.state !== undefined ||
      req.body.zipCode !== undefined
    ) {
      let defaultAddress = user.addresses.find(addr => addr.isDefault);
      if (!defaultAddress && user.addresses.length > 0) {
        defaultAddress = user.addresses[0];
      }

      if (defaultAddress) {
        defaultAddress.street = req.body.address !== undefined ? req.body.address : defaultAddress.street;
        defaultAddress.city = req.body.city !== undefined ? req.body.city : defaultAddress.city;
        defaultAddress.state = req.body.state !== undefined ? req.body.state : defaultAddress.state;
        defaultAddress.zipCode = req.body.zipCode !== undefined ? req.body.zipCode : defaultAddress.zipCode;
        if (req.body.country !== undefined) {
          defaultAddress.country = req.body.country;
        }
      } else {
        user.addresses.push({
          street: req.body.address || '',
          city: req.body.city || '',
          state: req.body.state || '',
          zipCode: req.body.zipCode || '',
          country: req.body.country || 'United States',
          isDefault: true
        });
      }
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
        addresses: updatedUser.addresses,
        twoFactorEnabled: updatedUser.twoFactorEnabled
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
  const token = req.cookies.refreshToken || req.body.refreshToken;

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
    const newRefreshToken = generateRefreshToken(user);

    // Update cookie with the refreshed token too
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    };
    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    return sendSuccess(res, 'Access token refreshed successfully', { accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    return sendError(res, 'Invalid or expired refresh token', 401);
  }
};

// @desc    Forgot password request (Generates OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return sendError(res, 'No user found with that email address', 404);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    console.log(`[PASSWORD RESET] Reset code for ${email}: ${otp}`);

    return sendSuccess(res, `Password reset instructions sent. (Test code: ${otp})`, {
      testOtp: otp
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using verified OTP code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  try {
    if (!email || !otp || !newPassword) {
      return sendError(res, 'Email, reset code, and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
      return sendError(res, 'Invalid or incorrect reset code', 400);
    }

    if (Date.now() > user.resetPasswordExpires) {
      return sendError(res, 'Reset code has expired. Please request a new one', 400);
    }

    user.password = newPassword;
    user.resetPasswordOtp = '';
    user.resetPasswordExpires = null;
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

    const otpauthUrl = `otpauth://totp/SwiftCart:${encodeURIComponent(user.email)}?secret=${secret}&issuer=SwiftCart&algorithm=SHA1&digits=6&period=30`;

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
  const { userId, code, rememberMe } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Auto-promote admin@email.com to admin role
    if (user.email === 'admin@email.com' && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
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

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };
    if (rememberMe) {
      cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000;
    }
    res.cookie('refreshToken', refreshToken, cookieOptions);

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
      refreshToken,
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
  const { email, otp, rememberMe } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Auto-promote admin@email.com to admin role
    if (user.email === 'admin@email.com' && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
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

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };
    if (rememberMe) {
      cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000;
    }
    res.cookie('refreshToken', refreshToken, cookieOptions);

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
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new user address
// @route   POST /api/auth/addresses
// @access  Private
const addAddress = async (req, res, next) => {
  const { street, city, state, zipCode, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      street,
      city,
      state,
      zipCode,
      country: country || 'United States',
      isDefault: user.addresses.length === 0 ? true : !!isDefault
    });

    const updatedUser = await user.save();
    return sendSuccess(res, 'Address added successfully', { addresses: updatedUser.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a specific user address
// @route   PUT /api/auth/addresses/:addressId
// @access  Private
const updateAddress = async (req, res, next) => {
  const { addressId } = req.params;
  const { street, city, state, zipCode, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);

    const address = user.addresses.id(addressId);
    if (!address) return sendError(res, 'Address not found', 404);

    if (isDefault && !address.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    address.street = street !== undefined ? street : address.street;
    address.city = city !== undefined ? city : address.city;
    address.state = state !== undefined ? state : address.state;
    address.zipCode = zipCode !== undefined ? zipCode : address.zipCode;
    address.country = country !== undefined ? country : address.country;
    address.isDefault = isDefault !== undefined ? !!isDefault : address.isDefault;

    const updatedUser = await user.save();
    return sendSuccess(res, 'Address updated successfully', { addresses: updatedUser.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a specific user address
// @route   DELETE /api/auth/addresses/:addressId
// @access  Private
const deleteAddress = async (req, res, next) => {
  const { addressId } = req.params;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);

    const address = user.addresses.id(addressId);
    if (!address) return sendError(res, 'Address not found', 404);

    const wasDefault = address.isDefault;
    user.addresses.pull({ _id: addressId });

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    const updatedUser = await user.save();
    return sendSuccess(res, 'Address deleted successfully', { addresses: updatedUser.addresses });
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
  addAddress,
  updateAddress,
  deleteAddress,
};
