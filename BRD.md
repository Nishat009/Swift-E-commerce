# SwiftCart - Business Requirements Document (BRD)

## 1. Executive Summary & Project Purpose
SwiftCart is a state-of-the-art e-commerce platform designed to offer high-end luxury fashion shopping integrated with interactive virtual try-on modules and enterprise production-level product experiences. The system aims to maximize user engagement, drive product sales, streamline seller catalog operations, and provide a seamless localized buying experience matching enterprise SaaS and e-commerce standards (Amazon, Shopify, Nike, Zara, Apple Store).

This document outlines the business objectives, core user profiles, and detailed descriptions of all features from both customer and administrator/seller perspectives.

---

## 2. Business Objectives
*   **Increase Conversion Rates**: Enhance the buying experience with interactive 360° rotation galleries, outfit bundle builders, sticky purchase cards, and a virtual try-on room.
*   **Boost Order Value**: Encourage customer additions via Frequently Bought Together outfit bundles offering an automated 10% discount.
*   **Customer Retention**: Keep users returning with personalized AI fit quiz tools, price drop alert subscriptions, and auto-applied promotions.
*   **Enterprise Product Management**: Replace simplistic modals with a dedicated multi-step product creation system featuring auto-saved drafts, dynamic variant matrix generation, live profit calculations, and automated SEO previews.
*   **Dynamic Localization**: Support cross-border transactions through dynamic multi-currency localizations (USD, EUR, GBP, BDT).
*   **Administrative Transparency**: Provide high-performance product inventory tables supporting bulk publish/archive/delete, CSV export, JSON payload import, quick edit popovers, user session tracking, audit logs, and analytics.

---

## 3. User Profiles & Perspectives

The system serves two main user profiles:
1.  **Normal Customer (End User)**: Interested in browsing items, utilizing local currency selectors, taking size fit quizzes, checking out with auto-applied promos, setting price drop alerts, comparing products side-by-side with difference toggles, and reading verified photo review cards.
2.  **Store Administrator / Seller (Admin)**: Responsible for catalog operations, creating complex multi-variant products, managing warehouse stock levels, updating order state flows, performing bulk updates, inspecting user session carts, and auditing system modifications.

---

## 4. Core Features & Business Logic

### Feature 1: Enterprise Product Management & Multi-Step Creation Workflow
*   **Admin / Seller View**:
    *   **Dedicated Page Routes**: Product creation and editing navigate to dedicated full-page routes (`/dashboard/products/create` and `/dashboard/products/:id/edit`), replacing modals.
    *   **10-Section Form Architecture (`ProductForm.tsx`)**:
        1.  **Basic Info**: Product Name, auto-generated URL Slug (with manual override), auto-generated SKU button, Barcode (EAN/UPC), Brand, Category, Subcategory, Tags pills, Short & Long Rich Text Description, Product Status (`Draft`, `Published`, `Archived`), Visibility (`Public`, `Private`, `Hidden`), and Badge Toggles (`Featured`, `New Arrival`, `Trending`, `Best Seller`).
        2.  **Media Gallery**: Drag & Drop multi-image uploader, Thumbnail cover selector, image reordering (Move Up/Down), image cropping preview, Alt Text per image, Video URL (YouTube/Vimeo/MP4), and Interactive 360° product spin preview toggle.
        3.  **Pricing & Financials**: Selling Price, Original MSRP, Cost Price, Sales Tax %, Base Currency; live calculations for Discount Amount, Discount Percentage (% OFF), Profit ($), and Profit Margin (%).
        4.  **Inventory & Warehousing**: Available Stock, Reserved Stock, Low Stock Alert Threshold, Warehouse Location, Stock Status (`In Stock`, `Out of Stock`, `On Backorder`), Max/Min Order Quantities, Allow Backorders toggle, and Inventory Tracking toggle.
        5.  **Dynamic Product Variants Matrix**: Dynamic multi-attribute variant builder (Colour, Size, Material, Storage, Memory, Style, etc.); automated combination matrix generator creating variant rows with individual SKUs, Price adjustments, Stock, Barcodes, and Images.
        6.  **Shipping & Logistics**: Weight (kg/lbs), Dimensions (L/W/H), Shipping Class, Free Shipping toggle, Express Shipping toggle, Delivery Estimate text, Packaging Type, Country of Origin, and Customs HS Code.
        7.  **SEO & Open Graph**: Meta Title, Meta Description, Keywords, Canonical URL, Open Graph Image URL, and a live Google Search snippet preview card.
        8.  **Related Products & Bundles**: Interactive multi-select picker for Frequently Bought Together, Similar Products, Accessories, Bundles, Cross-sells, and Upsells.
        9.  **Specifications & Custom Attributes**: Standard specifications + dynamic key-value custom attributes builder.
        10. **Publish Control**: Draft save, Scheduled publish datetime picker, Publish Now, and Archive actions.
    *   **UX Enhancements**: Autosave draft to `localStorage` every 10 seconds with timestamp indicator, `beforeunload` unsaved changes warning, `Ctrl+S` / `Cmd+S` keyboard shortcut, and a visual form completion progress bar.

---

### Feature 2: High-Performance Product Management Table
*   **Admin / Seller View**:
    *   **Dedicated Table View**: Hosted at `/dashboard/products` and integrated into the Admin Console.
    *   **Table Columns**: Image thumbnail, Name, SKU, Category, Brand, Price, Stock status badge, Rating, Status badge (`Published`, `Draft`, `Archived`), and Actions.
    *   **Controls & Search**: Full-text search across Title, Brand, SKU, and Category; filter by category and status; multi-column sorting (Name, Price, Stock, Date).
    *   **Bulk Operations**: Select multiple items for Bulk Delete, Bulk Publish, and Bulk Archive.
    *   **Data Export & Import**: Download CSV inventory export and import JSON catalog payloads.
    *   **Quick Actions**: Duplicate Product action (auto-generates draft copy) and Quick Edit popover/drawer for fast price and stock updates.

---

### Feature 3: Enterprise Product Detail Experience (PDP)
*   **Normal Customer View**:
    *   **Interactive Gallery**: Image slider, hover lens zoom, 360° spin rotation viewer mode, click fullscreen lightbox modal, video player, and thumbnail strip.
    *   **Pricing & Financials**: Localized currency conversion, discount percentage badge, tax details, EMI monthly payment calculator placeholder, coupon voucher selector, and price history trend chart.
    *   **Variant Selector**: Interactive color swatches (switching main display image on click), size grid pills, and Fit Quiz Advisor.
    *   **Real-time Shipping Estimator**: Standard and Express delivery date calculator with a real-time same-day dispatch countdown timer.
    *   **Sticky Purchase Card**: Fixed floating bottom bar containing Price, Active Variant summary, Quantity stepper, Wishlist toggle, Compare toggle, Add to Cart, and Buy Now.
    *   **Structured Content**: Accordion sections for Description & Craftsmanship, Technical Specifications table, Shipping & Return Policy, and FAQ.

---

### Feature 4: Frequently Bought Together Bundle Builder
*   **Normal Customer View**:
    *   View cross-sell outfit recommendations on the PDP linking the active item with two complementary items.
    *   Select/deselect individual bundle recommendations with checkboxes.
    *   Receive an automated **10% bundle discount** applied to the combined total.
    *   Add the entire checked bundle to the shopping bag in a single click.

---

### Feature 5: AI Size & Fit Advisor Quiz
*   **Normal Customer View**:
    *   Access the Fit Quiz sizing modal next to variant options on the PDP.
    *   Input height (cm), weight (kg), and fit preference (tight, regular, loose) to receive a size recommendation (XS to XXL) with match percentage score.
    *   Apply the recommendation instantly to update the selected variant in one click.

---

### Feature 6: Verified Customer Reviews & AI Sentiment Analyzer
*   **Normal Customer View**:
    *   Overall rating score card with 5-star to 1-star distribution bar charts and percentage indicators.
    *   Read reviews featuring buyer-uploaded outfit photos and an automated AI Sentiment Analysis box highlighting Pros & Cons.
    *   Submit verified reviews attaching photo URLs.
    *   Upvote reviews as helpful, locked to a single vote per user per review.

---

### Feature 7: Multi-Product Side-by-Side Comparison Matrix
*   **Normal Customer View**:
    *   Select up to 3 products to compare side-by-side via floating compare bar (`StickyCompareBar.tsx`).
    *   Compare Price, Rating, Brand, Category, Stock level, Shipping class, Material/Fabric, and Warranty inside a dedicated comparison modal (`CompareModal.tsx`).
    *   Toggle **"Display Differences Only"** switch to filter out identical attributes.

---

### Feature 8: Wishlist Collections & Price Drop Alerts
*   **Normal Customer View**:
    *   Organize saved items into Wishlist Collections / Folders (All Favorites, Summer Closet, Workplace Outfits).
    *   Toggle Price Drop Alerts & Back-in-Stock Alerts per saved item.
    *   Generate and copy a shareable Wishlist link.
    *   Move items directly from Wishlist to Shopping Cart ("Move to Cart" and "Move All to Cart").

---

### Feature 9: Typo-Tolerant Search & Recent Suggestions History
*   **Normal Customer View**:
    *   Debounced search suggestions listing categories, brands, SKUs, and item matches.
    *   Fuzzy Levenshtein search corrections (e.g. searching "shos" returns suggestions for "shoes") and a "Search anyway" override.
    *   Recent search history and trending tag triggers.

---

### Feature 10: Auto-Applied Promotion Rules Engine
*   **Normal Customer View**:
    *   Auto-applied checkout discounts:
        *   **Spend & Save Promo**: Automatically deducts $30 for cart subtotals of $300+.
        *   **Free Shipping Promo**: Automatically zeroes shipping for cart subtotals of $100+.

---

### Feature 11: Persistent Guest Cart Syncing
*   **Normal Customer View**:
    *   Guest cart items automatically merge into persistent database cart upon login.

---

### Feature 12: Unified Account Manager `/dashboard`
*   **Normal Customer View**:
    *   Manage Overview stats, Profile details, Orders history, Wishlist collections, Address CRUD, and 2FA Security settings.

---

### Feature 13: Enterprise User Session Inspection & Audit Logs
*   **Admin View**:
    *   Inspect active user shopping carts, wishlist selections, and order histories.
    *   Review administrative audit trails capturing timestamped object diffs.

---

### Feature 14: Dual-Image Studio & Virtual Dressing Room Suite
*   **Normal Customer View**:
    *   Interactive Virtual Dressing Room (`/dressing-room`) featuring 30 dual-image curated luxury fashion pieces with instant switching between Flat-Lay Product and Editorial Model Looks.
    *   Multi-category filter tabs: All Pieces, Tops & Shirts, Dresses, Outerwear, Trousers & Denim, Footwear, Bags & Leather, Jewelry & Accessories.
    *   High-resolution zoom lens, garment specification drawer, and live Add-to-Bag synchronization.
    *   AI Style Recommendation Suite (AI Picks, Complete The Look, Because You Viewed, Trending Styles).

---

### Feature 15: Google Authentication & Enterprise Access Protection
*   **Normal Customer View**:
    *   1-Click Google OAuth 2.0 sign-in and registration with automated account provisioning.
    *   Enterprise brute-force protection locking out failed attempts after 3 invalid credentials.
    *   Multi-Factor 2FA with Authenticator apps and emergency recovery codes.

---

### Feature 16: Automated Order Confirmation & Invoicing Engine
*   **Customer & Admin View**:
    *   Instant dispatch of itemized, responsive HTML order confirmation invoices to customer email.
    *   Dual-mode email infrastructure (Nodemailer) with free zero-config Ethereal Email test preview links and production SMTP support.
    *   Lifecycle notification emails for order updates (`Confirmed`, `Shipped`, `Delivered`, `Cancelled`).
    *   In-app notification synchronization and activity tracking.

---

## 5. Technology Stack Summary
*   **Frontend**: React 19, Next.js 16 (App Router), Three.js (3D Studio), Zustand (State Management), Framer Motion (Animations), Tailwind CSS 4.
*   **Backend**: Node.js, Express.js (REST API, MVC Pattern), Mongoose ODM, Nodemailer (Email Engine).
*   **Authentication & Security**: Google OAuth 2.0, TOTP validation (crypto module), JWT tokens, email OTP dispatch, HttpOnly cookies.
*   **Database**: MongoDB (Collections: Products, Users, Categories, Orders, Notifications, Reviews, Campaigns, Audit Trails).


---

# Appendix A — Current Implementation Overview (as of 2026-10-01)

A plain-language summary of what the project actually contains today, how it works, and where its data comes from. Where earlier sections of this document describe planned or aspirational features, this appendix reflects the code.

## A1. What SwiftCart is
A fashion e-commerce web app with a storefront, an admin console, a virtual dressing room, AI-style shopping helpers, and a "lucky draw" campaign system where customers buy tickets for a chance to win a prize.

**Tech stack**
| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Zustand (state), Framer Motion, three.js |
| Backend | Node.js, Express 4, Mongoose 8 (MongoDB), JWT, Helmet, rate limiting, Swagger docs at `/api-docs` |
| Auth | Email/password, email OTP, Google sign-in, optional 2FA (authenticator app) |
| Images | Local files in `public/`, Cloudinary upload support for admin |

**How to run:** `npm run dev` starts the frontend (port 3001) and backend (port 5000) together. `npm run seed` (in `backend/`) fills the database with sample data. Required backend env vars: `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (32+ characters each), `FRONTEND_URL`, `GOOGLE_CLIENT_ID`.

## A2. What customers can do
| Area | Pages | What happens |
|---|---|---|
| Browse | `/` landing page, `/products`, `/product/[id]` | Animated hero, category slider, lookbook, product grids, product detail with gallery, variants, reviews and AI helpers |
| Buy | `/cart`, `/checkout`, `/orders` | Cart syncs to the server when logged in; coupons; order history and cancellation |
| Account | `/auth/login`, `/auth/register`, `/profile`, `/addresses`, `/wishlist`, `/settings` | Login by password, OTP or Google; 2FA setup; saved addresses; wishlist |
| Lucky draw | `/campaigns`, `/campaigns/[id]`, `/campaigns/my-tickets` | Buy a campaign product, receive tickets, see draw results and notifications |
| Dressing room | `/dressing-room` | Mix and match clothes on an avatar (see A5) |

Storefront extras: multi-currency (USD, EUR, GBP, BDT), language switcher, dark mode, product compare, newsletter signup.

## A3. What admins can do
- **`/admin`** is a single large console covering: dashboard stats (orders, revenue, low stock, 6-month revenue), products, orders and status changes, users (change role, delete, view their cart/wishlist), reviews, newsletter, currencies, languages, 2FA, and the full campaign toolkit (create, edit, pause, draw winner, analytics, audit trail, activity logs).
- **`/dashboard/products/...`** is a product create/edit workflow (form and table) for sellers.
- Roles are `customer` and `admin`. Admin routes are protected on the server.

## A4. How the key flows work
**Checkout and orders**
1. Prices are always re-read from the database (never trusted from the browser), and stock is checked.
2. Coupons are applied (percentage or flat amount; must be active and unexpired). Seeded coupons: `WELCOME10`, `SUMMER20`, `FREESHIP`.
3. Tax is a flat 10%. Shipping is free over $100, otherwise $10.
4. Stock is reduced atomically; if anything fails it is rolled back. Cancelling an order puts stock back.
5. Order statuses: Pending, Processing, Confirmed, Packed, Shipped, Delivered, Cancelled, Returned.
6. There is no real payment gateway; payment status starts as "Pending".

**Lucky draw**
1. Admin creates a campaign: a product, a prize, a ticket limit, per-user limits, and a draw date.
2. A customer buys the product and receives numbered tickets (`SWIFT-TKT-...`), paid by a simulated wallet. Ticket counts are updated atomically so the limit cannot be exceeded.
3. Admin presses "draw": one ticket is picked at random, the campaign is marked completed, and the winner and all other participants are notified.
4. Every action is written to an activity log and an audit trail.

**Authentication**
- Short-lived access token (15 minutes) plus a 7-day refresh token in an httpOnly cookie. The frontend refreshes automatically on a 401.
- Google sign-in uses a one-time challenge and server-side token verification. Accounts can be linked.
- 2FA uses authenticator-app codes with recovery codes.
- Protections: Helmet, CORS whitelist, request validation, rate limiting (300 per 15 minutes globally, stricter on sign-in), bcrypt password hashing.

## A5. Dressing room and AI features
- **Dressing room:** runs entirely in the browser. Clothes are layered on an SVG or 3D avatar, with undo/redo, a quiz-based stylist, a keyword chat assistant, and style challenges with badges. Nothing is saved to the server, only to the browser.
- **AI smart search:** type something like "black shirt for office under 2500" and it extracts colour, category, occasion and price. This is rule-based logic written in `services/aiService.ts`, not a real language model, and it searches the local static catalogue rather than the database.
- Other AI widgets (picks for you, sales advisor, outfit builder, review analyzer, floating stylist) are also simulated with rules and short delays.

## A6. Data: what comes from the database and what does not
**From the database (MongoDB)**
- Products, categories, reviews, coupons, carts, wishlists, orders, users and addresses
- Campaigns, tickets, notifications, activity logs, audit trail
- Currencies and languages (defaults are seeded automatically on first server start)

**Built into the frontend (not editable from admin)**
- Hero section animation and its images
- The "lookbook" looks (images in `public/images/dress-room/`)
- Dressing-room clothing catalogue (`data/fashionCatalog.ts`) and chat/stylist content
- All AI behaviour, the `/products` page's mock data, and text translations
- Fallbacks: if the API is down, the app shows the local catalogue and a default category list

**Images:** category images are stored in the database as paths such as `/images/categories/dress.jpg`. Product images come from product records.

**Seed data (`npm run seed`) — warning: it deletes existing users, products, categories, coupons and reviews first.** It creates 17 categories (9 fashion plus home/furniture), fashion products plus sample furniture, 20 users (including `admin@email.com` and `user@email.com`, password `12345678`), 3 coupons, and random reviews.

## A7. Main database collections
| Collection | Purpose |
|---|---|
| User | Account, role, addresses, 2FA and OTP data |
| Product | Pricing, stock, images, variants, ratings, flags (featured, trending, new) |
| Category | Name, image, featured flag |
| Cart / Wishlist | Per-user items |
| Order | Items, totals, status, shipping address |
| Coupon, Review | Discounts; ratings and comments |
| Campaign, Ticket | Lucky draw campaigns and purchased tickets |
| Notification | In-app messages to users |
| ActivityLog, AuditTrail | Admin actions and change history |
| AuthChallenge | Short-lived Google/2FA login challenges |
| Currency, Language, Newsletter | Localisation settings and subscribers |

## A8. Known gaps and issues (found during code review)
These are differences between the documents and the code, or likely bugs. They have not been fixed yet.
1. **No emails are sent.** The email service file is empty. Order confirmation emails, password reset emails and OTP emails described elsewhere in the docs do not exist; reset tokens and OTP codes are only returned in the API response in development mode.
2. **No payment gateway.** Payments and the admin "monitoring" numbers (CPU, RAM, bkash/nagad/stripe status) are fake or simulated.
3. **Likely bug in ticket purchase:** the activity log written when buying tickets uses the wrong field name (`user` instead of `adminUser`), which can make the purchase fail and roll back.
4. **Order route order:** the admin "all orders" route in `/api/orders` is probably shadowed by `/:id`. The admin console may need `/api/admin/orders` instead.
5. **Reviews are always marked "verified"** with no check that the user bought the product.
6. **Wishlist data is stored twice** (inside the User record and in a separate Wishlist collection).
7. **AuditTrail model** has a broken serialiser (`delete _id` on undeclared variables).
8. **Winner video** in lucky draw is a hard-coded sample link.
9. **Seed script mismatch:** `seed_campaigns.js` expects a user `customer@email.com` that `seed.js` does not create.
10. **A broken image file:** `public/images/dress-room/raw-indigo-jeans-product.jpg` is not a real image.
11. **Docs drift:** README mixes ports 5000/5001; order statuses in README omit Confirmed, Packed, Returned; some features in sections 1–4 above (360° spin, CSV import, autosave) were not verified in code.
12. **Dead code:** the avatar GLB proxy route is commented out.

## A9. Update 2026-10-03 — Done since A8
Several items in A8 are now fixed or changed: order confirmation emails exist (Nodemailer), real bKash/Stripe gateways are integrated (`backend/PAYMENTS.md`), and a **mock payment gateway** (`PAYMENT_MOCK=true`, development only) lets the lucky draw be tested without real accounts. Also done in this phase:
- **Lucky draw hardening:** secure random winner pick, one draw only (atomic claim even with two admins), draw blocked while ticket payments are in flight, rollback if a draw fails, no fake winner video.
- **Coupons:** minimum spend, total usage limit, per-user limit; usage is freed when an order is cancelled or returned; an invalid code now rejects the order.
- **Server-side variant pricing:** cart and order prices are always calculated by the server from the product and selected variant.
- **Wishlist alerts:** customers get a notification when a wishlisted product drops in price or comes back in stock.
- **Winner delivery proof (backend):** `PUT /api/campaigns/admin/:id/delivery` (status, courier, tracking, proof image).
- **Audit:** campaign create, update, status change, draw and delivery are all recorded.
- Automated check: `npm run test:draw` in `backend` (uses a throwaway test database).

## A10. Pending work (to do in the next phase)
**Frontend for features that only have a backend today**
1. Admin coupon form: fields for minimum spend, usage limit and per-user limit; show "used X of Y" in the coupon list. Cart/checkout should call `GET /api/coupons/:code?subtotal=` and show the real discount and error messages.
2. Admin lucky-draw page: winner delivery form (status, courier, tracking number, proof image upload, note).
3. Winners gallery and "My tickets": show delivery status and the proof photo; winner sees delivery updates.
4. Notification list: show the new notification types `price_drop`, `restock` and `delivery_update`, linking to the product or campaign.
5. Admin audit view: show the campaign status/delivery audit entries.
6. Optional: let admin attach a real draw recording (`winnerVideoUrl`) when running the draw.

**Backend gaps**
7. Restock/price-drop alerts only fire when an admin edits the product. Stock returned by a cancelled order, bulk actions and variant-level stock do not trigger them; no email version yet.
8. Variant stock is not checked at checkout (only product stock). Variant-level stock decrement is needed.
9. Refunds: a late payment after a ticket hold expired or after an order was cancelled is only marked `refund_needed` / logged; there is no refund flow.
10. Real bKash/Stripe accounts and webhook setup must be tested end to end (only the mock gateway has been tested automatically).
11. The API returns HTTP 200 for every success and 422 for every error (`utils/response.js`), including 401/403/404. Clients cannot tell auth errors from validation errors by status code. Decide whether to keep this.
12. Remaining items from A8 that were not touched (reviews always "verified", wishlist stored twice, seed script mismatch, broken image file, docs drift, dead code).
13. Cleanup: `data/mockData.ts` and `data/fashionCatalog.ts` are no longer imported and can be deleted.

**Known bug — Google sign-in does not work (to investigate)**
14. "Sign in with Google" currently fails. `GOOGLE_CLIENT_ID` is set in `backend/.env`, so the likely causes are on the Google Cloud / environment side. Check in this order:
   - Authorized JavaScript origins in the OAuth client must contain exactly the URL used in the browser (`http://localhost:3001`, and `http://localhost`); opening the site via `127.0.0.1` or another port will fail.
   - If the Google app is in Testing mode, the Google account used must be listed under Test users.
   - `FRONTEND_URL` in `backend/.env` must include the origin being used (the backend checks the request origin, `requireGoogleOrigin`).
   - The backend must be restarted after changing `.env`; the Client ID must belong to a **Web application** client.
   - Browser console / network tab: look at `POST /api/auth/google/challenge` and `POST /api/auth/google` responses and the GIS script load (ad blockers or a blocked `accounts.google.com` also break it).
   - Setup steps are in `docs/google-login.md`; a run of `npm run test:auth` in `backend` checks the server side.
