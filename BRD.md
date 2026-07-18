# SwiftCart - Business Requirements Document (BRD)

## 1. Executive Summary & Project Purpose
SwiftCart is a state-of-the-art e-commerce platform designed to offer high-end luxury fashion shopping integrated with an interactive **Prize Campaign (Lucky Draw)** marketing module. The system aims to maximize user engagement, drive product sales, and provide a gamified shopping experience. Customers buy regular fashion products and automatically receive free, cryptographic lucky draw entries to win luxury rewards (e.g., cars, watches, high-end electronics).

This document outlines the business objectives, core user profiles, and detailed descriptions of all features from both customer and administrator perspectives.

---

## 2. Business Objectives
*   **Increase Conversion Rates**: Gamify the buying experience by tying products to high-value prizes.
*   **Boost Order Value**: Encourage customers to buy more items to collect multiple entries and increase their winning odds.
*   **Customer Retention**: Keep users returning to view drawing results, check live countdowns, and claim rewards.
*   **Administrative Transparency**: Provide clean management of campaigns, automated random draws, and transparent winners history.

---

## 3. User Profiles & Perspectives

The system serves two main user profiles:
1.  **Normal Customer (End User)**: Interested in purchasing items, tracking order deliveries, managing their draw entries, checking campaign countdowns, and viewing notification updates.
2.  **Store Administrator (Admin)**: Responsible for overall business operations, catalog updates, order state flow control, managing drawing parameters, conducting automated drawings, and checking sales analytics.

---

## 4. Core Features & Business Logic

### Feature 1: Product Catalog & E-Commerce Core
*   **Normal Customer View**:
    *   Browse fashion products across categories.
    *   Add items to the shopping cart, apply promo codes, and complete simulated checkout.
    *   Save desired items to a personal wishlist.
*   **Admin View**:
    *   Create, edit, and delete catalog products.
    *   Configure pricing, inventory counts, discount percentages, and media assets.
    *   Update order statuses (e.g., Pending, Confirmed, Packed, Shipped, Delivered).

### Feature 2: Prize Campaigns (Lucky Draws)
*   **Normal Customer View**:
    *   View active campaigns, current ticket sales progress bars, and countdown timers to the drawing.
    *   Purchase an eligible campaign product and automatically get lucky draw tickets.
    *   View a clean ticket vault with serial codes and print digital invoices.
    *   Explore a transparent Winners Gallery highlighting previous drawings and proof of winner verification.
*   **Admin View**:
    *   Launch new campaign programs with prize names, rules, ticket limits, and target draw dates.
    *   Conduct the lottery draw with a secure, server-side random selection.
    *   Automatically distribute status flags to winning and losing tickets.

### Feature 3: Smart Notification Center
*   **Normal Customer View**:
    *   Real-time notifications dropdown in the navigation menu for coupon alerts, checkout confirmations, drawing completions, and winner declarations.
*   **Admin View**:
    *   Trigger automated broadcasts to all participants of a draw campaign when a winner is chosen.

### Feature 4: Interactive Avatar Fitting Room
*   **Normal Customer View**:
    *   Select active products (clothing, items) and try them on a 3D avatar canvas in real-time.
*   **Admin View**:
    *   Categorize compatible products as try-on assets.

---

## 5. Technology Stack Summary
*   **Frontend**: React 19, Next.js 16 (App Router), Zustand (State Management), Framer Motion (Animations), Tailwind CSS 4.
*   **Backend**: Node.js, Express.js (REST API, MVC Pattern), Mongoose.
*   **Database**: MongoDB (NoSQL) for campaigns, tickets, orders, reviews, and catalog items.
