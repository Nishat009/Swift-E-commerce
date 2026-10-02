const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, enum: ['atelier', 'runway', 'editorial'] },
  image: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('HeroSlide', heroSlideSchema);
