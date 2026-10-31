/**
 * M12 Plan Analytics Adapter
 * Decouples M12 from M4 (Subscription Plan Management).
 */

const SEED_PLANS = [
  {
    planId: 'plan_starter_monthly_03',
    name: 'Starter Monthly',
    billingFrequency: 'monthly',
    price: 3300,
    subscriptionsCount: 4,
    activeCount: 3,
    invoicedRevenue: 59400,
    collectedRevenue: 52800
  },
  {
    planId: 'plan_pro_monthly_04',
    name: 'Pro Cloud Monthly',
    billingFrequency: 'monthly',
    price: 14250,
    subscriptionsCount: 3,
    activeCount: 3,
    invoicedRevenue: 171000,
    collectedRevenue: 156750
  },
  {
    planId: 'plan_enterprise_yearly_05',
    name: 'Enterprise Annual',
    billingFrequency: 'yearly',
    price: 120000,
    subscriptionsCount: 2,
    activeCount: 2,
    invoicedRevenue: 240000,
    collectedRevenue: 240000
  },
  {
    planId: 'plan_weekly_sprint_02',
    name: 'Weekly Sprint Tracker',
    billingFrequency: 'weekly',
    price: 750,
    subscriptionsCount: 2,
    activeCount: 1,
    invoicedRevenue: 15000,
    collectedRevenue: 13500
  },
  {
    planId: 'plan_daily_metered_01',
    name: 'Daily Metered Sandbox',
    billingFrequency: 'daily',
    price: 150,
    subscriptionsCount: 2,
    activeCount: 1,
    invoicedRevenue: 4500,
    collectedRevenue: 4200
  }
];

const getPlans = async () => [...SEED_PLANS];

const getPlanById = async (id) =>
  SEED_PLANS.find((p) => p.planId === id) || null;

const getPlanPerformance = async () => {
  const totalInvoiced = SEED_PLANS.reduce((sum, p) => sum + p.invoicedRevenue, 0);
  return SEED_PLANS.map((p) => ({
    planId: p.planId,
    name: p.name,
    billingFrequency: p.billingFrequency,
    price: p.price,
    subscriptionsCount: p.subscriptionsCount,
    activeCount: p.activeCount,
    invoicedRevenue: p.invoicedRevenue,
    collectedRevenue: p.collectedRevenue,
    revenueContribution: totalInvoiced > 0 ? parseFloat(((p.invoicedRevenue / totalInvoiced) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.invoicedRevenue - a.invoicedRevenue);
};

const getPlanDistribution = async () => {
  return SEED_PLANS.map((p) => ({
    name: p.name,
    count: p.subscriptionsCount,
    activeCount: p.activeCount
  }));
};

module.exports = {
  SEED_PLANS,
  getPlans,
  getPlanById,
  getPlanPerformance,
  getPlanDistribution
};
