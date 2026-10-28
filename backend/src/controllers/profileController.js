// The signed-in user's own profile and saved addresses.
const User = require('../models/User');
const { generateAccessToken } = require('../utils/generateTokens');
const { issueRefreshToken } = require('../services/refreshSessions');
const { sendSuccess, sendError } = require('../utils/response');
const jwt = require('jsonwebtoken');
const { cookieOptions } = require('../utils/authSession');
const { validateAddress, cleanAddress } = require('../utils/address');
const DEFAULT_COUNTRY = process.env.DEFAULT_COUNTRY || 'Bangladesh';

// 422 with per-field messages when an address is incomplete or obviously fake
const rejectInvalidAddress = (res, address) => {
  const errors = validateAddress(address);
  if (!Object.keys(errors).length) return false;
  sendError(res, Object.values(errors)[0], 422, errors);
  return true;
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, 'User profile retrieved successfully', { user: { ...user.toJSON(), hasPassword: Boolean(user.password) } });
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

    const passwordUser = await User.findById(req.user.id).select('+password');
    const hasPassword = Boolean(passwordUser && passwordUser.password);

    if (req.body.email && req.body.email !== user.email) {
      if (hasPassword && !(await passwordUser.matchPassword(req.body.currentPassword))) {
        return sendError(res, 'Enter your current password to change your email address', 401);
      }
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return sendError(res, 'Email already in use', 400);
      }
      user.email = req.body.email;
    }

    let passwordChanged = false;
    if (req.body.password) {
      // Google-only accounts have no password yet, so they can set one without a current password.
      if (hasPassword) {
        if (!req.body.currentPassword) {
          return sendError(res, 'Current password is required to set a new password', 400);
        }
        if (!(await passwordUser.matchPassword(req.body.currentPassword))) {
          return sendError(res, 'Current password is incorrect', 401);
        }
      }
      user.password = req.body.password;
      passwordChanged = true;
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

      // The profile form sends all four fields blank when no address was entered: leave addresses alone
      const allBlank = ['address', 'city', 'state', 'zipCode'].every((k) => !String(req.body[k] ?? '').trim());
      if (allBlank) {
        // nothing to change
      } else if (defaultAddress) {
        const merged = cleanAddress({
          street: req.body.address !== undefined ? req.body.address : defaultAddress.street,
          city: req.body.city !== undefined ? req.body.city : defaultAddress.city,
          state: req.body.state !== undefined ? req.body.state : defaultAddress.state,
          zipCode: req.body.zipCode !== undefined ? req.body.zipCode : defaultAddress.zipCode,
          country: req.body.country !== undefined ? req.body.country : defaultAddress.country,
        });
        if (rejectInvalidAddress(res, merged)) return;
        Object.assign(defaultAddress, merged);
      } else if (req.body.address && req.body.city && req.body.state && req.body.zipCode) {
        const fresh = cleanAddress({
          street: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zipCode: req.body.zipCode,
          country: req.body.country || DEFAULT_COUNTRY,
        });
        if (rejectInvalidAddress(res, fresh)) return;
        user.addresses.push({ ...fresh, isDefault: true });
      }
    }

    const updatedUser = await user.save();

    // A new password signs out other devices; this one gets fresh tokens to stay signed in
    let accessToken;
    if (passwordChanged) {
      const remember = Boolean(jwt.decode(req.cookies?.refreshToken || '')?.rm);
      res.cookie('refreshToken', await issueRefreshToken(updatedUser, remember, req), cookieOptions(remember));
      accessToken = generateAccessToken(updatedUser);
    }

    return sendSuccess(res, 'User profile updated successfully', {
      ...(accessToken ? { accessToken } : {}),
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        addresses: updatedUser.addresses,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        googleConnected: Boolean(updatedUser.googleId),
        hasPassword: hasPassword || Boolean(req.body.password)
      }
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
    const fresh = cleanAddress({ street, city, state, zipCode, country: country || DEFAULT_COUNTRY });
    if (rejectInvalidAddress(res, fresh)) return;

    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      ...fresh,
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

    // Only re-check the fields when they change (e.g. "set as default" sends just isDefault)
    const touched = [street, city, state, zipCode, country].some((v) => v !== undefined);
    const merged = cleanAddress({
      street: street !== undefined ? street : address.street,
      city: city !== undefined ? city : address.city,
      state: state !== undefined ? state : address.state,
      zipCode: zipCode !== undefined ? zipCode : address.zipCode,
      country: country !== undefined ? country : address.country,
    });
    if (touched && rejectInvalidAddress(res, merged)) return;

    if (isDefault && !address.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    Object.assign(address, merged);
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
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
};
