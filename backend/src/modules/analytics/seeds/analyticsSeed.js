const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../../../config/db');
const AnalyticsReport = require('../models/AnalyticsReport');
const DashboardPreference = require('../models/DashboardPreference');

const seedAnalytics = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('[Seed:M12] Cannot execute development seed in production environment!');
    process.exit(1);
  }

  try {
    console.log('[Seed:M12] Connecting to database...');
    await connectDB();

    console.log('[Seed:M12] Resetting M12 analytics collections...');
    await Promise.all([
      AnalyticsReport.deleteMany({}),
      DashboardPreference.deleteMany({})
    ]);

    console.log('[Seed:M12] Seeding Dashboard Preferences...');
    await DashboardPreference.create([
      {
        userId: 'usr_admin_001',
        dashboardType: 'admin',
        selectedWidgets: ['kpi_cards', 'revenue_trends', 'customer_growth', 'subscription_status', 'billing_runs', 'payment_methods', 'product_performance'],
        defaultDateRange: 'last_30_days',
        chartPreferences: { theme: 'blue', showComparison: true }
      },
      {
        userId: 'usr_staff_001',
        dashboardType: 'staff',
        selectedWidgets: ['kpi_cards', 'revenue_trends', 'customer_growth', 'subscription_status'],
        defaultDateRange: 'this_month',
        chartPreferences: { theme: 'blue', showComparison: false }
      }
    ]);

    console.log('[Seed:M12] Seeding Historical Analytics Reports...');
    await AnalyticsReport.create([
      {
        reportName: 'Q3_2026_Revenue_Summary',
        reportType: 'revenue',
        dateRange: {
          startDate: new Date('2026-07-01T00:00:00Z'),
          endDate: new Date('2026-09-30T23:59:59Z')
        },
        generatedBy: 'admin@brightloop.io',
        exportFormat: 'csv',
        recordCount: 42,
        status: 'completed'
      },
      {
        reportName: 'October_2026_Customer_Growth',
        reportType: 'customers',
        dateRange: {
          startDate: new Date('2026-10-01T00:00:00Z'),
          endDate: new Date('2026-10-31T23:59:59Z')
        },
        generatedBy: 'admin@brightloop.io',
        exportFormat: 'csv',
        recordCount: 15,
        status: 'completed'
      }
    ]);

    console.log('[Seed:M12] Successfully initialized M12 Dashboard & Analytics seed data:');
    console.log('  - 2 Dashboard Preferences (Admin & Staff)');
    console.log('  - 2 Historical Analytics Reports');
    console.log('  - Ready for executive telemetry queries.');

    process.exit(0);
  } catch (err) {
    console.error('[Seed:M12] Seeding failed:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedAnalytics();
}

module.exports = seedAnalytics;
