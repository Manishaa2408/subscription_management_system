const MOCK_INVOICES = [
  {
    id: 'inv_201',
    customerId: '660000000000000000000010',
    invoiceNumber: 'INV/2026/00120',
    invoiceDate: new Date('2026-09-01'),
    dueDate: new Date('2026-09-15'),
    totalAmount: 58999,
    amountDue: 0,
    status: 'paid'
  },
  {
    id: 'inv_202',
    customerId: '660000000000000000000010',
    invoiceNumber: 'INV/2026/00185',
    invoiceDate: new Date('2026-10-01'),
    dueDate: new Date('2026-10-15'),
    totalAmount: 1999,
    amountDue: 1999,
    status: 'posted'
  }
];

const getCustomerInvoices = async (customerId) => {
  const list = MOCK_INVOICES.filter(
    (i) => String(i.customerId) === String(customerId)
  );
  return list.length > 0 ? list : MOCK_INVOICES.map(i => ({ ...i, customerId }));
};

const getInvoiceById = async (invoiceId) => {
  return MOCK_INVOICES.find((i) => i.id === String(invoiceId)) || null;
};

const getInvoiceSummary = async (customerId) => {
  const invoices = await getCustomerInvoices(customerId);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.amountDue || 0), 0);
  const paidCount = invoices.filter((i) => i.status === 'paid').length;
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  return {
    totalInvoices: invoices.length,
    paidInvoices: paidCount,
    overdueInvoices: overdueCount,
    totalInvoiced,
    totalOutstanding
  };
};

module.exports = {
  getCustomerInvoices,
  getInvoiceById,
  getInvoiceSummary,
  MOCK_INVOICES
};
