const invoiceService = require('../services/invoiceService');
const paymentAdapter = require('../adapters/paymentAdapter');
const Invoice = require('../models/Invoice');

/**
 * Create a manual draft invoice
 * POST /api/invoices (Admin)
 */
const createInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.createInvoice(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Draft invoice created successfully',
      data: invoice
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
 * List all invoices with filters, pagination, and sorting
 * GET /api/invoices (Admin, Staff)
 */
const getInvoices = async (req, res) => {
  try {
    const result = await invoiceService.getInvoices(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Invoices retrieved successfully',
      data: result.invoices,
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
 * List logged-in customer's own invoices
 * GET /api/invoices/my (Customer)
 */
const getMyInvoices = async (req, res) => {
  try {
    const result = await invoiceService.getInvoices(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Your invoices retrieved successfully',
      data: result.invoices,
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
 * Get single invoice details by ID
 * GET /api/invoices/:id (Admin, Staff, Owner Customer)
 */
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id, req.user);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
        errors: [`No invoice found with ID: ${req.params.id}`]
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice details retrieved successfully',
      data: invoice
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message.includes('Access denied') ? 403 : 500);
    return res.status(statusCode).json({
      success: false,
      message: err.message,
      errors: [err.message]
    });
  }
};

/**
 * Update an eligible draft invoice
 * PUT /api/invoices/:id (Admin)
 */
const updateInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.updateDraftInvoice(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Draft invoice updated successfully',
      data: invoice
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
 * Issue a draft invoice
 * PATCH /api/invoices/:id/issue (Admin)
 */
const issueInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.issueInvoice(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} issued successfully`,
      data: invoice
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
 * Cancel an eligible invoice
 * PATCH /api/invoices/:id/cancel (Admin)
 */
const cancelInvoice = async (req, res) => {
  try {
    const { reason } = req.body;
    const invoice = await invoiceService.cancelInvoice(req.params.id, reason, req.user);
    return res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} has been cancelled`,
      data: invoice
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
 * Get tax breakdown for invoice
 * GET /api/invoices/:id/tax-breakdown (Admin, Staff, Owner Customer)
 */
const getTaxBreakdown = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id, req.user);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
        errors: []
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tax breakdown retrieved successfully',
      data: {
        invoiceNumber: invoice.invoiceNumber,
        subtotal: invoice.subtotal,
        discountTotal: invoice.discountTotal,
        taxableAmount: invoice.taxableAmount,
        taxBreakdown: invoice.taxBreakdown,
        grandTotal: invoice.grandTotal
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
 * Get printable invoice data
 * GET /api/invoices/:id/print (Admin, Staff, Owner Customer)
 */
const getPrintView = async (req, res) => {
  try {
    const printData = await invoiceService.getInvoicePrintData(req.params.id, req.user);
    if (!printData) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
        errors: []
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Printable invoice data retrieved successfully',
      data: printData
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
 * Get invoice history for a specific customer
 * GET /api/invoices/customer/:customerId (Admin, Staff)
 */
const getCustomerInvoices = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const query = { ...req.query, customerId };
    const result = await invoiceService.getInvoices(query, req.user);

    return res.status(200).json({
      success: true,
      message: `Invoices for customer ${customerId} retrieved successfully`,
      data: result.invoices,
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
 * Receive generated invoice from M9 Billing Engine webhook
 * POST /api/invoices/billing-webhook
 */
const receiveBillingWebhook = async (req, res) => {
  try {
    const result = await invoiceService.createInvoiceFromBillingPayload(req.body);
    const statusCode = result.isDuplicate ? 200 : 201;
    return res.status(statusCode).json({
      success: true,
      message: result.isDuplicate
        ? 'Duplicate billing request recognized; existing invoice returned'
        : 'Invoice created successfully from billing payload',
      data: result.invoice,
      isDuplicate: result.isDuplicate
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
 * GET /api/invoices/analytics/summary (Admin, Staff)
 */
const getAnalyticsSummary = async (req, res) => {
  try {
    const summary = await invoiceService.getAnalyticsSummary();
    return res.status(200).json({
      success: true,
      message: 'Analytics summary retrieved successfully',
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
 * Record mock payment (For standalone testing of payment statuses)
 * POST /api/invoices/:id/payments
 */
const recordPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const { amount, paymentMethod, transactionReference } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be positive' });
    }

    const newPayment = await paymentAdapter.recordMockPayment(invoice._id, {
      amount: Number(amount),
      paymentMethod,
      transactionReference
    });

    const totalPaid = await paymentAdapter.getPaidAmount(invoice._id);
    invoice.amountPaid = totalPaid;
    invoice.outstandingAmount = Math.max(0, Math.round((invoice.grandTotal - totalPaid) * 100) / 100);

    if (invoice.outstandingAmount <= 0) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'partially_paid';
    }

    await invoice.save();

    await invoiceService.recordAuditLog({
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      action: 'payment_recorded',
      newValues: { amount, totalPaid, status: invoice.status },
      user: req.user,
      reason: `Recorded payment of ₹${amount}`
    });

    return res.status(200).json({
      success: true,
      message: `Payment of ₹${amount} recorded successfully`,
      data: {
        payment: newPayment,
        invoice: {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amountPaid: invoice.amountPaid,
          outstandingAmount: invoice.outstandingAmount,
          status: invoice.status
        }
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Retrieve list of customers from customer adapter for manual invoice creation dropdown
 * GET /api/invoices/dev/customers (Admin, Staff)
 */
const getCustomersList = async (req, res) => {
  try {
    const customerAdapter = require('../adapters/customerAdapter');
    const customers = await customerAdapter.getAllCustomers();
    return res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: customers
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getMyInvoices,
  getInvoiceById,
  updateInvoice,
  issueInvoice,
  cancelInvoice,
  getTaxBreakdown,
  getPrintView,
  getCustomerInvoices,
  receiveBillingWebhook,
  getAnalyticsSummary,
  recordPayment,
  getCustomersList
};
