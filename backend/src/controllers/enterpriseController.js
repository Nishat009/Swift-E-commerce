const os = require('os');
const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { getMetrics } = require('../utils/metrics');
const AuditTrail = require('../models/AuditTrail');
const RequestLog = require('../models/RequestLog');
const { sendSuccess, sendError } = require('../utils/response');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pageParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};
// from / to are calendar days; "to" includes the whole day
const dateRange = (query) => {
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;
  const range = {};
  if (from && !isNaN(from)) range.$gte = from;
  if (to && !isNaN(to)) range.$lt = new Date(to.getTime() + 24 * 60 * 60 * 1000);
  return Object.keys(range).length ? range : null;
};

// @desc    System activity log: staff, customer and automatic events
// @route   GET /api/enterprise/logs   ?page&limit&role=admin|customer|system&category&q&from&to
// @access  Private/Admin
const getActivityLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = pageParams(req.query);
    const filter = {};
    if (ActivityLog.schema.path('actorRole').enumValues.includes(req.query.role)) {
      // Entries written before roles existed were all staff actions
      filter.actorRole = req.query.role === 'admin' ? { $in: ['admin', null] } : req.query.role;
    }
    if (ActivityLog.schema.path('category').enumValues.includes(req.query.category)) filter.category = req.query.category;
    const createdAt = dateRange(req.query);
    if (createdAt) filter.createdAt = createdAt;
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
    if (q) {
      const re = new RegExp(escapeRegex(q), 'i');
      const users = await User.find({ $or: [{ name: re }, { email: re }] }).select('_id').limit(50).lean();
      filter.$or = [{ action: re }, { details: re }, { adminUser: { $in: users.map((u) => u._id) } }];
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).populate('adminUser', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(limit),
      ActivityLog.countDocuments(filter),
    ]);
    return sendSuccess(res, 'Activity logs retrieved', logs, 200, {
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    API request trail: every write request and every failed request
// @route   GET /api/enterprise/request-logs   ?page&limit&method&status=2xx|4xx|5xx&role&q&from&to
// @access  Private/Admin
const getRequestLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = pageParams(req.query);
    const filter = {};
    if (['POST', 'PUT', 'PATCH', 'DELETE', 'GET'].includes(req.query.method)) filter.method = req.query.method;
    const statusClass = { '2xx': [200, 300], '3xx': [300, 400], '4xx': [400, 500], '5xx': [500, 600] }[req.query.status];
    if (statusClass) filter.statusCode = { $gte: statusClass[0], $lt: statusClass[1] };
    if (['admin', 'customer', 'guest'].includes(req.query.role)) filter.userRole = req.query.role;
    const createdAt = dateRange(req.query);
    if (createdAt) filter.createdAt = createdAt;
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
    if (q) {
      const re = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ path: re }, { userEmail: re }, { ipAddress: re }];
    }
    const [logs, total] = await Promise.all([
      RequestLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      RequestLog.countDocuments(filter),
    ]);
    return sendSuccess(res, 'Request logs retrieved', logs, 200, {
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit trail for a specific entity
// @route   GET /api/enterprise/audit/:entityType/:entityId
// @access  Private/Admin
const getEntityAuditTrail = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    if (!AuditTrail.schema.path('entityType').enumValues.includes(entityType) || !require('mongoose').isValidObjectId(entityId)) {
      return sendError(res, 'Unknown audit entity', 404);
    }
    const trail = await AuditTrail.find({ entityType, entityId })
      .populate('changedBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Audit trail retrieved', trail);
  } catch (error) {
    next(error);
  }
};

// @desc    Get system monitoring performance indicators
// @route   GET /api/enterprise/monitoring-stats
// @access  Private/Admin
const getMonitoringStats = async (req, res, next) => {
  try {
    // CPU usage sampled over a short window (os.loadavg is always 0 on Windows)
    const sampleCpu = () => os.cpus().reduce((acc, c) => {
      const t = Object.values(c.times).reduce((x, y) => x + y, 0);
      return { idle: acc.idle + c.times.idle, total: acc.total + t };
    }, { idle: 0, total: 0 });
    const c1 = sampleCpu();
    await new Promise((r) => setTimeout(r, 250));
    const c2 = sampleCpu();
    const cpuUsage = c2.total - c1.total > 0 ? (1 - (c2.idle - c1.idle) / (c2.total - c1.total)) * 100 : 0;
    const ramUsage = (1 - os.freemem() / os.totalmem()) * 100;

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      ordersLast24h, revenueAgg, newUsersLast24h, pendingOrders,
      lowStockCount, outOfStockCount, activeProducts, totalUsers, adminActionsLast24h
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: dayAgo } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: dayAgo }, orderStatus: { $nin: ['Cancelled', 'Returned'] } } },
        { $group: { _id: null, revenue: { $sum: '$total' } } }
      ]),
      User.countDocuments({ createdAt: { $gte: dayAgo } }),
      Order.countDocuments({ orderStatus: { $in: ['Pending', 'Processing'] } }),
      Product.countDocuments({ active: true, stock: { $gt: 0, $lte: 5 } }),
      Product.countDocuments({ active: true, stock: { $lte: 0 } }),
      Product.countDocuments({ active: true }),
      User.countDocuments(),
      ActivityLog.countDocuments({ createdAt: { $gte: dayAgo } })
    ]);

    const metrics = getMetrics();
    const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
    const healthy = dbState === 'connected' && metrics.successRate >= 95;

    return sendSuccess(res, 'System monitoring stats retrieved', {
      systemStatus: healthy ? 'healthy' : 'degraded',
      database: dbState,
      uptimeSeconds: Math.floor(process.uptime()),
      api: {
        totalRequests: metrics.totalRequests,
        serverErrors: metrics.serverErrors,
        clientErrors: metrics.clientErrors,
        successRate: metrics.successRate,
        avgResponseTime: metrics.avgResponseTimeMs
      },
      resources: {
        cpu: cpuUsage,
        ram: ramUsage,
        processMemoryMb: process.memoryUsage().rss / (1024 * 1024)
      },
      business: {
        ordersLast24h,
        revenueLast24h: revenueAgg.length ? Number(revenueAgg[0].revenue.toFixed(2)) : 0,
        newUsersLast24h,
        pendingOrders,
        lowStockCount,
        outOfStockCount,
        activeProducts,
        totalUsers,
        adminActionsLast24h
      },
      note: 'API figures are counted since the server process last started.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
  getRequestLogs,
  getEntityAuditTrail,
  getMonitoringStats
};
