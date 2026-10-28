// Every route that creates, changes or deletes data is checked against the policy in
// src/config/routePolicy.js:
//   - PUBLIC: deliberately open (sign-in, contact form, newsletter, chat, back-in-stock, webhook),
//     each one rate-limited or signature-checked;
//   - SIGNED_IN: needs `protect` (the controller then checks the record belongs to the caller);
//   - everything else: needs `protect` AND `authorize('admin')`.
// A new mutating route that is not in the policy fails here until someone decides its guard.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { collectMutatingRoutes, securityDocWithTable, SECURITY_MD } = require('../scripts/routeReport');
const { PUBLIC, SIGNED_IN } = require('../src/config/routePolicy');

test('every mutating route has the guard its policy requires', () => {
  const routes = collectMutatingRoutes();
  assert.ok(routes.length > 80, `found ${routes.length} mutating routes`);
  const problems = [];
  for (const route of routes) {
    if (route.access === 'public') {
      if (route.protect) problems.push(`${route.key} is listed as public but uses protect: update the policy`);
      continue;
    }
    if (!route.protect) problems.push(`${route.key} has no protect`);
    if (route.access === 'admin' && !(route.roles.length === 1 && route.roles[0] === 'admin')) {
      problems.push(`${route.key} needs authorize('admin') (has: ${route.roles.join(',') || 'none'})`);
    }
  }
  assert.deepEqual(problems, []);
});

test('the public and signed-in lists only name routes that exist', () => {
  const keys = new Set(collectMutatingRoutes().map((r) => r.key));
  const stale = [...Object.keys(PUBLIC), ...SIGNED_IN].filter((key) => !keys.has(key));
  assert.deepEqual(stale, []);
});

test('every route is mounted and found in its source file', () => {
  const lost = collectMutatingRoutes().filter((r) => r.url.startsWith('?') || r.line < 1).map((r) => r.key);
  assert.deepEqual(lost, []);
});

test('the route table in SECURITY.md matches the code (run: npm --prefix backend run routes:doc)', () => {
  const doc = fs.readFileSync(SECURITY_MD, 'utf8').replace(/\r\n/g, '\n');
  assert.equal(doc, securityDocWithTable(doc));
});
