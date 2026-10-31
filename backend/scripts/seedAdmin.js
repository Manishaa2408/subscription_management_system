const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const { connectDB, disconnectDB } = require('../src/config/db');

const seedAdmin = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    const adminName = process.env.ADMIN_NAME || 'Brightloop Admin';
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@brightloop.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';

    // Check if an admin with this email or any admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`[Seed] Admin user already exists with email: ${adminEmail}`);
      console.log(`[Seed] Role: ${existingAdmin.role}, Active: ${existingAdmin.isActive}`);
      await disconnectDB();
      process.exit(0);
    }

    console.log(`[Seed] Creating initial Admin user (${adminEmail})...`);

    const admin = await User.create({
      fullName: adminName,
      email: adminEmail,
      password: adminPassword, // User schema pre-save hook will hash this securely
      role: 'admin',
      isActive: true
    });

    console.log('[Seed] Admin user created successfully!');
    console.log(`[Seed] ID: ${admin._id}`);
    console.log(`[Seed] Email: ${admin.email}`);
    console.log(`[Seed] Role: ${admin.role}`);
    console.log('[Seed] You can now log in using these credentials.');

    return admin;
  } catch (err) {
    console.error('[Seed Error] Failed to seed admin:', err.message);
    throw err;
  }
};

if (require.main === module) {
  seedAdmin()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async () => {
      try {
        await disconnectDB();
      } catch (_) {}
      process.exit(1);
    });
}

module.exports = { seedAdmin };
