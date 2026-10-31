import { request } from './api';

const toQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  return query.toString() ? `?${query.toString()}` : '';
};

// ── Billing Schedules ────────────────────────────────────────────────────────

export const getBillingSchedules = async (params = {}) => {
  return await request(`/billing/schedules${toQueryString(params)}`);
};

export const getScheduleById = async (id) => {
  return await request(`/billing/schedules/${id}`);
};

export const createBillingSchedule = async (data) => {
  return await request('/billing/schedules', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateBillingSchedule = async (id, data) => {
  return await request(`/billing/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const getDueSchedules = async (params = {}) => {
  return await request(`/billing/schedules/due${toQueryString(params)}`);
};

// ── Billing Runs & Executions ────────────────────────────────────────────────

export const triggerBillingRun = async (data = {}) => {
  return await request('/billing/run', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const processSubscriptionBilling = async (subscriptionId, data = {}) => {
  return await request(`/billing/subscriptions/${subscriptionId}/process`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const getSubscriptionBillingHistory = async (subscriptionId) => {
  return await request(`/billing/subscriptions/${subscriptionId}/history`);
};

export const getBillingRuns = async (params = {}) => {
  return await request(`/billing/runs${toQueryString(params)}`);
};

export const getBillingRunDetails = async (id) => {
  return await request(`/billing/runs/${id}`);
};

export const retryBillingRun = async (id) => {
  return await request(`/billing/runs/${id}/retry`, {
    method: 'POST'
  });
};

// ── Monitoring & KPI APIs ─────────────────────────────────────────────────────

export const getBillingHistory = async (params = {}) => {
  return await request(`/billing/history${toQueryString(params)}`);
};

export const getFailedBillings = async (params = {}) => {
  return await request(`/billing/failed${toQueryString(params)}`);
};

export const getBillingSummary = async () => {
  return await request('/billing/summary');
};

export const getBillingStatus = async () => {
  return await request('/billing/status');
};
