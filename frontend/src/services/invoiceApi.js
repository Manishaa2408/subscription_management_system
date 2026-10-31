import { request } from './api';

export const invoiceApi = {
  // List invoices with query params
  getInvoices: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await request(`/invoices${queryString}`);
  },

  // Customer's own invoices
  getMyInvoices: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await request(`/invoices/my${queryString}`);
  },

  // Single invoice details
  getInvoiceById: async (id) => {
    return await request(`/invoices/${id}`);
  },

  // Create manual draft invoice
  createInvoice: async (data) => {
    return await request('/invoices', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update draft invoice
  updateInvoice: async (id, data) => {
    return await request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Issue draft invoice
  issueInvoice: async (id) => {
    return await request(`/invoices/${id}/issue`, {
      method: 'PATCH'
    });
  },

  // Cancel invoice
  cancelInvoice: async (id, reason) => {
    return await request(`/invoices/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  },

  // Tax breakdown
  getTaxBreakdown: async (id) => {
    return await request(`/invoices/${id}/tax-breakdown`);
  },

  // Printable representation
  getPrintData: async (id) => {
    return await request(`/invoices/${id}/print`);
  },

  // Customer dropdown helper list
  getCustomersList: async () => {
    return await request('/invoices/dev/customers');
  },

  // Record test payment (M11 sync demo)
  recordPayment: async (id, paymentData) => {
    return await request(`/invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  },

  // Analytics summary
  getAnalyticsSummary: async () => {
    return await request('/invoices/analytics/summary');
  }
};
