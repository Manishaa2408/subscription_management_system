/**
 * Pricing Service for Quotation Templates
 * Authoritative backend monetary and tax calculations.
 * Consistent two-decimal rounding, prevents client total tampering.
 */

export const roundToTwo = (num) => {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

/**
 * Calculate single line item totals
 * @param {number} quantity 
 * @param {number} unitPrice 
 * @param {number} taxRate (percentage, e.g. 18 for 18%)
 */
export const calculateLineItem = (quantity, unitPrice, taxRate = 0) => {
  const qty = Number(quantity);
  const price = Number(unitPrice);
  const tax = Number(taxRate) || 0;

  if (isNaN(qty) || qty <= 0) {
    throw new Error(`Invalid line quantity: ${quantity}`);
  }
  if (isNaN(price) || price < 0) {
    throw new Error(`Invalid line unit price: ${unitPrice}`);
  }
  if (isNaN(tax) || tax < 0 || tax > 100) {
    throw new Error(`Invalid tax rate: ${taxRate}`);
  }

  const lineSubtotal = roundToTwo(qty * price);
  const taxAmount = roundToTwo((lineSubtotal * tax) / 100);
  const lineTotal = roundToTwo(lineSubtotal + taxAmount);

  return {
    quantity: qty,
    unitPrice: price,
    taxRate: tax,
    lineSubtotal,
    taxAmount,
    lineTotal
  };
};

/**
 * Calculate template totals from array of processed line items
 * @param {Array} items 
 */
export const calculateTemplateTotals = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Template must contain at least one item to calculate totals");
  }

  let subtotal = 0;
  let taxTotal = 0;
  let grandTotal = 0;

  for (const item of items) {
    subtotal += item.lineSubtotal;
    taxTotal += item.taxAmount;
    grandTotal += item.lineTotal;
  }

  return {
    subtotal: roundToTwo(subtotal),
    taxTotal: roundToTwo(taxTotal),
    grandTotal: roundToTwo(grandTotal)
  };
};

export default {
  roundToTwo,
  calculateLineItem,
  calculateTemplateTotals
};
