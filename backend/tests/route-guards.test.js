// Every route that creates, changes or deletes data is checked against an explicit policy:
//   - PUBLIC: deliberately open (sign-in, contact form, newsletter, chat, back-in-stock, webhook),
//     each one rate-limited or signature-checked;
//   - SIGNED_IN: needs `protect` (the controller then checks the record belongs to the caller);
//   - everything else: needs `protect` AND `authorize('admin')`.
// A new mutating route that is not listed here fails this test until someone decides its guard.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

process.env.JWT_SECRET ||= 'route-guard-test-secret-0123456789abcdef';
process.env.JWT_REFRESH_SECRET ||= 'route-guard-test-refresh-0123456789abcdef';
const { protect } = require('../src/middleware/authMiddleware');

const PUBLIC = new Set([
  'auth POST /google/challenge', 'auth POST /google', 'auth POST /demo-login', 'auth POST /register',
  'auth POST /login', 'auth POST /logout', 'auth POST /refresh', 'auth POST /forgot-password',
  'auth POST /reset-password', 'auth POST /verify-2fa', 'auth POST /request-otp', 'auth POST /verify-otp',
  'chat POST /', 'contact POST /', 'newsletter POST /subscribe', 'product POST /:id/notify-me',
  'payment POST /stripe/webhook',
]);

// Whole routers that act only on the caller's own data
const SIGNED_IN_ROUTERS = new Set(['cart', 'wishlist', 'wardrobe', 'review', 'notification']);
const SIGNED_IN = new Set([
  'auth POST /google/link', 'auth PUT /profile', 'auth POST /2fa/setup', 'auth POST /2fa/enable',
  'auth POST /2fa/disable', 'auth POST /2fa/recovery-codes', 'auth POST /addresses',
  'auth PUT /addresses/:addressId', 'auth DELETE /addresses/:addressId',
  'campaign POST /:id/buy',
  'order POST /quote', 'order POST /', 'order PUT /:id/cancel', 'order POST /:id/return-request',
  'order POST /:id/return-request/respond',
  'payment POST /orders/:orderId/initiate',
]);

// "cartRoutes.js" -> "cart", "imageAssetRoutes.js" -> "imageAsset"
const routerName = (file) => file.replace(/Routes\.js$/, '');

const mutatingRoutes = () => {
  const routes = [];
  const dir = path.join(__dirname, '..', 'src', 'routes');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const router = require(path.join(dir, file));
    let routerProtect = false;
    let routerRoles = [];
    for (const layer of router.stack) {
      if (!layer.route) {
        // router.use(...) applies to every route declared after it
        if (layer.handle === protect) routerProtect = true;
        if (layer.handle.roles) routerRoles = layer.handle.roles;
        continue;
      }
      const handles = layer.route.stack.map((s) => s.handle);
      for (const method of Object.keys(layer.route.methods).filter((m) => !['get', 'head', '_all'].includes(m))) {
        routes.push({
          name: routerName(file),
          key: `${routerName(file)} ${method.toUpperCase()} ${layer.route.path}`,
          protect: routerProtect || handles.includes(protect),
          roles: [...routerRoles, ...handles.flatMap((h) => h.roles || [])],
        });
      }
    }
  }
  return routes;
};

test('every mutating route has the guard its policy requires', () => {
  const routes = mutatingRoutes();
  assert.ok(routes.length > 80, `found ${routes.length} mutating routes`);
  const problems = [];
  for (const route of routes) {
    if (PUBLIC.has(route.key)) {
      if (route.protect) problems.push(`${route.key} is listed as public but uses protect: update the list`);
      continue;
    }
    if (!route.protect) problems.push(`${route.key} has no protect`);
    const signedInOnly = SIGNED_IN.has(route.key) || SIGNED_IN_ROUTERS.has(route.name);
    if (!signedInOnly && !(route.roles.length === 1 && route.roles[0] === 'admin')) {
      problems.push(`${route.key} needs authorize('admin') (has: ${route.roles.join(',') || 'none'})`);
    }
  }
  assert.deepEqual(problems, []);
});

test('the public and signed-in lists only name routes that exist', () => {
  const keys = new Set(mutatingRoutes().map((r) => r.key));
  const stale = [...PUBLIC, ...SIGNED_IN].filter((key) => !keys.has(key));
  assert.deepEqual(stale, []);
});
