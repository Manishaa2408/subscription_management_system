import apiClient from "./apiClient";

export const subscriptionService = {
  // Get all subscriptions with filters
  getSubscriptions: async (params = {}) => {
    const res = await apiClient.get("/subscriptions", { params });
    return res.data;
  },

  // Get single subscription by ID
  getSubscriptionById: async (id) => {
    const res = await apiClient.get(`/subscriptions/${id}`);
    return res.data;
  },

  // Get metrics for dashboard
  getMetrics: async () => {
    const res = await apiClient.get("/subscriptions/dashboard/metrics");
    return res.data;
  },

  // Get catalog data (customers, plans, accepted quotations)
  getCatalogData: async () => {
    const res = await apiClient.get("/subscriptions/catalog");
    return res.data;
  },

  // Create manual subscription
  createManualSubscription: async (payload) => {
    const res = await apiClient.post("/subscriptions", payload);
    return res.data;
  },

  // Convert accepted quotation to subscription
  createFromQuotation: async (quotationId) => {
    const res = await apiClient.post(`/subscriptions/from-quotation/${quotationId}`);
    return res.data;
  },

  // Activate pending subscription
  activateSubscription: async (id) => {
    const res = await apiClient.post(`/subscriptions/${id}/activate`);
    return res.data;
  },

  // Renew active subscription (advances period)
  renewSubscription: async (id) => {
    const res = await apiClient.post(`/subscriptions/${id}/renew`);
    return res.data;
  },

  // Change plan (upgrade / downgrade)
  changePlan: async (id, newPlanId, reason) => {
    const res = await apiClient.post(`/subscriptions/${id}/change-plan`, { newPlanId, reason });
    return res.data;
  },

  // Pause subscription
  pauseSubscription: async (id, reason, expectedResumeDate) => {
    const res = await apiClient.post(`/subscriptions/${id}/pause`, { reason, expectedResumeDate });
    return res.data;
  },

  // Resume subscription
  resumeSubscription: async (id) => {
    const res = await apiClient.post(`/subscriptions/${id}/resume`);
    return res.data;
  },

  // Cancel subscription
  cancelSubscription: async (id, cancellationReason, cancelImmediately = true) => {
    const res = await apiClient.post(`/subscriptions/${id}/cancel`, { cancellationReason, cancelImmediately });
    return res.data;
  },

  // Get audit trail
  getActivity: async (id) => {
    const res = await apiClient.get(`/subscriptions/${id}/activity`);
    return res.data;
  },

  // Get renewal history
  getRenewals: async (id) => {
    const res = await apiClient.get(`/subscriptions/${id}/renewals`);
    return res.data;
  },

  // Get plan change history
  getPlanChanges: async (id) => {
    const res = await apiClient.get(`/subscriptions/${id}/plan-changes`);
    return res.data;
  },

  // Retry M9 billing sync
  retryBillingSync: async (id) => {
    const res = await apiClient.post(`/subscriptions/${id}/retry-sync`);
    return res.data;
  },

  // Get M9 billing info
  getBillingInfo: async (id) => {
    const res = await apiClient.get(`/subscriptions/${id}/billing-info`);
    return res.data;
  }
};

export default subscriptionService;
