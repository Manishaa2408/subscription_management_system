const reconciliationService = require('../services/reconciliationService');
const { runAutoMatching } = require('../services/autoMatchingService');
const Reconciliation = require('../models/Reconciliation');
const BankTransaction = require('../models/BankTransaction');

/**
 * List all bank transactions
 * GET /api/reconciliation/transactions (Admin, Staff)
 */
const getTransactions = async (req, res) => {
  try {
    const txns = await reconciliationService.getBankTransactions(req.query);
    return res.status(200).json({
      success: true,
      message: 'Bank transactions retrieved',
      data: txns
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get unmatched bank transactions
 * GET /api/reconciliation/unmatched (Admin, Staff)
 */
const getUnmatched = async (req, res) => {
  try {
    const txns = await BankTransaction.find({
      reconciliationStatus: { $in: ['unmatched', 'discrepancy'] }
    }).sort({ transactionDate: -1 }).lean();

    return res.status(200).json({
      success: true,
      message: 'Unmatched transactions retrieved',
      data: txns
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get matched reconciliations
 * GET /api/reconciliation/matches (Admin, Staff)
 */
const getMatches = async (req, res) => {
  try {
    const reconciliations = await Reconciliation.find().sort({ reconciliationDate: -1 }).lean();
    return res.status(200).json({
      success: true,
      message: 'Reconciliation matches retrieved',
      data: reconciliations
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Import bank statement CSV / JSON records
 * POST /api/reconciliation/import (Admin)
 */
const importTransactions = async (req, res) => {
  try {
    const { transactions, batchId } = req.body;
    const result = await reconciliationService.importBankTransactions(transactions, batchId, req.user);
    return res.status(201).json({
      success: true,
      message: `Imported ${result.importedCount} bank transactions`,
      data: result
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Run automatic matching
 * POST /api/reconciliation/auto-match (Admin)
 */
const runAutoMatch = async (req, res) => {
  try {
    const result = await runAutoMatching(req.user);
    return res.status(200).json({
      success: true,
      message: `Auto-matching complete. Matched ${result.matchedCount} transactions.`,
      data: result
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Manual match
 * POST /api/reconciliation/manual-match (Admin)
 */
const manualMatch = async (req, res) => {
  try {
    const result = await reconciliationService.manualMatch(req.body, req.user);
    return res.status(200).json({
      success: true,
      message: `Matched bank transaction with payment ${result.payment.paymentReference}`,
      data: result
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Resolve discrepancy
 * PATCH /api/reconciliation/:id/resolve (Admin)
 */
const resolveDiscrepancy = async (req, res) => {
  try {
    const { notes } = req.body;
    const recon = await reconciliationService.resolveDiscrepancy(req.params.id, notes, req.user);
    return res.status(200).json({
      success: true,
      message: 'Discrepancy resolved successfully',
      data: recon
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Get reconciliation summary
 * GET /api/reconciliation/summary (Admin, Staff)
 */
const getSummary = async (req, res) => {
  try {
    const summary = await reconciliationService.getReconciliationSummary();
    return res.status(200).json({
      success: true,
      message: 'Reconciliation summary retrieved',
      data: summary
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTransactions,
  getUnmatched,
  getMatches,
  importTransactions,
  runAutoMatch,
  manualMatch,
  resolveDiscrepancy,
  getSummary
};
