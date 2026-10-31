/**
 * M9 Subscription Plan Adapter
 * Standalone development adapter to decouple M9 from M4 (Subscription Plan Management).
 */

const SEED_PLANS = [
  {
    id: 'plan_daily_metered_01',
    planId: 'plan_daily_metered_01',
    name: 'Developer Sandbox Daily Pass',
    billingFrequency: 'daily',
    billingInterval: 1,
    price: 150,
    currency: 'INR',
    description: 'Daily computing sandbox for dev teams',
    status: 'active'
  },
  {
    id: 'plan_weekly_sprint_02',
    planId: 'plan_weekly_sprint_02',
    name: 'Sprint Analytics Weekly',
    billingFrequency: 'weekly',
    billingInterval: 1,
    price: 750,
    currency: 'INR',
    description: 'Weekly sprint tracking & KPI digest',
    status: 'active'
  },
  {
    id: 'plan_starter_monthly_03',
    planId: 'plan_starter_monthly_03',
    name: 'Brightloop Starter Monthly',
    billingFrequency: 'monthly',
    billingInterval: 1,
    price: 3300,
    currency: 'INR',
    description: 'Essential recurring subscription billing for up to 500 subscribers',
    status: 'active'
  },
  {
    id: 'plan_pro_monthly_04',
    planId: 'plan_pro_monthly_04',
    name: 'Brightloop Pro Cloud Monthly',
    billingFrequency: 'monthly',
    billingInterval: 1,
    price: 14250,
    currency: 'INR',
    description: 'Full automated revenue engine, webhook triggers and high-volume billing',
    status: 'active'
  },
  {
    id: 'plan_enterprise_yearly_05',
    planId: 'plan_enterprise_yearly_05',
    name: 'Brightloop Enterprise Annual',
    billingFrequency: 'yearly',
    billingInterval: 1,
    price: 120000,
    currency: 'INR',
    description: 'Annual enterprise subscription license with dedicated SLA',
    status: 'active'
  },
  {
    id: 'plan_archived_legacy_06',
    planId: 'plan_archived_legacy_06',
    name: 'Legacy Beta Monthly (Archived)',
    billingFrequency: 'monthly',
    billingInterval: 1,
    price: 999,
    currency: 'INR',
    description: 'Discontinued legacy beta tier',
    status: 'archived'
  }
];

const getPlanById = async (planId) => {
  if (!planId) return null;
  return SEED_PLANS.find((p) => p.id === planId || p.planId === planId) || null;
};

const getPlanPrice = async (planId) => {
  const plan = await getPlanById(planId);
  return plan ? plan.price : null;
};

const getPlanBillingCycle = async (planId) => {
  const plan = await getPlanById(planId);
  return plan ? { frequency: plan.billingFrequency, interval: plan.billingInterval } : null;
};

const getPlanCurrency = async (planId) => {
  const plan = await getPlanById(planId);
  return plan ? plan.currency : 'INR';
};

const validatePlan = async (planId) => {
  const plan = await getPlanById(planId);
  if (!plan) {
    return { valid: false, reason: `Plan '${planId}' does not exist` };
  }
  if (plan.status !== 'active') {
    return { valid: false, reason: `Plan '${planId}' is ${plan.status}` };
  }
  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(plan.billingFrequency)) {
    return { valid: false, reason: `Unsupported billing frequency '${plan.billingFrequency}'` };
  }
  return { valid: true, plan };
};

module.exports = {
  SEED_PLANS,
  getPlanById,
  getPlanPrice,
  getPlanBillingCycle,
  getPlanCurrency,
  validatePlan
};
