const ActivityLog = require('../models/ActivityLog');
const AuditTrail = require('../models/AuditTrail');
const RequestLog = require('../models/RequestLog');

// Category for the log filters, guessed from the action name when the caller does not give one
const CATEGORY_HINTS = [
  [/refund/i, 'refund'],
  [/wallet|fund|account/i, 'wallet'],
  [/order|return|payment/i, 'order'],
  [/product|stock|categor|import/i, 'product'],
  [/campaign|draw|ticket/i, 'campaign'],
  [/coupon|email|newsletter|hero/i, 'marketing'],
  [/login|logout|password|2fa|two.factor|sign/i, 'auth'],
  [/user|role/i, 'user'],
];
const categoryFor = (action) => (CATEGORY_HINTS.find(([re]) => re.test(action)) || [])[1] || 'other';

// Record something a signed-in person did (staff or customer). Never throws: logging must not
// break the action itself.
const logActivity = async (req, action, details, category) => {
  try {
    if (!req || !req.user) return;
    await ActivityLog.create({
      adminUser: req.user.id || req.user._id,
      actorRole: req.user.role === 'admin' ? 'admin' : 'customer',
      category: category || categoryFor(action),
      action,
      details,
      ipAddress: req.ip || '127.0.0.1'
    });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
};

// Record something the system did on its own (payment webhooks, scheduled jobs)
const logSystem = async (action, details, category) => {
  try {
    await ActivityLog.create({ adminUser: null, actorRole: 'system', category: category || categoryFor(action), action, details, ipAddress: '' });
  } catch (err) {
    console.error('System log failed:', err.message);
  }
};

// Record a before/after audit entry for Product / Order / Campaign documents.
const logAudit = async (req, entityType, entityId, changeSummary, previousState, newState) => {
  try {
    if (!req || !req.user) return;
    await AuditTrail.create({
      entityType,
      entityId,
      changedBy: req.user.id || req.user._id,
      changeSummary,
      previousState,
      newState
    });
  } catch (err) {
    console.error('Audit trail failed:', err.message);
  }
};

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
// Noisy or sensitive endpoints that add nothing to the trail
const SKIP_PATHS = [/^\/api\/payments\/stripe\/webhook/, /^\/api\/auth\/refresh/, /^\/api\/auth\/google\/challenge/, /^\/api\/notifications\/.*read/];

// Express middleware: one RequestLog line for every write request and every failed request
const requestLogger = (req, res, next) => {
  if (!req.originalUrl.startsWith('/api/')) return next();
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const path = req.originalUrl.split('?')[0];
    const failed = res.statusCode >= 400;
    if (!WRITE_METHODS.includes(req.method) && !failed) return;
    if (SKIP_PATHS.some((re) => re.test(path))) return;
    if (res.statusCode === 404 && !req.user) return; // bots probing for files
    const user = req.user || res.locals.sessionUser || null;
    RequestLog.create({
      method: req.method,
      path: path.slice(0, 300),
      statusCode: res.statusCode,
      durationMs: Math.round(Number(process.hrtime.bigint() - started) / 1e6),
      user: user ? user._id || user.id : null,
      userEmail: user?.email || '',
      userRole: user?.role || 'guest',
      ipAddress: req.ip || '',
      userAgent: String(req.get('user-agent') || '').slice(0, 200),
    }).catch((err) => console.error('Request log failed:', err.message));
  });
  next();
};

// Entries written before actorRole existed: label them from the user's current role (runs at startup,
// touches only those old entries)
const backfillActorRoles = async () => {
  try {
    const User = require('../models/User');
    const missing = { actorRole: { $exists: false } };
    const ids = await ActivityLog.distinct('adminUser', missing);
    if (!ids.length) return;
    const customers = await User.find({ _id: { $in: ids }, role: { $ne: 'admin' } }).select('_id').lean();
    if (customers.length) {
      await ActivityLog.updateMany({ ...missing, adminUser: { $in: customers.map((u) => u._id) } }, { $set: { actorRole: 'customer' } });
    }
    await ActivityLog.updateMany(missing, { $set: { actorRole: 'admin' } });
  } catch (err) {
    console.error('Activity log backfill failed:', err.message);
  }
};

module.exports = { logActivity, logSystem, logAudit, requestLogger, backfillActorRoles };
