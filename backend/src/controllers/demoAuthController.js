// One-click demo sign-in for reviewers ("Guest login" / "Admin login" buttons).
// Which accounts exist and which are switched on is decided in config/demo.js (see the
// DEMO_* variables there). Anyone who can open the site can use these accounts,
// so never point them at real customer data or a real admin account.
// Without DEMO_PASSWORD the demo accounts get a random, unusable password.
const crypto = require('crypto');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');
const { sendSession } = require('../utils/authSession');
const { DEMO_ROLES, demoAccount, demoPolicy } = require('../config/demo');

// Finds or creates a demo account, keeping its password equal to DEMO_PASSWORD when that is set
const findOrCreateDemoUser = async (role) => {
  const account = demoAccount(role);
  const { password } = demoPolicy();
  const user = await User.findOne({ email: account.email }).select('+password');
  if (!user) {
    return User.create({ ...account, password: password || crypto.randomBytes(24).toString('hex') });
  }
  if (password && user.role === account.role && !(user.password && await user.matchPassword(password))) {
    user.password = password;
    await user.save();
  }
  return user;
};

// Creates the enabled demo accounts at startup so the shared credentials work before anyone clicks a button.
// Never in production: there an account is only created by a demo-login click, when demo login is on.
const ensureDemoAccounts = async () => {
  const policy = demoPolicy();
  if (policy.production) return;
  if (policy.adminEnabled) {
    console.warn('[security] WARNING: the public demo ADMIN login is enabled (DEMO_LOGIN_ENABLED=true, DEMO_ALLOW_ADMIN=true). Anyone can sign in as admin; never enable it on a shop with real data.');
  }
  if (!policy.password) return;
  for (const role of policy.roles) await findOrCreateDemoUser(role);
};

// @desc    Which demo buttons the login page should show, plus the shared credentials when
//          DEMO_PASSWORD is set (never in production)
// @route   GET /api/auth/demo-login
// @access  Public
const getDemoLoginStatus = (req, res) => {
  const { roles, password, showCredentials } = demoPolicy();
  const credentials = showCredentials ? roles.map((role) => ({ role, email: demoAccount(role).email, password })) : [];
  return sendSuccess(res, 'Demo login status', { roles, credentials });
};

// @desc    Sign in to the shared demo customer or demo admin account
// @route   POST /api/auth/demo-login   body: { role: 'customer' | 'admin' }
// @access  Public (only when enabled)
const demoLogin = async (req, res, next) => {
  try {
    const role = typeof req.body.role === 'string' ? req.body.role : '';
    if (!demoPolicy().roles.includes(role)) {
      return sendError(res, 'Demo login is not available.', 404);
    }
    const account = demoAccount(role);
    const user = await findOrCreateDemoUser(role);
    if (user.role !== account.role) {
      return sendError(res, 'The demo account is misconfigured. Check DEMO_CUSTOMER_EMAIL / DEMO_ADMIN_EMAIL.', 409);
    }
    if (user.twoFactorEnabled) {
      return sendError(res, 'Two-factor authentication is on for the demo account. Sign in with the form instead.', 409);
    }
    return await sendSession(res, user, false, role === 'admin' ? 'Signed in as the demo admin' : 'Signed in as a guest shopper');
  } catch (error) {
    next(error);
  }
};

// The shared demo accounts, so admin actions can't lock everyone else out of them
const isDemoAccount = (user) => Boolean(user) && DEMO_ROLES.some((role) => demoAccount(role).email === String(user.email).toLowerCase());

// Blocks a request made by one of the shared demo accounts (user management, 2FA setup)
const blockDemoAdmin = (req, res, next) => {
  if (isDemoAccount(req.user)) {
    return sendError(res, 'This action is disabled for demo accounts.', 403);
  }
  next();
};

module.exports = { getDemoLoginStatus, demoLogin, ensureDemoAccounts, isDemoAccount, blockDemoAdmin };
