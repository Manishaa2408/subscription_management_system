/**
 * M12 Quotation Analytics Adapter
 * Decouples M12 from M6 (Quotation Management).
 */

const SEED_QUOTATIONS = [
  { id: 'quot_01', status: 'accepted', totalValue: 39600, customerId: 'cust_001_intra_kerala', date: new Date('2026-01-20T10:00:00Z') },
  { id: 'quot_02', status: 'accepted', totalValue: 171000, customerId: 'cust_002_inter_bengaluru', date: new Date('2026-02-15T11:00:00Z') },
  { id: 'quot_03', status: 'accepted', totalValue: 9000, customerId: 'cust_003_inter_chennai', date: new Date('2026-03-10T12:00:00Z') },
  { id: 'quot_04', status: 'accepted', totalValue: 120000, customerId: 'cust_001_intra_kerala', date: new Date('2026-04-05T14:00:00Z') },
  { id: 'quot_05', status: 'sent', totalValue: 50000, customerId: 'cust_005_mumbai_ent', date: new Date('2026-09-12T15:00:00Z') },
  { id: 'quot_06', status: 'sent', totalValue: 25000, customerId: 'cust_004_individual', date: new Date('2026-10-02T16:00:00Z') },
  { id: 'quot_07', status: 'rejected', totalValue: 35000, customerId: 'cust_006_inactive_user', date: new Date('2026-06-18T09:30:00Z') },
  { id: 'quot_08', status: 'expired', totalValue: 40000, customerId: 'cust_003_inter_chennai', date: new Date('2026-05-14T10:30:00Z') },
  { id: 'quot_09', status: 'draft', totalValue: 60000, customerId: 'cust_002_inter_bengaluru', date: new Date('2026-10-25T11:45:00Z') }
];

const getQuotations = async () => [...SEED_QUOTATIONS];

const getQuotationStatusBreakdown = async () => {
  const breakdown = { accepted: 0, sent: 0, rejected: 0, expired: 0, draft: 0 };
  SEED_QUOTATIONS.forEach((q) => {
    breakdown[q.status] = (breakdown[q.status] || 0) + 1;
  });
  return breakdown;
};

const getQuotationConversionData = async () => {
  const accepted = SEED_QUOTATIONS.filter((q) => q.status === 'accepted');
  const eligible = SEED_QUOTATIONS.filter((q) => ['accepted', 'rejected', 'expired', 'sent'].includes(q.status));

  const totalValue = SEED_QUOTATIONS.reduce((sum, q) => sum + q.totalValue, 0);
  const acceptedValue = accepted.reduce((sum, q) => sum + q.totalValue, 0);

  const conversionRate = eligible.length > 0 ? parseFloat(((accepted.length / eligible.length) * 100).toFixed(1)) : 0;

  return {
    totalQuotations: SEED_QUOTATIONS.length,
    acceptedCount: accepted.length,
    eligibleCount: eligible.length,
    conversionRate, // Percentage
    totalValue,
    acceptedValue,
    avgQuotationValue: Math.round(totalValue / (SEED_QUOTATIONS.length || 1))
  };
};

module.exports = {
  SEED_QUOTATIONS,
  getQuotations,
  getQuotationStatusBreakdown,
  getQuotationConversionData
};
