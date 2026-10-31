const Customer = require('../models/Customer');
const { logActivity } = require('./customerActivityService');

/**
 * Retrieve or link customer profile for the authenticated user
 */
const getCustomerByUserId = async (userId) => {
  let customer = await Customer.findOne({ userId });

  // If no customer profile is linked to this user yet, check by email
  if (!customer) {
    const userAdapter = require('../adapters/userAdapter');
    const user = await userAdapter.getUserById(userId);
    if (user && user.email) {
      customer = await Customer.findOne({ email: user.email.toLowerCase() });
      if (customer && !customer.userId) {
        customer.userId = userId;
        await customer.save();
      }
    }
  }

  return customer;
};

const updateCustomerProfile = async (userId, profileData, currentUser) => {
  const customer = await getCustomerByUserId(userId);
  if (!customer) {
    throw new Error('No customer profile found for the current user');
  }

  // Only allow permitted fields to be updated by customer
  const allowedFields = [
    'firstName',
    'lastName',
    'displayName',
    'phone',
    'alternatePhone',
    'website',
    'billingAddress',
    'shippingAddress'
  ];

  allowedFields.forEach((field) => {
    if (profileData[field] !== undefined) {
      customer[field] = profileData[field];
    }
  });

  customer.updatedBy = currentUser?.id || userId;
  await customer.save();

  await logActivity({
    customerId: customer._id,
    action: 'PORTAL_PROFILE_UPDATED',
    description: `Customer updated profile information via Customer Portal`,
    performedBy: currentUser
  });

  return customer;
};

module.exports = {
  getCustomerByUserId,
  updateCustomerProfile
};
