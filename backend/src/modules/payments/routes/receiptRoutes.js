const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { authenticate } = require('../adapters/authAdapter');

router.use(authenticate);

router.get('/:id', receiptController.getReceipt);
router.get('/:id/print', receiptController.getReceiptPrint);

module.exports = router;
