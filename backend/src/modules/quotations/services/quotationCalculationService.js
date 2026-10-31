import discountAdapter from "../adapters/discountAdapter.js";
import taxAdapter from "../adapters/taxAdapter.js";

export const roundToTwo = (num) => {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

/**
 * Authoritative backend calculations for a quotation
 */
export const calculateQuotationTotals = async (lineItems = [], discountCode = null, customerContext = {}) => {
  if (!Array.isArray(lineItems)) {
    throw new Error("Line items must be an array");
  }

  let subtotal = 0;
  const processedItems = [];

  for (const item of lineItems) {
    const qty = Math.max(0.01, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const taxRate = Number(item.taxRate) || 18;

    const lineSubtotal = roundToTwo(qty * price);
    const taxAmount = roundToTwo((lineSubtotal * taxRate) / 100);
    const lineTotal = roundToTwo(lineSubtotal + taxAmount);

    subtotal += lineSubtotal;

    processedItems.push({
      ...item,
      quantity: qty,
      unitPrice: price,
      taxRate,
      lineSubtotal,
      lineTotal
    });
  }

  subtotal = roundToTwo(subtotal);

  // Validate and compute discount
  let discountAmount = 0;
  let discountDetails = { code: null, type: null, value: 0 };

  if (discountCode) {
    const discountValidation = await discountAdapter.validateDiscount(discountCode, subtotal);
    if (!discountValidation.valid) {
      throw new Error(discountValidation.message);
    }
    if (discountValidation.discount) {
      discountAmount = discountValidation.discountAmount;
      discountDetails = discountValidation.discount;
    }
  }

  const taxableAmount = Math.max(0, roundToTwo(subtotal - discountAmount));

  // Compute taxes through tax adapter
  const taxResult = await taxAdapter.calculateTax(taxableAmount, customerContext, processedItems);
  const totalTax = taxResult.totalTax;
  const taxBreakdown = taxResult.taxBreakdown;

  const grandTotal = roundToTwo(taxableAmount + totalTax);

  return {
    lineItems: processedItems,
    subtotal,
    discountDetails,
    discountAmount,
    taxableAmount,
    taxBreakdown,
    totalTax,
    grandTotal
  };
};

export default {
  roundToTwo,
  calculateQuotationTotals
};
