const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getHeroSlides, requireValidSlideKey, uploadHeroSlide } = require('../controllers/heroController');

const router = express.Router();

router.get('/', getHeroSlides);
router.post('/:key', protect, authorize('admin'), requireValidSlideKey, upload.single('image'), uploadHeroSlide);

module.exports = router;
