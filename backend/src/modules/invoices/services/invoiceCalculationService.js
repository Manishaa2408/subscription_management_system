const {
  roundMoney,
  calculateLineTax,
  aggregateTaxBreakdown,
  getApplicableTax
} = require('./taxCalculationService');

/**
 * Validates and calculates a single invoice line item
 */
const calculateLineItem = async (rawItem, supplierState, customerState) => {
  const quantity = Number(rawItem.quantity);
  const unitPrice = Number(rawItem.unitPrice);

  if (!rawItem.itemName || typeof rawItem.itemName !== 'string') {
    throw new Error('Item name is required for all line items');
  }

  if (isNaN(quantity) || quantity <= 0) {
    throw new Error(`Invalid quantity "${rawItem.quantity}" for item "${rawItem.itemName}". Must be positive.`);
  }

  if (isNaN(unitPrice) || unitPrice < 0) {
    throw new Error(`Invalid unit price "${rawItem.unitPrice}" for item "${rawItem.itemName}". Cannot be negative.`);
  }

  const grossAmount = roundMoney(quantity * unitPrice);

  // Discount calculation
  let discountAmount = 0;
  const discountType = rawItem.discountType === 'fixed' ? 'fixed' : 'percentage';
  const discountValue = Math.max(0, Number(rawItem.discountValue || rawItem.discountPercentage || 0));

  if (discountType === 'percentage') {
    if (discountValue > 100) {
      throw new Error(`Discount percentage cannot exceed 100% for item "${rawItem.itemName}"`);
    }
    discountAmount = roundMoney((grossAmount * discountValue) / 100);
  } else {
    // Fixed discount
    discountAmount = roundMoney(Math.min(grossAmount, discountValue));
  }

  const taxableAmount = Math.max(0, roundMoney(grossAmount - discountAmount));

  // Retrieve applicable tax configuration
  const taxConfig = await getApplicableTax(rawItem.taxCode);
  const taxRate = rawItem.taxRate !== undefined && rawItem.taxRate !== null
    ? Number(rawItem.taxRate)
    : taxConfig.rate;

  const taxResult = calculateLineTax({
    taxableAmount,
    taxRate,
    taxCode: taxConfig.code || rawItem.taxCode || 'GST18',
    supplierState,
    customerState
  });

  return {
    itemName: rawItem.itemName.trim(),
    description: (rawItem.description || '').trim(),
    productId: rawItem.productId || null,
    variantId: rawItem.variantId || null,
    quantity,
    unitPrice: roundMoney(unitPrice),
    grossAmount,
    discountType,
    discountValue,
    discountAmount,
    taxableAmount,
    taxCode: taxResult.taxCode,
    taxRate: taxResult.taxRate,
    gstType: taxResult.gstType,
    cgstRate: taxResult.cgstRate,
    cgstAmount: taxResult.cgstAmount,
    sgstRate: taxResult.sgstRate,
    sgstAmount: taxResult.sgstAmount,
    igstRate: taxResult.igstRate,
    igstAmount: taxResult.igstAmount,
    taxAmount: taxResult.taxAmount,
    lineTotal: taxResult.lineTotal
  };
};

/**
 * Calculates complete financial totals for an invoice
 */
const calculateInvoiceTotals = async (rawItems, supplierState = 'Kerala', customerState = 'Kerala') => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error('Invoice must contain at least one line item');
  }

  const calculatedItems = [];
  let subtotal = 0;
  let discountTotal = 0;
  let taxableAmount = 0;

  for (const raw of rawItems) {
    const calculated = await calculateLineItem(raw, supplierState, customerState);
    calculatedItems.push(calculated);

    subtotal = roundMoney(subtotal + calculated.grossAmount);
    discountTotal = roundMoney(discountTotal + calculated.discountAmount);
    taxableAmount = roundMoney(taxableAmount + calculated.taxableAmount);
  }

  const taxBreakdown = aggregateTaxBreakdown(calculatedItems);
  const taxTotal = taxBreakdown.totalTax;
  const grandTotal = roundMoney(taxableAmount + taxTotal);

  return {
    items: calculatedItems,
    subtotal,
    discountTotal,
    taxableAmount,
    taxBreakdown,
    taxTotal,
    grandTotal
  };
};

module.exports = {
  calculateLineItem,
  calculateInvoiceTotals
};
