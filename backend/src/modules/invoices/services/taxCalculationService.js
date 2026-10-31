const TaxConfiguration = require('../models/TaxConfiguration');

/**
 * Standard rounding utility to 2 decimal places to avoid IEEE 754 floating point issues
 */
const roundMoney = (num) => {
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
    return 0;
  }
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Normalizes state name for comparison (case-insensitive, trimmed)
 */
const normalizeState = (state) => {
  if (!state || typeof state !== 'string') return '';
  return state.trim().toLowerCase();
};

/**
 * Determines GST category based on supplier state and customer billing state
 * @param {string} supplierState e.g. 'Kerala'
 * @param {string} customerState e.g. 'Kerala' or 'Karnataka'
 * @returns {'INTRA_STATE' | 'INTER_STATE'}
 */
const determineGSTType = (supplierState, customerState) => {
  const normSupplier = normalizeState(supplierState || process.env.COMPANY_STATE || 'Kerala');
  const normCustomer = normalizeState(customerState || 'Kerala');

  if (normSupplier && normCustomer && normSupplier === normCustomer) {
    return 'INTRA_STATE';
  }
  return 'INTER_STATE';
};

/**
 * Calculates tax for an individual line item
 */
const calculateLineTax = ({
  taxableAmount,
  taxRate,
  taxCode = 'GST18',
  supplierState = 'Kerala',
  customerState = 'Kerala'
}) => {
  const safeTaxable = Math.max(0, roundMoney(taxableAmount));
  const safeRate = Math.max(0, Number(taxRate) || 0);

  if (safeRate === 0 || safeTaxable === 0) {
    return {
      taxCode,
      taxRate: 0,
      gstType: 'ZERO_TAX',
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      taxAmount: 0,
      lineTotal: safeTaxable
    };
  }

  const gstType = determineGSTType(supplierState, customerState);
  const totalTaxAmount = roundMoney((safeTaxable * safeRate) / 100);

  if (gstType === 'INTRA_STATE') {
    const halfRate = safeRate / 2;
    // Calculate CGST and SGST with equal split
    const cgstAmount = roundMoney((safeTaxable * halfRate) / 100);
    // Ensure sum matches totalTaxAmount exactly
    const sgstAmount = roundMoney(totalTaxAmount - cgstAmount);

    return {
      taxCode,
      taxRate: safeRate,
      gstType: 'INTRA_STATE',
      cgstRate: halfRate,
      cgstAmount,
      sgstRate: halfRate,
      sgstAmount,
      igstRate: 0,
      igstAmount: 0,
      taxAmount: totalTaxAmount,
      lineTotal: roundMoney(safeTaxable + totalTaxAmount)
    };
  } else {
    // INTER_STATE: IGST
    return {
      taxCode,
      taxRate: safeRate,
      gstType: 'INTER_STATE',
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: safeRate,
      igstAmount: totalTaxAmount,
      taxAmount: totalTaxAmount,
      lineTotal: roundMoney(safeTaxable + totalTaxAmount)
    };
  }
};

/**
 * Aggregates all line taxes into a comprehensive tax breakdown
 */
const aggregateTaxBreakdown = (calculatedLines) => {
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let totalTax = 0;

  const ratesMap = new Map();

  for (const line of calculatedLines) {
    cgstTotal += line.cgstAmount || 0;
    sgstTotal += line.sgstAmount || 0;
    igstTotal += line.igstAmount || 0;
    totalTax += line.taxAmount || 0;

    const key = `${line.taxCode || 'DEFAULT'}_${line.taxRate}`;
    if (!ratesMap.has(key)) {
      ratesMap.set(key, {
        taxCode: line.taxCode || 'GST',
        rate: line.taxRate,
        taxableAmount: 0,
        taxAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0
      });
    }

    const entry = ratesMap.get(key);
    entry.taxableAmount = roundMoney(entry.taxableAmount + (line.taxableAmount || 0));
    entry.taxAmount = roundMoney(entry.taxAmount + (line.taxAmount || 0));
    entry.cgst = roundMoney(entry.cgst + (line.cgstAmount || 0));
    entry.sgst = roundMoney(entry.sgst + (line.sgstAmount || 0));
    entry.igst = roundMoney(entry.igst + (line.igstAmount || 0));
  }

  return {
    cgstTotal: roundMoney(cgstTotal),
    sgstTotal: roundMoney(sgstTotal),
    igstTotal: roundMoney(igstTotal),
    totalTax: roundMoney(totalTax),
    ratesSummary: Array.from(ratesMap.values())
  };
};

const mongoose = require('mongoose');

/**
 * Fetch active tax configuration by code
 */
const getApplicableTax = async (taxCode) => {
  const DEFAULTS = {
    GST0: { name: 'GST 0%', code: 'GST0', rate: 0, isActive: true },
    GST5: { name: 'GST 5%', code: 'GST5', rate: 5, isActive: true },
    GST12: { name: 'GST 12%', code: 'GST12', rate: 12, isActive: true },
    GST18: { name: 'GST 18%', code: 'GST18', rate: 18, isActive: true },
    GST28: { name: 'GST 28%', code: 'GST28', rate: 28, isActive: true }
  };

  if (!taxCode) {
    return DEFAULTS.GST18;
  }

  const normalized = taxCode.trim().toUpperCase();

  // If MongoDB is actively connected, query configured taxes
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const found = await TaxConfiguration.findOne({ code: normalized, isActive: true });
      if (found) {
        return found;
      }
    } catch (err) {
      // Fallback on error
    }
  }

  return DEFAULTS[normalized] || { name: `GST ${taxCode}`, code: normalized, rate: 18, isActive: true };
};

module.exports = {
  roundMoney,
  normalizeState,
  determineGSTType,
  calculateLineTax,
  aggregateTaxBreakdown,
  getApplicableTax
};
