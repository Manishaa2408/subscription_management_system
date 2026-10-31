const mongoose = require('mongoose');

const billingScheduleSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: String,
      required: [true, 'Subscription ID is required'],
      index: true,
      trim: true
    },
    customerId: {
      type: String,
      required: [true, 'Customer ID is required'],
      index: true,
      trim: true
    },
    planId: {
      type: String,
      required: [true, 'Plan ID is required'],
      index: true,
      trim: true
    },
    billingFrequency: {
      type: String,
      required: [true, 'Billing frequency is required'],
      enum: {
        values: ['daily', 'weekly', 'monthly', 'yearly'],
        message: '{VALUE} is not a supported billing frequency'
      },
      index: true
    },
    billingInterval: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Billing interval must be at least 1']
    },
    billingStartDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    currentPeriodStart: {
      type: Date,
      required: true
    },
    currentPeriodEnd: {
      type: Date,
      required: true
    },
    nextBillingDate: {
      type: Date,
      required: true,
      index: true
    },
    lastBillingDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled', 'completed'],
      default: 'active',
      index: true
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    amountSnapshot: {
      type: Number,
      required: true,
      min: [0, 'Amount snapshot cannot be negative']
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

// Compound index to quickly fetch due schedules
billingScheduleSchema.index({ status: 1, nextBillingDate: 1 });
billingScheduleSchema.index({ customerId: 1, status: 1 });

module.exports = mongoose.model('BillingSchedule', billingScheduleSchema);
