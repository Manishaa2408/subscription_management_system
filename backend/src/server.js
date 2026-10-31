require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const { startBillingScheduler } = require('./modules/billing/scheduler/billingScheduler');
    startBillingScheduler();

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`Brightloop Subscription Management System - Backend`);
      console.log(`Modules: M9 (Billing), M10 (Invoices), M11 (Payments)`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Server running on: http://localhost:${PORT}`);
      console.log(`Billing API:       http://localhost:${PORT}/api/billing`);
      console.log(`Billing Runs:      http://localhost:${PORT}/api/billing/runs`);
      console.log(`Invoices API:      http://localhost:${PORT}/api/invoices`);
      console.log(`Payments API:      http://localhost:${PORT}/api/payments`);
      console.log(`Health Check:      http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = startServer;
