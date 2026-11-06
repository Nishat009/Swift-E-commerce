const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');

const setupSwagger = require('./utils/swagger');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./config/rateLimits');
const { maskForDemoAdmin } = require('./middleware/demoPrivacy');
const { rejectOperatorKeys } = require('./middleware/sanitizeMiddleware');

const apiRoutes = require('./routes');
const { metricsMiddleware } = require('./utils/metrics');
const { requestLogger } = require('./utils/activityLog');

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

// 3a. Gzip JSON responses (a 500-product listing is ~340 KB raw, ~40 KB gzipped)
app.use(compression({ threshold: 1024 }));

// 3b. Request metrics (admin monitoring tab)
app.use(metricsMiddleware);
// 3c. System log: every write request and every failed request (admin System Logs tab)
app.use(requestLogger);

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
// Bodies with MongoDB operator keys ({"email": {"$ne": null}}) or __proto__ keys are refused with 422
app.use(rejectOperatorKeys);

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
app.use('/api', apiLimiter);

// 6. Static files mapping (local uploads fallback folder)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 7. Route bindings
// The shared demo admin never receives real customer contact details
app.use('/api', maskForDemoAdmin);

// Every router and its mount path is listed in routes/index.js
for (const [mountPath, router] of apiRoutes) app.use(mountPath, router);

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
