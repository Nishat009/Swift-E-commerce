# Google sign-in setup

The login and registration pages use Google's official Google Identity Services button. The browser sends the ID token to Express, which verifies the Google signature, audience, issuer, expiry, verified email and a one-use browser-bound nonce. Express creates/reuses a MongoDB user and issues the same app access token and HttpOnly refresh cookie used by email login. No Google access/refresh tokens or client secret are needed or stored.

## One-time Google Cloud setup

The project owner's Google account must complete these steps; a working client ID cannot be generated locally.

1. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview) and select or create the project for SwiftCart.
2. Complete **Branding** with the app name `SwiftCart`, a support email and developer contact email belonging to the owner.
3. Under **Audience**, choose **External** for general customer accounts. If the app is in Testing, add the Google accounts you will use to **Test users**.
4. Under **Clients**, create an OAuth client with application type **Web application**, named `SwiftCart Local`.
5. Add **Authorized JavaScript origins**: `http://localhost:3001` and `http://localhost`. Use `localhost` consistently when opening the site. Do not add `/auth/login` or `/api` to an origin.
6. This implementation uses the GIS JavaScript popup callback. No authorized redirect URI is needed.
7. Copy the **Client ID** and run from the repository root:

   ```powershell
   npm.cmd run setup:google -- YOUR_CLIENT_ID.apps.googleusercontent.com
   ```

   This changes only Google configuration in `backend/.env`, preserving existing database and secret settings. The frontend gets the public client ID from the backend challenge endpoint, so there is no separate frontend client ID to keep in sync. Do not paste a client secret.

8. Ensure MongoDB is running and `backend/.env` has `MONGO_URI` and `FRONTEND_URL=http://localhost:3001`. Install dependencies with `npm.cmd install` and `npm.cmd --prefix backend install` if needed. Restart both services:

   ```powershell
   npm.cmd run dev
   ```

## Use the complete flow

- Open `http://localhost:3001/auth/login`, choose **Sign in with Google**, select your Google account and complete Google's prompt. New accounts are created as customers and sent to `/dashboard`; returning admins go to `/admin`.
- On `/auth/register`, accept the Terms & Conditions before using Google. No name/password fields need to be filled in for Google signup.
- If that email already belongs to a password/OTP account, sign in using that method first, open `/settings`, then connect the matching Google account. This deliberately requires proof of the existing account rather than silently merging accounts by email. It preserves the original user ID, orders, cart and role.
- Accounts with 2FA enabled must enter an authenticator or recovery code after Google verification. The first-factor challenge expires in ten minutes and allows five attempts. No app session is issued before 2FA passes.
- Remember Me controls persistence at sign-in. Guest cart items are synchronized after successful authentication. Reloading uses the existing app session; access-token expiry uses the existing refresh endpoint. Logout clears browser app credentials and refresh cookies; it does not sign the user out of their Google account.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/google/challenge` | Return public client ID + nonce; set HttpOnly browser challenge cookie |
| POST | `/api/auth/google` | Verify `{ credential, rememberMe }`; create/sign in customer or request 2FA |
| POST | `/api/auth/google/link` | Authenticated request with `{ credential }`; connect matching Google email |
| POST | `/api/auth/verify-2fa` | Complete Google/password/OTP first-factor challenge using `{ userId, code }` |
| POST | `/api/auth/refresh` | Refresh app access token using the HttpOnly refresh cookie |
| POST | `/api/auth/logout` | Clear app cookies and outstanding challenges |

Google endpoints require an `Origin` matching `FRONTEND_URL`, include credentials, and are rate limited. A missing client ID returns 503 with an email-login fallback message. The nonce cookie and its MongoDB record are consumed even if token validation fails; retry from the Google button to obtain a new challenge. MongoDB indexes enforce one account per Google subject and expire challenge records.

## Verification

```powershell
npm.cmd --prefix backend run test:auth
```

Tests use an isolated `swiftcart_google_test_*` MongoDB database and remove only that database afterward. Set `MONGO_TEST_URI` to a test MongoDB server if the default `mongodb://127.0.0.1:27017` is unavailable. The tests use locally signed RSA identity tokens and substitute the provider's public-key download only; Google's real verification library, Express routes, MongoDB models, cookies and app JWTs all execute. This does not replace a real Google account popup test after configuring the actual client ID.

For a manual end-to-end check, verify first login, logout and returning login, page reload, Remember Me, existing-account linking, and an account with 2FA enabled. Cancel the Google popup and verify email login remains usable.

## Deployment and troubleshooting

- Add the production frontend's HTTPS origin to the same Google web client (or use a separate production client), set backend `GOOGLE_CLIENT_ID` and `FRONTEND_URL`, and set frontend `NEXT_PUBLIC_API_URL` to the deployed API. Configure strong, different `JWT_SECRET` and `JWT_REFRESH_SECRET` values. Keep frontend/API on the same site when possible so browser third-party-cookie restrictions do not block refresh/challenge cookies.
- `origin_mismatch`: check the exact browser origin and authorized JavaScript origins, including the port. Cloud configuration changes can take time to propagate.
- Google script blocked/network error: allow `https://accounts.google.com/gsi/client`, permit the Google popup, or use email login.
- Expired challenge: click **Try Google again** (or start Google sign-in again) for a new nonce.
- If adding a strict Content Security Policy later, allow the Google Identity Services resources as described in Google's setup guide. If setting COOP headers, use `same-origin-allow-popups` on pages hosting the Google popup.

Official references: [Google setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [ID-token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [GIS JavaScript API](https://developers.google.com/identity/gsi/web/reference/js-reference).
