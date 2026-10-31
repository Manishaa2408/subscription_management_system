const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const { authenticate, authorize } = require('../adapters/authAdapter');

router.use(authenticate);

router.get('/', authorize('admin', 'staff'), refundController.getRefunds);
router.post('/', authorize('admin'), refundController.createRefund);
router.get('/:id', authorize('admin', 'staff'), refundController.getRefundById);

module.exports = router;
