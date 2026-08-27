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
