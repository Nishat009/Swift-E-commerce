const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const setupSwagger = require('./utils/swagger');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const enterpriseRoutes = require('./routes/enterpriseRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const languageRoutes = require('./routes/languageRoutes');
const heroRoutes = require('./routes/heroRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const contactRoutes = require('./routes/contactRoutes');
const chatRoutes = require('./routes/chatRoutes');
const wardrobeRoutes = require('./routes/wardrobeRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const imageAssetRoutes = require('./routes/imageAssetRoutes');
const { metricsMiddleware } = require('./utils/metrics');

const app = express();


// Behind Render/Railway/Vercel-style proxies: use the real client IP for rate limits and logs
const trustProxy = process.env.TRUST_PROXY ?? (process.env.NODE_ENV === 'production' ? '1' : '');
if (trustProxy) app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);

// 1. Security HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading images locally
}));

// 2. CORS configuration (allow frontend to pass credentials)
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim().replace(/\/$/, ''))
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl/postman)
    if (!origin) return callback(null, true);
    
    const cleanedOrigin = origin.replace(/\/$/, '');
    
    if (allowedOrigins.includes(cleanedOrigin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Incoming origin: "${origin}" is not in the allowed list:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Logger Middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// 3b. Request metrics (admin monitoring tab)
app.use(metricsMiddleware);

// 4. Body parser and Cookie parser
// Keep the raw body for the Stripe webhook signature check
// 2mb leaves room for bulk product imports (CSV / JSON)
app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    if (req.originalUrl && req.originalUrl.startsWith('/api/payments/stripe/webhook')) req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Query strings are plain text: "a[]=x&a[]=y" becomes "x,y", and operator objects like ?price[$gt]=0 are refused
app.use((req, res, next) => {
  for (const [key, value] of Object.entries(req.query)) {
    if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      req.query[key] = value.join(',');
    } else if (value !== null && typeof value === 'object') {
      return res.status(400).json({ success: false, code: 400, status: 400, message: `Invalid query parameter "${key}"` });
    }
  }
  next();
});

// 5. Rate Limiter (protect against brute force attacks)
// General API limit. A single page load makes 10-20 calls, so this is sized for real browsing;
// sign-in, OTP and payment routes keep their own much stricter limiters.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.API_RATE_LIMIT) || 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again in a few minutes' }
});
app.use('/api', limiter);

// 6. Static files mapping (local uploads fallback folder)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 7. Route bindings
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/image-assets', imageAssetRoutes);

// 8. Swagger documentation endpoint
if (process.env.NODE_ENV !== 'production') setupSwagger(app);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// Default test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SwiftCart E-Commerce REST API' });
});

// 9. Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
