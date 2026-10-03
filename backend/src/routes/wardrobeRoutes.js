const express = require('express');
const mongoose = require('mongoose');
const Wardrobe = require('../models/Wardrobe');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

const challengeRules = {
  summer_casual: { layers: ['top', 'pants'], budget: 150, badge: 'summer_beach', points: 50 },
  office_formal: { layers: ['jacket'], budget: 350, badge: 'office_elite', points: 100 },
  streetwear_hype: { layers: ['pants', 'shoes'], budget: 400, badge: 'hype_beast', points: 80 },
};

router.get('/', async (req, res, next) => {
  try {
    const data = await Wardrobe.findOneAndUpdate({ user: req.user.id }, { $setOnInsert: { user: req.user.id } }, { upsert: true, new: true });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/', async (req, res, next) => {
  try {
    const { avatar, wornItems, savedAvatars } = req.body;
    if (!avatar || typeof avatar !== 'object' || Array.isArray(avatar) ||
        !wornItems || typeof wornItems !== 'object' || Array.isArray(wornItems) ||
        !Array.isArray(savedAvatars) || savedAvatars.length > 30) {
      return res.status(400).json({ success: false, message: 'Invalid wardrobe data.' });
    }
    const data = await Wardrobe.findOneAndUpdate(
      { user: req.user.id }, { $set: { avatar, wornItems, savedAvatars } }, { upsert: true, new: true, runValidators: true },
    );
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/challenges/:id/complete', async (req, res, next) => {
  try {
    const rule = challengeRules[req.params.id];
    if (!rule) return res.status(404).json({ success: false, message: 'Challenge not found.' });
    const selected = req.body.wornItems;
    if (!selected || typeof selected !== 'object' || Array.isArray(selected)) {
      return res.status(400).json({ success: false, message: 'Choose an outfit first.' });
    }
    const ids = Object.values(selected).map((item) => item?.id).filter((id) => mongoose.isValidObjectId(id));
    if (!ids.length) return res.status(400).json({ success: false, message: 'Choose an outfit first.' });
    const products = await Product.find({ _id: { $in: ids }, active: true, status: 'published', visibility: 'public' });
    if (products.length !== ids.length) return res.status(400).json({ success: false, message: 'Some outfit pieces are unavailable.' });
    const layers = products.map((product) => String(product.specifications?.get('Layer') || '').toLowerCase());
    const required = rule.layers.every((layer) => layers.includes(layer) || (layers.includes('dress') && ['top', 'pants'].includes(layer)));
    const total = products.reduce((sum, product) => sum + product.price * (1 - (product.discountPercentage || 0) / 100), 0);
    if (!required || total > rule.budget) return res.status(400).json({ success: false, message: 'The outfit does not meet this challenge’s layers or budget.' });
    await Wardrobe.updateOne({ user: req.user.id }, { $setOnInsert: { user: req.user.id } }, { upsert: true });
    const data = await Wardrobe.findOneAndUpdate(
      { user: req.user.id, completedChallenges: { $ne: req.params.id } },
      { $inc: { points: rule.points }, $addToSet: { unlockedBadges: rule.badge, completedChallenges: req.params.id } },
      { upsert: false, new: true },
    );
    if (!data) return res.status(409).json({ success: false, message: 'Challenge already completed. Refresh your wardrobe.' });
    res.json({ success: true, data: { points: data.points, unlockedBadges: data.unlockedBadges } });
  } catch (error) { next(error); }
});

module.exports = router;
