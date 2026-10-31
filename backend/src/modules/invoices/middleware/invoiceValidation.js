const mongoose = require('mongoose');

/**
 * Validates MongoDB ObjectId in route params
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for parameter "${paramName}"`,
        errors: [`Expected valid 24-character hexadecimal ObjectId, received "${id}"`]
      });
    }
    next();
  };
};

/**
 * Validates invoice creation payload
 */
const validateCreateInvoice = (req, res, next) => {
  const { customerId, items, issueDate, dueDate } = req.body;
  const errors = [];

  if (!customerId || typeof customerId !== 'string' || !customerId.trim()) {
    errors.push('customerId is required and must be a non-empty string');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('items must be an array containing at least one line item');
  } else {
    items.forEach((item, index) => {
      const idx = index + 1;
      if (!item.itemName || typeof item.itemName !== 'string' || !item.itemName.trim()) {
        errors.push(`Item #${idx}: itemName is required`);
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        errors.push(`Item #${idx}: quantity must be a positive integer`);
      }

      const unitPrice = Number(item.unitPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
        errors.push(`Item #${idx}: unitPrice must be a non-negative number`);
      }

      if (item.discountType === 'percentage') {
        const disc = Number(item.discountValue || 0);
        if (isNaN(disc) || disc < 0 || disc > 100) {
          errors.push(`Item #${idx}: percentage discount must be between 0 and 100`);
        }
      }
    });
  }

  if (issueDate && isNaN(Date.parse(issueDate))) {
    errors.push('issueDate must be a valid date');
  }

  if (dueDate && isNaN(Date.parse(dueDate))) {
    errors.push('dueDate must be a valid date');
  }

  if (issueDate && dueDate) {
    if (new Date(dueDate) < new Date(issueDate)) {
      errors.push('dueDate cannot be earlier than issueDate');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for invoice creation',
      errors
    });
  }

  next();
};

/**
 * Validates cancellation request
 */
const validateCancelInvoice = (req, res, next) => {
  const { reason } = req.body;
  if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'A valid cancellation reason of at least 3 characters is required',
      errors: ['Cancellation reason missing or too short']
    });
  }
  next();
};

module.exports = {
  validateObjectId,
  validateCreateInvoice,
  validateCancelInvoice
};
