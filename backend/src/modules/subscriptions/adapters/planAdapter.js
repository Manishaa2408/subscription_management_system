import planAdapter from "../../quotations/adapters/planAdapter.js";

/**
 * Plan Adapter for Subscription Lifecycle Management (M7)
 * Interfaces with Module M4
 */

export const getPlans = async () => {
  return await planAdapter.getPlans();
};

export const getPlanById = async (planId) => {
  return await planAdapter.getPlanById(planId);
};

export const validatePlanAvailability = async (planId) => {
  return await planAdapter.validatePlanAvailability(planId);
};

export const getPlanPricing = async (planId) => {
  return await planAdapter.getPlanPricing(planId);
};

export default {
  getPlans,
  getPlanById,
  validatePlanAvailability,
  getPlanPricing
};
