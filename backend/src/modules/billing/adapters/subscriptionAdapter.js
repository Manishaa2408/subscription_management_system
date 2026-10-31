/**
 * M9 Subscription Adapter
 * Standalone development adapter to decouple M9 from M7 (Subscription Lifecycle Management).
 * 
 * Exposes:
 *   getSubscriptionById(subscriptionId)
 *   getActiveSubscriptions()
 *   getDueSubscriptions(asOfDate)
 *   getCustomerSubscriptions(customerId)
 *   getSubscriptionBillingDetails(subscriptionId)
 *   getSubscriptionStatus(subscriptionId)
 *   getSubscriptionStartDate(subscriptionId)
 *   getSubscriptionEndDate(subscriptionId)
 *   updateNextBillingDate(subscriptionId, nextBillingDate)
 *   validateSubscriptionForBilling(subscriptionId)
 */

const now = new Date();
const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const pastDue = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000); // Yesterday
const dueFuture = new Date(todayStart.getTime() + 20 * 24 * 60 * 60 * 1000); // 20 days later

// Deep clone seed subscriptions so test runs or in-memory updates can be isolated
const INITIAL_SEED_SUBSCRIPTIONS = [
  {
    id: 'sub_active_due_monthly_01',
    subscriptionId: 'sub_active_due_monthly_01',
    subscriptionNumber: 'SUB-2026-0001',
    customerId: 'cust_001_intra_kerala',
    planId: 'plan_starter_monthly_03',
    productId: 'prod_bright_core',
    status: 'active',
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: null,
    nextBillingDate: pastDue,
    billingFrequency: 'monthly',
    billingInterval: 1,
    quantity: 1,
    autoRenew: true
  },
  {
    id: 'sub_active_due_weekly_02',
    subscriptionId: 'sub_active_due_weekly_02',
    subscriptionNumber: 'SUB-2026-0002',
    customerId: 'cust_002_inter_bengaluru',
    planId: 'plan_weekly_sprint_02',
    productId: 'prod_analytics_addon',
    status: 'active',
    startDate: new Date('2026-02-01T00:00:00Z'),
    endDate: null,
    nextBillingDate: pastDue,
    billingFrequency: 'weekly',
    billingInterval: 1,
    quantity: 1,
    autoRenew: true
  },
  {
    id: 'sub_active_due_daily_03',
    subscriptionId: 'sub_active_due_daily_03',
    subscriptionNumber: 'SUB-2026-0003',
    customerId: 'cust_003_inter_chennai',
    planId: 'plan_daily_metered_01',
    productId: 'prod_bright_core',
    status: 'active',
    startDate: new Date('2026-03-01T00:00:00Z'),
    endDate: null,
    nextBillingDate: todayStart,
    billingFrequency: 'daily',
    billingInterval: 1,
    quantity: 2,
    autoRenew: true
  },
  {
    id: 'sub_active_due_yearly_04',
    subscriptionId: 'sub_active_due_yearly_04',
    subscriptionNumber: 'SUB-2026-0004',
    customerId: 'cust_001_intra_kerala',
    planId: 'plan_enterprise_yearly_05',
    productId: 'prod_bright_core',
    status: 'active',
    startDate: new Date('2025-10-31T00:00:00Z'),
    endDate: null,
    nextBillingDate: pastDue,
    billingFrequency: 'yearly',
    billingInterval: 1,
    quantity: 1,
    autoRenew: true
  },
  {
    id: 'sub_future_not_due_05',
    subscriptionId: 'sub_future_not_due_05',
    subscriptionNumber: 'SUB-2026-0005',
    customerId: 'cust_002_inter_bengaluru',
    planId: 'plan_pro_monthly_04',
    productId: 'prod_bright_core',
    status: 'active',
    startDate: new Date('2026-10-15T00:00:00Z'),
    endDate: null,
    nextBillingDate: dueFuture,
    billingFrequency: 'monthly',
    billingInterval: 1,
    quantity: 1,
    autoRenew: true
  },
  {
    id: 'sub_paused_06',
    subscriptionId: 'sub_paused_06',
    subscriptionNumber: 'SUB-2026-0006',
    customerId: 'cust_003_inter_chennai',
    planId: 'plan_starter_monthly_03',
    status: 'paused',
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: null,
    nextBillingDate: pastDue,
    billingFrequency: 'monthly',
    billingInterval: 1,
    quantity: 1,
    autoRenew: false
  },
  {
    id: 'sub_cancelled_07',
    subscriptionId: 'sub_cancelled_07',
    subscriptionNumber: 'SUB-2026-0007',
    customerId: 'cust_004_individual',
    planId: 'plan_daily_metered_01',
    status: 'cancelled',
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: new Date('2026-05-01T00:00:00Z'),
    nextBillingDate: pastDue,
    billingFrequency: 'daily',
    billingInterval: 1,
    quantity: 1,
    autoRenew: false
  },
  {
    id: 'sub_expired_08',
    subscriptionId: 'sub_expired_08',
    subscriptionNumber: 'SUB-2026-0008',
    customerId: 'cust_001_intra_kerala',
    planId: 'plan_starter_monthly_03',
    status: 'expired',
    startDate: new Date('2025-01-01T00:00:00Z'),
    endDate: new Date('2025-12-31T23:59:59Z'),
    nextBillingDate: pastDue,
    billingFrequency: 'monthly',
    billingInterval: 1,
    quantity: 1,
    autoRenew: false
  },
  {
    id: 'sub_invalid_plan_09',
    subscriptionId: 'sub_invalid_plan_09',
    subscriptionNumber: 'SUB-2026-0009',
    customerId: 'cust_002_inter_bengaluru',
    planId: 'plan_ghost_does_not_exist',
    status: 'active',
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: null,
    nextBillingDate: pastDue,
    billingFrequency: 'monthly',
    billingInterval: 1,
    quantity: 1,
    autoRenew: true
  }
];

let liveSubscriptions = JSON.parse(JSON.stringify(INITIAL_SEED_SUBSCRIPTIONS));

const resetSeedSubscriptions = () => {
  liveSubscriptions = JSON.parse(JSON.stringify(INITIAL_SEED_SUBSCRIPTIONS));
};

const getSubscriptionById = async (subscriptionId) => {
  if (!subscriptionId) return null;
  return liveSubscriptions.find((s) => s.id === subscriptionId || s.subscriptionId === subscriptionId) || null;
};

const getActiveSubscriptions = async () => {
  return liveSubscriptions.filter((s) => s.status === 'active');
};

const getDueSubscriptions = async (asOfDate = new Date()) => {
  const targetDate = new Date(asOfDate);
  return liveSubscriptions.filter((s) => {
    if (s.status !== 'active') return false;
    if (!s.nextBillingDate) return false;
    return new Date(s.nextBillingDate) <= targetDate;
  });
};

const getCustomerSubscriptions = async (customerId) => {
  return liveSubscriptions.filter((s) => s.customerId === customerId);
};

const getSubscriptionBillingDetails = async (subscriptionId) => {
  const sub = await getSubscriptionById(subscriptionId);
  if (!sub) return null;
  return {
    subscriptionId: sub.subscriptionId || sub.id,
    customerId: sub.customerId,
    planId: sub.planId,
    productId: sub.productId,
    billingFrequency: sub.billingFrequency,
    billingInterval: sub.billingInterval || 1,
    quantity: sub.quantity || 1,
    nextBillingDate: sub.nextBillingDate,
    status: sub.status
  };
};

const getSubscriptionStatus = async (subscriptionId) => {
  const sub = await getSubscriptionById(subscriptionId);
  return sub ? sub.status : null;
};

const getSubscriptionStartDate = async (subscriptionId) => {
  const sub = await getSubscriptionById(subscriptionId);
  return sub ? sub.startDate : null;
};

const getSubscriptionEndDate = async (subscriptionId) => {
  const sub = await getSubscriptionById(subscriptionId);
  return sub ? sub.endDate : null;
};

const updateNextBillingDate = async (subscriptionId, nextBillingDate) => {
  const sub = liveSubscriptions.find((s) => s.id === subscriptionId || s.subscriptionId === subscriptionId);
  if (sub) {
    sub.nextBillingDate = new Date(nextBillingDate);
    return { success: true, updatedSubscription: sub };
  }
  return { success: false, message: 'Subscription not found' };
};

const validateSubscriptionForBilling = async (subscriptionId) => {
  const sub = await getSubscriptionById(subscriptionId);
  if (!sub) {
    return { valid: false, reason: `Subscription '${subscriptionId}' does not exist` };
  }
  if (sub.status !== 'active') {
    return { valid: false, reason: `Subscription '${subscriptionId}' status is '${sub.status}' (must be 'active')` };
  }
  if (sub.endDate && new Date(sub.endDate) < new Date()) {
    return { valid: false, reason: `Subscription '${subscriptionId}' expired on ${sub.endDate}` };
  }
  return { valid: true, subscription: sub };
};

module.exports = {
  INITIAL_SEED_SUBSCRIPTIONS,
  resetSeedSubscriptions,
  getSubscriptionById,
  getActiveSubscriptions,
  getDueSubscriptions,
  getCustomerSubscriptions,
  getSubscriptionBillingDetails,
  getSubscriptionStatus,
  getSubscriptionStartDate,
  getSubscriptionEndDate,
  updateNextBillingDate,
  validateSubscriptionForBilling
};
