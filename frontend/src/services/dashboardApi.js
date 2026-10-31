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

// ── Main Dashboard Overview ──

export const getDashboardOverview = async (params = {}) => {
  return await request(`/dashboard/overview${toQueryString(params)}`);
};

export const getRevenueSummary = async (params = {}) => {
  return await request(`/dashboard/revenue-summary${toQueryString(params)}`);
};

export const getCustomerSummary = async (params = {}) => {
  return await request(`/dashboard/customer-summary${toQueryString(params)}`);
};

export const getSubscriptionSummary = async (params = {}) => {
  return await request(`/dashboard/subscription-summary${toQueryString(params)}`);
};

// ── Specific Analytics ──

export const getRevenueTrends = async (params = {}) => {
  return await request(`/analytics/revenue/trends${toQueryString(params)}`);
};

export const getRevenueByProduct = async (params = {}) => {
  return await request(`/analytics/revenue/by-product${toQueryString(params)}`);
};

export const getRevenueByPlan = async (params = {}) => {
  return await request(`/analytics/revenue/by-plan${toQueryString(params)}`);
};

export const getRevenueComparison = async () => {
  return await request('/analytics/revenue/comparison');
};

export const getCustomerGrowth = async (params = {}) => {
  return await request(`/analytics/customers/growth${toQueryString(params)}`);
};

export const getCustomerDistribution = async () => {
  return await request('/analytics/customers/distribution');
};

export const getSubscriptionGrowth = async () => {
  return await request('/analytics/subscriptions/growth');
};

export const getSubscriptionStatus = async () => {
  return await request('/analytics/subscriptions/status');
};

export const getSubscriptionChurn = async () => {
  return await request('/analytics/subscriptions/churn');
};

export const getProductPerformance = async () => {
  return await request('/analytics/products/performance');
};

export const getPaymentMethods = async () => {
  return await request('/analytics/payments/methods');
};

export const getInvoiceTax = async (params = {}) => {
  return await request(`/analytics/invoices/tax${toQueryString(params)}`);
};

// ── Report Exports ──

export const downloadReport = async (type) => {
  const res = await fetch(`/api/reports/export/${type}`, {
    headers: {
      'x-mock-role': 'admin'
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to download ${type} report (HTTP ${res.status})`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}_report_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const getReportHistory = async () => {
  return await request('/reports/history');
};
