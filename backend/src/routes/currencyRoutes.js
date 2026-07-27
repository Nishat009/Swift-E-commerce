const express = require('express');
const router = express.Router();
const {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
} = require('../controllers/currencyController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public route to get active currencies in frontend dropdown
router.get('/', getCurrencies);

// Admin-only management endpoints
router.post('/', protect, authorize('admin'), createCurrency);
router.put('/:id', protect, authorize('admin'), updateCurrency);
router.delete('/:id', protect, authorize('admin'), deleteCurrency);

module.exports = router;
