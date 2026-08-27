# 🛍️ SwiftCart — Luxury Fashion & Enterprise E-Commerce Platform

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Studio-black?style=flat-square&logo=three.js)](https://threejs.org/)
[![Swagger API](https://img.shields.io/badge/Swagger-API_Docs-85EA2D?style=flat-square&logo=swagger)](http://localhost:5001/api-docs)

> **Live Preview & Demo:** [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001`)  
> **API Documentation (Swagger):** [http://localhost:5001/api-docs](http://localhost:5001/api-docs)  
> **Backend REST API:** [http://localhost:5001/api](http://localhost:5001/api)

---

## 📖 Table of Contents
1. [Overview & Value Proposition](#-overview--value-proposition)
2. [Key Features & Highlights](#-key-features--highlights)
3. [Technology Stack](#-technology-stack)
4. [Architecture & Project Structure](#-architecture--project-structure)
5. [Getting Started & Installation](#-getting-started--installation)
6. [Default Demo Credentials](#-default-demo-credentials)
7. [API Endpoints Overview](#-api-endpoints-overview)
8. [Environment Configuration](#-environment-configuration)
9. [License](#-license)

---

## 🌟 Overview & Value Proposition

**SwiftCart** is a high-end, luxury fashion and apparel e-commerce platform that pairs **Scandinavian/Ately-inspired minimalist editorial aesthetics** and **Zara-style lookbooks** with cutting-edge **3D Virtual Fitting Rooms** and **AI Commerce Intelligence**.

Built for enterprise scale, SwiftCart offers a seamless shopping experience for customers and a full-featured management dashboard for store administrators and sellers.

---

## ✨ Key Features & Highlights

### 👗 1. Customer Shopping Experience
* **Minimalist Ately & Zara Editorial Showcase**:
  * Uncluttered, spacious 3-column curated wardrobe grid with tabbed filtering (`All Pieces`, `New Drops`, `Bestsellers`, `Tops & Shirts`, `Trousers`, `Jackets & Coats`).
  * Smooth single-image zoom hover transition (`scale-105`) with neutral `#F6F5F3` garment backdrops.
  * Structured details beneath the frame: Uppercase brand tracking, live color swatches, fabric descriptors, and stock/rating indicators.
* **3D Virtual Dressing Room (`/dressing-room`)**:
  * Real-time 3D avatar fitting room powered by **Three.js**.
  * Interactive gender, skin tone, hairstyle, and body shape customization.
  * 1-click try-on for coats, knits, pants, dresses, and sneakers with 360° camera rotation.
* **Zara-Style Editorial Lookbook Reel**:
  * Horizontal lookbook panel with models against neutral stone plaster walls, oversized watermark typography, and an interactive **Look Inspector Modal**.
* **Enterprise Product Detail Page (PDP)**:
  * Image gallery with fullscreen zoom, video viewer, and color variant switching.
  * **AI Fit & Sizing Quiz**: Enter height, weight, and preferred cut for automatic size recommendation (XS–XXL).
  * **Frequently Bought Together Bundle Builder**: Automated 10% bundle discount when purchasing complementary items.
  * **Same-Day Dispatch Estimator**: Live countdown timer calculating guaranteed standard/express delivery dates.
  * **Sticky Mobile & Desktop Purchase Bar**: Floating quick-add bar with price and variant summary.
* **Smart Commerce Tools**:
  * **Multi-Product Comparison**: Side-by-side comparison modal with a *"Show Differences Only"* toggle.
  * **Instant Smart Search**: Debounced autocomplete with keyword highlighting and recent search history.
  * **Multi-Currency & Language Engine**: Dynamic price conversion (`USD`, `EUR`, `GBP`, `BDT`) and language localizer.
  * **Verified Photo Reviews**: Customer reviews with outfit photo attachments and AI sentiment rating bars.

* **Multi-Layered Security & Google Authentication**:
  * **Google OAuth 2.0 & Identity Services (GSI)**: 1-click Google sign-in modal with automatic account creation and JWT session linking.
  * **Two-Factor Authentication (2FA)**: Google Authenticator TOTP verification + emergency backup recovery codes.
  * **Passwordless Email OTP**: Secure 6-digit one-time passcodes dispatched for fast login.
  * **Brute-force Account Lockout**: Automatic 30-second security cooldown after 3 consecutive failed attempts.
* **Automated Order Invoicing & Email Notifications**:
  * **Transactional Order Confirmation**: Instant dispatch of branded, itemized HTML invoice receipts upon order placement.
  * **Dual-Mode Engine (Nodemailer)**: Zero-config **Ethereal Email** test mode with clickable live browser preview URLs, and seamless **Production SMTP** integration (Gmail, Resend, Brevo).
  * **Order Lifecycle Email Triggers**: Automatic status update emails on `Confirmed`, `Shipped`, `Delivered`, or `Cancelled`.
  * **In-App Notification Center**: Synchronized notifications stored in MongoDB with real-time notification bell counts.

---

### 🛡️ 2. Enterprise Admin & Seller Portal (`/admin`)
* **Live Store Overview**:
  * Real-time metrics for Gross Revenue, Orders Count, Customer Registrations, and Catalog Counts.
* **Comprehensive Catalog Management**:
  * Full-text search and multi-criteria filters across title, SKU, brand, and status.
  * Bulk operations: Select multiple items for Bulk Delete, Bulk Publish, and Bulk Archive.
  * CSV Inventory Export & JSON Catalog Payload Importer.
* **Order Lifecycle Control**:
  * Status progression: `Pending` ➔ `Processing` ➔ `Shipped` ➔ `Delivered` ➔ `Cancelled` (with automated customer email dispatch).
* **Security & Action Audit Trail**:
  * Real-time audit logs of administrative changes and access records.
* **Currencies & Languages Manager**:
  * Dynamic creation and rate management for global currencies and regional languages.
* **Admin Navigation & Instant Logout**:
  * Header and sidebar logout shortcuts and storefront link.

---

## 🛠 Technology Stack

### Frontend
| Technology | Description |
| :--- | :--- |
| **Next.js 16** | React framework with App Router, Turbopack, and SSR/SSG optimization |
| **React 19** | Modern UI rendering library with advanced hooks and concurrent features |
| **TypeScript 5** | End-to-end type safety and structured interfaces |
| **Tailwind CSS v4** | Utility-first CSS framework tailored for modern minimal design |
| **Framer Motion 12** | Fluid layout animations, transitions, and gesture controls |
| **Zustand 5** | Lightweight, reactive state management (Cart, Wishlist, Compare, Theme, Currencies) |
| **Three.js** | 3D avatar rendering and interactive fitting studio |
| **Lucide React** | Clean, minimalist icon set |

### Backend
| Technology | Description |
| :--- | :--- |
| **Node.js 18+** | High-performance JavaScript runtime |
| **Express.js 4** | Robust REST API server with modular routing and controllers |
| **MongoDB & Mongoose 8** | NoSQL document database with strict schema validation and populate indexing |
| **Nodemailer** | Transactional HTML email dispatch with Ethereal test preview and SMTP support |
| **JSON Web Tokens (JWT)** | Secure stateless authentication with HTTP-only cookie support |
| **Bcrypt.js** | Salted password hashing and security verification |
| **Swagger UI Express** | Interactive OpenAPI / Swagger 2.0 API documentation |
| **Helmet & Express-Rate-Limit** | Production-ready HTTP security headers and brute-force protection |

---

## 📂 Architecture & Project Structure

```text
Swift-E-commerce/
├── app/                              # Next.js App Router (Frontend)
│   ├── page.tsx                      # Minimalist Editorial Homepage
│   ├── layout.tsx                    # Root Layout with Theme & Context Providers
│   ├── products/                     # Product Catalog & Category Filter Pages
│   ├── product/[id]/                 # Enterprise Product Detail Page (PDP)
│   ├── dressing-room/                # 3D Virtual Try-On Studio (Three.js)
│   ├── admin/                        # Enterprise Management Console
│   ├── dashboard/                    # Customer Account & Orders Dashboard
│   ├── wishlist/                     # Saved Favorite Items Page
│   ├── checkout/                     # Multi-Step Localized Checkout
│   └── auth/                         # Login & Registration Pages
├── backend/                          # Express.js REST API (Backend)
│   ├── server.js                     # Server Entry Point & Swagger Configuration
│   ├── scripts/
│   │   ├── seed.js                   # Database Seeder (Catalog, Categories, Reviews)
│   │   └── seedAdmin.js              # Dedicated Admin Credentials Seeder
│   └── src/
│       ├── controllers/              # Business Logic (Products, Cart, Auth, Orders)
│       ├── middleware/               # Auth Guard, Role Verification, Error Handlers
│       ├── models/                   # Mongoose Schemas (Product, User, Cart, Order, etc.)
│       ├── routes/                   # Express API Route Handlers
│       └── utils/                    # Response formatters & helpers
├── components/                       # Reusable UI Components
│   ├── layout/                       # Navbar, Footer, MegaMenu, AccountLayout
│   ├── product/                      # ProductTable, ImageGallery, ReviewSection, VariantSelector
│   └── ui/                           # ProductCard, ZaraLookbookSection, CategorySlider, Modal, Button
├── context/                          # React Contexts (AuthContext, ToastContext)
├── data/                             # Curated High-Fashion Catalog Data
├── features/                         # AI Search, AI Recommendations, 3D Avatar Try-On
├── lib/                              # Axios API Client & Shared Utilities
├── stores/                           # Zustand Stores (Cart, Wishlist, Compare, Theme, Currency)
├── types/                            # Global TypeScript Interfaces
└── README.md                         # Project Documentation
```

---

## 🚀 Getting Started & Installation

### Prerequisites
* **Node.js** >= 18.0.0
* **MongoDB** (Local instance at `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)
* **npm** or **pnpm** / **yarn**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Nishat009/Swift-E-commerce.git
cd Swift-E-commerce
```

---

### Step 2: Set Up Backend Server
1. Navigate to the `backend` directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Seed the MongoDB Database with high-fashion catalog items, categories, and master accounts:
   ```bash
   npm run seed
   npm run seed:admin
   ```

3. Start the backend API server:
   ```bash
   npm run dev
   ```
   * The API server will be available at: **[http://localhost:5001](http://localhost:5001)**
   * Swagger Documentation is mounted at: **[http://localhost:5001/api-docs](http://localhost:5001/api-docs)**

---

### Step 3: Set Up Frontend (Next.js)
1. In a new terminal, navigate back to the root directory and install dependencies:
   ```bash
   cd ..
   npm install
   ```

2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   * The live storefront is running at: **[http://localhost:3001](http://localhost:3001)**

---

## 🔑 Default Demo Credentials

You can use the pre-configured accounts created during `npm run seed:admin`:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Master Admin** | `admin@email.com` | `12345678` | Full access to `/admin` Console, Products, Orders & Analytics |
| **Customer User** | `user@email.com` | `12345678` | Storefront browsing, 3D Studio, Cart, Wishlist & Orders |

---

## 🔌 API Endpoints Overview

The backend provides a RESTful API with interactive Swagger documentation:

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register new customer account | No |
| **POST** | `/api/auth/login` | Login with JWT token issuance | No |
| **POST** | `/api/auth/logout` | Terminate session & clear cookies | Yes |
| **GET** | `/api/auth/profile` | Retrieve active authenticated profile | Yes |
| **GET** | `/api/products` | Query catalog with search, filter, and pagination | No |
| **GET** | `/api/products/:id` | Fetch single product by ObjectId, numeric ID, or slug | No |
| **POST** | `/api/products` | Create a new catalog item | Admin |
| **PUT** | `/api/products/:id` | Update product attributes | Admin |
| **DELETE** | `/api/products/:id` | Remove product from store | Admin |
| **GET** | `/api/cart` | Retrieve user shopping bag | Yes |
| **POST** | `/api/cart` | Add product to shopping bag | Yes |
| **DELETE** | `/api/cart/:id` | Remove item from cart | Yes |
| **GET** | `/api/orders` | List customer orders / storewide orders | Yes |
| **POST** | `/api/orders` | Place new order with address and line items | Yes |
| **GET** | `/api/categories` | Retrieve all product categories | No |
| **GET** | `/api/currencies` | Retrieve live supported currencies | No |
| **GET** | `/api/languages` | Retrieve live supported languages | No |
| **GET** | `/api/admin/dashboard` | Aggregated analytics & recent orders | Admin |

> Explore the full interactive API schema at **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**.

---

## ⚙️ Environment Configuration

### Frontend (`.env.local` - Optional)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/swiftcart
JWT_SECRET=your_super_secret_jwt_key_swiftcart_2026
JWT_EXPIRE=30d
COOKIE_EXPIRE=30
FRONTEND_URL=http://localhost:3001
```

---

## 📄 License

This project is licensed under the **MIT License**. Built with craftsmanship for luxury e-commerce excellence.
