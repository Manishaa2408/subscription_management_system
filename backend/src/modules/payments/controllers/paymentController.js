const paymentService = require('../services/paymentService');
const { getInvoicePaymentSummary } = require('../services/invoicePaymentSyncService');
const { getReceiptByPaymentId } = require('../services/receiptService');
const invoiceAdapter = require('../adapters/invoiceAdapter');
const Payment = require('../models/Payment');

/**
 * Record a payment
 * POST /api/payments (Admin, Staff)
 */
const recordPayment = async (req, res) => {
  try {
    const result = await paymentService.recordPayment(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: `Payment ${result.payment.paymentReference} recorded successfully`,
      data: result
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * List payments with filters
 * GET /api/payments (Admin, Staff)
 */
const getPayments = async (req, res) => {
  try {
    const result = await paymentService.getPayments(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: result.payments,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * List logged-in customer's own payments
 * GET /api/payments/my (Customer)
 */
const getMyPayments = async (req, res) => {
  try {
    const result = await paymentService.getPayments(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Your payments retrieved successfully',
      data: result.payments,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * Get payment by ID
 * GET /api/payments/:id (Admin, Staff, Owner Customer)
 */
const getPaymentById = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id, req.user);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
        errors: [`No payment found with ID ${req.params.id}`]
      });
    }

    // Try fetching receipt if available
    const receipt = await getReceiptByPaymentId(payment._id, req.user).catch(() => null);

    return res.status(200).json({
      success: true,
      message: 'Payment retrieved successfully',
      data: {
        ...payment,
        receipt
      }
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * Verify pending payment
 * PATCH /api/payments/:id/verify (Admin)
 */
const verifyPayment = async (req, res) => {
  try {
    const result = await paymentService.verifyPayment(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: `Payment ${result.payment.paymentReference} verified successfully`,
      data: result
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * Mark payment failed
 * PATCH /api/payments/:id/fail (Admin)
 */
const failPayment = async (req, res) => {
  try {
    const payment = await paymentService.failPayment(req.params.id, req.body.reason, req.user);
    return res.status(200).json({
      success: true,
      message: `Payment ${payment.paymentReference} marked as failed`,
      data: payment
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * Get payments for an invoice
 * GET /api/payments/invoice/:invoiceId
 */
const getPaymentsByInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;
    const payments = await Payment.find({ invoiceId }).sort({ paymentDate: -1 }).lean();
    const summary = await getInvoicePaymentSummary(invoiceId);

    return res.status(200).json({
      success: true,
      message: 'Invoice payments retrieved successfully',
      data: {
        invoiceId,
        summary,
        payments
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * Get authoritative invoice payment summary (for M10 synchronization)
 * GET /api/payments/invoice/:invoiceId/summary
 */
const getInvoiceSummary = async (req, res) => {
  try {
    const summary = await getInvoicePaymentSummary(req.params.invoiceId);
    return res.status(200).json({
      success: true,
      message: 'Invoice payment summary retrieved',
      data: summary
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * Analytics summary for M12 Dashboard
 * GET /api/payments/analytics/summary
 */
const getAnalyticsSummary = async (req, res) => {
  try {
    const summary = await paymentService.getAnalyticsSummary();
    return res.status(200).json({
      success: true,
      message: 'Payment analytics summary retrieved',
      data: summary
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * Helper to fetch payable invoices for RecordPayment form
 * GET /api/payments/dev/invoices
 */
const getPayableInvoices = async (req, res) => {
  try {
    const invoices = await invoiceAdapter.getAllInvoices(req.query);
    return res.status(200).json({
      success: true,
      message: 'Invoices retrieved successfully',
      data: invoices
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Mock gateway webhook receiver
 * POST /api/payments/webhook
 */
const handleGatewayWebhook = async (req, res) => {
  try {
    const { event, paymentId, amount, transactionReference } = req.body;
    if (event === 'payment.captured' && paymentId) {
      const payment = await Payment.findById(paymentId);
      if (payment && payment.status === 'pending') {
        payment.status = 'completed';
        payment.transactionReference = transactionReference || payment.transactionReference;
        payment.verifiedAt = new Date();
        await payment.save();
        await paymentService.verifyPayment(payment._id, { id: 'GATEWAY_WEBHOOK', role: 'system', name: 'Gateway Webhook' });
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  recordPayment,
  getPayments,
  getMyPayments,
  getPaymentById,
  verifyPayment,
  failPayment,
  getPaymentsByInvoice,
  getInvoiceSummary,
  getAnalyticsSummary,
  getPayableInvoices,
  handleGatewayWebhook
};
