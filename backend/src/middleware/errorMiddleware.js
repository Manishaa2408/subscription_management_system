/**
 * Centralized Error Handling Middleware
 * Ensures responses strictly adhere to:
 * {
 *   "success": false,
 *   "message": "...",
 *   "errors": []
 * }
 */

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    errors: ['Route does not exist']
  });
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';
  let errors = [];

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate resource error: ${field} '${value}' already exists`;
    errors = [`${field} must be unique`];
  }
  // Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Data validation error';
    errors = Object.values(err.errors || {}).map((e) => e.message);
  }
  // Mongoose Cast Error (Invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    errors = ['Invalid identifier provided'];
  }
  // Generic error
  else if (err.errors) {
    errors = Array.isArray(err.errors) ? err.errors : [err.errors];
  } else {
    errors = [message];
  }

  // Never leak internal stack traces to client
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

module.exports = {
  notFoundHandler,
  notFound: notFoundHandler,
  errorHandler,
  default: {
    notFoundHandler,
    errorHandler
  }
};
