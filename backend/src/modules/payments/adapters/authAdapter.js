/**
 * M11 Temporary Authentication Adapter
 * 
 * Standalone development adapter to decouple M11 from Developer 1's M1 Authentication module.
 * Exposes: authenticate, authorize, getCurrentUser, generateDevToken.
 * In final integration, replace this with Developer 1's M1 auth middleware:
 *   const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'development_brightloop_secret_2026_m10';

// Built-in test accounts for development and QA
const DEV_USERS = {
  admin: {
    id: 'usr_admin_001',
    role: 'admin',
    name: 'Administrator',
    email: 'admin@brightloop.io'
  },
  staff: {
    id: 'usr_staff_001',
    role: 'staff',
    name: 'Ops Staff Member',
    email: 'staff@brightloop.io'
  },
  customer1: {
    id: 'cust_001_intra_kerala',
    role: 'customer',
    name: 'Kochi Tech Labs Pvt Ltd',
    email: 'finance@kochitechlabs.com'
  },
  customer2: {
    id: 'cust_002_inter_bengaluru',
    role: 'customer',
    name: 'Bengaluru Cloud Systems',
    email: 'accounts@bengalurucloud.io'
  }
};

/**
 * Generate a JWT for development testing
 */
const generateDevToken = (userPayload) => {
  return jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Authentication Middleware
 * Resolves user from:
 * 1. Bearer JWT token in Authorization header
 * 2. Development headers: 'x-mock-role', 'x-mock-user-id', 'x-mock-user-email'
 * 3. Default dev user fallback in development mode
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const mockRoleHeader = req.headers['x-mock-role'];
  const mockUserIdHeader = req.headers['x-mock-user-id'];
  const mockEmailHeader = req.headers['x-mock-user-email'];

  // 1. Check JWT
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.id || decoded.userId || decoded._id,
        role: decoded.role,
        email: decoded.email,
        name: decoded.name
      };
      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authorization token',
        errors: [err.message]
      });
    }
  }

  // 2. Development Header check
  if (mockRoleHeader && DEV_USERS[mockRoleHeader]) {
    const template = DEV_USERS[mockRoleHeader];
    req.user = {
      id: mockUserIdHeader || template.id,
      role: template.role,
      email: mockEmailHeader || template.email,
      name: template.name
    };
    return next();
  }

  // 3. Explicit mock user ID
  if (mockUserIdHeader) {
    const matchedUser = Object.values(DEV_USERS).find(u => u.id === mockUserIdHeader);
    if (matchedUser) {
      req.user = { ...matchedUser };
      return next();
    }
    req.user = {
      id: mockUserIdHeader,
      role: mockRoleHeader || 'customer',
      email: mockEmailHeader || 'user@example.com',
      name: 'Test User'
    };
    return next();
  }

  // 4. Default to admin in development mode
  if (process.env.NODE_ENV !== 'production') {
    req.user = { ...DEV_USERS.admin };
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please provide a valid Bearer token.',
    errors: []
  });
};

/**
 * Authorization Middleware for Role-based Access Control
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before authorization',
        errors: []
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}]. Current role: '${req.user.role}'`,
        errors: []
      });
    }

    next();
  };
};

const getCurrentUser = (req) => {
  return req.user || null;
};

module.exports = {
  authenticate,
  authorize,
  getCurrentUser,
  generateDevToken,
  DEV_USERS
};
