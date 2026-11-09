# Changelog

All notable changes to SwiftCart are listed here, newest first.

## 2026-11-09
### Fixed
- The landing page at `/` is back (a merge had replaced it with the old storefront home). Its header, hero and footer have **Live Demo** (opens `/shop`), **Login** and **Admin Login** buttons, and the "Try SwiftCart now" cards sign in to the demo customer or demo admin in one click.
- Demo login buttons no longer vanish while the hosted API wakes from sleep: they show as "Connecting…", the status check waits up to a minute and retries once, and a demo sign-in waits up to a minute too.
- The shop footer has visible **Login** and **Admin Login** buttons.

### Security
- New `DEMO_SITE=true` setting for a public showcase deployment with demo data only: it lets the one-click demo **admin** work when `NODE_ENV=production` (with `DEMO_LOGIN_ENABLED=true` and `DEMO_ALLOW_ADMIN=true`). Off by default; the shared `DEMO_PASSWORD` is still never sent in production. Test added.

## 2026-11-06
### Security
- In production the backend refuses to start when `DEMO_PASSWORD` is set, so a shared demo password can never reach a live shop. Test added.
- Chat sender IPs are hashed with an optional dedicated `CHAT_HASH_KEY` (32+ characters); without it the startup-checked `JWT_SECRET` is used, never an undefined key.
- Admin user lookups (`/users/:id`, `/cart`, `/wishlist`, `/role`) reject malformed ids with 404 before querying. Cart and wishlist lookups return only the product fields the admin view shows.
- New tests: chat and contact inboxes return 401 without a token and 403 for customers.
- Dependency audit: `npm audit` (dev dependencies included) is now **0 vulnerabilities** in both projects. The backend dropped `nodemon` for Node's built-in `node --watch`; the frontend overrides `minimatch` to `^11.0.1` (pulled in by the ESLint TypeScript plugin).
- The one-click demo **admin** now needs `DEMO_ALLOW_ADMIN=true` as well as `DEMO_LOGIN_ENABLED=true`, and stays off whenever `NODE_ENV=production`. In production the login page is never sent the shared `DEMO_PASSWORD`, and no demo account is created at startup. Settings live in `backend/src/config/demo.js`.
- Every request body with a MongoDB operator key (`$ne`, `$gt`, ...) or a `__proto__`/`constructor` key is refused with 422 before it reaches a controller (`middleware/sanitizeMiddleware.js`).
- Failed sign-ins are counted and the account locked in one atomic pipeline update, so parallel wrong passwords can't leave the counter and the lock out of step.
- Deleting a customer runs in one MongoDB transaction where the server supports it (Atlas). A new test checks that it never touches another account's data.
- Saved-address changes have their own rate limit (60 per 15 minutes).

### Changed
- `express-rate-limit` 7.5.1 → 8.7.3 (current major; IPv6 clients are limited per subnet). All rate-limit tests pass.
- Admin chat and contact inboxes load 50 messages at a time with a **Load more** button; marking or deleting a message updates the list in place instead of reloading it.
- Backend structure: the sign-in lockout rules live in `services/loginLockout.js`; every router and its mount path is listed once in `routes/index.js` (app.js mounts from it, and the SECURITY.md route report reads it); `config/demo.js` resolves the demo flags into one frozen `demoPolicy()` object that the demo controller reads.
- Dressing Room: fixed the two `npm run lint` errors in `AvatarViewer.tsx` (the model-loader effect now sits below the helpers it calls). Lint reports 0 errors.
- Contact form input is validated by `validations/contactValidation.js` (express-validator) like every other endpoint; the honeypot runs first. The contact page shows the server's field message.
- Admin chat and contact inboxes are paginated (`?page`, `?limit`, default 100, max 200) and return `pagination`; both collections have a `{ status: 1, createdAt: -1 }` index.
- Admin dashboard queries moved to `services/adminStats.js` and run in parallel; top-selling products are loaded in one query instead of one per product.
- Chat and contact controllers use the shared `sendSuccess` / `sendError` response helpers.
- Images: the 17 largest storefront photos were re-encoded (13.6 MB → 1.8 MB, same dimensions); the hero PNG is now a JPG. Removed the unused `app/image.png` and the duplicate `app/swiftcart-cover.png`; the marketing covers in `docs/` are left out of the submission ZIP (`.gitattributes` `export-ignore`).
- The email-code (OTP) sign-in logic moved from `authController` to `services/otpService.js`. `authRoutes.js` uses shared middleware chains.
- New `npm run install:all` installs the frontend and the backend in one step. README setup now lists both `.env` copies, the required variables, `db:init`, MongoDB 6.0+ and port 5000, and says that `database/*.sql` is not used at runtime.
- React and react-dom 19.2.0 → 19.2.9. `npm audit --omit=dev` still reports 0 vulnerabilities in both packages. The `swagger-jsdoc` glob override was checked and `/api-docs` loads.
- `data/fashionCatalog.ts` and `data/mockData.ts` are actually deleted now. An earlier entry listed them as removed, but the files were still in the repo. The catalog has one source: `backend/scripts/fashionProductsData.js`.

## 2026-11-02
### Fixed
- README listed `12345678` as the demo password, but the seed generates a random one unless `SEED_PASSWORD` is set. It now explains the live one-click demo login (verified against the deployed backend) and the local seed accounts correctly.
- README now summarizes route authorization (101 mutating routes, policy file, route-guard test output); HowToSetup starts with an ordered quick start and notes that the ZIP never contains `node_modules`.
- Dependency audit: `npm audit --omit=dev` reports **0 vulnerabilities** for both the frontend and the backend. Upgraded next and eslint-config-next 16.4.3 → 16.4.4 and nodemailer 10.2.1 → 10.3.1. Every production dependency in both `package.json` files is now pinned to an exact version (no caret ranges). Full result in SECURITY.md.
- Shared demo accounts can no longer enable or disable 2FA or regenerate recovery codes (`blockDemoAdmin` now guards `/2fa/enable`, `/2fa/disable` and `/2fa/recovery-codes`, like `/2fa/setup`), so nobody can lock everyone else out of the demo.
- Wrong email-code (OTP) guesses are now counted with an atomic `$inc`, so parallel guesses can't slip past the 5-attempt limit.
- Auth controllers cast `email` to a string before querying, so an operator object can never reach a Mongo filter even if validation is bypassed.
- Backend `npm audit` is clean: `swagger-jsdoc`'s vulnerable `glob`/`minimatch` are overridden with `glob@^14.0.3`. Results are recorded in SECURITY.md.
- The backend logs a loud startup warning whenever the public demo admin login is enabled.
- Dressing Room: garments photographed on a model or against a busy/non-studio background (most of the current catalog's stock photos) no longer get smeared across the mannequin as a messy collage. The cutout detector now also checks how much of the photo's border actually sits on a plain backdrop, not just how smooth that border is, so busy real-world photos correctly fall back to the plain-fabric silhouette instead of being treated as a flat-lay.
- `npm audit`: removed the unused `next-auth` dependency (the app uses its own Express/JWT auth) and updated the lockfile, which also cleared a high-severity `follow-redirects` advisory.
- `POST /api/auth/register` no longer confirms whether an email is already registered ("User already exists" let an attacker enumerate accounts); it now returns a generic 409 message.
- The shared demo-admin login (`DEMO_LOGIN_ENABLED`) can no longer hand out an admin session when `NODE_ENV=production`, even if `DEMO_LOGIN_ROLES` is misconfigured to include `admin` on a live deployment.
- `/api/auth/refresh` and `/api/auth/logout` (cookie-authenticated) now reject cross-site requests that don't carry the site's own `Origin` header, closing a CSRF gap on those two endpoints (mirrors the `requireGoogleOrigin` check already used on the Google sign-in routes). Non-browser clients that pass the refresh token in the request body are unaffected.

### Changed
- Business logic moved out of route files: chat, contact, newsletter, recommendation, wardrobe and hero routes now only wire paths and middleware to new handlers in `backend/src/controllers/` (`chatController`, `contactController`, `newsletterController`, `recommendationController`, `wardrobeController`, `heroController`). Behaviour is unchanged.
- Login page: the failed-attempt lockout and the reset-link modal state moved into `hooks/useLoginLockout.ts` and `hooks/useResetTokenModal.ts`.
- Added indexes on `StockAlert.user` and `AuthChallenge.user`, which are queried when an account is deleted; `database/schema.json` regenerated.
- Removed a stale changelog line with the old Node.js minimum; the project consistently requires Node.js 22+ (`engines`, `.nvmrc`, README, HowToSetup).
- `blockDemoCredentialChange` moved from `authRoutes.js` into `middleware/demoPrivacy.js`; route files only wire routes.
- Challenge lifetime, remember-me cookie age and the OTP attempt limit are now named constants in `config/security.js` instead of repeated literals.
- `@types/node` bumped to `^22` to match the Node 22 runtime; added `.nvmrc` (22). README now names one frontend port (3001); HowToSetup notes the 32-character JWT secret check and the test prerequisites.
- `register`, `login` and `verify-otp` now issue their session through the same `sendSession()` helper the Google and demo logins already use, instead of each repeating the token/cookie/response logic inline.
- The refresh token is now read through a single `getRefreshTokenFromRequest()` helper (cookie first, body fallback for non-browser clients) shared by `/auth/refresh` and `/auth/logout`, and it's rejected unless it's actually a string.
- The Google sign-in client-id check is now a single `getGoogleClientId()` helper shared by the challenge and verify steps.
- Stopped tracking the 20 demo product photos under `backend/uploads/` in git — they're exact duplicates of the seed images already in `public/images/dress-room/` and were only there because the `.gitignore` rule was added after they'd been committed. They stay on disk; the runtime uploads folder keeps only `.gitkeep`.
- Raised the minimum Node.js version to 22 (current LTS) across both `package.json` files, the README, `HowToSetup.md` and `docs/PROJECT_OVERVIEW.md`.
- `@types/react` / `@types/react-dom` are now pinned to `~19.2.0` to match the installed `react`/`react-dom` 19.2.0 runtime (they had drifted to `^19.3.0`), and `lucide-react` is now pinned exactly to `0.556.0` instead of a caret range.
- README's "Live Preview & Demo" link now points at the deployed site (`https://swift-e-commerce-eta.vercel.app/`) instead of only `localhost`, and the project-structure tree now lists `services/`.

## 2026-10-28 (third update)
### Security
- New [SECURITY.md](SECURITY.md) at the repository root: how requests are authorized, how ownership is checked, and a generated table of all 101 routes that change data with their guard and source file and line. A test fails if the table no longer matches the routers.
- The route-guard policy (public / signed-in / admin) lives in `backend/src/config/routePolicy.js`, shared by the test and the table generator (`npm --prefix backend run routes:doc`).

### Changed
- The store's public category list only shows categories that have products, so old categories without products (such as furniture left in the live database) no longer appear in the menu. Admins still see every category in the admin panel.
- `npm run seed` creates only the fashion catalog (the same 9 categories and 31 products as `seed:catalog` and the live demo); the sample furniture is gone, and search suggestions no longer offer "Sofa" or "Chair".
- AGENTS.md describes the project; `tsconfig.tsbuildinfo` (a build cache) is no longer tracked in git.

## 2026-10-28 (second update)
### Security
- Sign-in sessions are stored on the server: the refresh cookie's secret is kept only as a hash, rotates on every refresh, and is revoked on logout. Replaying an old refresh token signs that user out everywhere. Existing sessions from before this change need to sign in once more.
- `/api/auth/refresh` and `/api/auth/logout` are rate-limited.
- The shared demo admin sees customer emails, phone numbers, street addresses, IPs and surnames masked, and can no longer read customer email history or export the wallet statement.
- A route-guard test checks every POST/PUT/PATCH/DELETE route against an explicit public / signed-in / admin policy.
- Chat messages store a keyed hash of the sender's IP instead of the address and are deleted after `CHAT_RETENTION_DAYS` (default 180).
- Dependencies: bcryptjs 3.0 and helmet 8.3. `npm audit` (dev dependencies included): 0 vulnerabilities in the frontend and the backend.

### Changed
- Products are looked up only by id, slug, SKU, barcode or exact title; the hard-coded numeric id map and the "Nth product" fallback are gone. Public product pages are capped at 200 items (admins 500).
- Product badges (Sale, Low Stock, Featured, Bestseller, New) are computed once by the API and sent with each product; the catalog filter uses the same rules, so the frontend no longer repeats them.
- productController's filter and sort building moved to `services/productQuery.js`, the copy draft to `copyDraftController.js`, and the mock checkout page to `views/mockCheckoutPage.js`.
- Indexes for the unpaid-order sweep and a customer's chat history. Deleting a customer also removes their sign-in sessions.
- Removed the unused `data/fashionCatalog.ts` and `data/mockData.ts` (the catalog lives only in `backend/scripts/fashionProductsData.js`).
- README: complete local setup in one place (MongoDB 6.0+, both env files, secrets, `npm ci`, `db:init`, ports), the live test scripts (`npm --prefix backend run test:live`), and the new session and privacy notes.

## 2026-10-28
### Security
- The shared demo admin can no longer change order status, email customers or test payment gateways (role changes, deletions, payment settings and wallet adjustments were already blocked).
- In production, payment gateway keys saved in the admin panel are encrypted only with their own `PAYMENT_SETTINGS_KEY`, never with `JWT_SECRET`; without it, keys cannot be saved (switches and the Taka rate still work). A `PAYMENT_SETTINGS_KEY` shorter than 32 characters stops the server at startup.
- Starting an online payment looks the order up together with its owner, so another customer's order is never loaded.
- Dependencies: Next.js 16.4.3 and multer 2.5.0; `npm audit` reports 0 vulnerabilities in both packages.

### Changed
- All rate limits are defined in one file (`backend/src/config/rateLimits.js`).
- The product copy draft (`POST /api/admin/copy-draft`) moved from the route file to a controller with input validation; the admin form shows which field is missing.
- The sign-in page's forgot-password flow is its own component (`components/auth/ForgotPasswordModal.tsx`); unused camera-scanner code was removed.
- Sign-up, password reset and settings share one "passwords do not match" check.
- Database indexes for the audit trail and the campaign list.
- README: demo access for the live site, and a Security section (route guards, payment checks, demo limits, audit result). HowToSetup: `PAYMENT_SETTINGS_KEY`, frontend port 3001, the first-start demo catalog.

## 2026-10-27
### Added
- Admin panel **Cancellations & Returns** tab: cancelled orders, return requests and refunds in one place, with filters, totals and a button to open each order and act on it.
- Admin panel **Payment Settings** tab: switch cash on delivery, bKash and card on or off, choose bKash sandbox or live, set the Taka rate, save gateway keys (encrypted, never shown again) and test the connection. Only a super admin can save changes; keys left empty use the server environment values.

### Fixed
- The store no longer shows 0 products on a database without public products: the backend adds the fashion catalog at startup when no product is visible (insert-only; `AUTO_SEED_CATALOG=false` turns it off).
- "Explore Full Catalog" / All Products: one request per filter change (no second request when the catalog arrives), stale answers are ignored, and a "waking up the server" note appears during a slow first load.
- The shop header and footer no longer appear inside the admin panel; the admin header now has its own notifications bell and dark-mode toggle.
- Checkout hides cash on delivery when it is switched off in Payment Settings.
- Shop homepage categories only list categories that have products.

### Changed
- The Live Demo links (landing page and README) open the store at `/shop` instead of the sign-in page.

## 2026-10-25
### Changed
- The storefront homepage (`/shop`) is back to the full design: lookbook slider, curated wardrobe tabs, AI picks, runway edit, banners, perks and newsletter. The landing page at `/` is unchanged.

### Fixed
- Sign-in, Google sign-in and demo login no longer fail with a cancelled request when the backend is waking up; API requests now wait up to 60 seconds instead of 10.

## 2026-10-24
### Security
- Seed scripts no longer contain fixed passwords. The demo accounts use `SEED_PASSWORD` from `backend/.env`, or a random password printed by the seed; sample customers get random passwords.
- All npm audit advisories fixed (frontend 16, backend 11), including nodemailer 10 and sharp 0.35.
- Production builds never show the dev-mode login or reset codes on the sign-in page.

### Changed
- Deleting a customer also removes their notifications, stock alerts, wardrobe and pending sign-in challenges. Orders, tickets and reviews are kept.
- The setup guide now lists the required versions (today Node.js 22+ and MongoDB 6+) and how to start and check MongoDB.
- `backend/uploads/` is no longer tracked in git.
- Admin panel: "Refresh Dashboard" now reloads whichever tab is open, and "Inspect Session" shows a customer's orders without first opening the Orders tab.
- Sign-up form errors are shown in red again.
- Cover images redesigned around real screenshots, with the Vibe96 badge.

## 2026-10-23
### Fixed
- Shop collections now request New and Bestseller products directly, so matching items beyond the first catalog page can appear. If a collection request fails, the shop also recognizes badge tags in the loaded catalog.

## 2026-10-22
### Fixed
- The landing page's Live Demo button now always opens the sign-in page with the demo logins, even for visitors who are already signed in (previously they were sent straight to their account).

## 2026-10-21
### Added
- `database/seed.sql`: the demo categories and products as plain SQL, generated by `npm --prefix backend run db:seed-sql` and checked by a test.
- `npm --prefix backend run seed:catalog`: adds the fashion demo catalog to any database without deleting anything.
- Loading placeholders and a "Try again" button for the shop homepage product rails.

### Fixed
- "New in" and "Bestsellers" rails were empty because seeded products never had the `newArrival` / `bestSeller` flags set.

## 2026-10-20
### Added
- `HowToSetup.md`, `CLAUDE.md` and this changelog.
- Frontend `.env.example`.
- `npm run package:zip`, which builds a submission ZIP from git so `.env` files, `node_modules` and build output are never included.
- Complete project guide in `docs/PROJECT_OVERVIEW.md`.
- `database/` folder: generated `schema.json` for all collections, plus `npm --prefix backend run db:init` to create the database and indexes from scratch.
- Landing page at `/` with a Live Demo button; the shop homepage moved to `/shop`.
- Admin login page at `/admin/login` with one-click demo login, and an Admin Panel button in the footer.
- Optional `DEMO_PASSWORD` so the demo accounts can also sign in with shared credentials.
- Cover images in `docs/` (1920×1080 and 1080×1080).

### Removed
- Personal AI-tool notes (`codex.md`, `antigravity.md`).

## 2026-10-18
### Changed
- Simpler 3D dressing room that can wear any garment photo.
- Minimal homepage.

## 2026-10-17
### Added
- Return and refund requests for delivered orders.
- Email alerts to staff for new orders and return requests.
- Staff can email customers from the admin panel.

## 2026-10-15
### Added
- 3D mannequin with demo dress try-on in the dressing room.

## 2026-10-12
### Fixed
- Filtering and sorting now use the discounted price.
- Correct Sale badge count and size data.

## 2026-10-04
### Added
- Payments: Stripe card checkout and bKash, plus cash on delivery.
- Coupon rules, wishlist price and stock alerts, delivery proof.

### Changed
- Lucky-draw campaigns hardened.

## 2026-10-01
### Added
- Looping hero video, themed lookbook and category images.
- Google login.

## 2026-08-27
### Added
- Order confirmation emails (Nodemailer).
- Google OAuth login and registration.

## 2026-08-26
### Added
- 30 dual-image dressing-room products and unified product cards.

## 2026-08-25
### Fixed
- TypeScript build errors in page and Modal components.

## 2026-08-10 – 2026-08-23
### Added
- AI features and a new site design.

## 2026-07-28
### Added
- New product features.

## 2026-07-21
### Added
- Authentication security improvements and session inspection.
- Admin panel dark mode fixes.
- Campaign purchase simulation and camera QR scanner.

## 2026-07-12 – 2026-07-23
### Changed
- Frontend moved back to the repo root for Vercel deployments.

### Fixed
- More robust CORS origin matching.
- Live admin account promotion.

## 2025-12-09
### Added
- User dashboard.

## 2025-12-08
### Added
- Initial project (Create Next App).
