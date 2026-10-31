const CustomerActivity = require('../models/CustomerActivity');

/**
 * Append-only customer activity logger
 */
const logActivity = async ({ customerId, action, description, performedBy, metadata = {} }) => {
  try {
    const activity = await CustomerActivity.create({
      customerId,
      action,
      description,
      performedBy: {
        id: performedBy?.id || null,
        name: performedBy?.fullName || performedBy?.name || 'System',
        role: performedBy?.role || 'system'
      },
      metadata
    });
    return activity;
  } catch (err) {
    console.error('[ActivityLog Error]', err.message);
    return null;
  }
};

const getCustomerActivities = async (customerId, limit = 25) => {
  return await CustomerActivity.find({ customerId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = {
  logActivity,
  getCustomerActivities
};
