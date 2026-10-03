const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const uploadDir = path.join(__dirname, '../../uploads');

router.post('/', protect, authorize('admin'), upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file || !/^image\/(jpeg|png|webp)$/.test(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Upload a JPG, PNG or WebP image up to 5 MB.' });
    }
    const metadata = await sharp(req.file.buffer).metadata();
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > 40_000_000) {
      return res.status(400).json({ success: false, message: 'Image dimensions are invalid or too large.' });
    }
    await fs.mkdir(uploadDir, { recursive: true });
    const id = crypto.randomUUID();
    const variants = {
      ecommerceClean: { width: 1000, height: 1000, fit: 'contain', background: '#f8f7f4' },
      lifestyle: { width: 1200, height: 1500, fit: 'cover', position: 'attention' },
      socialBanner: { width: 1200, height: 628, fit: 'cover', position: 'attention' },
      thumbnail: { width: 400, height: 400, fit: 'cover', position: 'attention' },
    };
    const base = `${req.protocol}://${req.get('host')}/uploads/`;
    const output = {};
    for (const [name, resize] of Object.entries(variants)) {
      const filename = `asset-${id}-${name}.webp`;
      await sharp(req.file.buffer).rotate().resize(resize).webp({ quality: 85 }).toFile(path.join(uploadDir, filename));
      output[name] = base + filename;
    }
    res.status(201).json({ success: true, data: output });
  } catch (error) { next(error); }
});

module.exports = router;
