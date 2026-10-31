// backend/src/modules/products/adapters/authAdapter.js
/**
 * Development authentication adapter for M3.
 * It inspects the `x-dev-role` header (admin|staff|customer) and sets a mock user.
 * In production, replace this with M1's real authentication middleware.
 */

module.exports = {
  /**
   * Middleware to attach a mock user to req based on headers.
   * If `x-dev-role` is present, use it; otherwise default to admin for safety.
   */
  authenticate: (req, res, next) => {
    const roleHeader = req.headers['x-dev-role'];
    const role = roleHeader ? roleHeader.toLowerCase() : 'admin';
    const allowedRoles = ['admin', 'staff', 'customer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid dev role header' });
    }
    // Mock user object – in real setup, this will be populated by JWT middleware.
    req.user = {
      id: `dev-${role}-${Date.now()}`,
      role,
      email: `${role}@example.com`,
      fullName: `${role.charAt(0).toUpperCase() + role.slice(1)} User`
    };
    next();
  },

  /**
   * Simple role authorisation helper.
   */
  authorize: (allowedRoles) => (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  },

  /**
   * Get current user (used by services). Returns the mock user attached by authenticate.
   */
  getCurrentUser: (req) => req.user
};
