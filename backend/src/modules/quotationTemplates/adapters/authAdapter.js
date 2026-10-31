/**
 * Auth Adapter for Quotation Template Management (M5)
 * 
 * Provides isolated authentication and role-based authorization.
 * Conforms to standard user shape:
 * req.user = { id: string, email: string, role: 'admin' | 'staff' | 'customer' }
 * 
 * In development (NODE_ENV=development), it allows switching roles via headers:
 * x-dev-role: 'admin' | 'staff' | 'customer' (default: 'admin')
 * x-dev-user-id: string
 * x-dev-user-email: string
 * 
 * During final integration, this adapter is easily swapped with M1's auth middleware.
 */

export const authenticate = (req, res, next) => {
  // If production environment, reject dev fallback
  if (process.env.NODE_ENV === "production") {
    // In production, when integrated with M1:
    // return m1AuthMiddleware(req, res, next);
    return res.status(401).json({
      success: false,
      message: "Authentication required. Production auth module not configured.",
      errors: ["Missing authentication token"]
    });
  }

  // Development authentication mechanism
  const devRole = (req.headers["x-dev-role"] || req.query.devRole || "admin").toLowerCase();
  const validRoles = ["admin", "staff", "customer"];

  if (!validRoles.includes(devRole)) {
    return res.status(400).json({
      success: false,
      message: `Invalid development role '${devRole}'. Must be one of: ${validRoles.join(", ")}`,
      errors: ["Invalid role specified"]
    });
  }

  // Attach standardized req.user
  req.user = {
    id: req.headers["x-dev-user-id"] || "67246830a3f65e2a84b12345",
    email: req.headers["x-dev-user-email"] || `${devRole}@brightloop.local`,
    role: devRole
  };

  next();
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        errors: ["User context not found"]
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' does not have permission to access this resource`,
        errors: ["Insufficient permissions"]
      });
    }

    next();
  };
};

export default {
  authenticate,
  authorize
};
