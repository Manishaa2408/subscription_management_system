const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../adapters/authAdapter');

// Webhook can be public/gateway signed
router.post('/webhook', paymentController.handleGatewayWebhook);

// Protected routes
router.use(authenticate);

// Special routes before :id
router.get('/my', authorize('customer'), paymentController.getMyPayments);
router.get('/analytics/summary', authorize('admin', 'staff'), paymentController.getAnalyticsSummary);
router.get('/dev/invoices', authorize('admin', 'staff'), paymentController.getPayableInvoices);
router.get('/invoice/:invoiceId/summary', paymentController.getInvoiceSummary);
router.get('/invoice/:invoiceId', paymentController.getPaymentsByInvoice);

// List & Create
router.get('/', authorize('admin', 'staff'), paymentController.getPayments);
router.post('/', authorize('admin', 'staff'), paymentController.recordPayment);

// Single payment operations
router.get('/:id', paymentController.getPaymentById);
router.patch('/:id/verify', authorize('admin'), paymentController.verifyPayment);
router.patch('/:id/fail', authorize('admin'), paymentController.failPayment);

module.exports = router;
