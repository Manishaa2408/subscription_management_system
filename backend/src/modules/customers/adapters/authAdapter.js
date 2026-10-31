const path = require('path');

// Try loading real M1 authentication middleware if present
let m1AuthMiddleware = null;
let m1RoleMiddleware = null;
try {
  m1AuthMiddleware = require('../../../middleware/authMiddleware');
  m1RoleMiddleware = require('../../../middleware/roleMiddleware');
} catch (_) {
  // Standalone mode without M1
}

/**
 * Authentication Adapter for M2
 * Supports live M1 JWT tokens AND development mock identities for standalone testing
 */
const authenticate = async (req, res, next) => {
  // 1. Development standalone mock identity bypass (only in non-production)
  if (process.env.NODE_ENV !== 'production') {
    const devRole = req.headers['x-dev-role'];
    const devUserId = req.headers['x-dev-user-id'];
    const devEmail = req.headers['x-dev-email'];

    if (devRole && ['admin', 'staff', 'customer'].includes(devRole)) {
      req.user = {
        id: devUserId || '660000000000000000000001',
        role: devRole,
        email: devEmail || `${devRole}@brightloop.com`,
        fullName: `Dev ${devRole.charAt(0).toUpperCase() + devRole.slice(1)}`
      };
      return next();
    }
  }

  // 2. Delegate to live M1 auth middleware if available
  if (m1AuthMiddleware && m1AuthMiddleware.protect) {
    return m1AuthMiddleware.protect(req, res, next);
  }

  // 3. Fallback for standalone when no credentials provided
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please provide valid session credentials.',
    errors: []
  });
};

/**
 * Role-Based Authorization Adapter
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errors: []
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        errors: []
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  protect: authenticate
};
