/**
 * Temporary development seed catalog for Subscription Plans (Simulates M4)
 * Contains daily, weekly, monthly, and yearly recurring plans.
 * Valid MongoDB ObjectIds for independent development.
 */
export const SAMPLE_PLANS = [
  {
    _id: "67246830a3f65e2a84b12001",
    name: "Enterprise Cloud Subscription (Yearly)",
    code: "PLAN-ENT-YR",
    billingInterval: "yearly",
    price: 50000,
    taxRate: 18,
    status: "active",
    description: "Annual full suite SaaS license with automatic offsite backups",
    minQuantity: 1
  },
  {
    _id: "67246830a3f65e2a84b12002",
    name: "Enterprise Cloud Subscription (Monthly)",
    code: "PLAN-ENT-MO",
    billingInterval: "monthly",
    price: 5000,
    taxRate: 18,
    status: "active",
    description: "Monthly enterprise software tier with flexible cancellation",
    minQuantity: 1
  },
  {
    _id: "67246830a3f65e2a84b12003",
    name: "Starter Business Plan (Monthly)",
    code: "PLAN-START-MO",
    billingInterval: "monthly",
    price: 1999,
    taxRate: 18,
    status: "active",
    description: "Ideal for small teams up to 10 users",
    minQuantity: 1
  },
  {
    _id: "67246830a3f65e2a84b12004",
    name: "Developer Sandbox Tier (Weekly)",
    code: "PLAN-DEV-WK",
    billingInterval: "weekly",
    price: 600,
    taxRate: 18,
    status: "active",
    description: "Short-term development environment for fast prototyping",
    minQuantity: 1
  },
  {
    _id: "67246830a3f65e2a84b12005",
    name: "High-Performance Compute Burst (Daily)",
    code: "PLAN-BURST-DAY",
    billingInterval: "daily",
    price: 150,
    taxRate: 18,
    status: "active",
    description: "On-demand daily compute allocation for batch heavy workloads",
    minQuantity: 1
  }
];

/**
 * Subscription Plan Catalog Adapter Interface:
 * - getPlans()
 * - getPlanById(id)
 * - validatePlan(planId)
 * - getPlanPrice(planId)
 */

export const getPlans = async () => {
  return SAMPLE_PLANS.filter(p => p.status === "active");
};

export const getPlanById = async (id) => {
  if (!id) return null;
  const strId = id.toString();
  return SAMPLE_PLANS.find(p => p._id.toString() === strId) || null;
};

export const validatePlan = async (planId) => {
  const plan = await getPlanById(planId);
  if (!plan) {
    return { valid: false, message: `Subscription plan with ID '${planId}' not found in catalog` };
  }
  if (plan.status !== "active") {
    return { valid: false, message: `Subscription plan '${plan.name}' is inactive` };
  }
  return { valid: true, plan };
};

export const getPlanPrice = async (planId) => {
  const { valid, plan, message } = await validatePlan(planId);
  if (!valid) {
    throw new Error(message);
  }
  return {
    price: plan.price,
    billingInterval: plan.billingInterval,
    taxRate: plan.taxRate || 0,
    name: plan.name
  };
};

export default {
  getPlans,
  getPlanById,
  validatePlan,
  getPlanPrice
};
