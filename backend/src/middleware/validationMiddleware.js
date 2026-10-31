const { validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHandler');

/**
 * Middleware to check validation results from express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));
    return sendError(res, 400, formattedErrors[0].message, formattedErrors);
  }
  next();
};

module.exports = { validate };
