const mongoose = require('mongoose');

const billingLogSchema = new mongoose.Schema(
  {
    billingRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingRun',
      default: null,
      index: true
    },
    billingExecutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingExecution',
      default: null,
      index: true
    },
    event: {
      type: String,
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

module.exports = mongoose.model('BillingLog', billingLogSchema);
