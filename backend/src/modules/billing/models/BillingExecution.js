const mongoose = require('mongoose');

const billingExecutionSchema = new mongoose.Schema(
  {
    billingRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingRun',
      required: true,
      index: true
    },
    subscriptionId: {
      type: String,
      required: true,
      index: true
    },
    customerId: {
      type: String,
      required: true,
      index: true
    },
    planId: {
      type: String,
      required: true
    },
    billingPeriodStart: {
      type: Date,
      required: true
    },
    billingPeriodEnd: {
      type: Date,
      required: true
    },
    billingAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    sourceReference: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    invoiceReference: {
      type: String,
      default: null,
      index: true
    },
    invoiceId: {
      type: String,
      default: null
    },
    attemptCount: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed', 'skipped', 'retry_scheduled'],
      default: 'processing',
      index: true
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now
    },
    nextRetryAt: {
      type: Date,
      default: null,
      index: true
    },
    errorMessage: {
      type: String,
      default: null
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

billingExecutionSchema.index({ subscriptionId: 1, createdAt: -1 });
billingExecutionSchema.index({ status: 1, nextRetryAt: 1 });

module.exports = mongoose.model('BillingExecution', billingExecutionSchema);
