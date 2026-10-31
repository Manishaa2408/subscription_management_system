const mongoose = require('mongoose');

const ReconciliationSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true
    },
    paymentReference: {
      type: String,
      required: true
    },
    bankTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankTransaction',
      required: true,
      index: true
    },
    bankTransactionReference: {
      type: String,
      required: true
    },
    matchedAmount: {
      type: Number,
      required: true
    },
    differenceAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['matched', 'discrepancy', 'resolved'],
      default: 'matched',
      index: true
    },
    matchType: {
      type: String,
      enum: ['exact_reference', 'amount_and_date', 'manual', 'partial'],
      default: 'manual'
    },
    reconciliationDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    reconciledBy: {
      id: { type: String, default: 'system' },
      role: { type: String, default: 'admin' },
      email: { type: String, default: 'admin@brightloop.io' },
      name: { type: String, default: 'System' }
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'reconciliations'
  }
);

ReconciliationSchema.index({ paymentId: 1, bankTransactionId: 1 }, { unique: true });

module.exports = mongoose.model('Reconciliation', ReconciliationSchema);
