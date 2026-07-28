const express = require('express');
const router = express.Router();
const {
  getLanguages,
  adminGetLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
} = require('../controllers/languageController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public listing
router.get('/', getLanguages);

// Secure admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/admin/all', adminGetLanguages);
router.post('/', createLanguage);
router.put('/:id', updateLanguage);
router.delete('/:id', deleteLanguage);

module.exports = router;
