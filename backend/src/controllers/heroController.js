const { uploadToCloudinary } = require('../services/cloudinaryService');
const HeroSlide = require('../models/HeroSlide');

const keys = ['atelier', 'runway', 'editorial'];

const getHeroSlides = async (req, res, next) => {
  try {
    const slides = await HeroSlide.find({ key: { $in: keys } }).select('key image -_id');
    res.json({ success: true, slides });
  } catch (error) { next(error); }
};

// Runs before the upload, so an unknown slide never stores a file
const requireValidSlideKey = (req, res, next) => {
  if (!keys.includes(req.params.key)) return res.status(400).json({ success: false, message: 'Invalid slide.' });
  next();
};

const uploadHeroSlide = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Choose an image to upload.' });
    const uploaded = await uploadToCloudinary(req.file, 'swiftcart/hero');
    const origin = `${req.protocol}://${req.get('host')}`;
    const image = uploaded.startsWith('/') ? `${origin}${uploaded}` : uploaded;
    await HeroSlide.findOneAndUpdate({ key: req.params.key }, { image }, { upsert: true, new: true });
    res.json({ success: true, key: req.params.key, image });
  } catch (error) { next(error); }
};

module.exports = { getHeroSlides, requireValidSlideKey, uploadHeroSlide };
