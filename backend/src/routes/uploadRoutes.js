const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadToCloudinary } = require('../services/cloudinaryService');

const router = express.Router();

// @desc    Upload a single image (admin). Uses Cloudinary when configured, else local /uploads
// @route   POST /api/uploads   (multipart field name: "image")
// @access  Private/Admin
router.post('/', protect, authorize('admin'), (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Choose an image to upload.' });
    }
    const uploaded = await uploadToCloudinary(req.file, 'swiftcart/products');
    const origin = (process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const url = uploaded.startsWith('/') ? `${origin}${uploaded}` : uploaded;
    res.status(201).json({ success: true, message: 'Image uploaded', data: { url } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
