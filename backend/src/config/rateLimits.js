// Every rate limit in one place. Public endpoints (sign-in, contact, newsletter, chat,
// back-in-stock alerts) rely on these instead of authentication.
const rateLimit = require('express-rate-limit');

const MINUTE = 60 * 1000;

// name -> window, maximum requests per IP in that window, message shown when it is reached
const LIMITS = {
  api: { windowMs: 15 * MINUTE, max: Number(process.env.API_RATE_LIMIT) || 2000, message: 'Too many requests from this IP, please try again in a few minutes' },
  signIn: { windowMs: 10 * MINUTE, max: 60, message: 'Too many sign-in attempts. Please try again in ten minutes.' },
  verify: { windowMs: 15 * MINUTE, max: 20, message: 'Too many verification attempts. Please try again later.' },
  // Session refresh and logout: a page load refreshes at most once, so this only stops floods
  session: { windowMs: 15 * MINUTE, max: 120, message: 'Too many session requests. Please try again in a few minutes.' },
  otpRequest: { windowMs: 15 * MINUTE, max: 10, message: 'Too many requests. Please try again later.' },
  customerEmail: { windowMs: 15 * MINUTE, max: 30, message: 'Too many emails sent in a short time. Please wait a few minutes.' },
  chat: { windowMs: 15 * MINUTE, max: 60, message: 'Too many chat messages. Please wait a moment and try again.' },
  contact: { windowMs: 60 * MINUTE, max: 5, message: 'Too many messages sent. Please try again in an hour.' },
  subscribe: { windowMs: 15 * MINUTE, max: 10, message: 'Too many requests. Please try again later.' },
  notify: { windowMs: 15 * MINUTE, max: 20, message: 'Too many requests. Please try again later.' },
};

const limiter = ({ windowMs, max, message }) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message },
});

module.exports = {
  LIMITS,
  apiLimiter: limiter(LIMITS.api),
  signInLimiter: limiter(LIMITS.signIn),
  verifyLimiter: limiter(LIMITS.verify),
  sessionLimiter: limiter(LIMITS.session),
  otpRequestLimiter: limiter(LIMITS.otpRequest),
  customerEmailLimiter: limiter(LIMITS.customerEmail),
  chatLimiter: limiter(LIMITS.chat),
  contactLimiter: limiter(LIMITS.contact),
  subscribeLimiter: limiter(LIMITS.subscribe),
  notifyLimiter: limiter(LIMITS.notify),
};
