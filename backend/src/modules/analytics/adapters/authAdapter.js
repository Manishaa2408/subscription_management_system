const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'development_brightloop_secret_2026_m10';

const DEV_USERS = {
  admin: {
    id: 'usr_admin_001',
    name: 'Administrator',
    email: 'admin@brightloop.io',
    role: 'admin'
  },
  staff: {
    id: 'usr_staff_001',
    name: 'Operations Specialist',
    email: 'ops@brightloop.io',
    role: 'staff'
  },
  customer: {
    id: 'cust_001_intra_kerala',
    name: 'Kochi Tech Labs Pvt Ltd',
    email: 'finance@kochitechlabs.com',
    role: 'customer'
  }
};

const generateDevToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const authenticate = (req, res, next) => {
  const mockRole = req.headers['x-mock-role'];
  const mockUserId = req.headers['x-mock-user-id'];
  const mockUserEmail = req.headers['x-mock-user-email'];

  if (mockRole) {
    req.user = {
      id: mockUserId || `usr_${mockRole}_auto`,
      role: mockRole.toLowerCase(),
      email: mockUserEmail || `${mockRole}@brightloop.io`
    };
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.id || decoded.userId || decoded._id,
        role: decoded.role,
        email: decoded.email
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

  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    req.user = { ...DEV_USERS.admin };
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication required. Provide Bearer token or development mock headers.',
    errors: ['No authentication credentials found']
  });
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions',
        errors: ['User unauthenticated']
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' lacks permission for this action`,
        errors: [`Requires one of: ${allowedRoles.join(', ')}`]
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  DEV_USERS,
  generateDevToken
};
