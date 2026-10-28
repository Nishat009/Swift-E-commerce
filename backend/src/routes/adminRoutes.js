const express = require('express');
const { customerEmailLimiter } = require('../config/rateLimits');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserCart,
  getUserWishlist
} = require('../controllers/adminController');
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, requireSuperAdmin } = require('../middleware/roleMiddleware');
const { getWallet, exportStatement, adjustWallet } = require('../controllers/walletController');
const { blockDemoAdmin } = require('../controllers/demoAuthController');
const { getInsights } = require('../controllers/insightController');
const { sendCustomerEmail, listCustomerEmails } = require('../controllers/customerEmailController');
const { getPaymentSettings, updatePaymentSettings, testPaymentGateway } = require('../controllers/paymentSettingsController');
const { paymentSettingsRules } = require('../validations/paymentSettingsValidation');
const { validate } = require('../middleware/validationMiddleware');
const { generateCopyDraft } = require('../controllers/copyDraftController');
const { copyDraftRules } = require('../validations/productValidation');

// Secure all admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/insights', getInsights);
router.post('/copy-draft', copyDraftRules, validate, generateCopyDraft);
router.get('/users', getAllUsers);
// The shared demo admin can look around (with customer contact details masked, see demoPrivacy.js)
// but not change accounts, read or send customer emails, export statements or call gateways
router.put('/users/:id/role', blockDemoAdmin, updateUserRole);
router.delete('/users/:id', blockDemoAdmin, deleteUser);
router.get('/users/:id/cart', getUserCart);
router.get('/users/:id/wishlist', getUserWishlist);
router.get('/users/:id/emails', blockDemoAdmin, listCustomerEmails);
router.post('/users/:id/email', blockDemoAdmin, customerEmailLimiter, sendCustomerEmail);

// Store wallet (account statement); only a super admin can add or withdraw funds by hand
router.get('/wallet', getWallet);
router.get('/wallet/statement.csv', blockDemoAdmin, exportStatement);
router.post('/wallet/adjust', requireSuperAdmin, adjustWallet);

// Payment gateways: any admin can view and test; only a super admin can change switches or keys
router.get('/payment-settings', getPaymentSettings);
router.put('/payment-settings', requireSuperAdmin, paymentSettingsRules, validate, updatePaymentSettings);
router.post('/payment-settings/test/:method', blockDemoAdmin, testPaymentGateway);

// Admin orders management routes
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', blockDemoAdmin, updateOrderStatus);

module.exports = router;
