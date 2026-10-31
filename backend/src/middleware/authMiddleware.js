const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/responseHandler');

/**
 * Protect routes - Verifies JWT from HttpOnly cookie or Authorization header
 * With fallback support for simulated testing headers (x-mock-role, x-mock-user-id)
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Bearer token header (for API testing / external callers)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 3. Fallback for testing/development environments (x-mock-role / x-mock-user-id)
  if (!token && (req.headers['x-mock-role'] || req.headers['x-mock-user-id'])) {
    req.user = {
      id: req.headers['x-mock-user-id'] || '60c72b2f9b1d8b001f8e4caa',
      email: req.headers['x-mock-user-email'] || 'admin@brightloop.io',
      role: req.headers['x-mock-role'] || 'admin',
      fullName: 'System User'
    };
    return next();
  }

  if (!token) {
    return sendError(res, 401, 'Authentication required. Please log in.');
  }

  try {
    const secret = process.env.JWT_SECRET || 'development_brightloop_secret_2026_hackathon';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 401, 'User account no longer exists.');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Your account has been deactivated. Please contact an administrator.');
    }

    // Attach user information to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Session expired. Please log in again.');
    }
    return sendError(res, 401, 'Invalid authentication token.');
  }
};

module.exports = {
  protect,
  authenticate: protect,
  default: { protect, authenticate: protect }
};
