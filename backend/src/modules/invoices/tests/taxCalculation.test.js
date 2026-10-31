const {
  roundMoney,
  determineGSTType,
  calculateLineTax,
  aggregateTaxBreakdown
} = require('../services/taxCalculationService');
const { calculateInvoiceTotals } = require('../services/invoiceCalculationService');

describe('M10 - Tax and Invoice Calculation Engine', () => {
  describe('Rounding and Precision Utility', () => {
    test('rounds standard decimals accurately to 2 decimal places', () => {
      expect(roundMoney(123.456)).toBe(123.46);
      expect(roundMoney(10.004)).toBe(10);
      expect(roundMoney(10.005)).toBe(10.01);
    });

    test('handles edge case inputs safely', () => {
      expect(roundMoney(null)).toBe(0);
      expect(roundMoney(undefined)).toBe(0);
      expect(roundMoney(NaN)).toBe(0);
      expect(roundMoney('invalid')).toBe(0);
    });
  });

  describe('GST Type Determination', () => {
    test('identifies intra-state transaction when supplier and customer states match', () => {
      expect(determineGSTType('Kerala', 'Kerala')).toBe('INTRA_STATE');
      expect(determineGSTType('kerala ', ' KERALA')).toBe('INTRA_STATE');
    });

    test('identifies inter-state transaction when states differ', () => {
      expect(determineGSTType('Kerala', 'Karnataka')).toBe('INTER_STATE');
      expect(determineGSTType('Kerala', 'Tamil Nadu')).toBe('INTER_STATE');
      expect(determineGSTType('Kerala', 'Maharashtra')).toBe('INTER_STATE');
    });
  });

  describe('Intra-State GST Calculations (CGST + SGST)', () => {
    test('correctly splits 18% GST into 9% CGST and 9% SGST for intra-state', () => {
      const taxable = 1000;
      const result = calculateLineTax({
        taxableAmount: taxable,
        taxRate: 18,
        taxCode: 'GST18',
        supplierState: 'Kerala',
        customerState: 'Kerala'
      });

      expect(result.gstType).toBe('INTRA_STATE');
      expect(result.taxRate).toBe(18);
      expect(result.cgstRate).toBe(9);
      expect(result.cgstAmount).toBe(90);
      expect(result.sgstRate).toBe(9);
      expect(result.sgstAmount).toBe(90);
      expect(result.igstRate).toBe(0);
      expect(result.igstAmount).toBe(0);
      expect(result.taxAmount).toBe(180);
      expect(result.lineTotal).toBe(1180);
    });

    test('handles odd decimal amounts without penny rounding discrepancy', () => {
      const taxable = 333.33;
      const result = calculateLineTax({
        taxableAmount: taxable,
        taxRate: 18,
        taxCode: 'GST18',
        supplierState: 'Kerala',
        customerState: 'Kerala'
      });

      expect(result.taxAmount).toBe(60);
      expect(result.cgstAmount + result.sgstAmount).toBe(result.taxAmount);
      expect(result.lineTotal).toBe(393.33);
    });
  });

  describe('Inter-State GST Calculations (IGST)', () => {
    test('applies full 18% IGST for inter-state transactions', () => {
      const taxable = 2500;
      const result = calculateLineTax({
        taxableAmount: taxable,
        taxRate: 18,
        taxCode: 'GST18',
        supplierState: 'Kerala',
        customerState: 'Karnataka'
      });

      expect(result.gstType).toBe('INTER_STATE');
      expect(result.cgstAmount).toBe(0);
      expect(result.sgstAmount).toBe(0);
      expect(result.igstRate).toBe(18);
      expect(result.igstAmount).toBe(450);
      expect(result.taxAmount).toBe(450);
      expect(result.lineTotal).toBe(2950);
    });
  });

  describe('Invoice Totals and Multi-line Aggregates', () => {
    test('accurately calculates discounts and grand totals for mixed items', async () => {
      const rawItems = [
        {
          itemName: 'Cloud Subscription',
          quantity: 2,
          unitPrice: 2000, // 4000 gross
          discountType: 'percentage',
          discountValue: 10, // 400 discount -> 3600 taxable
          taxCode: 'GST18',
          taxRate: 18 // 648 tax
        },
        {
          itemName: 'Storage Addon',
          quantity: 1,
          unitPrice: 500, // 500 gross
          discountType: 'fixed',
          discountValue: 0, // 500 taxable
          taxCode: 'GST18',
          taxRate: 18 // 90 tax
        }
      ];

      const totals = await calculateInvoiceTotals(rawItems, 'Kerala', 'Kerala');

      expect(totals.subtotal).toBe(4500);
      expect(totals.discountTotal).toBe(400);
      expect(totals.taxableAmount).toBe(4100);
      expect(totals.taxTotal).toBe(738);
      expect(totals.taxBreakdown.cgstTotal).toBe(369);
      expect(totals.taxBreakdown.sgstTotal).toBe(369);
      expect(totals.taxBreakdown.igstTotal).toBe(0);
      expect(totals.grandTotal).toBe(4838);
    });
  });
});
