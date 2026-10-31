const mongoose = require('mongoose');

const BankTransactionSchema = new mongoose.Schema(
  {
    transactionReference: {
      type: String,
      required: [true, 'Bank transaction reference is required'],
      trim: true,
      index: true
    },
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Statement description is required'],
      trim: true
    },
    creditAmount: {
      type: Number,
      default: 0,
      min: [0, 'Credit amount cannot be negative']
    },
    debitAmount: {
      type: Number,
      default: 0,
      min: [0, 'Debit amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    importBatchId: {
      type: String,
      default: () => `BATCH-${Date.now()}`
    },
    reconciliationStatus: {
      type: String,
      enum: ['unmatched', 'matched', 'partially_matched', 'discrepancy', 'ignored'],
      default: 'unmatched',
      index: true
    },
    matchedPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    },
    matchedPaymentReference: {
      type: String,
      default: null
    },
    matchedAt: {
      type: Date,
      default: null
    },
    matchedBy: {
      id: { type: String, default: null },
      role: { type: String, default: null },
      email: { type: String, default: null },
      name: { type: String, default: null }
    },
    differenceAmount: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'banktransactions'
  }
);

BankTransactionSchema.index({ reconciliationStatus: 1, transactionDate: -1 });

module.exports = mongoose.model('BankTransaction', BankTransactionSchema);
