/**
 * Invoice Status and Lifecycle Management Service
 */

const ALLOWED_TRANSITIONS = {
  draft: ['issued', 'cancelled'],
  issued: ['partially_paid', 'paid', 'overdue', 'cancelled'],
  partially_paid: ['paid', 'overdue'],
  overdue: ['partially_paid', 'paid', 'cancelled'],
  paid: [], // Terminal state
  cancelled: [] // Terminal state
};

/**
 * Validates whether transition from current to target status is permitted
 */
const isValidTransition = (currentStatus, targetStatus) => {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
};

/**
 * Checks if an invoice is in an editable state (only 'draft' is editable)
 */
const canEditInvoice = (invoice) => {
  return invoice && invoice.status === 'draft';
};

/**
 * Checks if an invoice can be cancelled
 */
const canCancelInvoice = (invoice) => {
  if (!invoice) return false;
  if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
  // If payments have been received, cancellation is prohibited through ordinary flow
  if (invoice.amountPaid && invoice.amountPaid > 0) return false;
  return invoice.status === 'draft' || invoice.status === 'issued' || invoice.status === 'overdue';
};

/**
 * Evaluates dynamically if an issued invoice is now overdue
 */
const evaluateEffectiveStatus = (invoice) => {
  if (!invoice) return 'draft';
  if (invoice.status === 'draft' || invoice.status === 'paid' || invoice.status === 'cancelled') {
    return invoice.status;
  }

  // If fully paid
  if (invoice.outstandingAmount <= 0 && invoice.grandTotal > 0) {
    return 'paid';
  }

  // If past due date with remaining balance
  if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.outstandingAmount > 0) {
    return 'overdue';
  }

  // If partially paid
  if (invoice.amountPaid > 0 && invoice.outstandingAmount > 0) {
    return 'partially_paid';
  }

  return invoice.status;
};

module.exports = {
  ALLOWED_TRANSITIONS,
  isValidTransition,
  canEditInvoice,
  canCancelInvoice,
  evaluateEffectiveStatus
};
