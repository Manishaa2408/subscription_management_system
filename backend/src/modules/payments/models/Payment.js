const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    paymentReference: {
      type: String,
      required: [true, 'Payment reference is required'],
      unique: true,
      trim: true,
      index: true
    },
    customerId: {
      type: String,
      required: [true, 'Customer ID is required'],
      index: true
    },
    customerSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' }
    },
    invoiceId: {
      type: String,
      required: [true, 'Invoice ID is required'],
      index: true
    },
    invoiceReference: {
      type: String,
      required: [true, 'Invoice reference number is required'],
      index: true
    },
    subscriptionId: {
      type: String,
      default: null,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['upi', 'bank_transfer', 'card', 'cash', 'cheque', 'other'],
      default: 'bank_transfer'
    },
    transactionReference: {
      type: String,
      trim: true,
      default: ''
    },
    gatewayReference: {
      type: String,
      trim: true,
      default: null
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
      default: 'completed',
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    recordedBy: {
      id: { type: String, default: 'system' },
      role: { type: String, default: 'admin' },
      email: { type: String, default: 'admin@brightloop.io' },
      name: { type: String, default: 'System' }
    },
    verifiedBy: {
      id: { type: String, default: null },
      role: { type: String, default: null },
      email: { type: String, default: null },
      name: { type: String, default: null }
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    receiptNumber: {
      type: String,
      default: null
    },
    reconciliationStatus: {
      type: String,
      enum: ['unmatched', 'matched', 'partially_matched', 'discrepancy', 'ignored'],
      default: 'unmatched',
      index: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'payments'
  }
);

PaymentSchema.index({ customerId: 1, status: 1 });
PaymentSchema.index({ invoiceId: 1, status: 1 });
PaymentSchema.index({ paymentDate: -1 });
PaymentSchema.index({ transactionReference: 1 }, { sparse: true });

module.exports = mongoose.model('Payment', PaymentSchema);
