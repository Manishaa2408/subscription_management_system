import customerAdapter from "../adapters/customerAdapter.js";
import DiscountUsage from "../models/DiscountUsage.js";
import { calculateEligibleAmount } from "./discountCalculationService.js";

/**
 * Centralized Eligibility Service (M8)
 * Checks all conditions and returns machine-readable reasonCodes upon failure.
 */

export const checkEligibility = async (discount, context = {}) => {
  const now = new Date();

  // 1. Check Active Status
  if (discount.status !== "active") {
    return {
      eligible: false,
      reasonCode: "DISCOUNT_INACTIVE",
      message: `Discount '${discount.code}' is currently ${discount.status}`
    };
  }

  // 2. Start Date Window
  if (discount.startDate && now < new Date(discount.startDate)) {
    return {
      eligible: false,
      reasonCode: "DISCOUNT_NOT_STARTED",
      message: `Discount '${discount.code}' starts on ${new Date(discount.startDate).toLocaleDateString()}`
    };
  }

  // 3. Expiration Window
  if (discount.endDate && now > new Date(discount.endDate)) {
    return {
      eligible: false,
      reasonCode: "DISCOUNT_EXPIRED",
      message: `Discount '${discount.code}' expired on ${new Date(discount.endDate).toLocaleDateString()}`
    };
  }

  // 4. Currency Compatibility
  if (context.currency && discount.currency) {
    if (context.currency.toUpperCase() !== discount.currency.toUpperCase()) {
      return {
        eligible: false,
        reasonCode: "CURRENCY_MISMATCH",
        message: `Discount currency (${discount.currency}) does not match order currency (${context.currency})`
      };
    }
  }

  // 5. Minimum Purchase Requirement
  const totalPurchase = Number(context.subtotal ?? context.totalAmount ?? 0);
  if (discount.minimumPurchase && discount.minimumPurchase > 0) {
    if (totalPurchase < discount.minimumPurchase) {
      return {
        eligible: false,
        reasonCode: "MINIMUM_PURCHASE_NOT_MET",
        message: `Minimum purchase of ₹${discount.minimumPurchase.toLocaleString()} required (Current: ₹${totalPurchase.toLocaleString()})`
      };
    }
  }

  // 6. Customer Eligibility
  const customerId = context.customerId ? context.customerId.toString() : null;

  if (discount.applicability?.customerIds?.length > 0) {
    if (!customerId) {
      return {
        eligible: false,
        reasonCode: "CUSTOMER_NOT_ELIGIBLE",
        message: "Customer context is required for this discount"
      };
    }
    const eligibleCustomerIds = discount.applicability.customerIds.map((c) => c.toString());
    if (!eligibleCustomerIds.includes(customerId)) {
      return {
        eligible: false,
        reasonCode: "CUSTOMER_NOT_ELIGIBLE",
        message: "This discount code is not available for this customer account"
      };
    }
  }

  // Customer Type (new vs existing)
  if (discount.applicability?.customerType && discount.applicability.customerType !== "all") {
    if (!customerId) {
      return {
        eligible: false,
        reasonCode: "CUSTOMER_NOT_ELIGIBLE",
        message: "Customer context is required to determine eligibility"
      };
    }

    const isNew = await customerAdapter.isNewCustomer(customerId);

    if (discount.applicability.customerType === "new" && !isNew) {
      return {
        eligible: false,
        reasonCode: "CUSTOMER_NOT_ELIGIBLE",
        message: "This discount offer is valid for new customers only"
      };
    }

    if (discount.applicability.customerType === "existing" && isNew) {
      return {
        eligible: false,
        reasonCode: "CUSTOMER_NOT_ELIGIBLE",
        message: "This discount offer is reserved for existing returning customers"
      };
    }
  }

  // 7. Global Usage Limit
  if (discount.usageLimits?.maximumTotalUsage != null && discount.usageLimits.maximumTotalUsage > 0) {
    if ((discount.usageCount || 0) >= discount.usageLimits.maximumTotalUsage) {
      return {
        eligible: false,
        reasonCode: "USAGE_LIMIT_REACHED",
        message: "This promotional discount has reached its total redemption limit"
      };
    }
  }

  // 8. Per-Customer Usage Limit
  if (discount.usageLimits?.maximumPerCustomer != null && discount.usageLimits.maximumPerCustomer > 0 && customerId) {
    const customerUsageCount = await DiscountUsage.countDocuments({
      discountId: discount._id,
      customerId,
      status: { $in: ["redeemed", "reserved"] }
    });

    if (customerUsageCount >= discount.usageLimits.maximumPerCustomer) {
      return {
        eligible: false,
        reasonCode: "CUSTOMER_USAGE_LIMIT_REACHED",
        message: `You have reached the maximum allowed usage limit (${discount.usageLimits.maximumPerCustomer}) for this coupon`
      };
    }
  }

  // 9. Line Item / Product / Plan Filtering
  const eligibleAmount = calculateEligibleAmount(discount, context);
  if (eligibleAmount <= 0) {
    const hasProductFilter = discount.applicability?.products?.length > 0;
    const hasPlanFilter = discount.applicability?.plans?.length > 0;

    if (hasProductFilter) {
      return {
        eligible: false,
        reasonCode: "PRODUCT_NOT_ELIGIBLE",
        message: "No products in this order are eligible for this discount"
      };
    }
    if (hasPlanFilter) {
      return {
        eligible: false,
        reasonCode: "PLAN_NOT_ELIGIBLE",
        message: "Selected subscription plans are not eligible for this discount"
      };
    }
    return {
      eligible: false,
      reasonCode: "MINIMUM_PURCHASE_NOT_MET",
      message: "Order amount eligible for discount is zero"
    };
  }

  // 10. Stacking rules
  if (context.existingDiscounts && context.existingDiscounts.length > 0) {
    if (!discount.stacking?.isStackable) {
      return {
        eligible: false,
        reasonCode: "STACKING_NOT_ALLOWED",
        message: "This discount code cannot be combined with other offers"
      };
    }
  }

  return {
    eligible: true,
    eligibleAmount
  };
};

export default {
  checkEligibility
};
