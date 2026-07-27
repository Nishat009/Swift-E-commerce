# SwiftCart - Software Requirements Specification (SRS)

## 1. System Scope & Context
SwiftCart is a multi-tier web application combining an e-commerce catalog with advanced interactive visual elements, fuzzy search algorithms, and persistent authentication models. This document describes the specifications, structures, database schemas, and API configurations required to support the platform.

---

## 2. Functional Requirements Breakdown

### 2.1 E-Commerce Core Module
*   **FR-1.1**: The system shall retrieve catalog products dynamically from the MongoDB database, showing descriptions, brand details, stock numbers, prices, and discounts.
*   **FR-1.2**: Normal Customers shall be able to filter search listings by debounced query strings, categories, price range sliders, colors, sizes, and toggle views (grid or list modes). Active filters shall display as tags with click-to-clear options and active count indicators.
*   **FR-1.3**: The system shall support a state-retained shopping cart using client-side Zustand store sync, supporting "Save For Later" transfers, coupon codes validation (`SAVE20`, `FREESHIP`), and shipping cost estimation calculators.
*   **FR-1.4**: Normal Customers shall be able to simulate order checkout with billing/shipping addresses, payment gateways, and receive toast notifications.
*   **FR-1.5**: The system shall support a detailed Quick View modal for products, showing specifications, ratings count, low stock warnings, return policies, and delivery estimates.
*   **FR-1.6**: Administrators shall have CRUD capabilities on products, and toggle order delivery status values (`Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).
*   **FR-1.7**: The system shall support price localization, allowing customers to switch active currencies (USD, EUR, GBP) and format prices automatically.
*   **FR-1.8**: The PDP shall display Frequently Bought Together bundles, applying a 10% discount and supporting single-click batch cart addition.
*   **FR-1.9**: The PDP shall house an AI Sizing Advisor quiz calculating optimal size matches (XS to XXL) from height, weight, and fit inputs, with automated variant selection.
*   **FR-1.10**: The PDP shall support a Back-in-Stock email subscription capture form for out-of-stock items.
*   **FR-1.11**: The product details gallery shall support a 360° interactive view cycling product image frames via horizontal drag gestures.
*   **FR-1.12**: Product reviews shall support photo URL attachments, display a shared outfit gallery, render automated AI Pros/Cons sentiment tags, and limit helpful upvoting to once per user.
*   **FR-1.13**: Search fields shall utilize Levenshtein distance matching to suggest fuzzy search corrections when initial queries return empty. Focus states shall trigger dropdown panels displaying recent search histories and trending tags.
*   **FR-1.14**: The checkout system shall execute auto-applied promotions: subtracting $30 on orders of $300+, and setting shipping free for orders of $100+.
*   **FR-1.15**: The comparison modal shall display an interactive SVG radar chart mapping price value, ratings, specifications count, stock levels, and tags popularity.
*   **FR-1.16**: The client cart store shall automatically sync local guest cart items to the database cart upon successful user login.

### 2.2 User Authentication & MFA Security Module
*   **FR-2.1**: Customers shall be able to setup Two-Factor Authentication (2FA) by scanning a generated QR code with any standard authenticator app.
*   **FR-2.2**: The system shall validate time-based one-time passwords (TOTP) during login step-up verification.
*   **FR-2.3**: The system shall generate 10 single-use Recovery Codes for alternative account access.
*   **FR-2.4**: Normal Customers shall be able to request dynamic, temporary login OTP codes sent to their email.
*   **FR-2.5**: The customer settings area shall leverage a shared sidebar shell layout (`AccountLayout`), organizing account management into distinct routes: `/dashboard`, `/profile`, `/orders`, `/wishlist`, `/addresses`, and `/settings`.
*   **FR-2.6**: The addresses page shall support full CRUD operations on user shipping destinations, allowing default selections.
*   **FR-2.7**: The system shall prevent admins from viewing raw or decrypted customer password strings.

### 2.3 Enterprise Administration & Inspection Module
*   **FR-3.1**: Administrators shall be able to inspect any customer's active shopping cart items, quantities, and subtotal.
*   **FR-3.2**: Administrators shall be able to inspect any customer's wishlist choices.
*   **FR-3.3**: The system shall log all administrative actions in a persistent Audit Trail, capturing previous vs updated states.

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
|             (Node.js, Mongoose Middleware)             |
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
*   `title` (String, required): Product title.
*   `description` (String, required): Full description.
*   `category` (String, required): Category string.
*   `brand` (String, required): Manufacturer brand.
*   `price` (Number, required): Default pricing.
*   `stock` (Number, required): Inventory counts.
*   `thumbnail` (String, required): Main image asset.
*   `images` (Array of Strings): Alternative image assets for galleries and 360 degree rotation.

### 4.2 Review Schema (`Review.js`)
*   `product` (ObjectId ref Product, required): Associated product.
*   `user` (ObjectId ref User, required): Author.
*   `rating` (Number, required): Rating value from 1 to 5.
*   `comment` (String, required): Review text.
*   `images` (Array of Strings): Customer uploaded photo URLs.

---

## 5. REST API Endpoints Catalog

### 5.1 E-Commerce Catalog Endpoints
*   `GET /api/products` - Retrieve list of products with filters.
*   `GET /api/products/:id` - Fetch product specifications.
*   `POST /api/reviews` - Submit product reviews (with optional photos list).
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
*   `POST /api/auth/2fa/setup` - Generate 2FA secret and QR code URL for scan (16-char Base32 aligned).
*   `POST /api/auth/2fa/enable` - Confirm verification token and active MFA.
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
