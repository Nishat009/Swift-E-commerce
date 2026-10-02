// In-memory request metrics since the API process started (used by the admin monitoring tab).
const startedAt = Date.now();
const stats = { total: 0, serverErrors: 0, clientErrors: 0, totalDurationMs: 0 };

const metricsMiddleware = (req, res, next) => {
  const begin = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - begin) / 1e6;
    stats.total += 1;
    stats.totalDurationMs += ms;
    if (res.statusCode >= 500) stats.serverErrors += 1;
    else if (res.statusCode >= 400) stats.clientErrors += 1;
  });
  next();
};

const getMetrics = () => ({
  startedAt,
  totalRequests: stats.total,
  serverErrors: stats.serverErrors,
  clientErrors: stats.clientErrors,
  avgResponseTimeMs: stats.total ? stats.totalDurationMs / stats.total : 0,
  successRate: stats.total ? ((stats.total - stats.serverErrors) / stats.total) * 100 : 100
});

module.exports = { metricsMiddleware, getMetrics };
