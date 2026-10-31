require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`Brightloop Subscription Management System - Backend`);
      console.log(`Module: M10 - Invoice & Tax Management`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Server running on: http://localhost:${PORT}`);
      console.log(`Invoices API:      http://localhost:${PORT}/api/invoices`);
      console.log(`Tax Config API:    http://localhost:${PORT}/api/tax-configurations`);
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
