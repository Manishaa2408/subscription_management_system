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

// ── Payments ──────────────────────────────────────────────────────────────────

export const getPayments = async (params = {}) => {
  return await request(`/payments${toQueryString(params)}`);
};

export const getMyPayments = async (params = {}) => {
  return await request(`/payments/my${toQueryString(params)}`);
};

export const getPaymentById = async (id) => {
  return await request(`/payments/${id}`);
};

export const recordPayment = async (data) => {
  return await request('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const verifyPayment = async (id) => {
  return await request(`/payments/${id}/verify`, {
    method: 'PATCH',
  });
};

export const failPayment = async (id, data = {}) => {
  return await request(`/payments/${id}/fail`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const getInvoiceSummary = async (invoiceId) => {
  return await request(`/payments/invoice/${invoiceId}/summary`);
};

export const getAnalyticsSummary = async (params = {}) => {
  return await request(`/payments/analytics/summary${toQueryString(params)}`);
};

// Dev helper — invoice dropdown
export const getDevInvoices = async () => {
  return await request('/payments/dev/invoices');
};

// ── Receipts ──────────────────────────────────────────────────────────────────

export const getReceiptById = async (id) => {
  return await request(`/receipts/${id}`);
};

export const getReceiptByPaymentId = async (paymentId) => {
  return await request(`/receipts/payment/${paymentId}`);
};

export const getPrintableReceipt = async (id) => {
  return await request(`/receipts/${id}/print`);
};

// ── Refunds ───────────────────────────────────────────────────────────────────

export const getRefunds = async (params = {}) => {
  return await request(`/refunds${toQueryString(params)}`);
};

export const getRefundById = async (id) => {
  return await request(`/refunds/${id}`);
};

export const createRefund = async (data) => {
  return await request('/refunds', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// ── Reconciliation ────────────────────────────────────────────────────────────

export const getReconciliationSummary = async () => {
  return await request('/reconciliation/summary');
};

export const getBankTransactions = async (params = {}) => {
  return await request(`/reconciliation/transactions${toQueryString(params)}`);
};

export const getUnmatchedTransactions = async () => {
  return await request('/reconciliation/unmatched');
};

export const getMatches = async () => {
  return await request('/reconciliation/matches');
};

export const importBankTransactions = async (transactions) => {
  return await request('/reconciliation/import', {
    method: 'POST',
    body: JSON.stringify({ transactions }),
  });
};

export const runAutoMatch = async () => {
  return await request('/reconciliation/auto-match', {
    method: 'POST',
  });
};

export const manualMatch = async (data) => {
  return await request('/reconciliation/manual-match', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
