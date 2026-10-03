const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: function () { return !this.googleId; }, select: false },
    googleId: { type: String, unique: true, sparse: true },
    phone: { type: String, default: '' },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop' },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    addresses: [AddressSchema],
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: '', select: false },
    twoFactorRecoveryCodes: { type: [String], default: [], select: false },
    otpCode: { type: String, default: '', select: false },
    otpExpires: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    otpRequestedAt: { type: Date, select: false },
    passwordResetToken: { type: String, default: '', select: false },
    passwordResetExpires: { type: Date, select: false },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    // Bumped whenever the password changes, which signs out every existing session
    tokenVersion: { type: Number, default: 0 },
    lockUntil: { type: Date, select: false },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  if (!this.isNew) this.tokenVersion = (this.tokenVersion || 0) + 1;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || typeof enteredPassword !== 'string') return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Transform _id to id in JSON serialization
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    ret.googleConnected = Boolean(ret.googleId);
    delete ret.googleId;
    delete ret.twoFactorSecret;
    delete ret.twoFactorRecoveryCodes;
    delete ret.otpCode;
    delete ret.otpExpires;
    delete ret.otpAttempts;
    delete ret.otpRequestedAt;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.failedLoginAttempts;
    delete ret.lockUntil;
    delete ret.tokenVersion;
    return ret;
  }
});

module.exports = mongoose.model('User', UserSchema);
