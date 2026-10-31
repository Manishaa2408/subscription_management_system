const { sendError } = require('../utils/responseHandler');

/**
 * Reusable Role Authorization Middleware
 * Usage: router.get('/admin-only', protect, authorize('admin'), controller)
 * Usage: router.get('/staff-or-admin', protect, authorize('admin', 'staff'), controller)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
      );
    }

    next();
  };
};

module.exports = { authorize };
