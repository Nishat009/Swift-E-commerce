const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { productRules } = require('../validations/productValidation');

router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', protect, authorize('admin'), productRules, validate, createProduct);
router.put('/:id', protect, authorize('admin'), productRules, validate, updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
