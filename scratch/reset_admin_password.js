// Reset admin password script
// Run with: node reset_admin_password.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@brightloop.com';
const NEW_PASSWORD = 'Admin@123'; // new password you want to set

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const Customer = mongoose.model('Customer', new mongoose.Schema({ email: String, password: String }));
    const admin = await Customer.findOne({ email: ADMIN_EMAIL });
    if (!admin) {
      console.error('Admin user not found');
      process.exit(1);
    }
    const hashed = await bcrypt.hash(NEW_PASSWORD, 10);
    admin.password = hashed;
    await admin.save();
    console.log('Admin password reset to', NEW_PASSWORD);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
