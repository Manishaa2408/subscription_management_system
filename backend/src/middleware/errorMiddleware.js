const { sendError } = require('../utils/responseHandler');

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    message = `Resource not found with id of ${err.value}`;
    statusCode = 404;
  }

  // Mongoose Duplicate Key (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `An account with this ${field} already exists.`;
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

  // Log error on server side
  console.error(`[Error] [${req.method}] ${req.originalUrl} - Status: ${statusCode} - ${message}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  return sendError(res, statusCode, message, errors);
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  return sendError(res, 404, `API route not found: ${req.originalUrl}`);
};

module.exports = { errorHandler, notFound };
