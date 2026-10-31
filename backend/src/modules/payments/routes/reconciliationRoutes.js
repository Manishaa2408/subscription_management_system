const express = require('express');
const router = express.Router();
const reconciliationController = require('../controllers/reconciliationController');
const { authenticate, authorize } = require('../adapters/authAdapter');

router.use(authenticate);

router.get('/transactions', authorize('admin', 'staff'), reconciliationController.getTransactions);
router.get('/unmatched', authorize('admin', 'staff'), reconciliationController.getUnmatched);
router.get('/matches', authorize('admin', 'staff'), reconciliationController.getMatches);
router.get('/summary', authorize('admin', 'staff'), reconciliationController.getSummary);

router.post('/import', authorize('admin'), reconciliationController.importTransactions);
router.post('/auto-match', authorize('admin'), reconciliationController.runAutoMatch);
router.post('/manual-match', authorize('admin'), reconciliationController.manualMatch);
router.patch('/:id/resolve', authorize('admin'), reconciliationController.resolveDiscrepancy);

module.exports = router;
