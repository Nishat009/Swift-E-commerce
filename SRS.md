# SwiftCart - Software Requirements Specification (SRS)

## 1. System Scope & Context
SwiftCart is a multi-tier web application combining an e-commerce catalog with advanced interactive visual elements, multi-step product form workflows, fuzzy search algorithms, and persistent authentication models. This document describes the specifications, structures, database schemas, and API configurations required to support the platform.

---

## 2. Functional Requirements Breakdown

### 2.1 E-Commerce & Product Management Core Module
*   **FR-1.1**: The system shall retrieve catalog products dynamically from the MongoDB database, displaying titles, slugs, SKUs, barcodes, brands, categories, subcategories, status badges, visibility flags, pricing, discount percentages, profit margins, stock counts, reserved stock, low stock thresholds, warehouse locations, and media assets.
*   **FR-1.2**: Product creation and editing shall use dedicated full-page routes (`/dashboard/products/create` and `/dashboard/products/:id/edit`), replacing modals. The form (`ProductForm.tsx`) shall feature 10 structured sections with sticky sidebar jump navigation: *Basic Info, Media, Pricing, Inventory, Variants, Shipping, SEO, Related Products, Product Attributes, Publish*.
*   **FR-1.3**: The product form shall support autosaving drafts to `localStorage` every 10 seconds, `beforeunload` unsaved changes prompts, `Ctrl+S` / `Cmd+S` keyboard shortcuts, and a visual form completion percentage progress bar.
*   **FR-1.4**: The system shall feature an upgraded Product Management Table (`ProductTable.tsx`) at `/dashboard/products` and inside the Admin Console, supporting full-text search, category/status filtering, multi-column sorting, pagination, bulk operations (Bulk Delete, Bulk Publish, Bulk Archive), CSV export, JSON payload import, product duplication, and quick-edit popovers.
*   **FR-1.5**: The system shall calculate selling price, discount amounts, profit ($), and profit margin (%) dynamically in real-time as values are entered into pricing fields.
*   **FR-1.6**: The system shall support a dynamic Multi-Attribute Variant Builder (Colour, Size, Material, Storage, Memory, Style, etc.) automatically generating combination SKU matrices with individual pricing, stock, barcodes, and images.
*   **FR-1.7**: The product media section shall support multi-image Drag & Drop uploading, thumbnail cover selection, image reordering, image cropping previews, video URLs, and an interactive 360° product spin preview toggle.
*   **FR-1.8**: The SEO section shall render a live Google Search snippet preview card reflecting meta titles, meta descriptions, and canonical URLs in real-time.
*   **FR-1.9**: Normal Customers shall be able to filter search listings by debounced query strings, categories, subcategories, price range sliders, colors, sizes, and layout view toggles (grid or list modes). Active filters shall display as chip tags with click-to-clear options and active count indicators.
*   **FR-1.10**: The PDP gallery shall support hover lens zoom, an interactive 360° rotation view cycling image frames via horizontal drag gestures, a fullscreen lightbox modal, thumbnail strip navigation, and video playback.
*   **FR-1.11**: The PDP shall display localized delivery estimates and a real-time same-day dispatch countdown timer (`Order in the next Xh Ym Zs`).
*   **FR-1.12**: The PDP shall render a fixed floating Sticky Purchase Card on scroll containing price, active variant details, quantity stepper, wishlist button, compare button, and Add to Cart.
*   **FR-1.13**: The PDP shall display Frequently Bought Together bundles, applying a 10% discount and supporting single-click batch cart addition.
*   **FR-1.14**: The PDP shall house an AI Sizing Advisor quiz calculating optimal size matches (XS to XXL) from height, weight, and fit inputs, with automated variant selection.
*   **FR-1.15**: The PDP shall support a Back-in-Stock email subscription capture form for out-of-stock items.
*   **FR-1.16**: Product reviews (`ReviewSection.tsx`) shall display overall rating scores, 5-star to 1-star distribution bar charts with percentage indicators, buyer photo galleries, automated AI Pros/Cons sentiment tags, verified buyer badges, and limit helpful upvoting to once per user per review.
*   **FR-1.17**: The system shall support multi-product side-by-side comparison (`CompareModal.tsx` & `StickyCompareBar.tsx`) comparing up to 3 products across Price, Rating, Brand, Category, Stock, Shipping, Material, and Warranty, with a **"Display Differences Only"** toggle switch.
*   **FR-1.18**: The Wishlist page (`/wishlist`) shall support Wishlist Collections / Folders, Price Drop Alert toggles, Back-in-Stock Alert toggles, shareable Wishlist URL generation, and "Move to Cart" / "Move All to Cart" actions.
*   **FR-1.19**: Search fields shall utilize Levenshtein distance matching to suggest fuzzy search corrections when initial queries return empty. Focus states shall trigger dropdown panels displaying recent search histories and trending tags.
*   **FR-1.20**: The checkout system shall execute auto-applied promotions: subtracting $30 on orders of $300+, and setting shipping free for orders of $100+.
*   **FR-1.21**: The client cart store shall automatically sync local guest cart items to the database cart upon successful user login.

---

### 2.2 User Authentication & MFA Security Module
*   **FR-2.1**: Customers shall be able to set up Two-Factor Authentication (2FA) by scanning a generated QR code with any standard authenticator app.
*   **FR-2.2**: The system shall validate time-based one-time passwords (TOTP) during login step-up verification.
*   **FR-2.3**: The system shall generate 10 single-use Recovery Codes for alternative account access.
*   **FR-2.4**: Normal Customers shall be able to request dynamic, temporary login OTP codes sent to their email.
*   **FR-2.5**: The customer settings area shall leverage a shared sidebar shell layout (`AccountLayout`), organizing account management into distinct routes: `/dashboard`, `/profile`, `/orders`, `/wishlist`, `/addresses`, and `/settings`.
*   **FR-2.6**: The addresses page shall support full CRUD operations on user shipping destinations, allowing default selections.
*   **FR-2.7**: The system shall prevent admins from viewing raw or decrypted customer password strings.

---

### 2.3 Enterprise Administration & Inspection Module
*   **FR-3.1**: Administrators shall be able to inspect any customer's active shopping cart items, quantities, and subtotal.
*   **FR-3.2**: Administrators shall be able to inspect any customer's wishlist choices.
*   **FR-3.3**: The system shall log all administrative actions in a persistent Audit Trail, capturing previous vs updated states.
*   **FR-3.4**: Administrators shall be able to perform bulk publish, bulk archive, and bulk delete operations on products.
*   **FR-3.5**: Administrators shall be able to duplicate existing products as draft items in one click.

---

## 3. Technology Stack & Architectural Diagram

The system follows a classic **Client-Server MVC architecture** with Next.js frontend and Express/Node API backend.

```
+--------------------------------------------------------+
|                      Next.js App                       |
| (React 19, Zustand State, Framer Motion, Tailwind V4)  |
+---------------------------+----------------------------+
                            |
                     REST HTTP / JSON
                            |
                            v
+---------------------------+----------------------------+
|                    Express API Server                  |
|             (Node.js, Mongoose ODM Middleware)          |
+---------------------------+----------------------------+
                            |
                      NoSQL Queries
                            |
                            v
+---------------------------+----------------------------+
|                       MongoDB Atlas                    |
|       (Collections: Products, Users, Orders, Reviews)  |
+--------------------------------------------------------+
```

---

## 4. System Data Schemas (Mongoose Models)

### 4.0 User Schema (`User.js`)
*   `name` (String, required): Display name.
*   `email` (String, required, unique): Unique login email address.
*   `password` (String, required): Bcrypt hashed password.
*   `role` (String, enum: `customer`, `admin`): Account authority.
*   `twoFactorSecret` (String): Secure base32 secret key for TOTP authenticator validation.
*   `twoFactorEnabled` (Boolean): Active state flag for MFA.
*   `twoFactorRecoveryCodes` (Array of Strings): Single-use recovery codes.
*   `otpCode` (String): Dynamically generated temporary email verification code.
*   `otpExpiry` (Date): Expiry timestamp for the dynamic OTP.
*   `wishlist` (Array of ObjectIds ref Product): Saved items.

### 4.1 Product Schema (`Product.js`)
*   `title` (String, required, trimmed): Product title.
*   `slug` (String, unique, sparse): Auto-generated or manual URL slug.
*   `sku` / `SKU` (String, sparse): Stock keeping unit identifier.
*   `barcode` (String): EAN/UPC barcode number.
*   `description` (String, required): Full rich text description.
*   `shortDescription` (String): Brief summary.
*   `category` (String, required): Primary category string.
*   `subcategory` (String): Secondary subcategory.
*   `brand` (String, required): Brand name.
*   `tags` (Array of Strings): Product tag pills.
*   `status` (String, enum: `draft`, `published`, `archived`, default: `published`).
*   `visibility` (String, enum: `public`, `private`, `hidden`, default: `public`).
*   `featured` (Boolean, default: false).
*   `trending` (Boolean, default: false).
*   `newArrival` (Boolean, default: false).
*   `bestSeller` (Boolean, default: false).
*   `active` (Boolean, default: true).
*   `price` (Number, required, min: 0): Selling price.
*   `originalPrice` (Number): Original MSRP compare price.
*   `salePrice` (Number): Active sale price.
*   `discountPercentage` (Number, default: 0).
*   `discountAmount` (Number, default: 0).
*   `tax` (Number, default: 0): Sales tax percentage.
*   `currency` (String, default: 'USD').
*   `costPrice` (Number, default: 0): Internal manufacturing cost.
*   `profitMargin` (Number, default: 0): Calculated profit margin percentage.
*   `stock` (Number, required, min: 0, default: 0): Available stock count.
*   `reservedStock` (Number, default: 0).
*   `lowStockThreshold` (Number, default: 5).
*   `warehouse` (String, default: 'Main Warehouse').
*   `stockStatus` (String, enum: `in_stock`, `out_of_stock`, `backorder`).
*   `maxOrderQuantity` (Number, default: 10).
*   `minOrderQuantity` (Number, default: 1).
*   `allowBackorders` (Boolean, default: false).
*   `trackInventory` (Boolean, default: true).
*   `images` (Array of Strings, required): Product photo URLs.
*   `videos` (Array of Strings): Video URLs.
*   `thumbnail` (String, required): Main display cover image URL.
*   `specifications` (Map of Strings): Specs key-value pairs.
*   `attributes` (Array of objects: `name`, `value`, `group`): Custom attributes.
*   `variants` (Array of variant groups and options).
*   `variantCombinations` (Array of variant combination objects: `id`, `sku`, `price`, `stock`, `barcode`, `images`, `attributes`).
*   `shippingInfo` (Object: `estimate`, `freeShipping`, `expressShipping`, `returnPolicy`, `cost`, `weight`, `dimensions`, `shippingClass`, `packagingType`, `countryOfOrigin`, `hsCode`).
*   `seo` (Object: `metaTitle`, `metaDescription`, `keywords`, `canonicalUrl`, `ogImage`).
*   `relatedProducts` (Array of ObjectIds ref Product).
*   `bundles` (Array of ObjectIds ref Product).
*   `rating` (Number, default: 4.5).
*   `totalReviews` (Number, default: 0).
*   `reviewCount` (Number, default: 0).
*   `soldCount` (Number, default: 0).
*   `wishlistCount` (Number, default: 0).
*   `viewCount` (Number, default: 0).
*   `ratingDistribution` (Object: star counts for 5, 4, 3, 2, 1).
*   `reviews` (Array of review objects).

### 4.2 Review Schema (`Review.js`)
*   `product` (ObjectId ref Product, required): Associated product.
*   `user` (ObjectId ref User, required): Author.
*   `rating` (Number, required): Rating value from 1 to 5.
*   `comment` (String, required): Review text.
*   `images` (Array of Strings): Customer uploaded photo URLs.
*   `helpfulCount` (Number, default: 0).

---

## 5. REST API Endpoints Catalog

### 5.1 E-Commerce & Product Management Endpoints
*   `GET /api/products` - Retrieve list of products with search, status, category, brand, rating, and pagination filters.
*   `GET /api/products/:id` - Fetch product specifications by ID or slug.
*   `POST /api/products` - Create a new product (Admin only).
*   `PUT /api/products/:id` - Update an existing product (Admin only).
*   `DELETE /api/products/:id` - Soft delete/archive a product (Admin only).
*   `POST /api/products/bulk` - Perform bulk action (`delete`, `publish`, `archive`) on product IDs array (Admin only).
*   `POST /api/products/:id/duplicate` - Duplicate a product as a draft copy (Admin only).
*   `POST /api/reviews` - Submit product review with photo URLs list.
*   `GET /api/reviews/product/:id` - Get reviews list for a product.

### 5.2 Cart Endpoints
*   `GET /api/cart` - Fetch user's persistent cart database array.
*   `POST /api/cart` - Add/merge items in database cart.
*   `PUT /api/cart` - Update quantities.
*   `DELETE /api/cart/:productId` - Remove item from cart.
*   `POST /api/cart/clear` - Clear user's cart in database.

### 5.3 Authentication, MFA & Addresses Endpoints
*   `POST /api/auth/register` - Create customer account.
*   `POST /api/auth/login` - Verify standard credentials; prompts for dynamic 2FA if active.
*   `POST /api/auth/request-otp` - Request dynamic OTP code sent to user email.
*   `POST /api/auth/verify-otp` - Verify email OTP to log in passwordless.
*   `POST /api/auth/2fa/setup` - Generate 2FA secret and QR code URL for scan.
*   `POST /api/auth/2fa/enable` - Confirm verification token and activate MFA.
*   `POST /api/auth/2fa/disable` - Deactivate MFA for authenticated session.
*   `POST /api/auth/verify-2fa` - Verify time-based TOTP or recovery code input.
*   `POST /api/auth/addresses` - Add new shipping address to user profile.
*   `PUT /api/auth/addresses/:addressId` - Update a specific shipping address.
*   `DELETE /api/auth/addresses/:addressId` - Remove a specific shipping address.

### 5.4 Admin Control Endpoints
*   `GET /api/admin/dashboard` - Fetch store metrics, top products, low stock, and recent orders.
*   `GET /api/admin/users` - Retrieve all registered users.
*   `GET /api/admin/users/:id/cart` - Inspect target user's active cart.
*   `GET /api/admin/users/:id/wishlist` - Inspect target user's active wishlist.
