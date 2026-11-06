// Demo-login settings in one place: which shared demo accounts exist, which of them are switched on,
// and whether their shared password may be shown. Read from the environment on every call, so the
// tests (and an operator restarting with new values) see changes without a code edit.
//
// DEMO_LOGIN_ENABLED=true   turns the one-click demo buttons on (off by default).
// DEMO_LOGIN_ROLES          limits which buttons work (default "customer,admin").
// DEMO_ALLOW_ADMIN=true     is also required before the demo ADMIN button works. It is ignored when
//                           NODE_ENV=production, so a production build never hands out a public admin session.
// DEMO_PASSWORD             (optional, 8+ characters) lets the demo accounts sign in with the normal form too.

const DEMO_ACCOUNT_DEFAULTS = {
  customer: { email: 'guest@swiftcart.demo', name: 'Guest Shopper', role: 'customer', emailVar: 'DEMO_CUSTOMER_EMAIL' },
  admin: { email: 'admin@swiftcart.demo', name: 'Demo Admin', role: 'admin', emailVar: 'DEMO_ADMIN_EMAIL' },
};

const DEMO_ROLES = Object.keys(DEMO_ACCOUNT_DEFAULTS);

const isProduction = () => process.env.NODE_ENV === 'production';

// The account for a demo role, with the email override from the environment applied
const demoAccount = (role) => {
  const { email, name, emailVar } = DEMO_ACCOUNT_DEFAULTS[role];
  return { email: (process.env[emailVar] || email).toLowerCase(), name, role };
};

const adminDemoAllowed = () => String(process.env.DEMO_ALLOW_ADMIN).toLowerCase() === 'true' && !isProduction();

const enabledRoles = () => {
  if (String(process.env.DEMO_LOGIN_ENABLED).toLowerCase() !== 'true') return [];
  const roles = String(process.env.DEMO_LOGIN_ROLES || 'customer,admin')
    .split(',').map((r) => r.trim()).filter((r) => DEMO_ACCOUNT_DEFAULTS[r]);
  return adminDemoAllowed() ? roles : roles.filter((r) => r !== 'admin');
};

const demoPassword = () => ((process.env.DEMO_PASSWORD || '').length >= 8 ? process.env.DEMO_PASSWORD : '');

// The shared password is only ever returned by the public status endpoint outside production
const showDemoCredentials = () => !isProduction() && Boolean(demoPassword());

module.exports = { DEMO_ROLES, demoAccount, enabledRoles, demoPassword, showDemoCredentials, isProduction };
