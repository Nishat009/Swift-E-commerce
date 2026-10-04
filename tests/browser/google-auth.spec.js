const { test, expect } = require('@playwright/test');

// Browser tests substitute GIS and API responses. Real token verification, routes,
// cookies and persistence are covered separately by backend/tests/google-auth.test.js.
const user = { id: 'google-browser-user', name: 'Google Browser User', email: 'browser@gmail.com', role: 'customer', googleConnected: true };

for (const twoFactor of [false, true]) {
  test(`Google login preserves the return page (2FA: ${twoFactor})`, async ({ page }) => {
    await installAuthFixtures(page, { twoFactor });
    await page.goto('/auth/login?redirect=%2Fsettings');
    await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
    if (twoFactor) {
      await page.getByLabel('Enter your authenticator or recovery code').fill('123456');
      await page.getByRole('button', { name: 'Verify and sign in' }).click();
    }
    await expect(page).toHaveURL(/\/settings$/);
  });
}

async function installAuthFixtures(page, options = {}) {
  const state = { googleRequests: [], secondFactorRequests: [], refreshRequests: 0, cartWrites: 0, loggedIn: false, profileExpired: false, linked: false, ...options };
  await page.route('https://accounts.google.com/gsi/client', route => route.fulfill({
    contentType: 'application/javascript',
    body: `(() => {
      let config;
      window.google = { accounts: { id: {
        initialize(value) { config = value; },
        renderButton(element, options) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = options.text === 'signup_with' ? 'Sign up with Google' : options.text === 'continue_with' ? 'Continue with Google' : 'Sign in with Google';
          button.onclick = () => config.callback({ credential: 'browser-token:' + config.nonce });
          element.appendChild(button);
        },
        cancel() {}, disableAutoSelect() {}
      }}};
    })();`,
  }));
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api/, '');
    const body = request.method() === 'POST' ? request.postDataJSON() || {} : {};
    let data = [];
    let status = 200;
    let message = 'OK';
    if (path === '/auth/google/challenge') {
      if (state.unconfigured) { status = 503; message = 'Google sign-in is not available yet. Please use email sign-in.'; }
      else data = { clientId: 'browser.apps.googleusercontent.com', nonce: 'browser-nonce' };
    } else if (path === '/auth/google') {
      state.googleRequests.push(body);
      if (state.rejectGoogle) { status = 401; message = 'Google could not verify your sign-in. Please try again.'; }
      else if (state.twoFactor) data = { require2FA: true, userId: user.id };
      else { state.loggedIn = true; data = { user, accessToken: 'browser-access' }; }
    } else if (path === '/auth/verify-2fa') {
      state.secondFactorRequests.push(body);
      if (body.code !== '123456') { status = 400; message = 'Invalid verification code or recovery code'; }
      else { state.loggedIn = true; data = { user, accessToken: 'browser-access' }; }
    } else if (path === '/auth/profile') {
      if (state.profileExpired) { state.profileExpired = false; status = 401; message = 'Token expired'; }
      else if (state.loggedIn) data = { user: { ...user, googleConnected: state.linkMode ? state.linked : true } };
      else { status = 401; message = 'Not authenticated'; }
    } else if (path === '/auth/refresh') {
      state.refreshRequests++;
      data = { accessToken: 'browser-refreshed-access' };
    } else if (path === '/auth/logout') {
      state.loggedIn = false;
      data = {};
    } else if (path === '/auth/google/link') {
      expect(request.headers().authorization).toBe('Bearer browser-access');
      state.linked = true;
      data = { user };
    } else if (path === '/cart' || path === '/cart/merge') {
      if (request.method() === 'POST') state.cartWrites++;
      data = { products: [] };
    } else if (path === '/currencies') {
      data = [{ code: 'USD', symbol: '$', rate: 1, isDefault: true }];
    } else if (path === '/languages') {
      data = [{ code: 'en', name: 'English', isDefault: true, isActive: true }];
    } else if (path === '/notifications/unread-count') data = { count: 0 };
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: status === 200, data, message }) });
  });
  return state;
}

test('Google login saves session, syncs guest cart, restores/refreshes on reload, and logs out', async ({ page }) => {
  const state = await installAuthFixtures(page);
  await page.goto('/auth/login');
  await page.evaluate(() => localStorage.setItem('cart-storage', JSON.stringify({ state: { items: [{ product: { id: 'guest-product', name: 'Guest product', price: 10 }, quantity: 1 }] }, version: 0 })));
  await page.reload();
  await page.getByLabel('Remember me', { exact: false }).check();
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Welcome back, Google Browser User!' })).toBeVisible();
  expect(state.googleRequests[0]).toEqual({ credential: 'browser-token:browser-nonce', rememberMe: true });
  expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBe('browser-access');
  expect(await page.evaluate(() => localStorage.getItem('rememberMe'))).toBe('true');
  expect(state.cartWrites).toBe(1);
  state.profileExpired = true;
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome back, Google Browser User!' })).toBeVisible();
  expect(state.refreshRequests).toBe(1);
  await page.getByRole('button', { name: 'Logout', exact: true }).first().click();
  await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeNull();
});

test('Google signup requires terms acceptance and creates session without password fields', async ({ page }) => {
  const state = await installAuthFixtures(page);
  await page.goto('/auth/register');
  const button = page.getByRole('button', { name: 'Sign up with Google', exact: true, includeHidden: true });
  await expect(button).toBeAttached();
  await expect(page.locator('[inert]').filter({ has: button })).toHaveCount(1);
  await page.locator('#agreeTerms').check();
  await page.getByRole('button', { name: 'Sign up with Google', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(state.googleRequests).toHaveLength(1);
});

test('Google login waits for 2FA, displays invalid-code error, and completes verification', async ({ page }) => {
  const state = await installAuthFixtures(page, { twoFactor: true });
  await page.goto('/auth/login');
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
  await expect(page.getByLabel('Enter your authenticator or recovery code')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeNull();
  await page.getByLabel('Enter your authenticator or recovery code').fill('000000');
  await page.getByRole('button', { name: 'Verify and sign in' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Invalid verification code');
  await page.getByLabel('Enter your authenticator or recovery code').fill('123456');
  await page.getByRole('button', { name: 'Verify and sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(state.secondFactorRequests).toHaveLength(2);
});

test('failed Google verification displays error and retry obtains a new usable button', async ({ page }) => {
  const state = await installAuthFixtures(page, { rejectGoogle: true });
  await page.goto('/auth/login');
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Google could not verify');
  expect(state.refreshRequests).toBe(0);
  state.rejectGoogle = false;
  await page.getByRole('button', { name: 'Try Google again' }).click();
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('missing Google configuration leaves email login available', async ({ page }) => {
  await installAuthFixtures(page, { unconfigured: true });
  await page.goto('/auth/login');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Google sign-in is not available yet');
  await expect(page.locator('input[type="email"]')).toBeEditable();
  await expect(page.locator('input[type="password"]')).toBeEditable();
});

test('signed-in existing account can connect Google from settings', async ({ page }) => {
  const state = await installAuthFixtures(page, { loggedIn: true, linkMode: true });
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'browser-access');
    localStorage.setItem('rememberMe', 'true');
    sessionStorage.setItem('session_active', 'true');
  });
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Continue with Google', exact: true }).click();
  await expect(page.getByText('Google is connected. You can sign in using your Google account.')).toBeVisible();
  expect(state.linked).toBe(true);
});
