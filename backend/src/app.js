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

const app = express();


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
    
    if (allowedOrigins.includes(cleanedOrigin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Incoming origin: "${origin}" is not in the allowed list:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Logger Middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// 4. Body parser and Cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 5. Rate Limiter (protect against brute force attacks)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
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

// 8. Swagger documentation endpoint
setupSwagger(app);

// Default test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SwiftCart E-Commerce REST API' });
});

// 9. Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
