const MOCK_QUOTATIONS = [
  {
    id: 'quote_101',
    customerId: '660000000000000000000010',
    quotationNumber: 'SO-QT-2026-0042',
    quotationDate: new Date('2026-03-01'),
    validUntil: new Date('2026-03-31'),
    totalAmount: 58999,
    status: 'accepted',
    itemsCount: 3
  },
  {
    id: 'quote_102',
    customerId: '660000000000000000000010',
    quotationNumber: 'SO-QT-2026-0089',
    quotationDate: new Date('2026-10-15'),
    validUntil: new Date('2026-11-15'),
    totalAmount: 14990,
    status: 'sent',
    itemsCount: 1
  }
];

const getCustomerQuotations = async (customerId) => {
  const list = MOCK_QUOTATIONS.filter(
    (q) => String(q.customerId) === String(customerId)
  );
  return list.length > 0 ? list : MOCK_QUOTATIONS.map(q => ({ ...q, customerId }));
};

const getQuotationById = async (quotationId) => {
  return MOCK_QUOTATIONS.find((q) => q.id === String(quotationId)) || null;
};

module.exports = {
  getCustomerQuotations,
  getQuotationById,
  MOCK_QUOTATIONS
};
