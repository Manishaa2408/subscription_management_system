import { body, param, validationResult } from "express-validator";

/**
 * Standard validation result processor
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

export const createCampaignRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Campaign name is required"),
  body("campaignCode")
    .optional()
    .trim()
    .toUpperCase(),
  body("startDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Start date must be a valid ISO date"),
  body("endDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("End date must be a valid ISO date")
];

export const createDiscountRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Discount name is required"),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Discount code is required")
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage("Discount code must contain only letters, numbers, hyphens, and underscores"),
  body("discountType")
    .isIn(["percentage", "fixed"])
    .withMessage("Discount type must be 'percentage' or 'fixed'"),
  body("discountValue")
    .isFloat({ min: 0.01 })
    .withMessage("Discount value must be a positive number"),
  body("currency")
    .optional()
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be a 3-letter code (e.g. INR)"),
  body("maximumDiscount")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Maximum discount cap must be non-negative"),
  body("minimumPurchase")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum purchase must be non-negative"),
  body("applicationType")
    .optional()
    .isIn(["one_time", "recurring", "unlimited_recurring"])
    .withMessage("Application type must be 'one_time', 'recurring', or 'unlimited_recurring'"),
  body("billingCycles")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Billing cycles must be at least 1")
];

export const updateDiscountRules = [
  param("id")
    .isMongoId()
    .withMessage("Valid discount ID is required"),
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Discount name cannot be empty"),
  body("discountType")
    .optional()
    .isIn(["percentage", "fixed"])
    .withMessage("Discount type must be 'percentage' or 'fixed'"),
  body("discountValue")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Discount value must be a positive number")
];

export const validateDiscountRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Discount code is required"),
  body("subtotal")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Subtotal must be non-negative")
];

export const calculateDiscountRules = [
  body("discountId")
    .optional()
    .isString(),
  body("code")
    .optional()
    .trim()
    .isString()
];

export const reserveUsageRules = [
  body("discountId")
    .isMongoId()
    .withMessage("Valid discount ID is required"),
  body("customerId")
    .notEmpty()
    .withMessage("Customer ID is required")
];

export const redeemUsageRules = [
  param("id")
    .isMongoId()
    .withMessage("Valid discount ID is required")
];

export const statusRules = [
  param("id")
    .isMongoId()
    .withMessage("Valid ID is required"),
  body("status")
    .isIn(["active", "inactive", "expired", "archived"])
    .withMessage("Status must be one of: active, inactive, expired, archived")
];
