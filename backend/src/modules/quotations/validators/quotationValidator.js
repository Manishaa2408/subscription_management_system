import { body, param, query, validationResult } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Quotation validation failed",
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

export const createQuotationRules = [
  body("customerId")
    .notEmpty().withMessage("Customer ID is required")
    .isMongoId().withMessage("Customer ID must be a valid MongoDB ObjectId"),

  body("templateId")
    .optional({ nullable: true })
    .isMongoId().withMessage("Template ID must be a valid MongoDB ObjectId"),

  body("quotationDate")
    .optional()
    .isISO8601().withMessage("Quotation date must be a valid ISO8601 date"),

  body("validUntil")
    .optional()
    .isISO8601().withMessage("Valid-until date must be a valid ISO8601 date"),

  body("currency")
    .optional()
    .isString().isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter ISO code"),

  body("discountCode")
    .optional({ nullable: true })
    .trim(),

  body("lineItems")
    .optional()
    .isArray().withMessage("Line items must be an array"),

  body("lineItems.*.quantity")
    .optional()
    .isFloat({ min: 0.01 }).withMessage("Line quantity must be greater than 0"),

  body("lineItems.*.unitPrice")
    .optional()
    .isFloat({ min: 0 }).withMessage("Line unit price cannot be negative")
];

export const updateQuotationRules = [
  param("id").isMongoId().withMessage("Invalid quotation ID format"),

  body("validUntil")
    .optional()
    .isISO8601().withMessage("Valid-until date must be a valid ISO8601 date"),

  body("discountCode")
    .optional({ nullable: true })
    .trim(),

  body("lineItems")
    .optional()
    .isArray().withMessage("Line items must be an array")
];

export const addLineItemRules = [
  param("id").isMongoId().withMessage("Invalid quotation ID format"),
  body("quantity").isFloat({ min: 0.01 }).withMessage("Quantity must be greater than 0"),
  body("unitPrice").isFloat({ min: 0 }).withMessage("Unit price cannot be negative")
];

export const quotationIdParamRule = [
  param("id").isMongoId().withMessage("Invalid quotation ID format")
];

export const rejectQuotationRules = [
  param("id").isMongoId().withMessage("Invalid quotation ID format"),
  body("reason").optional().trim()
];

export const cancelQuotationRules = [
  param("id").isMongoId().withMessage("Invalid quotation ID format"),
  body("reason").optional().trim()
];

export default {
  validate,
  createQuotationRules,
  updateQuotationRules,
  addLineItemRules,
  quotationIdParamRule,
  rejectQuotationRules,
  cancelQuotationRules
};
