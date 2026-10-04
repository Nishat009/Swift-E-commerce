const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const HeroSlide = require('../models/HeroSlide');

const router = express.Router();
const keys = ['atelier', 'runway', 'editorial'];

router.get('/', async (req, res, next) => {
  try {
    const slides = await HeroSlide.find({ key: { $in: keys } }).select('key image -_id');
    res.json({ success: true, slides });
  } catch (error) { next(error); }
});

router.post('/:key', protect, authorize('admin'), (req, res, next) => {
  if (!keys.includes(req.params.key)) return res.status(400).json({ success: false, message: 'Invalid slide.' });
  next();
}, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Choose an image to upload.' });
    const uploaded = await uploadToCloudinary(req.file, 'swiftcart/hero');
    const origin = `${req.protocol}://${req.get('host')}`;
    const image = uploaded.startsWith('/') ? `${origin}${uploaded}` : uploaded;
    await HeroSlide.findOneAndUpdate({ key: req.params.key }, { image }, { upsert: true, new: true });
    res.json({ success: true, key: req.params.key, image });
  } catch (error) { next(error); }
});

module.exports = router;
