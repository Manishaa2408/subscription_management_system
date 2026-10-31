import { body, param, query, validationResult } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Subscription validation failed",
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

export const createManualSubscriptionRules = [
  body("customerId")
    .notEmpty().withMessage("Customer ID is required")
    .isMongoId().withMessage("Customer ID must be a valid MongoDB ObjectId"),

  body("startDate")
    .optional()
    .isISO8601().withMessage("Start date must be a valid ISO8601 date"),

  body("trialDays")
    .optional()
    .isInt({ min: 0 }).withMessage("Trial period must be 0 or more days"),

  body("lineItems")
    .isArray({ min: 1 }).withMessage("At least one line item is required")
];

export const subscriptionIdParamRule = [
  param("id").isMongoId().withMessage("Invalid subscription ID format")
];

export const quotationIdParamRule = [
  param("quotationId").isMongoId().withMessage("Invalid quotation ID format")
];

export const changePlanRules = [
  param("id").isMongoId().withMessage("Invalid subscription ID format"),
  body("newPlanId").notEmpty().withMessage("New plan ID is required").isMongoId().withMessage("New plan ID must be a valid MongoDB ObjectId"),
  body("reason").optional().trim()
];

export const pauseSubscriptionRules = [
  param("id").isMongoId().withMessage("Invalid subscription ID format"),
  body("reason").optional().trim(),
  body("expectedResumeDate").optional({ nullable: true }).isISO8601().withMessage("Expected resume date must be a valid date")
];

export const cancelSubscriptionRules = [
  param("id").isMongoId().withMessage("Invalid subscription ID format"),
  body("type").optional().isIn(["immediate", "end_of_period"]).withMessage("Cancellation type must be 'immediate' or 'end_of_period'"),
  body("reason").optional().trim()
];

export default {
  validate,
  createManualSubscriptionRules,
  subscriptionIdParamRule,
  quotationIdParamRule,
  changePlanRules,
  pauseSubscriptionRules,
  cancelSubscriptionRules
};
