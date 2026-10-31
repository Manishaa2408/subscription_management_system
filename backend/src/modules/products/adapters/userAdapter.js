// backend/src/modules/products/adapters/userAdapter.js
/**
 * Development user adapter for M3.
 * Provides mock user lookup based on the mock authentication adapter.
 * In production, this will be replaced by the real user service from M1.
 */

const mockUsers = [
  { id: 'dev-admin-1', role: 'admin', email: 'admin@example.com', fullName: 'Admin User' },
  { id: 'dev-staff-1', role: 'staff', email: 'staff1@example.com', fullName: 'Staff One' },
  { id: 'dev-staff-2', role: 'staff', email: 'staff2@example.com', fullName: 'Staff Two' },
  { id: 'dev-customer-1', role: 'customer', email: 'customer@example.com', fullName: 'Customer User' }
];

module.exports = {
  /** Retrieve a user by mock ID */
  getUserById: async (userId) => {
    return mockUsers.find((u) => u.id === userId) || null;
  },
  /** Validate that a user exists (used by services) */
  validateUser: async (userId) => {
    const user = await module.exports.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
};
