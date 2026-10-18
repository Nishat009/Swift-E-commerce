const express = require('express');
const router = express.Router();
const {
  getActivityLogs,
  getRequestLogs,
  getEntityAuditTrail,
  getMonitoringStats
} = require('../controllers/enterpriseController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/logs', protect, authorize('admin'), getActivityLogs);
router.get('/request-logs', protect, authorize('admin'), getRequestLogs);
router.get('/audit/:entityType/:entityId', protect, authorize('admin'), getEntityAuditTrail);
router.get('/monitoring-stats', protect, authorize('admin'), getMonitoringStats);

module.exports = router;
