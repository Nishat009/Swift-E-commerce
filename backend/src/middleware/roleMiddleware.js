const { sendError } = require('../utils/response');
const { isDemoAccount } = require('../controllers/demoAuthController');

const authorize = (...roles) => {
  const guard = (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authorization failed, user not authenticated', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `User role '${req.user.role}' is not authorized to access this route`,
        403
      );
    }

    next();
  };
  // Lets tests/route-guards.test.js read which roles a route requires
  guard.roles = roles;
  return guard;
};

// The user model only has 'customer' and 'admin', so "super admin" is the strictest admin: a real
// (non-demo) admin account. To narrow it to specific people, list their emails in SUPER_ADMIN_EMAILS
// (comma separated); when that is unset every real admin is a super admin.
const isSuperAdmin = (user) => {
  if (!user || user.role !== 'admin' || isDemoAccount(user)) return false;
  const listed = String(process.env.SUPER_ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return !listed.length || listed.includes(String(user.email || '').toLowerCase());
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user) return sendError(res, 'Authorization failed, user not authenticated', 401);
  if (isDemoAccount(req.user)) return sendError(res, 'This action is disabled for demo accounts.', 403);
  if (!isSuperAdmin(req.user)) return sendError(res, 'Only a super admin can do this.', 403);
  next();
};

module.exports = { authorize, isSuperAdmin, requireSuperAdmin };
