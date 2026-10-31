const mongoose = require('mongoose');

const billingAttemptSchema = new mongoose.Schema(
  {
    billingExecutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingExecution',
      required: true,
      index: true
    },
    attemptNumber: {
      type: Number,
      required: true
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'retry_scheduled'],
      required: true
    },
    requestReference: {
      type: String,
      required: true
    },
    responseSummary: {
      type: String,
      default: ''
    },
    errorMessage: {
      type: String,
      default: null
    },
    nextRetryAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('BillingAttempt', billingAttemptSchema);
