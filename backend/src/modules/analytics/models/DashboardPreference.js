const mongoose = require('mongoose');

const dashboardPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    dashboardType: {
      type: String,
      default: 'admin'
    },
    selectedWidgets: {
      type: [String],
      default: ['kpi_cards', 'revenue_trends', 'customer_growth', 'subscription_status', 'billing_runs', 'payment_methods']
    },
    defaultDateRange: {
      type: String,
      default: 'last_30_days'
    },
    chartPreferences: {
      theme: { type: String, default: 'blue' },
      showComparison: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DashboardPreference', dashboardPreferenceSchema);
