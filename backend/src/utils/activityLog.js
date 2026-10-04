const ActivityLog = require('../models/ActivityLog');
const AuditTrail = require('../models/AuditTrail');

// Record an admin action. Never throws: logging must not break the action itself.
const logActivity = async (req, action, details) => {
  try {
    if (!req || !req.user) return;
    await ActivityLog.create({
      adminUser: req.user.id || req.user._id,
      action,
      details,
      ipAddress: req.ip || '127.0.0.1'
    });
  } catch (err) {
    console.error('Activity log failed:', err.message);
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

module.exports = { logActivity, logAudit };
