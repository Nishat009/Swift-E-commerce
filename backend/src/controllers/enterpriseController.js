const os = require('os');
const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { getMetrics } = require('../utils/metrics');
const AuditTrail = require('../models/AuditTrail');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get all activity logs
// @route   GET /api/enterprise/logs
// @access  Private/Admin
const getActivityLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find()
      .populate('adminUser', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments();

    return sendSuccess(res, 'Activity logs retrieved', logs, 200, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
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
  getEntityAuditTrail,
  getMonitoringStats
};
