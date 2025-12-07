# 🛒 SwiftCart – Modern E-Commerce Web Application

A modern, high-performance e-commerce web application built with **Next.js**, **React**, and **Tailwind CSS**. This project demonstrates complete frontend capabilities including UI/UX design, state management, product handling, filtering, cart operations, and responsive layouts.

![SwiftCart](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)

---

## ✨ Features

### 🔍 **Product Listing Page**
- Grid & list view layouts with smooth transitions
- Category-wise filtering
- Price range filter with real-time updates
- Search with debounce functionality
- Product pagination
- Hover effects & quick preview
- Responsive design for all screen sizes

### 📝 **Product Detail Page**
- Interactive image gallery with zoom functionality
- Detailed product description
- Real-time stock status
- Customer ratings & reviews section
- "Related Products" recommendations
- Quantity selector with stock validation

### 🛒 **Advanced Shopping Cart**
- Add / remove products with smooth animations
- Quantity update with dynamic total calculation
- Persistent cart using localStorage (Zustand)
- Cart drawer with slide-in animation
- Full cart page with detailed view
- Discount & tax calculation
- Free shipping threshold indicator

### 📦 **Checkout Flow**
- Multi-step checkout (Address → Payment → Confirmation)
- Form validation with error handling
- Order summary with breakdown
- Responsive mobile-first UI
- Progress indicator

### 👤 **User Authentication**
- Login / Register pages
- Protected routes (Profile, Orders)
- Session handling
- Form validation

### 📱 **Fully Responsive UI**
- Mobile-first design approach
- Breakpoint-based layouts
- Tailwind utility classes for performance
- Touch-friendly interactions

### ⚙️ **State Management**
- Global state using Zustand
- Persistent storage with localStorage
- Optimistic updates
- Cart synchronization

### 🌙 **Dark / Light Theme Toggle**
- Persistent theme preference
- Smooth theme transitions
- System preference detection
- Custom Tailwind theme extension

### 🎨 **UI/UX Enhancements**
- Smooth animations with Framer Motion
- Loading skeletons
- Error states
- Empty states
- Hover effects
- Image zoom functionality

---

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Image Optimization:** Next.js Image
- **Form Handling:** React Hooks

---

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd swiftcart
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Project Structure

```
swiftcart/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── cart/              # Shopping cart page
│   ├── checkout/          # Checkout flow
│   ├── orders/            # Order history
│   ├── product/           # Product detail pages
│   ├── products/          # Product listing page
│   └── layout.tsx         # Root layout
├── components/
│   ├── layout/            # Layout components (Navbar, Footer)
│   └── ui/               # Reusable UI components
├── data/
│   └── mockData.ts       # Mock data for products, reviews
├── lib/
│   ├── api.ts            # API functions (using mock data)
│   └── utils.ts          # Utility functions
├── stores/
│   ├── cartStore.ts      # Zustand cart store
│   └── themeStore.ts     # Zustand theme store
└── types/
    └── index.ts          # TypeScript type definitions
```

---

## 🎯 Key Features Implementation

### Product Listing
- **Filtering:** Category, price range, and search
- **Sorting:** Price (low to high, high to low), rating
- **Pagination:** Efficient product loading
- **View Modes:** Grid and list layouts

### Shopping Cart
- **State Management:** Zustand with persistence
- **Cart Drawer:** Slide-in panel with animations
- **Quantity Control:** Increment/decrement with validation
- **Price Calculation:** Subtotal, tax, shipping, total

### Product Details
- **Image Gallery:** Multiple images with thumbnail navigation
- **Image Zoom:** Hover to zoom functionality
- **Reviews:** Customer reviews with ratings
- **Related Products:** Category-based recommendations

### Checkout Process
- **Multi-step Form:** Address → Payment → Confirmation
- **Validation:** Real-time form validation
- **Order Summary:** Live price calculations
- **Success State:** Confirmation page with order details

---

## 🎨 Design Features

- **Modern UI:** Clean, minimalist design
- **Dark Mode:** Full dark theme support
- **Animations:** Smooth transitions and micro-interactions
- **Responsive:** Mobile-first, works on all devices
- **Accessibility:** ARIA labels, keyboard navigation
- **Performance:** Optimized images, lazy loading

---

## 📱 Responsive Breakpoints

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

---

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

---

## 🚀 Deployment

This project is ready to deploy on **Vercel**:

1. Push your code to GitHub
2. Import your repository on Vercel
3. Deploy with one click

Or deploy manually:

```bash
npm run build
npm run start
```

---

## 📝 Development Notes

### Mock Data
Currently using mock data for demonstration. The project structure is ready for backend integration:
- API functions in `lib/api.ts` can be easily replaced with real API calls
- Mock data in `data/mockData.ts` can be removed once backend is connected
- All components are designed to work with real data structures

### State Management
- **Cart:** Zustand store with localStorage persistence
- **Theme:** Zustand store with localStorage persistence
- **UI State:** Local component state with React hooks

### Performance Optimizations
- Next.js Image optimization
- Code splitting
- Lazy loading
- Debounced search
- Memoized calculations

---

## 🎓 Learning Resources

This project demonstrates:
- Next.js App Router patterns
- TypeScript best practices
- Tailwind CSS utility-first approach
- Zustand state management
- Framer Motion animations
- Responsive design principles
- Form validation
- Error handling

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

Built with ❤️ for portfolio demonstration

---

## 🙏 Acknowledgments

- Design inspiration from modern e-commerce platforms
- Icons from [Lucide](https://lucide.dev/)
- Images from [Unsplash](https://unsplash.com/)

---

**Note:** This is a frontend-only implementation using mock data. Backend integration can be added later for full functionality.
# Swift-E-commerce
