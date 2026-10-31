const mongoose = require('mongoose');

const RefundSchema = new mongoose.Schema(
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
    customerId: {
      type: String,
      required: true,
      index: true
    },
    invoiceId: {
      type: String,
      required: true,
      index: true
    },
    refundReference: {
      type: String,
      required: [true, 'Refund reference is required'],
      unique: true,
      trim: true,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Refund amount is required'],
      min: [0.01, 'Refund amount must be positive']
    },
    reason: {
      type: String,
      required: [true, 'Refund reason is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'completed',
      index: true
    },
    processedBy: {
      id: { type: String, default: 'system' },
      role: { type: String, default: 'admin' },
      email: { type: String, default: 'admin@brightloop.io' },
      name: { type: String, default: 'System' }
    },
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'refunds'
  }
);

RefundSchema.index({ customerId: 1, processedAt: -1 });

module.exports = mongoose.model('Refund', RefundSchema);
