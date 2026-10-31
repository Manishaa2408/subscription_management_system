const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const invoiceAdapter = require('../adapters/invoiceAdapter');

/**
 * Calculates current payment summary for an invoice and syncs with invoice adapter
 * @param {string} invoiceId
 */
const syncInvoicePaymentSummary = async (invoiceId) => {
  if (!invoiceId) return null;

  const invoice = await invoiceAdapter.getInvoiceById(invoiceId);
  if (!invoice) {
    throw new Error(`Invoice with ID "${invoiceId}" not found for payment synchronization`);
  }

  // Authoritative invoice grand total
  const grandTotal = invoice.grandTotal || 0;

  // Aggregate all completed payments for this invoice
  const completedPayments = await Payment.find({
    invoiceId: invoice._id ? invoice._id.toString() : invoiceId.toString(),
    status: 'completed'
  }).lean();

  const totalPaymentsAmount = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Aggregate completed refunds for this invoice
  const completedRefunds = await Refund.find({
    invoiceId: invoice._id ? invoice._id.toString() : invoiceId.toString(),
    status: 'completed'
  }).lean();

  const totalRefundedAmount = completedRefunds.reduce((sum, r) => sum + (r.amount || 0), 0);

  const netPaid = Math.max(0, Math.round((totalPaymentsAmount - totalRefundedAmount) * 100) / 100);
  const outstandingAmount = Math.max(0, Math.round((grandTotal - netPaid) * 100) / 100);

  let paymentStatus = 'issued';
  if (grandTotal > 0 && netPaid >= grandTotal) {
    paymentStatus = 'paid';
  } else if (netPaid > 0 && netPaid < grandTotal) {
    paymentStatus = 'partially_paid';
  } else if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && outstandingAmount > 0) {
    paymentStatus = 'overdue';
  }

  const summary = {
    invoiceId: invoice._id || invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId,
    grandTotal,
    totalPaid: netPaid,
    totalRefunded: totalRefundedAmount,
    outstandingAmount,
    paymentStatus,
    paymentsCount: completedPayments.length,
    lastPaymentDate: completedPayments.length > 0 
      ? completedPayments[completedPayments.length - 1].paymentDate 
      : null
  };

  // Sync to M10 through adapter
  await invoiceAdapter.updateInvoicePaymentSummary(invoiceId, summary);

  return summary;
};

/**
 * Get current payment summary without modifying adapter
 */
const getInvoicePaymentSummary = async (invoiceId) => {
  return await syncInvoicePaymentSummary(invoiceId);
};

module.exports = {
  syncInvoicePaymentSummary,
  getInvoicePaymentSummary
};
