const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../adapters/authAdapter');
const {
  createScheduleHandler,
  getSchedulesHandler,
  getDueSchedulesHandler,
  getScheduleByIdHandler,
  updateScheduleHandler,
  triggerBillingRunHandler,
  processSubscriptionHandler,
  getSubscriptionHistoryHandler,
  getBillingHistoryHandler,
  getFailedBillingsHandler,
  getBillingSummaryHandler,
  getBillingStatusHandler
} = require('../controllers/billingController');

// All billing endpoints require authentication
router.use(authenticate);

// ── Schedule APIs ──
router.post('/schedules', authorize('admin'), createScheduleHandler);
router.get('/schedules', authorize('admin', 'staff'), getSchedulesHandler);
router.get('/schedules/due', authorize('admin', 'staff'), getDueSchedulesHandler);
router.get('/schedules/:id', authorize('admin', 'staff'), getScheduleByIdHandler);
router.put('/schedules/:id', authorize('admin'), updateScheduleHandler);

// ── Execution APIs ──
router.post('/run', authorize('admin'), triggerBillingRunHandler);
router.post('/subscriptions/:subscriptionId/process', authorize('admin'), processSubscriptionHandler);
router.get('/subscriptions/:subscriptionId/history', authorize('admin', 'staff'), getSubscriptionHistoryHandler);

// ── Monitoring & Reporting APIs ──
router.get('/history', authorize('admin', 'staff'), getBillingHistoryHandler);
router.get('/failed', authorize('admin', 'staff'), getFailedBillingsHandler);
router.get('/summary', authorize('admin', 'staff'), getBillingSummaryHandler);
router.get('/status', authorize('admin'), getBillingStatusHandler);

module.exports = router;
