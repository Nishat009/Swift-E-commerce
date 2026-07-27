const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Language code is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Language name is required'],
      trim: true,
    },
    flag: {
      type: String,
      required: [true, 'Language flag is required'],
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Before saving, if isDefault is true, set all other languages' isDefault to false
languageSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { isDefault: false });
  }
  next();
});

const Language = mongoose.model('Language', languageSchema);

module.exports = Language;
