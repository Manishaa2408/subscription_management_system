// reset_admin_password_from_env.js
// Usage: node reset_admin_password_from_env.js
// This script reads the .env file, hashes ADMIN_PASSWORD, and updates the admin user record.
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/brightloop';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@brightloop.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';

(async () => {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const Customer = mongoose.model('Customer', new mongoose.Schema({ email: String, password: String }));
    const admin = await Customer.findOne({ email: ADMIN_EMAIL });
    if (!admin) {
      console.error('❌ Admin user not found (email:', ADMIN_EMAIL, ')');
      process.exit(1);
    }
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    admin.password = hashed;
    await admin.save();
    console.log('✅ Admin password has been set to the value from .env');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting admin password:', err);
    process.exit(1);
  }
})();
