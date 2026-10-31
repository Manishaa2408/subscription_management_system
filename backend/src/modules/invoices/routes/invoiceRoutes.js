const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticate, authorize } = require('../adapters/authAdapter');
const {
  validateObjectId,
  validateCreateInvoice,
  validateCancelInvoice
} = require('../middleware/invoiceValidation');

// All invoice routes require authentication
router.use(authenticate);

// Special routes before parameterized :id
router.get('/my', authorize('customer'), invoiceController.getMyInvoices);
router.get('/analytics/summary', authorize('admin', 'staff'), invoiceController.getAnalyticsSummary);
router.get('/dev/customers', authorize('admin', 'staff'), invoiceController.getCustomersList);
router.post('/billing-webhook', invoiceController.receiveBillingWebhook); // Ingestion from M9
router.get('/customer/:customerId', authorize('admin', 'staff'), invoiceController.getCustomerInvoices);

// List & Create
router.get('/', authorize('admin', 'staff'), invoiceController.getInvoices);
router.post('/', authorize('admin'), validateCreateInvoice, invoiceController.createInvoice);

// Single invoice operations
router.get('/:id', validateObjectId('id'), invoiceController.getInvoiceById);
router.put('/:id', authorize('admin'), validateObjectId('id'), invoiceController.updateInvoice);
router.patch('/:id/issue', authorize('admin'), validateObjectId('id'), invoiceController.issueInvoice);
router.patch('/:id/cancel', authorize('admin'), validateObjectId('id'), validateCancelInvoice, invoiceController.cancelInvoice);

// Breakdown & Print
router.get('/:id/tax-breakdown', validateObjectId('id'), invoiceController.getTaxBreakdown);
router.get('/:id/print', validateObjectId('id'), invoiceController.getPrintView);

// Mock payment recording for standalone testing of M11 sync
router.post('/:id/payments', authorize('admin', 'staff'), validateObjectId('id'), invoiceController.recordPayment);

module.exports = router;
