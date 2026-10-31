const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../adapters/authAdapter');
const {
  getOverviewHandler,
  getRevenueSummaryHandler,
  getCustomerSummaryHandler,
  getSubscriptionSummaryHandler,
  getBillingSummaryHandler,
  getInvoiceSummaryHandler,
  getPaymentSummaryHandler
} = require('../controllers/dashboardController');

router.use(authenticate);

// Main dashboard KPI endpoints (Admin & Staff)
router.get('/overview', authorize('admin', 'staff'), getOverviewHandler);
router.get('/revenue-summary', authorize('admin', 'staff'), getRevenueSummaryHandler);
router.get('/customer-summary', authorize('admin', 'staff'), getCustomerSummaryHandler);
router.get('/subscription-summary', authorize('admin', 'staff'), getSubscriptionSummaryHandler);
router.get('/billing-summary', authorize('admin', 'staff'), getBillingSummaryHandler);
router.get('/invoice-summary', authorize('admin', 'staff'), getInvoiceSummaryHandler);
router.get('/payment-summary', authorize('admin', 'staff'), getPaymentSummaryHandler);

module.exports = router;
