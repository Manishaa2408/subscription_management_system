// backend/src/modules/plans/services/planActivityService.js
const PlanActivity = require('../models/PlanActivity');

/** Log an activity for a subscription plan */
const logActivity = async ({ planId, action, description = '', performedBy = null, metadata = {} }) => {
  const entry = new PlanActivity({
    planId,
    action,
    description,
    performedBy,
    metadata
  });
  await entry.save();
  return entry;
};

module.exports = { logActivity };
