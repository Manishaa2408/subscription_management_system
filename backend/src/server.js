require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Start M9 automated recurring billing cron scheduler
    const { startBillingScheduler } = require('./modules/billing/scheduler/billingScheduler');
    startBillingScheduler();

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`Brightloop Software - Subscription Management System`);
      console.log(`ALL 12 MODULES INTEGRATED (M1 - M12)`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Server running on: http://localhost:${PORT}`);
      console.log(`System Health:     http://localhost:${PORT}/api/health`);
      console.log(`Auth API (M1):     http://localhost:${PORT}/api/auth`);
      console.log(`Customers (M2):    http://localhost:${PORT}/api/customers`);
      console.log(`Products (M3):     http://localhost:${PORT}/api/products`);
      console.log(`Plans (M4):        http://localhost:${PORT}/api/plans`);
      console.log(`Templates (M5):    http://localhost:${PORT}/api/quotation-templates`);
      console.log(`Quotations (M6):   http://localhost:${PORT}/api/quotations`);
      console.log(`Subscriptions (M7):http://localhost:${PORT}/api/subscriptions`);
      console.log(`Discounts (M8):    http://localhost:${PORT}/api/discounts`);
      console.log(`Billing (M9):      http://localhost:${PORT}/api/billing`);
      console.log(`Invoices (M10):    http://localhost:${PORT}/api/invoices`);
      console.log(`Payments (M11):    http://localhost:${PORT}/api/payments`);
      console.log(`Analytics (M12):   http://localhost:${PORT}/api/dashboard`);
      console.log(`=======================================================`);
    });

    return server;
  } catch (err) {
    console.error('[Server Error] Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = startServer;
