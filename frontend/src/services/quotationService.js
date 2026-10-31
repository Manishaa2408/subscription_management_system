import apiClient from "./apiClient";

export const quotationService = {
  getQuotations: async (params = {}) => {
    const response = await apiClient.get("/quotations", { params });
    return response.data;
  },

  getQuotationById: async (id) => {
    const response = await apiClient.get(`/quotations/${id}`);
    return response.data;
  },

  createQuotation: async (data) => {
    const response = await apiClient.post("/quotations", data);
    return response.data;
  },

  updateQuotation: async (id, data) => {
    const response = await apiClient.put(`/quotations/${id}`, data);
    return response.data;
  },

  sendQuotation: async (id) => {
    const response = await apiClient.post(`/quotations/${id}/send`);
    return response.data;
  },

  acceptQuotation: async (id) => {
    const response = await apiClient.post(`/quotations/${id}/accept`);
    return response.data;
  },

  rejectQuotation: async (id, reason) => {
    const response = await apiClient.post(`/quotations/${id}/reject`, { reason });
    return response.data;
  },

  cancelQuotation: async (id, reason) => {
    const response = await apiClient.post(`/quotations/${id}/cancel`, { reason });
    return response.data;
  },

  convertQuotation: async (id) => {
    const response = await apiClient.post(`/quotations/${id}/convert`);
    return response.data;
  },

  getQuotationActivity: async (id) => {
    const response = await apiClient.get(`/quotations/${id}/activity`);
    return response.data.data.activity;
  },

  getDashboardMetrics: async () => {
    const response = await apiClient.get("/quotations/dashboard/metrics");
    return response.data.data.metrics;
  },

  getCatalogCustomers: async () => {
    const response = await apiClient.get("/quotations/catalog/customers");
    return response.data.data.customers;
  },

  getCatalogDiscounts: async () => {
    const response = await apiClient.get("/quotations/catalog/discounts");
    return response.data.data.discounts;
  }
};

export default quotationService;
