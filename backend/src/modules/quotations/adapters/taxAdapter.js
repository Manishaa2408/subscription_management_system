/**
 * Tax Adapter for Quotation Management (M6)
 * Simulates Developer 3's Module M10 (Invoice & Tax Management)
 */

export const calculateTax = async (taxableAmount, customerContext = {}, lineItems = []) => {
  const amount = Math.max(0, Number(taxableAmount) || 0);

  // Standard Indian GST rate for SaaS software and consulting services is 18%
  // Break down into CGST (9%) and SGST (9%)
  const cgstRate = 9;
  const sgstRate = 9;
  const totalRate = 18;

  const cgstAmount = Math.round(((amount * cgstRate) / 100) * 100) / 100;
  const sgstAmount = Math.round(((amount * sgstRate) / 100) * 100) / 100;
  const totalTax = Math.round((cgstAmount + sgstAmount) * 100) / 100;

  const taxBreakdown = [
    {
      name: "CGST",
      rate: cgstRate,
      amount: cgstAmount
    },
    {
      name: "SGST",
      rate: sgstRate,
      amount: sgstAmount
    }
  ];

  return {
    taxRate: totalRate,
    totalTax,
    taxBreakdown
  };
};

export default {
  calculateTax
};
