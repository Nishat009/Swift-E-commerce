// One-click demo sign-in for reviewers ("Guest login" / "Admin login" buttons).
// Off unless DEMO_LOGIN_ENABLED=true. DEMO_LOGIN_ROLES limits which buttons work
// (default "customer,admin"). Anyone who can open the site can use these accounts,
// so never point them at real customer data or a real admin account.
const crypto = require('crypto');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');
const { sendSession } = require('../utils/authSession');

const DEMO_ACCOUNTS = {
  customer: () => ({ email: (process.env.DEMO_CUSTOMER_EMAIL || 'guest@swiftcart.demo').toLowerCase(), name: 'Guest Shopper', role: 'customer' }),
  admin: () => ({ email: (process.env.DEMO_ADMIN_EMAIL || 'admin@swiftcart.demo').toLowerCase(), name: 'Demo Admin', role: 'admin' }),
};

const enabledRoles = () => {
  if (String(process.env.DEMO_LOGIN_ENABLED).toLowerCase() !== 'true') return [];
  return String(process.env.DEMO_LOGIN_ROLES || 'customer,admin')
    .split(',').map((r) => r.trim()).filter((r) => DEMO_ACCOUNTS[r]);
};

// @desc    Which demo buttons the login page should show
// @route   GET /api/auth/demo-login
// @access  Public
const getDemoLoginStatus = (req, res) => sendSuccess(res, 'Demo login status', { roles: enabledRoles() });

// @desc    Sign in to the shared demo customer or demo admin account
// @route   POST /api/auth/demo-login   body: { role: 'customer' | 'admin' }
// @access  Public (only when enabled)
const demoLogin = async (req, res, next) => {
  try {
    const role = typeof req.body.role === 'string' ? req.body.role : '';
    if (!enabledRoles().includes(role)) {
      return sendError(res, 'Demo login is not available.', 404);
    }
    const account = DEMO_ACCOUNTS[role]();

    let user = await User.findOne({ email: account.email });
    if (!user) {
      // Random password: the demo account is only reachable through this button
      user = await User.create({ ...account, password: crypto.randomBytes(24).toString('hex') });
    }
    if (user.role !== account.role) {
      return sendError(res, 'The demo account is misconfigured. Check DEMO_CUSTOMER_EMAIL / DEMO_ADMIN_EMAIL.', 409);
    }
    if (user.twoFactorEnabled) {
      return sendError(res, 'Two-factor authentication is on for the demo account. Sign in with the form instead.', 409);
    }
    return sendSession(res, user, false, role === 'admin' ? 'Signed in as the demo admin' : 'Signed in as a guest shopper');
  } catch (error) {
    next(error);
  }
};

// The shared demo accounts, so admin actions can't lock everyone else out of them
const isDemoAccount = (user) => Boolean(user) && Object.values(DEMO_ACCOUNTS).some((a) => a().email === String(user.email).toLowerCase());

// Blocks a request made by one of the shared demo accounts (user management, 2FA setup)
const blockDemoAdmin = (req, res, next) => {
  if (isDemoAccount(req.user)) {
    return sendError(res, 'This action is disabled for demo accounts.', 403);
  }
  next();
};

module.exports = { getDemoLoginStatus, demoLogin, enabledRoles, isDemoAccount, blockDemoAdmin };
