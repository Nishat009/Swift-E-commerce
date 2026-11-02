const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getRecommendations } = require('../controllers/recommendationController');

const router = express.Router();
router.get('/', protect, getRecommendations);

module.exports = router;
