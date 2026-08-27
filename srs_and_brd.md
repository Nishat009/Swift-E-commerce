# Business Requirements Document (BRD) & Software Requirements Specification (SRS)
## Project: SwiftCart (Swift-E-commerce)

---

# PART 1: Business Requirements Document (BRD)

## 1. Executive Summary & Objectives
SwiftCart is a premium, high-end e-commerce platform designed to merge classic luxury aesthetics with modern interactive web experiences and enterprise-grade product management workflows. Unlike standard e-commerce storefronts that rely on basic forms and flat grids, SwiftCart aims to capture user attention, streamline seller catalog management, and improve conversion rates through multi-step form workflows, hardware-accelerated 3D interactions, a virtual closet dressing room, side-by-side product comparisons, and localized experience upgrades.

The primary business objectives are:
- **Maximize Engagement**: Hook users with tactile 3D Tilt product cards, interactive 360° rotation galleries, outfit bundle blocks, sticky purchase cards, and verified photo reviews.
- **Support Interactive Try-On**: Drive clothing category conversion rates by allowing users to try on outfits on a virtual avatar (Closet Builder) and calculate correct fits via the AI Fit Quiz Advisor.
- **Enterprise Product Management**: Enable sellers and administrators to create complex multi-variant items through a 10-section multi-step form with autosave drafts, variant matrix auto-generation, live profit calculations, and automated SEO previews.
- **High-Performance Catalog Management**: Offer store owners a dedicated inventory table supporting bulk publish/archive/delete, CSV exports, JSON payload imports, duplicate product cloning, and quick-edit drawers.
- **Leverage Multi-Currency Support**: Expand business outreach internationally through dynamic conversion rate localizations (USD, EUR, GBP, BDT).
- **Deliver Premium Quality**: Offer a curated earth-tone aesthetic (Beige, Gold, Cream) targeted at design-conscious demographics.

---

## 2. Target Audience & Stakeholders
- **Consumers (End Users)**: Style-centric shoppers purchasing premium apparel, lighting, decor, and furniture.
- **E-commerce Merchants (Admins / Sellers)**: Product managers, copywriters, and administrators managing catalogs, configuring pricing/variant matrices, reviewing sessions, and auditing system changes.
- **Development Team**: Frontend and backend engineers building, updating, and scaling the codebase.

---

## 3. High-Level Product Scope
- **Dedicated Product Creation & Editing Routes**: Full-page forms at `/dashboard/products/create` and `/dashboard/products/:id/edit` with 10 structured sections, jump navigation, 10s autosave drafts, and completion progress bars.
- **High-Performance Inventory Management Table**: Searchable, sortable table supporting multi-select bulk operations (delete/publish/archive), CSV downloads, JSON imports, product duplication, and quick price/stock edit drawers.
- **Interactive Product Catalog**: High-performance grid list featuring dynamic sorting, price range selectors, currency conversion dropdowns, sticky purchase cards, and fuzzy search suggestions.
- **Immersive Customer Experience**: Interactive 3D tilt product showcases, 360° rotation galleries, video players, outfit bundle blocks, price drop alerts, and customer photo review cards.
- **Multi-Product Comparison System**: Side-by-side specs matrix comparing up to 3 products with a **"Display Differences Only"** filter switch.
- **Interactive Closet Dressing Room**: A React-based closet manager mapping apparel coordinates to avatars alongside an AI Fit Quiz rules engine.
- **Cart & Checkout Engine**: Coupon codes, auto-applied Spend & Save promotion rules, shipping estimators, default addresses, and persistent cart syncing.
- **Admin Command Suite**: Portal for updating inventory, managing review averages, checking statistics, inspecting user session carts, and tracking audit logs.

---

# PART 2: Software Requirements Specification (SRS)

## 1. Introduction
This section details the functional, non-functional, database, and API requirements for the SwiftCart system.

---

## 2. System Architecture & Tech Stack

```mermaid
graph TD
  User([Web Browser client]) -->|Next.js App Router Frontend| NextJS[SwiftCart Frontend - Port 3001]
  NextJS -->|Zustand Local State| CartStore[Cart & Auth States]
  NextJS -->|REST API Request / JWT| ExpressAPI[Express Node.js Backend - Port 5000]
  ExpressAPI -->|Security - Helmet/Rate Limit| Middleware[Auth & Validation Middleware]
  Middleware -->|Mongoose ODM| MongoDB[(MongoDB - swiftcart DB)]
  ExpressAPI -->|Images Storage| Cloudinary[Cloudinary Media Bucket]
```

### Tech Stack Details:
- **Frontend Framework**: Next.js 16 (React 19, Turbopack compiler, App Router).
- **Frontend Animation**: Framer Motion 12 (interactive spring physics, motion values).
- **Styling**: Tailwind CSS v4 (inline theme parameters, native CSS variables).
- **State Management**: Zustand 5 (persistent cart drawer storage, auth caching, currency configs, compare store).
- **Backend API**: Node.js, Express.js (v4.19).
- **Database**: MongoDB (Mongoose ODM 8.3).
- **Image hosting**: Cloudinary API.
- **Authentication**: JWT token headers & cookies.

---

## 3. Functional Requirements

### 3.1 User Management, Authentication & Shell Navigation
- **Registration & Login**: Secure account creation with encrypted credentials, phone numbers, and addresses.
- **Auth Guard**: Role-based access control separating regular customers from administrative paths (`/admin`, `/dashboard`).
- **Unified Profile Shell (`AccountLayout.tsx`)**: Organize account management into distinct routes sharing a sidebar/drawer layout:
  - **Overview** (`/dashboard`): Stats cards (orders, wishlist, cart) and recent order feed.
  - **Products** (`/dashboard/products`): Enterprise Product Table with search, sorting, bulk actions, CSV export, and quick edit.
  - **Profile** (`/profile`): Contact details, name, phone, email, and default address.
  - **Orders** (`/orders`): Track shipments, print invoice documents, and cancel pending orders.
  - **Wishlist** (`/wishlist`): Wishlist collections/folders (All Favorites, Summer Closet, Workplace Outfits), price drop alerts, share link generator, and move to cart actions.
  - **Addresses** (`/addresses`): Full CRUD operations for managing multiple shipping addresses, including default selections.
  - **Settings** (`/settings`): Deactivate/activate TOTP Two-Factor Authentication (2FA) via 16-character Base32 aligned QR codes, obtain recovery codes, or update account password.
- **Passwordless Email OTP**: Secure credentials-free login via time-limited code delivery to customer email.
- **Multi-Currency Localizer**: Navbar selector converts default USD catalog values into EUR (€, rate: 0.92) or GBP (£, rate: 0.78) and formats pricing across cards, detail views, sticky bars, cart summaries, and compare panels.
- **Persistent Guest Cart Sync**: Instantly upload guest cart items to the database cart upon successful login.

### 3.2 Product Catalog & Interactive Grid
- **Enterprise Multi-Step Creation Workflow (`ProductForm.tsx`)**:
  - Full-page dedicated routes: `/dashboard/products/create` and `/dashboard/products/:id/edit`.
  - 10 form sections with sticky right sidebar jump navigation: *Basic Info, Media, Pricing, Inventory, Variants, Shipping, SEO, Related Products, Product Attributes, Publish*.
  - Live financial calculations (discount amount, discount %, profit $, profit margin %).
  - Automated variant combination matrix generator (SKUs, barcodes, price deltas, stock).
  - Live Google Search snippet preview card.
  - Autosave draft every 10 seconds, `beforeunload` unsaved changes warning, `Ctrl+S` / `Cmd+S` keyboard shortcut, and completion progress bar.
- **3D Tilt Product Card**:
  - The card rotates dynamically based on mouse coordinate hover tracking (tilt angle limits: $\pm10^\circ$).
  - An absolute-positioned light-flare radial gradient follows the user's cursor.
  - Image scales (`scale-108`) and cross-fades with a secondary product image on hover, while action buttons (Quick View, Add to Cart) slide up.
  - Device compatibility: Disables cursor-tracking on touchscreens (fallback to standard scaling).
- **Advanced Filtering & Search**:
  - Search bar with debounced autocomplete suggestions listing category/brand matches, recent search terms, and trending tags.
  - Typo-Tolerant Search: Levenshtein distance check on empty search outputs to display fuzzy recommendations (e.g., searching "shos" returns suggestions for "shoes") and a "search anyway" button.
  - Price Range Slider: A custom dual-handle track for filtering prices from $0 to $2000.
  - Active filter tags displayed as chip items with single-click remove buttons and total active count indicators.
  - Category radio selection, color/size checkboxes, and list/grid layout toggle views.
- **Quick View Modal**: Popup displaying product specs, average rating, reviews count, low stock warnings, delivery estimate, and return policy.

### 3.3 Product Details Page (PDP) & Interactive Visuals
- **Interactive Gallery**: Image hover zoom, 360° spin rotation viewer cycling frames via drag gestures, fullscreen lightbox modal, thumbnail strip, and video player tab.
- **Financial Indicators & Timers**: Discount badge, tax details, EMI calculator placeholder, coupon selector, and real-time same-day shipping countdown timer.
- **Sticky Purchase Bar**: Fixed floating bottom bar containing Price, Active Variant summary, Quantity stepper, Wishlist, Compare button, Add to Cart, and Buy Now.
- **Structured Accordions**: Description & Craftsmanship, Technical Specifications, Shipping & Return Policy, and FAQ.

### 3.4 Multi-Product Side-by-Side Comparison
- Compare up to 3 products side-by-side (`CompareModal.tsx` & `StickyCompareBar.tsx`) across Price, Rating, Brand, Category, Stock, Shipping, Material, and Warranty.
- Toggle **"Display Differences Only"** switch to filter out identical properties.

### 3.5 Virtual Dressing Room (Closet Builder) & Advisor Quiz
- **Virtual Avatar**: Interactive canvas/svg layout displaying an avatar base.
- **Layer Mapping**: Categorized trying on of shirts, pants, dresses, and jackets.
- **AI Fit Quiz Advisor**: A modal sizing advisor evaluating height, weight, and fit inputs, recommending optimal size matches (XS to XXL) with match percentage score, and applying them automatically.

### 3.6 Cart, Coupons & Promotions Engine
- **Zustand Cart Store**: Persists items in local storage, handles quantity updates, and automatically tallies coupon discounts.
- **Save For Later**: Move items from the cart to a saved storage deck and vice versa.
- **Coupon System**: Code validation checks against active coupon schemas (e.g., `SAVE20` for 20% off, `FREESHIP` for free shipping).
- **Shipping Estimator**: Enter a zip code to calculate delivery fees dynamically.
- **Auto-Applied promotions rules engine**: Calculates auto-applied discounts:
  - Spend & Save: Subtracts $30 if cart subtotal is $300 or more.
  - Free Shipping: Zeroes shipping cost if cart subtotal is $100 or more.
- **Frequently Bought Together Bundle Builder**: Cross-sell block linking the active item with related options, displaying raw vs discounted totals, applying a 10% discount, and adding items to the cart in a batch.

### 3.7 Interactive Assets & Verified Customer Reviews
- **360° Interactive Rotation Gallery**: Gallery sequencer on the PDP that maps alternate image frames to horizontal drag gesture offsets.
- **Restock Alert capture**: Form on out-of-stock items for alert subscriptions.
- **Customer review image uploads**: Form fields allowing buyers to attach review photo URLs, rendered inside customer review rows and aggregated in a shared outfit photo gallery.
- **Review Rating Distribution**: Rating score card with 5-star to 1-star distribution bar charts and percentage indicators.
- **AI Review Sentiment Box**: Evaluates text comments and prints pros/cons highlights cards.
- **Upvote locks**: Restricts helpful upvoting to one vote per user per review.

### 3.8 Administrative & Management Suite
- **Product Inventory Management Table**: Complete tabular view with search, filter, multi-column sorting, pagination, bulk operations (delete/publish/archive), CSV export, JSON import, product cloning/duplication, and quick edit drawer.
- **Dashboard**: Track system statistics (total sales, users, order quantities) with adaptive Dark Mode theme support.
- **User Session Inspection**: Query any customer's live cart contents, active wishlist selections, and complete purchase histories.
- **Enterprise Audit Trails**: Track action histories showing timestamps, admins responsible, and complete before-and-after values object diff.

---

## 4. Database Schema Specifications (Mongoose)

### 4.1 User Schema (`User.js`)
- `name`: String, required.
- `email`: String, required, unique.
- `password`: String, required (bcrypt hash).
- `role`: String ('customer', 'admin'), default 'customer'.
- `phone`: String.
- `addresses`: Array of address subdocuments.
- `twoFactorSecret`: String, base32 secret key for authenticator TOTP check.
- `twoFactorEnabled`: Boolean, active state flag for user MFA.
- `twoFactorRecoveryCodes`: Array of Strings, single-use security recovery keys.
- `otpCode`: String, dynamic OTP code.
- `otpExpiry`: Date, verification expiry time.
- `wishlist`: Array of ObjectIds ref Product.

### 4.2 Product Schema (`Product.js`)
- `title`: String, required, trimmed.
- `slug`: String, unique, sparse.
- `sku` / `SKU`: String, sparse.
- `barcode`: String.
- `description`: String, required.
- `shortDescription`: String.
- `category`: String, required.
- `subcategory`: String.
- `brand`: String, required.
- `tags`: Array of Strings.
- `status`: String ('draft', 'published', 'archived'), default 'published'.
- `visibility`: String ('public', 'private', 'hidden'), default 'public'.
- `featured`, `trending`, `newArrival`, `bestSeller`: Booleans.
- `price`: Number, required, min 0.
- `originalPrice`, `salePrice`, `discountPercentage`, `discountAmount`, `tax`, `costPrice`, `profitMargin`: Numbers.
- `currency`: String, default 'USD'.
- `stock`: Number, required, min 0.
- `reservedStock`, `lowStockThreshold`: Numbers.
- `warehouse`: String.
- `stockStatus`: String ('in_stock', 'out_of_stock', 'backorder').
- `maxOrderQuantity`, `minOrderQuantity`: Numbers.
- `allowBackorders`, `trackInventory`: Booleans.
- `images`: Array of Strings (URLs).
- `videos`: Array of Strings (URLs).
- `thumbnail`: String, required (URL).
- `specifications`: Map of Strings.
- `attributes`: Array of attribute objects (`name`, `value`, `group`).
- `variants`: Array of variant group objects.
- `variantCombinations`: Array of variant combination objects (`id`, `sku`, `price`, `stock`, `barcode`, `images`, `attributes`).
- `shippingInfo`: Object (`estimate`, `freeShipping`, `expressShipping`, `returnPolicy`, `cost`, `weight`, `dimensions`, `shippingClass`, `packagingType`, `countryOfOrigin`, `hsCode`).
- `seo`: Object (`metaTitle`, `metaDescription`, `keywords`, `canonicalUrl`, `ogImage`).
- `relatedProducts`, `bundles`: Array of ObjectIds ref Product.
- `rating`, `reviewCount`, `soldCount`, `wishlistCount`, `viewCount`: Numbers.
- `ratingDistribution`: Object (star counts for 5, 4, 3, 2, 1).
- `reviews`: Array of review subdocuments.

---

## 5. Non-Functional Requirements

### 5.1 Performance & Rendering
- **GPU Acceleration**: Interactive card rendering uses native CSS 3D transforms (`transformStyle: preserve-3d`).
- **Optimized Images**: Image loading leverages Next.js `<Image>` component with domain whitelisting and auto-compression.
- **Debounced Search Inputs**: Search inputs delay requests by `300ms` / `500ms` to prevent API hammering.

### 5.2 Security & Integrity
- **Password Protection**: Encryption using `bcryptjs` (salt rounds: 10).
- **Google OAuth 2.0 Integration**: Validated Google ID Tokens with auto-provisioning and session issuance.
- **MFA & Account Lockout**: Time-based OTP (TOTP) validation with brute-force lockout after 3 consecutive invalid attempts.
- **API Guarding**: Helmet middleware and Express Rate Limiter restrict excessive requests. JWT tokens stored securely in HttpOnly cookies.

### 5.3 Automated Invoicing & Notifications
- **Nodemailer Transactional Engine**: Real-time dispatch of itemized HTML invoice emails upon order creation and status transitions (`Confirmed`, `Shipped`, `Delivered`, `Cancelled`).
- **Zero-Config Developer Preview**: Automated Ethereal test inbox integration generating web preview links.
- **In-App Notification Synchronization**: Database-backed notification activity feed with live unread indicators.

### 5.4 Scalability
- **MongoDB Indexing**: Database indexing on frequently filtered fields (`category`, `status`, `sku`, `price`, `rating`).
- **Responsive Layout**: Fluid breakpoints supporting views from mobile portrait ($320\text{px}$) to widescreen desktops ($1440\text{px}$).
