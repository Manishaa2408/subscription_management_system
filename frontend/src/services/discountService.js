import apiClient from "./apiClient";

export const discountService = {
  // --- DISCOUNT ENDPOINTS ---
  getDiscounts: async (params = {}) => {
    const res = await apiClient.get("/discounts", { params });
    return res.data;
  },

  getDiscountById: async (id) => {
    const res = await apiClient.get(`/discounts/${id}`);
    return res.data;
  },

  createDiscount: async (payload) => {
    const res = await apiClient.post("/discounts", payload);
    return res.data;
  },

  updateDiscount: async (id, payload) => {
    const res = await apiClient.put(`/discounts/${id}`, payload);
    return res.data;
  },

  updateDiscountStatus: async (id, status) => {
    const res = await apiClient.patch(`/discounts/${id}/status`, { status });
    return res.data;
  },

  archiveDiscount: async (id) => {
    const res = await apiClient.patch(`/discounts/${id}/archive`);
    return res.data;
  },

  getMetrics: async () => {
    const res = await apiClient.get("/discounts/dashboard/metrics");
    return res.data;
  },

  getCatalogData: async () => {
    const res = await apiClient.get("/discounts/catalog");
    return res.data;
  },

  getEligibleDiscounts: async () => {
    const res = await apiClient.get("/discounts/eligible");
    return res.data;
  },

  // --- VALIDATION & CALCULATION ---
  validateDiscount: async (payload) => {
    const res = await apiClient.post("/discounts/validate", payload);
    return res.data;
  },

  calculateDiscount: async (payload) => {
    const res = await apiClient.post("/discounts/calculate", payload);
    return res.data;
  },

  reserveDiscountUsage: async (payload) => {
    const res = await apiClient.post("/discounts/reserve", payload);
    return res.data;
  },

  confirmRedemption: async (id, payload = {}) => {
    const res = await apiClient.post(`/discounts/${id}/redeem`, payload);
    return res.data;
  },

  releaseReservation: async (id, reason) => {
    const res = await apiClient.post(`/discounts/${id}/release`, { reason });
    return res.data;
  },

  getDiscountUsage: async (id, params = {}) => {
    const res = await apiClient.get(`/discounts/${id}/usage`, { params });
    return res.data;
  },

  getDiscountActivity: async (id) => {
    const res = await apiClient.get(`/discounts/${id}/activity`);
    return res.data;
  },

  // --- CAMPAIGN ENDPOINTS ---
  getCampaigns: async (params = {}) => {
    const res = await apiClient.get("/discount-campaigns", { params });
    return res.data;
  },

  getCampaignById: async (id) => {
    const res = await apiClient.get(`/discount-campaigns/${id}`);
    return res.data;
  },

  createCampaign: async (payload) => {
    const res = await apiClient.post("/discount-campaigns", payload);
    return res.data;
  },

  updateCampaign: async (id, payload) => {
    const res = await apiClient.put(`/discount-campaigns/${id}`, payload);
    return res.data;
  },

  updateCampaignStatus: async (id, status) => {
    const res = await apiClient.patch(`/discount-campaigns/${id}/status`, { status });
    return res.data;
  },

  archiveCampaign: async (id) => {
    const res = await apiClient.patch(`/discount-campaigns/${id}/archive`);
    return res.data;
  }
};

export default discountService;
