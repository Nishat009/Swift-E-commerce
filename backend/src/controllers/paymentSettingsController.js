const { sendSuccess, sendError } = require('../utils/response');
const { logActivity } = require('../utils/activityLog');
const settings = require('../services/paymentSettings');
const payments = require('../services/paymentService');
const { isSuperAdmin } = require('../middleware/roleMiddleware');

const GATEWAY_LABELS = { cod: 'Cash on delivery', bkash: 'bKash', card: 'Card (Stripe)' };

// @desc    Payment gateway settings (switches, modes, which credentials are set) and what checkout offers
// @route   GET /api/admin/payment-settings
// @access  Private/Admin
const getPaymentSettings = (req, res) =>
  sendSuccess(res, 'Payment settings retrieved', {
    ...settings.adminView(),
    available: payments.getEnabledMethods(),
    mock: payments.isMockMode(),
    canEdit: isSuperAdmin(req.user),
  });

// @desc    Update payment gateway settings
// @route   PUT /api/admin/payment-settings
// @access  Private/Super admin
const updatePaymentSettings = async (req, res, next) => {
  try {
    const changes = req.body || {};
    // At least one way to pay must stay switched on after the change
    const stillOn = ['cod', 'bkash', 'card'].some((gateway) =>
      typeof changes[gateway]?.enabled === 'boolean' ? changes[gateway].enabled : settings.isGatewayEnabled(gateway));
    if (!stillOn) return sendError(res, 'Keep at least one payment method switched on.', 400);

    const view = await settings.update(changes, req.user);
    payments.resetGatewayCache();

    const touched = Object.keys(GATEWAY_LABELS).filter((gateway) => changes[gateway]).map((gateway) => GATEWAY_LABELS[gateway]);
    if (changes.bdtPerUsd !== undefined) touched.push('Taka rate');
    // Never log credential values, only which gateways changed
    await logActivity(req, 'Payment Settings Updated', `Updated ${touched.join(', ') || 'payment settings'}`, 'system');

    return sendSuccess(res, 'Payment settings saved', {
      ...view,
      available: payments.getEnabledMethods(),
      mock: payments.isMockMode(),
      canEdit: true,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check a gateway's credentials with a harmless authenticated call
// @route   POST /api/admin/payment-settings/test/:method
// @access  Private/Admin
const testPaymentGateway = async (req, res) => {
  try {
    const message = await payments.testGatewayConnection(req.params.method);
    return sendSuccess(res, message, { ok: true });
  } catch (error) {
    return sendError(res, `Connection failed: ${error.message}`, 400);
  }
};

module.exports = { getPaymentSettings, updatePaymentSettings, testPaymentGateway };
