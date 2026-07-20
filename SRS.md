# SwiftCart - Software Requirements Specification (SRS)

## 1. System Scope & Context
SwiftCart is a multi-tier web application combining an e-commerce catalog with a real-time draw campaign lottery module. This document describes the specifications, system structures, database schemas, and API configurations required to support the platform.

---

## 2. Functional Requirements Breakdown

### 2.1 E-Commerce Core Module
*   **FR-1.1**: The system shall retrieve catalog products dynamically from the MongoDB database, showing descriptions, brand details, stock numbers, prices, and discounts.
*   **FR-1.2**: Normal Customers shall be able to filter search listings by debounced query strings, categories, price range sliders, colors, sizes, and toggle views (grid or list modes). Active filters shall display as tags with click-to-clear options and active count indicators.
*   **FR-1.3**: The system shall support a state-retained shopping cart using client-side Zustand store sync, supporting "Save For Later" transfers, coupon codes validation (`SAVE20`, `FREESHIP`), and shipping cost estimation calculators.
*   **FR-1.4**: Normal Customers shall be able to simulate order checkout with billing/shipping addresses, payment gateways, and receive toast notifications.
*   **FR-1.5**: The system shall support a detailed Quick View modal for products, showing specifications, ratings count, low stock warnings, return policies, and delivery estimates.
*   **FR-1.6**: Administrators shall have CRUD capabilities on products, and toggle order delivery status values (`Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).

### 2.2 Lucky Draw Campaign Module
*   **FR-2.1**: Active campaigns shall display live progress based on `(ticketsSold / ticketLimit) * 100`.
*   **FR-2.2**: The system shall run live countdowns targeting campaign `drawDate`.
*   **FR-2.3**: Upon purchase of campaign-linked products, the system shall generate unique tickets prefixed with `SWIFT-TKT-[ID]`.
*   **FR-2.4**: Customers shall be able to review their tickets and view a detailed digital invoice modal with standard printing features.
*   **FR-2.5**: The system shall enforce `maxTicketsPerUser` limits during tickets purchase or automated checkout assignment.
*   **FR-2.6**: The Administrator shall trigger campaign drawings. The backend shall select a random winning ticket cryptographically from purchased entries, marking others as lost, declaring the winner, and issuing system notifications.

### 2.3 Real-Time Notification System
*   **FR-3.1**: The system shall generate in-app notifications on ticket purchases, draw completion outcomes, and congratulations notifications.
*   **FR-3.2**: Users shall review notifications through a navigation bar dropdown and mark alerts as read.

### 2.4 User Authentication & MFA Security Module
*   **FR-4.1**: Customers shall be able to setup Two-Factor Authentication (2FA) by scanning a generated QR code with any standard authenticator app.
*   **FR-4.2**: The system shall validate time-based one-time passwords (TOTP) during login step-up verification.
*   **FR-4.3**: The system shall generate 10 single-use Recovery Codes for alternative account access.
*   **FR-4.4**: Normal Customers shall be able to request dynamic, temporary login OTP codes sent to their email.
*   **FR-4.5**: The customer settings area shall leverage a shared sidebar shell layout (`AccountLayout`), organizing account management into distinct routes: `/dashboard`, `/profile`, `/orders`, `/wishlist`, `/addresses`, and `/settings`.
*   **FR-4.6**: The addresses page shall support full CRUD operations on user shipping destinations, allowing default selections.
*   **FR-4.7**: The system shall prevent admins from viewing raw or decrypted customer password strings.

### 2.5 Enterprise Administration & Inspection Module
*   **FR-5.1**: Administrators shall be able to inspect any customer's active shopping cart items, quantities, and subtotal.
*   **FR-5.2**: Administrators shall be able to inspect any customer's wishlist choices.
*   **FR-5.3**: The system shall log all administrative actions in a persistent Audit Trail, capturing previous vs updated states.

---

## 3. Technology Stack & Architectural Diagram

The system follows a classic **Client-Server MVC architecture** with decoupled Next.js frontend and Express/Node API backend.

```
+--------------------------------------------------------+
|                      Next.js App                       |
|  (React 19, Zustand State, Framer Motion, Tailwind V4) |
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
|   (Collections: Products, Campaigns, Tickets, Orders)  |
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

### 4.1 Campaign Schema (`Campaign.js`)
*   `title` (String, required): Campaign title.
*   `description` (String): Rich text details.
*   `terms` (String): Draw terms and conditions.
*   `productTitle`, `productPrice`, `productDescription`, `productImage` (Embedded): Campaign item details.
*   `linkedProducts` (Array of ObjectId ref Product): Eligible products for auto-ticket.
*   `prizeName`, `prizeDescription`, `prizeImage` (Embedded): Grand prize details.
*   `drawDate` (Date): Targeted draw execution time.
*   `ticketLimit` (Number): Maximum ticket pool.
*   `ticketsSold` (Number): Sold count.
*   `maxTicketsPerUser` (Number): Limits user holdings.
*   `status` (Enum: `draft`, `active`, `paused`, `sold-out`, `completed`, `archived`).
*   `winnerUser` (ObjectId ref User): Selected winner user.
*   `winnerTicket` (String): Winning ticket code.

### 4.2 Ticket Schema (`Ticket.js`)
*   `ticketNumber` (String, unique): Ticket code identifier.
*   `user` (ObjectId ref User): Associated buyer.
*   `campaign` (ObjectId ref Campaign): Reference to campaign.
*   `purchaseAmount` (Number): Charged cost.
*   `paymentMethod` (String): Method identifier.
*   `status` (Enum: `active`, `won`, `lost`).

### 4.3 Notification Schema (`Notification.js`)
*   `user` (ObjectId ref User): Destination client.
*   `title`, `message` (String): Alert text content.
*   `type` (Enum: `campaign_purchase`, `draw_result`, `campaign_update`, `winner_announcement`, `system`).
*   `isRead` (Boolean): Read state marker.

---

## 5. REST API Endpoints Catalog

### 5.1 Campaigns Endpoints
*   `GET /api/campaigns` - Retrieve all campaigns (status-filtered).
*   `GET /api/campaigns/:id` - Fetch campaign specifications by id.
*   `POST /api/campaigns/:id/buy` - Join lucky draw and purchase product.
*   `GET /api/campaigns/my-tickets` - Get active user's tickets ledger.

### 5.2 Admin Control Endpoints
*   `GET /api/admin/dashboard` - Fetch store metrics, top products, low stock, and recent orders.
*   `GET /api/admin/users` - Retrieve all registered users.
*   `PUT /api/admin/users/:id/role` - Update target user role (e.g. customer vs admin).
*   `DELETE /api/admin/users/:id` - Delete user account.
*   `GET /api/admin/users/:id/cart` - Inspect target user's active cart.
*   `GET /api/admin/users/:id/wishlist` - Inspect target user's active wishlist.
*   `GET /api/campaigns/admin/analytics` - Fetch global store draw metrics.
*   `POST /api/campaigns/admin/create` - Instantiate new campaign catalog.
*   `PUT /api/campaigns/admin/:id` - Update campaign variables.
*   `PUT /api/campaigns/admin/:id/status` - Transition campaign status workflow.
*   `POST /api/campaigns/admin/:id/draw` - Execute random lottery winner draw.

### 5.3 Notifications Endpoints
*   `GET /api/notifications` - Retrieve customer's notifications.
*   `GET /api/notifications/unread-count` - Get counts of unread alerts.
*   `PUT /api/notifications/:id/read` - Mark specific notification as read.
*   `PUT /api/notifications/read-all` - Mark all notifications as read.

### 5.4 Authentication, MFA & Addresses Endpoints
*   `POST /api/auth/register` - Create customer account.
*   `POST /api/auth/login` - Verify standard credentials; prompts for dynamic 2FA if active.
*   `POST /api/auth/request-otp` - Request dynamic OTP code sent to user email.
*   `POST /api/auth/verify-otp` - Verify email OTP to log in passwordless.
*   `POST /api/auth/2fa/setup` - Generate 2FA secret and QR code URL for scan.
*   `POST /api/auth/2fa/enable` - Confirm verification token and active MFA.
*   `POST /api/auth/2fa/disable` - Deactivate MFA for authenticated session.
*   `POST /api/auth/verify-2fa` - Verify time-based TOTP or recovery code input.
*   `POST /api/auth/addresses` - Add new shipping address to user profile.
*   `PUT /api/auth/addresses/:addressId` - Update a specific shipping address.
*   `DELETE /api/auth/addresses/:addressId` - Remove a specific shipping address.
