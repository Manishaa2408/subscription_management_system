// backend/src/modules/plans/adapters/authAdapter.js
/**
 * Development authentication adapter for M4.
 * Mirrors the authAdapter used by other modules.
 * Reads `x-dev-role` header and attaches a mock user to req.
 */

module.exports = {
  authenticate: (req, res, next) => {
    const roleHeader = req.headers['x-dev-role'];
    const role = roleHeader ? roleHeader.toLowerCase() : 'admin';
    const allowed = ['admin', 'staff', 'customer'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid dev role header' });
    }
    req.user = {
      id: `dev-${role}-${Date.now()}`,
      role,
      email: `${role}@example.com`,
      fullName: `${role.charAt(0).toUpperCase() + role.slice(1)} User`
    };
    next();
  },
  authorize: (allowedRoles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  },
  getCurrentUser: (req) => req.user
};
