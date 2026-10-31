const BankTransaction = require('../models/BankTransaction');
const Reconciliation = require('../models/Reconciliation');
const Payment = require('../models/Payment');

/**
 * Imports an array of bank transaction statement records
 */
const importBankTransactions = async (records, batchId, user) => {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('Records must be a non-empty array of bank transactions');
  }

  const cleanBatchId = batchId || `BATCH-${Date.now()}`;
  const importedDocs = [];
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const raw = records[i];
    const idx = i + 1;

    try {
      if (!raw.transactionReference || !raw.transactionReference.trim()) {
        errors.push(`Row #${idx}: transactionReference is required`);
        continue;
      }

      const creditAmount = Math.max(0, Number(raw.creditAmount || raw.credit || 0));
      const debitAmount = Math.max(0, Number(raw.debitAmount || raw.debit || 0));

      const txnDate = raw.transactionDate ? new Date(raw.transactionDate) : new Date();

      const doc = new BankTransaction({
        transactionReference: raw.transactionReference.trim(),
        transactionDate: txnDate,
        description: (raw.description || 'Bank transaction').trim(),
        creditAmount,
        debitAmount,
        currency: raw.currency || 'INR',
        importBatchId: cleanBatchId,
        reconciliationStatus: 'unmatched',
        notes: raw.notes || ''
      });

      await doc.save();
      importedDocs.push(doc);
    } catch (err) {
      errors.push(`Row #${idx} (${raw.transactionReference || 'unknown'}): ${err.message}`);
    }
  }

  return {
    batchId: cleanBatchId,
    totalSubmitted: records.length,
    importedCount: importedDocs.length,
    failedCount: errors.length,
    errors,
    transactions: importedDocs
  };
};

/**
 * List bank transactions with status filters and search
 */
const getBankTransactions = async (filters = {}) => {
  const query = {};
  if (filters.status && filters.status !== 'all') {
    query.reconciliationStatus = filters.status;
  }
  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    query.$or = [
      { transactionReference: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } }
    ];
  }

  return await BankTransaction.find(query).sort({ transactionDate: -1 }).lean();
};

/**
 * Manual match between a bank transaction and internal payment
 */
const manualMatch = async ({ bankTransactionId, paymentId, notes = '' }, user) => {
  const [bankTxn, payment] = await Promise.all([
    BankTransaction.findById(bankTransactionId),
    Payment.findById(paymentId)
  ]);

  if (!bankTxn) throw new Error(`Bank transaction with ID "${bankTransactionId}" not found`);
  if (!payment) throw new Error(`Payment with ID "${paymentId}" not found`);

  // Prevent double reconciliation
  if (bankTxn.reconciliationStatus === 'matched' || bankTxn.matchedPaymentId) {
    throw new Error(`Bank transaction "${bankTxn.transactionReference}" is already matched to another payment`);
  }

  if (payment.reconciliationStatus === 'matched') {
    throw new Error(`Payment "${payment.paymentReference}" is already reconciled`);
  }

  // Calculate difference
  const difference = Math.round((bankTxn.creditAmount - payment.amount) * 100) / 100;
  const status = difference === 0 ? 'matched' : 'discrepancy';

  const reconciliation = new Reconciliation({
    paymentId: payment._id,
    paymentReference: payment.paymentReference,
    bankTransactionId: bankTxn._id,
    bankTransactionReference: bankTxn.transactionReference,
    matchedAmount: payment.amount,
    differenceAmount: difference,
    status,
    matchType: 'manual',
    reconciliationDate: new Date(),
    reconciledBy: user ? { id: user.id, role: user.role, email: user.email, name: user.name } : undefined,
    notes: notes || (difference !== 0 ? `Amount difference detected: ₹${difference}` : 'Manual reconciliation matched')
  });

  await reconciliation.save();

  // Update BankTransaction
  bankTxn.reconciliationStatus = status;
  bankTxn.matchedPaymentId = payment._id;
  bankTxn.matchedPaymentReference = payment.paymentReference;
  bankTxn.matchedAt = new Date();
  bankTxn.matchedBy = user ? { id: user.id, role: user.role, email: user.email, name: user.name } : null;
  bankTxn.differenceAmount = difference;
  bankTxn.notes = notes;
  await bankTxn.save();

  // Update Payment
  payment.reconciliationStatus = status;
  await payment.save();

  return {
    reconciliation,
    bankTransaction: bankTxn,
    payment
  };
};

/**
 * Resolve a discrepancy
 */
const resolveDiscrepancy = async (reconciliationId, resolutionNotes, user) => {
  const recon = await Reconciliation.findById(reconciliationId);
  if (!recon) throw new Error('Reconciliation record not found');

  recon.status = 'resolved';
  recon.notes = recon.notes 
    ? `${recon.notes} | Resolution: ${resolutionNotes}` 
    : `Resolution: ${resolutionNotes}`;
  await recon.save();

  await BankTransaction.findByIdAndUpdate(recon.bankTransactionId, {
    $set: { reconciliationStatus: 'matched', notes: `Resolved: ${resolutionNotes}` }
  });

  await Payment.findByIdAndUpdate(recon.paymentId, {
    $set: { reconciliationStatus: 'matched' }
  });

  return recon;
};

/**
 * Reconciliation summary statistics
 */
const getReconciliationSummary = async () => {
  const [totalTxns, matchedTxns, unmatchedTxns, discrepancyTxns] = await Promise.all([
    BankTransaction.countDocuments(),
    BankTransaction.countDocuments({ reconciliationStatus: 'matched' }),
    BankTransaction.countDocuments({ reconciliationStatus: 'unmatched' }),
    BankTransaction.countDocuments({ reconciliationStatus: 'discrepancy' })
  ]);

  const progressPercentage = totalTxns > 0 
    ? Math.round((matchedTxns / totalTxns) * 100) 
    : 0;

  return {
    totalBankTransactions: totalTxns,
    matchedCount: matchedTxns,
    unmatchedCount: unmatchedTxns,
    discrepancyCount: discrepancyTxns,
    progressPercentage
  };
};

module.exports = {
  importBankTransactions,
  getBankTransactions,
  manualMatch,
  resolveDiscrepancy,
  getReconciliationSummary
};
