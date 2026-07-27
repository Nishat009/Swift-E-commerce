# SwiftCart - Business Requirements Document (BRD)

## 1. Executive Summary & Project Purpose
SwiftCart is a state-of-the-art e-commerce platform designed to offer high-end luxury fashion shopping integrated with interactive virtual try-on modules and premium catalog experiences. The system aims to maximize user engagement, drive product sales, and provide a seamless localized buying experience. 

This document outlines the business objectives, core user profiles, and detailed descriptions of all features from both customer and administrator perspectives.

---

## 2. Business Objectives
*   **Increase Conversion Rates**: Enhance the buying experience with 360° rotation galleries, outfit bundles, and a virtual try-on room.
*   **Boost Order Value**: Encourage customer additions via Frequently Bought Together bundles offering a 10% discount.
*   **Customer Retention**: Keep users returning with personalized fit quiz tools and auto-applied promotions.
*   **Dynamic Localization**: Support cross-border transactions through dynamic multi-currency localizations (USD, EUR, GBP).
*   **Administrative Transparency**: Provide clean management of catalogs, user session tracking, audit logs, and analytics.

---

## 3. User Profiles & Perspectives

The system serves two main user profiles:
1.  **Normal Customer (End User)**: Interested in purchasing items, utilizing local currency selectors, taking size fit quizzes, checking out with auto-applied promos, and reading verified review cards.
2.  **Store Administrator (Admin)**: Responsible for overall business operations, catalog updates, order state flow control, user session inspections, and auditing system modifications.

---

## 4. Core Features & Business Logic

### Feature 1: Product Catalog & E-Commerce Core
*   **Normal Customer View**:
    *   Browse fashion products using debounced autocomplete suggestions, price range sliders, color/size check filters, and responsive mobile drawers.
    *   Manage active filter tags dynamically with single-click clear options and total active counts.
    *   Inspect product details quickly using a popup Quick View modal showing specifications, ratings, low stock warnings, return policies, and delivery estimates.
    *   Add items to the shopping cart, apply coupon code discounts (e.g., `SAVE20`, `FREESHIP`), estimate shipping fees, and save items in a "Save For Later" storage deck.
    *   Save desired items to a personal wishlist synchronized directly with the database.
    *   Select active local currencies (USD `$`, EUR `€`, GBP `£`) in the Navbar, converting all prices across the platform instantly.
*   **Admin View**:
    *   Create, edit, and delete catalog products.
    *   Configure pricing, inventory counts, discount percentages, and media assets.
    *   Update order statuses (e.g., Pending, Confirmed, Processing, Shipped, Delivered, Cancelled).

### Feature 2: Frequently Bought Together Bundle Builder
*   **Normal Customer View**:
    *   View cross-sell bundles on the product details page linking the active item with two related look recommendations.
    *   Select/deselect individual recommendations with checkboxes.
    *   Receive an automated **10% discount** when purchasing the bundle.
    *   Add all checked bundle items to the cart in a single click.

### Feature 3: AI Size & Fit Advisor
*   **Normal Customer View**:
    *   Access a Fit Quiz sizing modal next to variants on the PDP.
    *   Input height, weight, and fit preference (tight, regular, loose) to receive a size recommendation (XS to XXL) matching customer proportions.
    *   Apply the recommendation instantly, updating the selected variant in one click.

### Feature 4: Back-in-Stock Capture Alerts
*   **Normal Customer View**:
    *   View a restock subscription box on out-of-stock product detail layouts.
    *   Submit email addresses to be notified automatically when stock is refilled.

### Feature 5: 360° Interactive Drag Rotation Gallery
*   **Normal Customer View**:
    *   Toggle between standard image preview and a 360° interactive drag gallery.
    *   Drag horizontally across the active image container to sequence through the alternative image frames of the product.

### Feature 6: Verified Customer Image Reviews & Sentiment Analyzer
*   **Normal Customer View**:
    *   Read reviews with buyer-uploaded outfit photos and an automated AI Pros & Cons highlights box summarizing overall feedback sentiment.
    *   Submit reviews attaching photo URLs (comma-separated).
    *   Upvote reviews as helpful, locked to a single vote per user per review.

### Feature 7: Typo-Tolerant Search & Recent Suggestions History
*   **Normal Customer View**:
    *   Utilize debounced search input fields suggesting category, brand, and item matches.
    *   Experience fuzzy Levenshtein search corrections (e.g. searching "shos" returns suggestions for "shoes") and a "Search anyway" override button.
    *   View list of recent search history and trending tag triggers when focusing the empty search bar.

### Feature 8: Auto-Applied Promotion Rules Engine
*   **Normal Customer View**:
    *   Receive auto-applied discounts on checkout without entering coupon codes:
        *   **Spend & Save Promo**: Automatically deducts $30 for cart subtotals of $300 or more.
        *   **Free Shipping Promo**: Automatically gets free shipping for cart subtotals of $100 or more.

### Feature 9: Interactive SVG Comparison Radar Chart
*   **Normal Customer View**:
    *   Compare products side-by-side inside the comparison modal.
    *   Inspect a custom SVG radar chart mapping price value, rating, specifications count, stock levels, and tags popularity.

### Feature 10: Persistent Guest Cart Syncing
*   **Normal Customer View**:
    *   Add items to the shopping cart as a guest. Upon successful login, guest cart items are automatically merged into the customer's persistent database cart.

### Feature 11: Unified Account Manager `/dashboard`
*   **Normal Customer View**:
    *   Manage personal settings via a unified layout:
        *   **Dashboard Overview**: View stats cards (orders, wishlist, cart) and recent order feed.
        *   **Profile Editor**: Edit contact info and primary address.
        *   **Orders History**: Track shipments, print invoice documents, and cancel pending orders.
        *   **Addresses Manager**: CRUD operations on multiple addresses.
        *   **Security Settings**: Toggle Two-Factor Authentication (2FA) scan secrets and manage recovery codes.

### Feature 12: Enterprise User Session Inspection
*   **Admin View**:
    *   Inspect active user shopping carts, wishlist selections, and orders history.
    *   Review system audit trails tracking historical changes, responsibilities, and before/after values object diff.

---

## 5. Technology Stack Summary
*   **Frontend**: React 19, Next.js 16 (App Router), Zustand (State Management), Framer Motion (Animations), Tailwind CSS 4.
*   **Backend**: Node.js, Express.js (REST API, MVC Pattern), Mongoose.
*   **Authentication & Security**: Custom zero-dependency TOTP validation (Node's `crypto` module), JWT token verification, dynamic email-based OTP dispatch.
*   **Database**: MongoDB (NoSQL) for campaigns, tickets, orders, reviews, audit trails, and catalog items.
