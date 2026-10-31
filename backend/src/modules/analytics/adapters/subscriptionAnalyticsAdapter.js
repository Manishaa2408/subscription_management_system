/**
 * M12 Subscription Analytics Adapter
 * Decouples M12 from M7 (Subscription Lifecycle Management).
 */

const SEED_SUBSCRIPTIONS = [
  {
    subscriptionId: 'sub_active_due_monthly_01',
    subscriptionNumber: 'SUB-2026-0001',
    customerId: 'cust_001_intra_kerala',
    planId: 'plan_starter_monthly_03',
    status: 'active',
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: null,
    mrr: 3300
  },
  {
    subscriptionId: 'sub_active_due_weekly_02',
    subscriptionNumber: 'SUB-2026-0002',
    customerId: 'cust_002_inter_bengaluru',
    planId: 'plan_weekly_sprint_02',
    status: 'active',
    startDate: new Date('2026-02-01T00:00:00Z'),
    endDate: null,
    mrr: 3000
  },
  {
    subscriptionId: 'sub_active_due_daily_03',
    subscriptionNumber: 'SUB-2026-0003',
    customerId: 'cust_003_inter_chennai',
    planId: 'plan_daily_metered_01',
    status: 'active',
    startDate: new Date('2026-03-01T00:00:00Z'),
    endDate: null,
    mrr: 4500
  },
  {
    subscriptionId: 'sub_active_due_yearly_04',
    subscriptionNumber: 'SUB-2026-0004',
    customerId: 'cust_001_intra_kerala',
    planId: 'plan_enterprise_yearly_05',
    status: 'active',
    startDate: new Date('2025-10-31T00:00:00Z'),
    endDate: null,
    mrr: 10000
  },
  {
    subscriptionId: 'sub_future_not_due_05',
    subscriptionNumber: 'SUB-2026-0005',
    customerId: 'cust_002_inter_bengaluru',
    planId: 'plan_pro_monthly_04',
    status: 'active',
    startDate: new Date('2026-10-15T00:00:00Z'),
    endDate: null,
    mrr: 14250
  },
  {
    subscriptionId: 'sub_paused_06',
    subscriptionNumber: 'SUB-2026-0006',
    customerId: 'cust_003_inter_chennai',
    planId: 'plan_starter_monthly_03',
    status: 'paused',
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: null,
    mrr: 0
  },
  {
    subscriptionId: 'sub_cancelled_07',
    subscriptionNumber: 'SUB-2026-0007',
    customerId: 'cust_004_individual',
    planId: 'plan_daily_metered_01',
    status: 'cancelled',
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: new Date('2026-05-01T00:00:00Z'),
    cancelledAt: new Date('2026-05-01T00:00:00Z'),
    mrr: 0
  },
  {
    subscriptionId: 'sub_expired_08',
    subscriptionNumber: 'SUB-2026-0008',
    customerId: 'cust_001_intra_kerala',
    planId: 'plan_starter_monthly_03',
    status: 'expired',
    startDate: new Date('2025-01-01T00:00:00Z'),
    endDate: new Date('2025-12-31T23:59:59Z'),
    mrr: 0
  }
];

const getSubscriptions = async () => [...SEED_SUBSCRIPTIONS];

const getSubscriptionStatusBreakdown = async () => {
  const breakdown = { active: 0, paused: 0, cancelled: 0, expired: 0 };
  SEED_SUBSCRIPTIONS.forEach((s) => {
    breakdown[s.status] = (breakdown[s.status] || 0) + 1;
  });
  return breakdown;
};

const getSubscriptionChurnData = async () => {
  const activeCount = SEED_SUBSCRIPTIONS.filter((s) => s.status === 'active').length;
  const cancelledCount = SEED_SUBSCRIPTIONS.filter((s) => s.status === 'cancelled').length;
  const totalBase = activeCount + cancelledCount;

  const churnRate = totalBase > 0 ? parseFloat(((cancelledCount / totalBase) * 100).toFixed(1)) : 0;
  const retentionRate = totalBase > 0 ? parseFloat(((activeCount / totalBase) * 100).toFixed(1)) : 100;

  return {
    activeSubscriptions: activeCount,
    cancelledSubscriptions: cancelledCount,
    totalBase,
    churnRate,     // Percentage e.g. 16.7%
    retentionRate  // Percentage e.g. 83.3%
  };
};

const getSubscriptionGrowth = async () => {
  const months = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026'];
  const monthMap = {};
  months.forEach((m) => { monthMap[m] = { newSubs: 0, cancelledSubs: 0 }; });

  SEED_SUBSCRIPTIONS.forEach((s) => {
    const startStr = new Date(s.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (monthMap[startStr]) monthMap[startStr].newSubs += 1;
    if (s.cancelledAt) {
      const cancelStr = new Date(s.cancelledAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthMap[cancelStr]) monthMap[cancelStr].cancelledSubs += 1;
    }
  });

  let activeTotal = 0;
  return Object.entries(monthMap).map(([period, data]) => {
    activeTotal += data.newSubs - data.cancelledSubs;
    return {
      period,
      newSubscriptions: data.newSubs,
      cancelledSubscriptions: data.cancelledSubs,
      activeTotal: Math.max(0, activeTotal)
    };
  });
};

module.exports = {
  SEED_SUBSCRIPTIONS,
  getSubscriptions,
  getSubscriptionStatusBreakdown,
  getSubscriptionChurnData,
  getSubscriptionGrowth
};
