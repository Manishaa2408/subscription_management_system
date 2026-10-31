/**
 * M10 Temporary Payment Adapter
 * 
 * Standalone development adapter to decouple M10 from Developer 3's M11 Payment & Reconciliation module.
 * Exposes: getInvoicePaymentSummary, getPaidAmount, getOutstandingAmount, getPaymentStatus, recordMockPayment.
 * 
 * In final integration, connect M10 to M11's payment records service:
 *   const paymentService = require('../../payments/services/paymentService');
 */

// In-memory mock payments store for dev testing
const MOCK_PAYMENTS_STORE = new Map();

const getInvoicePaymentSummary = async (invoiceId) => {
  if (!invoiceId) return null;
  const idStr = invoiceId.toString();
  const payments = MOCK_PAYMENTS_STORE.get(idStr) || [];
  
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  return {
    invoiceId: idStr,
    totalPaid: Math.round(totalPaid * 100) / 100,
    paymentsCount: payments.length,
    paymentsList: payments.map(p => ({
      paymentId: p.paymentId,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      transactionReference: p.transactionReference,
      paymentDate: p.paymentDate,
      status: p.status
    }))
  };
};

const getPaidAmount = async (invoiceId) => {
  const summary = await getInvoicePaymentSummary(invoiceId);
  return summary ? summary.totalPaid : 0;
};

const getOutstandingAmount = async (invoiceId, grandTotal) => {
  const paid = await getPaidAmount(invoiceId);
  const outstanding = Math.max(0, (grandTotal || 0) - paid);
  return Math.round(outstanding * 100) / 100;
};

const getPaymentStatus = async (invoiceId, grandTotal, dueDate) => {
  const paid = await getPaidAmount(invoiceId);
  const total = grandTotal || 0;

  if (total > 0 && paid >= total) {
    return 'paid';
  }
  if (paid > 0 && paid < total) {
    return 'partially_paid';
  }
  if (dueDate && new Date(dueDate) < new Date()) {
    return 'overdue';
  }
  return 'issued';
};

const recordMockPayment = async (invoiceId, paymentData) => {
  if (!invoiceId) throw new Error('Invoice ID required');
  const idStr = invoiceId.toString();
  const existing = MOCK_PAYMENTS_STORE.get(idStr) || [];
  
  const newPayment = {
    paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    amount: paymentData.amount,
    paymentMethod: paymentData.paymentMethod || 'bank_transfer',
    transactionReference: paymentData.transactionReference || `TXN-REF-${Date.now()}`,
    paymentDate: paymentData.paymentDate || new Date(),
    status: 'completed',
    recordedAt: new Date()
  };

  existing.push(newPayment);
  MOCK_PAYMENTS_STORE.set(idStr, existing);
  return newPayment;
};

module.exports = {
  getInvoicePaymentSummary,
  getPaidAmount,
  getOutstandingAmount,
  getPaymentStatus,
  recordMockPayment,
  MOCK_PAYMENTS_STORE
};
