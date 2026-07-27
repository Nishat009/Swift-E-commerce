# Business Requirements Document (BRD) & Software Requirements Specification (SRS)
## Project: SwiftCart (Swift-E-commerce)

---

# PART 1: Business Requirements Document (BRD)

## 1. Executive Summary & Objectives
SwiftCart is a premium, high-end e-commerce platform designed to merge classic luxury aesthetics with modern interactive web experiences. Unlike standard e-commerce storefronts that rely on flat grids, SwiftCart aims to capture user attention and improve conversion rates through immersive, hardware-accelerated 3D interactions, a virtual closet dressing room, and localized experience upgrades.

The primary business objectives are:
- **Maximize Engagement**: Hook users with tactile 3D Tilt product cards, interactive 360° rotation galleries, and dynamic category slider components.
- **Support Interactive Try-On**: Drive clothing category conversion rates by allowing users to try on outfits on a virtual avatar (Closet Builder) and calculate correct fits via the AI Fit Quiz Advisor.
- **Leverage Multi-Currency Support**: Expand business outreach internationally through dynamic conversion rate localizations (USD, EUR, GBP).
- **Deliver Premium Quality**: Offer a curated earth-tone aesthetic (Beige, Gold, Cream) targeted at design-conscious demographics.

## 2. Target Audience & Stakeholders
- **Consumers (End Users)**: Style-centric shoppers purchasing premium apparel, lighting, decor, and furniture.
- **E-commerce Merchants (Admins)**: Product managers, copywriters, and administrators managing catalogs, reviewing sessions, and auditing changes.
- **Development Team**: Frontend and backend engineers building, updating, and scaling the codebase.

## 3. High-Level Product Scope
- **Interactive Product Catalog**: High-performance grid list featuring dynamic sorting, price range selectors, currency conversion dropdowns, and fuzzy search did-you-mean suggestions.
- **Immersive Customer Experience**: Interactive 3D tilt product showcases, 360° rotation galleries, outfit bundle blocks, and reviews containing customer photos.
- **Interactive Closet Dressing Room**: A React-based closet manager mapping apparel coordinates to avatars alongside a Fit Quiz rules engine.
- **Cart & Checkout Engine**: Coupon codes, auto-applied Spend & Save promotion rules, shipping estimators, default addresses, and persistent cart syncing.
- **Admin Command Suite**: Secure portal for updating inventory, managing review averages, checking statistics, inspecting user session carts, and tracking audit logs.

---

# PART 2: Software Requirements Specification (SRS)

## 1. Introduction
This section details the functional, non-functional, database, and API requirements for the SwiftCart system.

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
- **State Management**: Zustand 5 (persistent cart drawer storage, auth caching, currency configs).
- **Backend API**: Node.js, Express.js (v4.19).
- **Database**: MongoDB (Mongoose ODM 8.3).
- **Image hosting**: Cloudinary API.
- **Authentication**: JWT token headers & cookies.

---

## 3. Functional Requirements

### 3.1 User Management, Authentication & Shell Navigation
- **Registration & Login**: Secure account creation with encrypted credentials, phone numbers, and addresses.
- **Auth Guard**: Role-based access control separating regular customers from administrative paths (`/admin`).
- **Unified Profile Shell (`AccountLayout.tsx`)**: Organize account management into distinct routes sharing a sidebar/drawer layout:
  - **Overview** (`/dashboard`): Stats cards (orders, wishlist, cart) and recent order feed.
  - **Profile** (`/profile`): Contact details, name, phone, email, and default address.
  - **Orders** (`/orders`): Track shipments, print invoice documents, and cancel pending orders.
  - **Wishlist** (`/wishlist`): View and manage saved items, or move them directly to the shopping cart.
  - **Addresses** (`/addresses`): Full CRUD operations for managing multiple shipping addresses, including default selections.
  - **Settings** (`/settings`): Deactivate/activate TOTP Two-Factor Authentication (2FA) via 16-character Base32 aligned QR codes, obtain recovery codes, or update account password.
- **Passwordless Email OTP**: Secure credentials-free login via time-limited code delivery to customer email.
- **Multi-Currency Localizer**: Navbar selector converts default USD catalog values into EUR (€, rate: 0.92) or GBP (£, rate: 0.78) and formats pricing across cards, detail views, sticky bars, cart summaries, and compare panels.
- **Persistent Guest Cart Sync**: Instantly upload guest cart items to the database cart upon successful login.

### 3.2 Product Catalog & Interactive Grid
- **3D Tilt Product Card**:
  - The card rotates dynamically based on mouse coordinate hover tracking (tilt angle limits: $\pm10^\circ$).
  - An absolute-positioned light-flare radial gradient follows the user's cursor.
  - Image scales (`scale-108`) and cross-fades with a secondary product image on hover, while action buttons (Quick View, Add to Cart) slide up.
  - Device compatibility: Disables cursor-tracking on touchscreens (fallback to standard scaling).
- **Advanced Filtering & Search**:
  - Search bar with debounced autocomplete suggestions listing category/brand matches, recent search terms, and trending tags.
  - Typo-Tolerant Search: Runs Levenshtein distance check on empty search outputs to display fuzzy recommendations (e.g., searching "shos" returns suggestions for "shoes") and a "search anyway" button.
  - Price Range Slider: A custom dual-handle track for filtering prices from $0 to $2000.
  - Active filter tags displayed as chip items with single-click remove buttons and total active count indicators.
  - Category radio selection, color/size checkboxes, and list/grid layout toggle views.
- **Quick View Modal**:
  - Popup displaying product specs, average rating, reviews count, low stock warnings, delivery estimate, and return policy.

### 3.3 Virtual Dressing Room (Closet Builder) & Advisor Quiz
- **Virtual Avatar**: Interactive canvas/svg layout displaying an avatar base.
- **Layer Mapping**: Categorized trying on of shirts, pants, dresses, and jackets.
- **Closet Inventory**: Fetches compatible products with coordinate styling tags (e.g. `SvgStyle` and `SvgColor` attributes in product specs).
- **AI Fit Quiz Advisor**: A modal sizing advisor evaluating height, weight, and fit inputs, recommending optimal size matches (XS to XXL) and applying them automatically to variant configurations.

### 3.4 Cart, Coupons & Promotions Engine
- **Zustand Cart Store**: Persists items in local storage, handles quantity updates, and automatically tallies coupon discounts.
- **Save For Later**: Move items from the cart to a saved storage deck and vice versa.
- **Coupon System**: Code validation checks against active coupon schemas (e.g., `SAVE20` for 20% off, `FREESHIP` for free shipping).
- **Shipping Estimator**: Enter a zip code to calculate delivery fees dynamically.
- **Auto-Applied promotions rules engine**: Calculates auto-applied discounts:
  - Spend & Save: Subtracts $30 if cart subtotal is $300 or more.
  - Free Shipping: Zeroes shipping cost if cart subtotal is $100 or more.
- **Frequently Bought Together Bundle Builder**: Cross-sell block linking the active item with related options, displaying raw vs discounted totals, applying a 10% discount, and adding items to the cart in a batch.

### 3.5 Interactive Assets & Verified Customer Reviews
- **360° Interactive Rotation Gallery**: Gallery sequencer on the PDP that maps alternate image frames to horizontal drag gesture offsets.
- **Restock Alert capture**: Form on out-of-stock items for alert subscriptions.
- **Customer review image uploads**: Form fields allowing buyers to attach review photo URLs, rendered inside customer review rows and aggregated in a shared outfit photo gallery.
- **AI Review Sentiment Box**: Evaluates text comments and prints pros/cons highlights cards.
- **Upvote locks**: Restricts helpful upvoting to one vote per user per review.
- **SVG Comparison Radar Chart**: Pentagon charts drawing relative scores on price value, ratings, specifications count, stock, and tags.

### 3.6 Administrative Portal
- **Dashboard**: Track system statistics (total sales, users, order quantities) with complete adaptive Dark Mode theme support.
- **Product Management**: Create, edit, and delete products, uploading pictures directly via Cloudinary.
- **Category Control**: Create featured category headers with custom Unsplash portrait cutouts.
- **User Session Inspection**: Query any customer's live cart contents, active wishlist selections, and complete purchase histories.
- **Enterprise Audit Trails**: Track action histories showing timestamps, admins responsible, and complete before-and-after values object diff.

---

## 4. Database Schema Specifications (Mongoose)

### 4.1 User Schema (`User.js`)
- `name`: String, required.
- `email`: String, required, unique.
- `password`: String, required (stored as bcrypt hash).
- `role`: String ('customer', 'admin'), default 'customer'.
- `phone`: String.
- `addresses`: Array of address subdocuments (street, city, state, zipCode, country, isDefault).
- `twoFactorSecret`: String, base32 secret key for authenticator TOTP check.
- `twoFactorEnabled`: Boolean, active state flag for user MFA.
- `twoFactorRecoveryCodes`: Array of Strings, single-use security recovery keys.
- `otpCode`: String, dynamic OTP code.
- `otpExpiry`: Date, verification expiry time for the dynamic OTP.
- `wishlist`: Array of ObjectIds ref Product.

### 4.2 Product Schema (`Product.js`)
- `title`: String, required, trimmed.
- `description`: String, required.
- `category`: String, key reference to Category.
- `brand`: String, required.
- `price`: Number, required, minimum 0.
- `stock`: Number, required, minimum 0.
- `thumbnail`: String, required (URL).
- `images`: Array of Strings (URLs).
- `tags`: Array of Strings.
- `specifications`: Map of Strings (e.g. SvgStyle, SvgColor, color, material).

### 4.3 Review Schema (`Review.js`)
- `product`: ObjectId ref Product, required.
- `user`: ObjectId ref User, required.
- `rating`: Number, required, min 1, max 5.
- `comment`: String, required.
- `images`: Array of Strings (URLs).

---

## 5. Non-Functional Requirements

### 5.1 Performance & Rendering
- **GPU Acceleration**: Interactive card rendering must use native CSS 3D transforms (`transformStyle: preserve-3d`) to offload rendering logic from the main thread.
- **Optimized Images**: Image loading must leverage Next.js `<Image>` component, performing domain whitelisting and auto-compression.
- **Debounced Search Inputs**: Prevent API hammering by delaying searches by `300ms` / `500ms`.

### 5.2 Security & Integrity
- **Password Protection**: Encryption using `bcryptjs` (salt rounds: 10).
- **API Guarding**:
  - Helmet middleware to enforce secure HTTP headers.
  - Express Rate Limiter restricts excessive connection requests.
  - JWT tokens stored securely.

### 5.3 Scalability
- **MongoDB Indexing**: Database indexing on frequently filtered fields (`category`, `price`, `rating`).
- **Responsive Layout**: Fluid breakpoints supporting views from mobile portrait ($320\text{px}$) to widescreen desktops ($1440\text{px}$).
