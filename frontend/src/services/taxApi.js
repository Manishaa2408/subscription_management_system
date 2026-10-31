import { request } from './api';

export const taxApi = {
  // List tax configurations
  getTaxConfigurations: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.isActive !== undefined) query.append('isActive', params.isActive);
    if (params.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await request(`/tax-configurations${qs}`);
  },

  // Single tax configuration
  getTaxConfigurationById: async (id) => {
    return await request(`/tax-configurations/${id}`);
  },

  // Create tax configuration
  createTaxConfiguration: async (data) => {
    return await request('/tax-configurations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update tax configuration
  updateTaxConfiguration: async (id, data) => {
    return await request(`/tax-configurations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Toggle active/inactive
  toggleTaxStatus: async (id, isActive) => {
    return await request(`/tax-configurations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    });
  },

  // Preview tax calculation without persisting
  calculatePreview: async (payload) => {
    return await request('/tax-configurations/calculate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
