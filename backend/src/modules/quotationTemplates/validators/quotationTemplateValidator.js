import { body, param, query, validationResult } from "express-validator";

/**
 * Middleware to evaluate validation rules and format error response
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Template validation failed",
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Validation rules for creating a quotation template
 */
export const createTemplateRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Template name is required")
    .isLength({ max: 200 }).withMessage("Template name cannot exceed 200 characters"),

  body("code")
    .optional()
    .trim()
    .matches(/^QT-[A-Za-z0-9-]+$/).withMessage("Template code must follow format QT-XXX"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Description cannot exceed 1000 characters"),

  body("validityDays")
    .notEmpty().withMessage("Validity period is required")
    .isInt({ min: 1 }).withMessage("Validity period must be a positive integer of at least 1 day"),

  body("status")
    .optional()
    .isIn(["active", "inactive"]).withMessage("Status must be either 'active' or 'inactive'"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Notes cannot exceed 2000 characters"),

  body("items")
    .isArray({ min: 1 }).withMessage("At least one line item is required"),

  body("items.*.itemType")
    .isIn(["product", "plan"]).withMessage("Item type must be either 'product' or 'plan'"),

  body("items.*.itemId")
    .isMongoId().withMessage("Item ID must be a valid MongoDB ObjectId"),

  body("items.*.quantity")
    .isFloat({ min: 0.01 }).withMessage("Quantity must be greater than zero"),

  body("items.*.unitPrice")
    .optional()
    .isFloat({ min: 0 }).withMessage("Unit price cannot be negative"),

  body("items.*.taxRate")
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage("Tax rate must be between 0% and 100%")
];

/**
 * Validation rules for updating a quotation template
 */
export const updateTemplateRules = [
  param("id")
    .isMongoId().withMessage("Invalid quotation template ID format"),

  body("name")
    .optional()
    .trim()
    .notEmpty().withMessage("Template name cannot be empty")
    .isLength({ max: 200 }).withMessage("Template name cannot exceed 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Description cannot exceed 1000 characters"),

  body("validityDays")
    .optional()
    .isInt({ min: 1 }).withMessage("Validity period must be a positive integer of at least 1 day"),

  body("status")
    .optional()
    .isIn(["active", "inactive"]).withMessage("Status must be either 'active' or 'inactive'"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Notes cannot exceed 2000 characters"),

  body("items")
    .optional()
    .isArray({ min: 1 }).withMessage("If updating items, at least one line item is required"),

  body("items.*.itemType")
    .optional()
    .isIn(["product", "plan"]).withMessage("Item type must be either 'product' or 'plan'"),

  body("items.*.itemId")
    .optional()
    .isMongoId().withMessage("Item ID must be a valid MongoDB ObjectId"),

  body("items.*.quantity")
    .optional()
    .isFloat({ min: 0.01 }).withMessage("Quantity must be greater than zero"),

  body("items.*.unitPrice")
    .optional()
    .isFloat({ min: 0 }).withMessage("Unit price cannot be negative"),

  body("items.*.taxRate")
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage("Tax rate must be between 0% and 100%")
];

/**
 * Validation rules for status update
 */
export const updateStatusRules = [
  param("id")
    .isMongoId().withMessage("Invalid quotation template ID format"),

  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(["active", "inactive"]).withMessage("Status must be 'active' or 'inactive'")
];

/**
 * Validation rules for ID param
 */
export const templateIdParamRule = [
  param("id")
    .isMongoId().withMessage("Invalid quotation template ID format")
];

export default {
  validate,
  createTemplateRules,
  updateTemplateRules,
  updateStatusRules,
  templateIdParamRule
};
