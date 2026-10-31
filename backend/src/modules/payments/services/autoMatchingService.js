const BankTransaction = require('../models/BankTransaction');
const Payment = require('../models/Payment');
const Reconciliation = require('../models/Reconciliation');

/**
 * Runs automated reconciliation matching between bank credit transactions and payments
 */
const runAutoMatching = async (user = null) => {
  // Find all unmatched bank transactions (only credits - money coming in)
  const unmatchedBankTxns = await BankTransaction.find({
    reconciliationStatus: 'unmatched',
    creditAmount: { $gt: 0 }
  }).sort({ transactionDate: 1 });

  // Find all unmatched completed payments
  const unmatchedPayments = await Payment.find({
    status: 'completed',
    reconciliationStatus: 'unmatched'
  }).sort({ paymentDate: 1 });

  const matchedResults = [];
  const matchedPaymentIds = new Set();
  const matchedBankTxnIds = new Set();

  // Priority 1: Exact transaction reference match
  for (const bankTxn of unmatchedBankTxns) {
    if (matchedBankTxnIds.has(bankTxn._id.toString())) continue;
    if (!bankTxn.transactionReference) continue;

    const cleanRef = bankTxn.transactionReference.trim().toLowerCase();

    const candidate = unmatchedPayments.find((p) => {
      if (matchedPaymentIds.has(p._id.toString())) return false;
      if (!p.transactionReference) return false;
      return p.transactionReference.trim().toLowerCase() === cleanRef;
    });

    if (candidate) {
      const difference = Math.round((bankTxn.creditAmount - candidate.amount) * 100) / 100;
      const status = difference === 0 ? 'matched' : 'discrepancy';

      const recon = new Reconciliation({
        paymentId: candidate._id,
        paymentReference: candidate.paymentReference,
        bankTransactionId: bankTxn._id,
        bankTransactionReference: bankTxn.transactionReference,
        matchedAmount: candidate.amount,
        differenceAmount: difference,
        status,
        matchType: 'exact_reference',
        reconciliationDate: new Date(),
        reconciledBy: user ? { id: user.id, role: user.role, email: user.email, name: user.name } : undefined,
        notes: difference === 0 
          ? 'Auto-matched via exact transaction reference' 
          : `Auto-matched via transaction reference with amount discrepancy: ₹${difference}`
      });

      await recon.save();

      bankTxn.reconciliationStatus = status;
      bankTxn.matchedPaymentId = candidate._id;
      bankTxn.matchedPaymentReference = candidate.paymentReference;
      bankTxn.matchedAt = new Date();
      bankTxn.differenceAmount = difference;
      bankTxn.notes = recon.notes;
      await bankTxn.save();

      candidate.reconciliationStatus = status;
      await candidate.save();

      matchedBankTxnIds.add(bankTxn._id.toString());
      matchedPaymentIds.add(candidate._id.toString());
      matchedResults.push({
        matchType: 'exact_reference',
        reconciliation: recon,
        paymentReference: candidate.paymentReference,
        bankTransactionReference: bankTxn.transactionReference
      });
    }
  }

  // Priority 2: Exact Amount + Date within ±3 days
  for (const bankTxn of unmatchedBankTxns) {
    if (matchedBankTxnIds.has(bankTxn._id.toString())) continue;

    const bankDate = new Date(bankTxn.transactionDate).getTime();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    // Find candidate payments with exact amount within 3-day window
    const candidates = unmatchedPayments.filter((p) => {
      if (matchedPaymentIds.has(p._id.toString())) return false;
      if (p.amount !== bankTxn.creditAmount) return false;

      const pDate = new Date(p.paymentDate).getTime();
      return Math.abs(bankDate - pDate) <= threeDaysMs;
    });

    // Only auto-match if exactly ONE unambiguous match exists
    if (candidates.length === 1) {
      const candidate = candidates[0];

      const recon = new Reconciliation({
        paymentId: candidate._id,
        paymentReference: candidate.paymentReference,
        bankTransactionId: bankTxn._id,
        bankTransactionReference: bankTxn.transactionReference,
        matchedAmount: candidate.amount,
        differenceAmount: 0,
        status: 'matched',
        matchType: 'amount_and_date',
        reconciliationDate: new Date(),
        reconciledBy: user ? { id: user.id, role: user.role, email: user.email, name: user.name } : undefined,
        notes: 'Auto-matched via exact amount and date proximity (±3 days)'
      });

      await recon.save();

      bankTxn.reconciliationStatus = 'matched';
      bankTxn.matchedPaymentId = candidate._id;
      bankTxn.matchedPaymentReference = candidate.paymentReference;
      bankTxn.matchedAt = new Date();
      bankTxn.differenceAmount = 0;
      bankTxn.notes = recon.notes;
      await bankTxn.save();

      candidate.reconciliationStatus = 'matched';
      await candidate.save();

      matchedBankTxnIds.add(bankTxn._id.toString());
      matchedPaymentIds.add(candidate._id.toString());
      matchedResults.push({
        matchType: 'amount_and_date',
        reconciliation: recon,
        paymentReference: candidate.paymentReference,
        bankTransactionReference: bankTxn.transactionReference
      });
    }
  }

  return {
    matchedCount: matchedResults.length,
    results: matchedResults
  };
};

module.exports = {
  runAutoMatching
};
