const Payment = require('../models/Payment');
const invoiceAdapter = require('../adapters/invoiceAdapter');
const { getInvoicePaymentSummary } = require('./invoicePaymentSyncService');

/**
 * Validates whether a payment can be allocated against an invoice
 * Enforces overpayment rejection, customer match, and positive amount
 */
const validatePaymentAllocation = async ({ invoiceId, customerId, amount, transactionReference }) => {
  const numericAmount = Number(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Payment amount must be a positive number greater than zero');
  }

  const invoice = await invoiceAdapter.getInvoiceById(invoiceId);
  if (!invoice) {
    throw new Error(`Invoice with ID "${invoiceId}" not found`);
  }

  // Customer match check
  if (customerId && invoice.customerId && invoice.customerId !== customerId) {
    throw new Error(`Customer ID "${customerId}" does not match invoice customer "${invoice.customerId}"`);
  }

  // Authoritative current outstanding balance
  const paymentSummary = await getInvoicePaymentSummary(invoice._id || invoiceId);
  const outstanding = paymentSummary.outstandingAmount;

  if (numericAmount > outstanding) {
    throw new Error(
      `Payment amount of ₹${numericAmount} exceeds the current outstanding balance of ₹${outstanding}. Overpayments are strictly rejected per billing policy.`
    );
  }

  // Duplicate transaction reference check (if transactionReference provided)
  if (transactionReference && transactionReference.trim()) {
    const existingTxn = await Payment.findOne({
      transactionReference: transactionReference.trim(),
      status: { $in: ['completed', 'pending'] }
    });

    if (existingTxn) {
      throw new Error(
        `A payment record with transaction reference "${transactionReference.trim()}" already exists (${existingTxn.paymentReference})`
      );
    }
  }

  return {
    valid: true,
    invoice,
    outstandingAmount: outstanding
  };
};

module.exports = {
  validatePaymentAllocation
};
