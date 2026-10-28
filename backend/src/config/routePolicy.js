// Who may call each route that creates, changes or deletes data. Read by
// tests/route-guards.test.js (which fails when a route breaks this policy) and by
// scripts/routeReport.js (which writes the route table in SECURITY.md).
//   PUBLIC     no sign-in, on purpose; each one is rate-limited or signature-checked
//   SIGNED_IN  `protect`; the controller checks that the record belongs to the caller
//   everything else needs `protect` AND `authorize('admin')`
// Keys are "<router> <METHOD> <path inside the router>", the router being the route file name
// without "Routes.js" (cartRoutes.js -> "cart").

const PUBLIC = {
  'auth POST /google/challenge': 'Google sign-in step 1 (sign-in rate limit, origin check)',
  'auth POST /google': 'Google sign-in (sign-in rate limit, origin and nonce check)',
  'auth POST /demo-login': 'One-click demo login, only when DEMO_LOGIN_ENABLED (sign-in rate limit)',
  'auth POST /register': 'Create an account (sign-in rate limit, validation)',
  'auth POST /login': 'Password sign-in (sign-in rate limit, account lock after 3 failures)',
  'auth POST /logout': 'Ends the caller\'s own session (session rate limit)',
  'auth POST /refresh': 'Rotates the caller\'s refresh session (session rate limit)',
  'auth POST /forgot-password': 'Emails a reset code (OTP rate limit; same answer for unknown emails)',
  'auth POST /reset-password': 'Reset with the emailed code (verify rate limit)',
  'auth POST /verify-2fa': 'Second sign-in step, needs the pending challenge cookie (verify rate limit)',
  'auth POST /request-otp': 'Emails a sign-in code (OTP rate limit)',
  'auth POST /verify-otp': 'Sign in with the emailed code (verify rate limit)',
  'chat POST /': 'Shopping assistant message (chat rate limit)',
  'contact POST /': 'Contact form (5 per hour per IP)',
  'newsletter POST /subscribe': 'Newsletter sign-up (rate-limited)',
  'product POST /:id/notify-me': 'Back-in-stock email alert (rate-limited)',
  'payment POST /stripe/webhook': 'Stripe webhook, accepted only with a valid Stripe-Signature',
};

// Whole routers that only act on the caller's own data
const SIGNED_IN_ROUTERS = ['cart', 'wishlist', 'wardrobe', 'review', 'notification'];

const SIGNED_IN = [
  'auth POST /google/link', 'auth PUT /profile', 'auth POST /2fa/setup', 'auth POST /2fa/enable',
  'auth POST /2fa/disable', 'auth POST /2fa/recovery-codes', 'auth POST /addresses',
  'auth PUT /addresses/:addressId', 'auth DELETE /addresses/:addressId',
  'campaign POST /:id/buy',
  'order POST /quote', 'order POST /', 'order PUT /:id/cancel', 'order POST /:id/return-request',
  'order POST /:id/return-request/respond',
  'payment POST /orders/:orderId/initiate',
];

/** 'public' | 'signed-in' | 'admin' for a route key and its router name. */
const requiredAccess = (key, routerName) => {
  if (PUBLIC[key]) return 'public';
  if (SIGNED_IN.includes(key) || SIGNED_IN_ROUTERS.includes(routerName)) return 'signed-in';
  return 'admin';
};

module.exports = { PUBLIC, SIGNED_IN, SIGNED_IN_ROUTERS, requiredAccess };
