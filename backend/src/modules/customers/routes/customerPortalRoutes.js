const express = require('express');
const router = express.Router();

const {
  getPortalProfile,
  updatePortalProfile,
  getPortalDashboard,
  getPortalSubscriptions,
  getPortalQuotations,
  getPortalInvoices,
  getPortalPayments,
  getPortalAddresses
} = require('../controllers/customerPortalController');

const { authenticate } = require('../adapters/authAdapter');

// All portal endpoints require an authenticated customer session
router.use(authenticate);

router.get('/profile', getPortalProfile);
router.put('/profile', updatePortalProfile);
router.get('/dashboard', getPortalDashboard);
router.get('/subscriptions', getPortalSubscriptions);
router.get('/quotations', getPortalQuotations);
router.get('/invoices', getPortalInvoices);
router.get('/payments', getPortalPayments);
router.get('/addresses', getPortalAddresses);

module.exports = router;
