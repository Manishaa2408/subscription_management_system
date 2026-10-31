/**
 * Centralized Error Handling Middleware
 * Brightloop SMS – All Modules (M1–M12)
 */

const sendError = (res, statusCode, message, errors = []) => {
  return res.status(statusCode).json({ success: false, message, errors });
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (err.statusCode) statusCode = err.statusCode;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
    errors = ['Invalid identifier provided'];
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An entry with this ${field} already exists.`;
    statusCode = 409;
    errors = [{ field, message }];
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message
    }));
    message = errors[0] ? errors[0].message : 'Validation failed';
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  if (err.errors && !errors.length) {
    errors = Array.isArray(err.errors) ? err.errors : [err.errors];
  }

  console.error(`[Error] [${req.method}] ${req.originalUrl} – ${statusCode}: ${message}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  return sendError(res, statusCode, message, errors);
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  return sendError(res, 404, `API route not found: ${req.originalUrl}`);
};

// Also export as notFoundHandler for M5+ compatibility
const notFoundHandler = notFound;

module.exports = { errorHandler, notFound, notFoundHandler };
