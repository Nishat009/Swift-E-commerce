const express = require('express');
const router = express.Router();
const {
  getCoupons,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon
} = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { couponRules } = require('../validations/couponValidation');

// Validate/get coupon requires user authentication
router.get('/:code', protect, getCouponByCode);

// Admin CRUD operations
router.get('/', protect, authorize('admin'), getCoupons);
router.post('/', protect, authorize('admin'), couponRules, validate, createCoupon);
router.put('/:id', protect, authorize('admin'), couponRules, validate, updateCoupon);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);

module.exports = router;
