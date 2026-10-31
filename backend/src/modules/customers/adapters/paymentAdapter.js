const MOCK_PAYMENTS = [
  {
    id: 'pay_301',
    customerId: '660000000000000000000010',
    paymentNumber: 'PAY-2026-00078',
    invoiceNumber: 'INV/2026/00120',
    paymentDate: new Date('2026-09-05'),
    amount: 58999,
    paymentMethod: 'Bank Transfer (NEFT)',
    status: 'completed',
    transactionReference: 'NEFT-AXIS-992104'
  },
  {
    id: 'pay_302',
    customerId: '660000000000000000000010',
    paymentNumber: 'PAY-2026-00035',
    invoiceNumber: 'INV/2026/00095',
    paymentDate: new Date('2026-08-02'),
    amount: 1999,
    paymentMethod: 'UPI',
    status: 'completed',
    transactionReference: 'UPI-9012849182'
  }
];

const getCustomerPayments = async (customerId) => {
  const list = MOCK_PAYMENTS.filter(
    (p) => String(p.customerId) === String(customerId)
  );
  return list.length > 0 ? list : MOCK_PAYMENTS.map(p => ({ ...p, customerId }));
};

const getPaymentById = async (paymentId) => {
  return MOCK_PAYMENTS.find((p) => p.id === String(paymentId)) || null;
};

const getCustomerPaymentSummary = async (customerId) => {
  const payments = await getCustomerPayments(customerId);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalPayments: payments.length,
    totalPaidAmount: totalPaid,
    lastPaymentDate: payments[0]?.paymentDate || null
  };
};

module.exports = {
  getCustomerPayments,
  getPaymentById,
  getCustomerPaymentSummary,
  MOCK_PAYMENTS
};
