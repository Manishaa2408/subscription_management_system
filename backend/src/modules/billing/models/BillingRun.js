const mongoose = require('mongoose');

const billingRunSchema = new mongoose.Schema(
  {
    runReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    triggerType: {
      type: String,
      enum: ['scheduled', 'manual', 'retry'],
      required: true,
      default: 'manual',
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    completedAt: {
      type: Date,
      default: null
    },
    totalExamined: {
      type: Number,
      default: 0
    },
    eligibleCount: {
      type: Number,
      default: 0
    },
    successCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    skippedCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'completed_with_errors', 'failed'],
      default: 'processing',
      index: true
    },
    summary: {
      type: String,
      default: ''
    },
    errorSummary: {
      type: [String],
      default: []
    },
    triggeredBy: {
      type: String,
      default: 'system'
    }
  },
  {
    timestamps: true
  }
);

billingRunSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BillingRun', billingRunSchema);
