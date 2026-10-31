const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const { connectDB } = require('./config/db');

let seedAdmin;
try {
  seedAdmin = require('../scripts/seedAdmin').seedAdmin;
} catch (e) {
  seedAdmin = null;
}

let autoSeedAll;
try {
  autoSeedAll = require('./seeds/autoSeed').autoSeedAll;
} catch (e) {
  autoSeedAll = null;
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Seed admin
  if (seedAdmin) {
    try {
      await seedAdmin();
    } catch (err) {
      console.warn('[Server] Auto seed admin warning:', err.message);
    }
  }

  // Seed demo data for quotations, invoices, payments, discounts
  if (autoSeedAll) {
    try {
      await autoSeedAll();
    } catch (err) {
      console.warn('[Server] Auto seed all warning:', err.message);
    }
  }

  const server = app.listen(PORT, () => {
    console.log(
      `[Server] Brightloop SMS running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
    console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    console.log(`[Server] All 12 modules loaded (M1-M12)`);
  });

  process.on('unhandledRejection', (err) => {
    console.error(`[Server] Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
