import planAdapter from "../../quotations/adapters/planAdapter.js";

/**
 * Plan Adapter for Discount Management (M8)
 * Interfaces with Module M4 (Subscription Plan Management)
 */

export const getAllPlans = async () => {
  return await planAdapter.getPlans();
};

export const getPlanById = async (planId) => {
  return await planAdapter.getPlanById(planId);
};

export default {
  getAllPlans,
  getPlanById
};
