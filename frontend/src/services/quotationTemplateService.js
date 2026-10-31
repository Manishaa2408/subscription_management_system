import apiClient from "./apiClient";

export const quotationTemplateService = {
  // Quotation Templates CRUD
  getTemplates: async (params = {}) => {
    const response = await apiClient.get("/quotation-templates", { params });
    return response.data;
  },

  getTemplateById: async (id) => {
    const response = await apiClient.get(`/quotation-templates/${id}`);
    return response.data;
  },

  createTemplate: async (data) => {
    const response = await apiClient.post("/quotation-templates", data);
    return response.data;
  },

  updateTemplate: async (id, data) => {
    const response = await apiClient.put(`/quotation-templates/${id}`, data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/quotation-templates/${id}/status`, { status });
    return response.data;
  },

  deleteTemplate: async (id) => {
    const response = await apiClient.delete(`/quotation-templates/${id}`);
    return response.data;
  },

  getPreview: async (id) => {
    const response = await apiClient.get(`/quotation-templates/${id}/preview`);
    return response.data;
  },

  // Dynamic Catalog via Adapters
  getCatalogProducts: async () => {
    const response = await apiClient.get("/quotation-templates/catalog/products");
    return response.data.data.products;
  },

  getCatalogPlans: async () => {
    const response = await apiClient.get("/quotation-templates/catalog/plans");
    return response.data.data.plans;
  }
};

export default quotationTemplateService;
