const mongoose = require('mongoose');

const analyticsReportSchema = new mongoose.Schema(
  {
    reportName: {
      type: String,
      required: true,
      trim: true
    },
    reportType: {
      type: String,
      enum: ['revenue', 'customers', 'subscriptions', 'invoices', 'payments', 'billing', 'executive_summary'],
      required: true
    },
    filters: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    dateRange: {
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null }
    },
    generatedBy: {
      type: String,
      required: true,
      default: 'system'
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    exportFormat: {
      type: String,
      enum: ['csv', 'json', 'excel'],
      default: 'csv'
    },
    recordCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['generating', 'completed', 'failed'],
      default: 'completed'
    }
  },
  {
    timestamps: true
  }
);

analyticsReportSchema.index({ reportType: 1, generatedAt: -1 });

module.exports = mongoose.model('AnalyticsReport', analyticsReportSchema);
