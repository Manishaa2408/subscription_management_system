/**
 * Discount Calculation Service (M8)
 * Handles monetary precision calculations, eligible amount filtering,
 * caps, and bound checks.
 */

export const calculateEligibleAmount = (discount, context = {}) => {
  const lineItems = context.lineItems || [];

  // If no line items, fallback to context subtotal or totalAmount
  if (!lineItems || lineItems.length === 0) {
    return Math.max(0, Number(context.subtotal ?? context.totalAmount ?? 0));
  }

  const hasProductFilter = discount.applicability?.products?.length > 0;
  const hasPlanFilter = discount.applicability?.plans?.length > 0;

  // If no specific product or plan restrictions, all line items are eligible
  if (!hasProductFilter && !hasPlanFilter) {
    return lineItems.reduce((sum, item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  }

  // Filter line items based on applicability
  const applicableProductIds = (discount.applicability.products || []).map((p) => p.toString());
  const applicablePlanIds = (discount.applicability.plans || []).map((p) => p.toString());

  let eligibleAmount = 0;

  for (const item of lineItems) {
    const itemProductId = item.productId ? item.productId.toString() : null;
    const itemPlanId = item.planId ? item.planId.toString() : null;

    let isEligible = false;

    if (hasProductFilter && itemProductId && applicableProductIds.includes(itemProductId)) {
      isEligible = true;
    }
    if (hasPlanFilter && itemPlanId && applicablePlanIds.includes(itemPlanId)) {
      isEligible = true;
    }

    if (isEligible) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      eligibleAmount += qty * price;
    }
  }

  return Math.round(eligibleAmount * 100) / 100;
};

export const calculateDiscountAmount = (discount, eligibleAmount) => {
  const amount = Math.max(0, Number(eligibleAmount) || 0);

  if (amount === 0) {
    return {
      eligibleAmount: 0,
      rawDiscount: 0,
      finalDiscount: 0,
      maximumDiscountApplied: false
    };
  }

  let rawDiscount = 0;
  let maximumDiscountApplied = false;

  if (discount.discountType === "percentage") {
    const pct = Math.min(100, Math.max(0, Number(discount.discountValue) || 0));
    rawDiscount = (amount * pct) / 100;

    if (discount.maximumDiscount != null && discount.maximumDiscount > 0) {
      if (rawDiscount > discount.maximumDiscount) {
        rawDiscount = discount.maximumDiscount;
        maximumDiscountApplied = true;
      }
    }
  } else if (discount.discountType === "fixed") {
    const fixedVal = Math.max(0, Number(discount.discountValue) || 0);
    rawDiscount = Math.min(fixedVal, amount);
  }

  // Ensure 0 <= finalDiscount <= eligibleAmount
  const finalDiscount = Math.max(0, Math.min(rawDiscount, amount));
  const roundedFinal = Math.round(finalDiscount * 100) / 100;

  return {
    eligibleAmount: amount,
    rawDiscount: Math.round(rawDiscount * 100) / 100,
    finalDiscount: roundedFinal,
    maximumDiscountApplied
  };
};

export default {
  calculateEligibleAmount,
  calculateDiscountAmount
};
