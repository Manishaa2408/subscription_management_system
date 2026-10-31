const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../adapters/authAdapter');
const {
  getBillingRunsHandler,
  getBillingRunDetailsHandler,
  retryBillingRunHandler
} = require('../controllers/billingRunController');

router.use(authenticate);

router.get('/', authorize('admin', 'staff'), getBillingRunsHandler);
router.get('/:id', authorize('admin', 'staff'), getBillingRunDetailsHandler);
router.post('/:id/retry', authorize('admin'), retryBillingRunHandler);

module.exports = router;
