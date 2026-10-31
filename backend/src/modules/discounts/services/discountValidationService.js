import Discount from "../models/Discount.js";
import discountEligibilityService from "./discountEligibilityService.js";
import discountCalculationService from "./discountCalculationService.js";

/**
 * Discount Validation Service (M8)
 * Validates discount codes without consuming usage.
 * Returns standard format:
 * { valid: boolean, message: string, reasonCode?: string, data?: object }
 */

export const validateDiscount = async (discountCode, context = {}) => {
  if (!discountCode || typeof discountCode !== "string") {
    return {
      valid: false,
      reasonCode: "INVALID_DISCOUNT_CONFIGURATION",
      message: "A valid discount code string must be provided"
    };
  }

  // Normalize code to uppercase & trimmed
  const normalizedCode = discountCode.trim().toUpperCase();

  const discount = await Discount.findOne({ code: normalizedCode });

  if (!discount) {
    return {
      valid: false,
      reasonCode: "DISCOUNT_NOT_FOUND",
      message: `Discount code '${normalizedCode}' does not exist`
    };
  }

  // Check all eligibility rules
  const eligibility = await discountEligibilityService.checkEligibility(discount, context);

  if (!eligibility.eligible) {
    return {
      valid: false,
      reasonCode: eligibility.reasonCode,
      message: eligibility.message
    };
  }

  // Calculate discount using the validated eligible amount
  const calculation = discountCalculationService.calculateDiscountAmount(
    discount,
    eligibility.eligibleAmount
  );

  if (calculation.finalDiscount <= 0) {
    return {
      valid: false,
      reasonCode: "MINIMUM_PURCHASE_NOT_MET",
      message: "The calculated discount amount is ₹0"
    };
  }

  return {
    valid: true,
    message: "Discount applied successfully",
    data: {
      discountId: discount._id,
      code: discount.code,
      name: discount.name,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      currency: discount.currency,
      eligibleAmount: calculation.eligibleAmount,
      discountAmount: calculation.finalDiscount,
      maximumDiscount: discount.maximumDiscount,
      maximumDiscountApplied: calculation.maximumDiscountApplied,
      applicationType: discount.applicationType,
      billingCycles: discount.billingCycles,
      stackable: discount.stacking?.isStackable || false
    }
  };
};

export const calculateDiscount = async (discountIdOrCode, context = {}) => {
  let discount = null;
  if (typeof discountIdOrCode === "object" && discountIdOrCode._id) {
    discount = discountIdOrCode;
  } else {
    const code = String(discountIdOrCode).trim().toUpperCase();
    discount = await Discount.findOne({ $or: [{ code }, { _id: discountIdOrCode }] });
  }

  if (!discount) {
    const error = new Error(`Discount '${discountIdOrCode}' not found`);
    error.statusCode = 404;
    throw error;
  }

  const eligibleAmount = discountCalculationService.calculateEligibleAmount(discount, context);
  const calculation = discountCalculationService.calculateDiscountAmount(discount, eligibleAmount);

  return {
    discountId: discount._id,
    code: discount.code,
    name: discount.name,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    currency: discount.currency,
    eligibleAmount: calculation.eligibleAmount,
    discountAmount: calculation.finalDiscount,
    rawDiscount: calculation.rawDiscount,
    maximumDiscount: discount.maximumDiscount,
    maximumDiscountApplied: calculation.maximumDiscountApplied,
    applicationType: discount.applicationType,
    billingCycles: discount.billingCycles
  };
};

export default {
  validateDiscount,
  calculateDiscount
};
