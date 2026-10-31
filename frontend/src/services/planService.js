// frontend/src/services/planService.js
import api from '../api/axiosClient';

export const planService = {
  // Admin & Staff endpoints
  createPlan: (data) => api.post('/plans', data),
  listPlans: (params) => api.get('/plans', { params }),
  getPlan: (id) => api.get(`/plans/${id}`),
  updatePlan: (id, data) => api.put(`/plans/${id}`, data),
  changePlanStatus: (id, status) => api.patch(`/plans/${id}/status`, { status }),
  archivePlan: (id) => api.patch(`/plans/${id}/archive`),
  getPlanActivity: (id) => api.get(`/plans/${id}/activity`),

  // Customer-facing catalog
  getCatalog: (params) => api.get('/plans/catalog', { params }),
  getPlansByProduct: (productId) => api.get(`/plans/product/${productId}`)
};

export default planService;
