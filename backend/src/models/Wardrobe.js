const mongoose = require('mongoose');

const WardrobeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  avatar: { type: mongoose.Schema.Types.Mixed, default: {} },
  wornItems: { type: mongoose.Schema.Types.Mixed, default: {} },
  savedAvatars: { type: [mongoose.Schema.Types.Mixed], default: [] },
  points: { type: Number, default: 100 },
  unlockedBadges: { type: [String], default: ['first_avatar'] },
  completedChallenges: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Wardrobe', WardrobeSchema);
