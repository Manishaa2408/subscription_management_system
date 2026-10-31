/**
 * M12 Discount Analytics Adapter
 * Decouples M12 from M8 (Discount Management).
 */

const SEED_DISCOUNTS = [
  { code: 'EARLYBIRD20', type: 'percentage', value: 20, usageCount: 4, totalSavings: 18400, status: 'active' },
  { code: 'STARTUP500', type: 'fixed', value: 500, usageCount: 8, totalSavings: 4000, status: 'active' },
  { code: 'ENTERPRISE15', type: 'percentage', value: 15, usageCount: 2, totalSavings: 36000, status: 'active' },
  { code: 'BETAEXPIRED', type: 'percentage', value: 10, usageCount: 5, totalSavings: 7500, status: 'expired' }
];

const getDiscountSummary = async () => {
  const totalSavings = SEED_DISCOUNTS.reduce((sum, d) => sum + d.totalSavings, 0);
  const totalUsage = SEED_DISCOUNTS.reduce((sum, d) => sum + d.usageCount, 0);
  return {
    totalDiscounts: SEED_DISCOUNTS.length,
    activeDiscounts: SEED_DISCOUNTS.filter((d) => d.status === 'active').length,
    totalUsage,
    totalSavings,
    discounts: SEED_DISCOUNTS
  };
};

module.exports = {
  SEED_DISCOUNTS,
  getDiscountSummary
};
