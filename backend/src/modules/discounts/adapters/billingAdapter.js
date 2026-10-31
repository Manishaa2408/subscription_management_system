/**
 * Billing Adapter for Discount Management (M8)
 * Interfaces with Module M9 (Recurring Billing Engine)
 */

export const getBillingContext = async (subscriptionId, billingCycle) => {
  return {
    subscriptionId,
    billingCycle: billingCycle || 1,
    status: "active"
  };
};

export const getRecurringDiscountConfiguration = async (discount) => {
  if (!discount || discount.applicationType === "one_time") {
    return null;
  }

  return {
    discountId: discount._id,
    code: discount.code,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    currency: discount.currency,
    applicationType: discount.applicationType,
    billingCycles: discount.applicationType === "unlimited_recurring" ? -1 : (discount.billingCycles || 1)
  };
};

export default {
  getBillingContext,
  getRecurringDiscountConfiguration
};
