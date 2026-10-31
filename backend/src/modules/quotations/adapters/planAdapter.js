import planCatalogAdapter from "../../quotationTemplates/adapters/planCatalogAdapter.js";

/**
 * Plan Adapter for Quotation Management (M6)
 * Simulates Developer 1's Module M4 (Subscription Plan Management)
 */

export const getPlans = async () => {
  return await planCatalogAdapter.getPlans();
};

export const getPlanById = async (planId) => {
  return await planCatalogAdapter.getPlanById(planId);
};

export const validatePlanAvailability = async (planId) => {
  return await planCatalogAdapter.validatePlan(planId);
};

export const getPlanPricing = async (planId) => {
  return await planCatalogAdapter.getPlanPrice(planId);
};

export default {
  getPlans,
  getPlanById,
  validatePlanAvailability,
  getPlanPricing
};
