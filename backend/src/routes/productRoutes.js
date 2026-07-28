const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  duplicateProduct,
  bulkActionProducts,
  deleteProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', protect, authorize('admin'), createProduct);
router.post('/bulk', protect, authorize('admin'), bulkActionProducts);
router.post('/:id/duplicate', protect, authorize('admin'), duplicateProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
