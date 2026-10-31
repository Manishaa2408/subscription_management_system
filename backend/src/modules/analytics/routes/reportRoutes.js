const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../adapters/authAdapter');
const {
  exportRevenue,
  exportCustomers,
  exportSubscriptions,
  exportInvoices,
  exportPayments,
  getHistory
} = require('../controllers/reportController');

router.use(authenticate);

// Reports are restricted to Admin
router.get('/export/revenue', authorize('admin'), exportRevenue);
router.get('/export/customers', authorize('admin'), exportCustomers);
router.get('/export/subscriptions', authorize('admin'), exportSubscriptions);
router.get('/export/invoices', authorize('admin'), exportInvoices);
router.get('/export/payments', authorize('admin'), exportPayments);
router.get('/history', authorize('admin'), getHistory);

module.exports = router;
