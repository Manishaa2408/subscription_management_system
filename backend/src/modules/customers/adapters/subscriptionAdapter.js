const MOCK_SUBSCRIPTIONS = [
  {
    id: 'sub_001',
    customerId: '660000000000000000000010', // dynamic check or fallback
    subscriptionNumber: 'SUB-2026-001',
    planName: 'Enterprise SaaS Annual',
    amount: 49999,
    interval: 'yearly',
    status: 'active',
    startDate: new Date('2026-01-15'),
    nextBillingDate: new Date('2027-01-15'),
    autoRenew: true
  },
  {
    id: 'sub_002',
    customerId: '660000000000000000000010',
    subscriptionNumber: 'SUB-2026-002',
    planName: 'AI Analytics Add-on',
    amount: 1999,
    interval: 'monthly',
    status: 'active',
    startDate: new Date('2026-02-01'),
    nextBillingDate: new Date('2026-11-01'),
    autoRenew: true
  }
];

const getCustomerSubscriptions = async (customerId) => {
  // If specific customer has matches, return them; otherwise provide realistic sample list for preview
  const list = MOCK_SUBSCRIPTIONS.filter(
    (s) => String(s.customerId) === String(customerId)
  );
  return list.length > 0 ? list : MOCK_SUBSCRIPTIONS.map(s => ({ ...s, customerId }));
};

const getSubscriptionById = async (subscriptionId) => {
  return MOCK_SUBSCRIPTIONS.find((s) => s.id === String(subscriptionId)) || null;
};

const getActiveSubscriptionCount = async (customerId) => {
  const subs = await getCustomerSubscriptions(customerId);
  return subs.filter((s) => s.status === 'active').length;
};

const getSubscriptionSummary = async (customerId) => {
  const subs = await getCustomerSubscriptions(customerId);
  const activeCount = subs.filter((s) => s.status === 'active').length;
  const totalMonthlyRunRate = subs.reduce((acc, curr) => {
    return acc + (curr.interval === 'yearly' ? Math.round(curr.amount / 12) : curr.amount);
  }, 0);

  return {
    totalSubscriptions: subs.length,
    activeSubscriptions: activeCount,
    monthlyRunRate: totalMonthlyRunRate,
    recentSubscription: subs[0] || null
  };
};

module.exports = {
  getCustomerSubscriptions,
  getSubscriptionById,
  getActiveSubscriptionCount,
  getSubscriptionSummary,
  MOCK_SUBSCRIPTIONS
};
