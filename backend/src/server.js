const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const { connectDB } = require('./config/db');
const { seedAdmin } = require('../scripts/seedAdmin');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Ensure Admin account is seeded
  try {
    await seedAdmin();
  } catch (err) {
    console.warn('[Server] Auto seed admin warning:', err.message);
  }

  const server = app.listen(PORT, () => {
    console.log(
      `[Server] Brightloop Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
    console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[Server] Unhandled Rejection: ${err.message}`);
  });
};

startServer();
