const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getWardrobe, saveWardrobe, completeChallenge } = require('../controllers/wardrobeController');

const router = express.Router();
router.use(protect);

router.get('/', getWardrobe);

router.put('/', saveWardrobe);

router.post('/challenges/:id/complete', completeChallenge);

module.exports = router;
