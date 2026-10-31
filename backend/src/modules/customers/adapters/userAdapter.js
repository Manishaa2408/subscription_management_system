let User = null;
try {
  User = require('../../../models/User');
} catch (_) {}

// Standalone mock users
const MOCK_USERS = [
  {
    id: '660000000000000000000001',
    _id: '660000000000000000000001',
    fullName: 'Brightloop Admin',
    email: 'admin@brightloop.com',
    role: 'admin',
    isActive: true
  },
  {
    id: '660000000000000000000002',
    _id: '660000000000000000000002',
    fullName: 'Support Staff',
    email: 'staff@brightloop.com',
    role: 'staff',
    isActive: true
  },
  {
    id: '660000000000000000000003',
    _id: '660000000000000000000003',
    fullName: 'Aarav Patel',
    email: 'aarav@techcorp.in',
    role: 'customer',
    isActive: true
  },
  {
    id: '660000000000000000000004',
    _id: '660000000000000000000004',
    fullName: 'Neha Sharma',
    email: 'neha@cloudworks.io',
    role: 'customer',
    isActive: true
  }
];

const getUserById = async (userId) => {
  if (User) {
    try {
      const user = await User.findById(userId);
      if (user) return user.toSafeObject ? user.toSafeObject() : user;
    } catch (_) {}
  }
  return MOCK_USERS.find((u) => u.id === String(userId)) || null;
};

const getUserByEmail = async (email) => {
  if (User) {
    try {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (user) return user.toSafeObject ? user.toSafeObject() : user;
    } catch (_) {}
  }
  return MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
};

const validateUser = async (userId) => {
  const user = await getUserById(userId);
  return !!user && user.isActive !== false;
};

const getUserRole = async (userId) => {
  const user = await getUserById(userId);
  return user ? user.role : null;
};

const getUserEmail = async (userId) => {
  const user = await getUserById(userId);
  return user ? user.email : null;
};

const getUserDetails = async (userId) => {
  return await getUserById(userId);
};

module.exports = {
  getUserById,
  getUserByEmail,
  validateUser,
  getUserRole,
  getUserEmail,
  getUserDetails,
  MOCK_USERS
};
