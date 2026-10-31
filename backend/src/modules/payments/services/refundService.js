const Refund = require('../models/Refund');
const Payment = require('../models/Payment');
const { generateRefundReference } = require('./paymentSequenceService');
const { syncInvoicePaymentSummary } = require('./invoicePaymentSyncService');

/**
 * Creates and processes a refund record against an existing completed payment
 */
const createRefund = async ({ paymentId, amount, reason }, user) => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Refund amount must be a positive number greater than zero');
  }

  if (!reason || !reason.trim()) {
    throw new Error('A valid reason for the refund is required for compliance and audit');
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error(`Original payment with ID "${paymentId}" not found`);
  }

  if (payment.status !== 'completed' && payment.status !== 'partially_refunded') {
    throw new Error(`Refunds can only be processed on completed payments. Current status: ${payment.status}`);
  }

  // Calculate previously refunded sum
  const existingRefunds = await Refund.find({
    paymentId: payment._id,
    status: 'completed'
  }).lean();

  const totalPreviouslyRefunded = existingRefunds.reduce((sum, r) => sum + (r.amount || 0), 0);
  const maxRefundable = Math.max(0, Math.round((payment.amount - totalPreviouslyRefunded) * 100) / 100);

  if (numericAmount > maxRefundable) {
    throw new Error(
      `Requested refund of ₹${numericAmount} exceeds the maximum refundable balance of ₹${maxRefundable}`
    );
  }

  const refundReference = await generateRefundReference(new Date().getFullYear());

  const refund = new Refund({
    paymentId: payment._id,
    paymentReference: payment.paymentReference,
    customerId: payment.customerId,
    invoiceId: payment.invoiceId,
    refundReference,
    amount: numericAmount,
    reason: reason.trim(),
    status: 'completed',
    processedBy: user ? { id: user.id, role: user.role, email: user.email, name: user.name } : undefined,
    processedAt: new Date()
  });

  await refund.save();

  // Update original payment status
  const newTotalRefunded = Math.round((totalPreviouslyRefunded + numericAmount) * 100) / 100;
  if (newTotalRefunded >= payment.amount) {
    payment.status = 'refunded';
  } else {
    payment.status = 'partially_refunded';
  }
  await payment.save();

  // Synchronize invoice balance (net paid decreases, outstanding increases)
  const invoiceSummary = await syncInvoicePaymentSummary(payment.invoiceId);

  return {
    refund,
    payment,
    invoiceSummary
  };
};

/**
 * List refunds with optional filters
 */
const getRefunds = async (filters = {}) => {
  const query = {};
  if (filters.customerId) query.customerId = filters.customerId;
  if (filters.paymentId) query.paymentId = filters.paymentId;

  return await Refund.find(query).sort({ processedAt: -1 }).lean();
};

/**
 * Get refund by ID
 */
const getRefundById = async (refundId) => {
  return await Refund.findById(refundId).lean();
};

module.exports = {
  createRefund,
  getRefunds,
  getRefundById
};
