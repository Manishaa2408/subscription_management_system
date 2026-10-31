import api from '../api/axiosClient';

export const customerService = {
  // Admin & Staff APIs
  getCustomers: (params) => api.get('/customers', { params }),
  getCustomerById: (id) => api.get(`/customers/${id}`),
  createCustomer: (data) => api.post('/customers', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  updateCustomerStatus: (id, status) => api.patch(`/customers/${id}/status`, { status }),
  getCustomerActivity: (id) => api.get(`/customers/${id}/activity`),
  getCustomerNotes: (id) => api.get(`/customers/${id}/notes`),
  addCustomerNote: (id, data) => api.post(`/customers/${id}/notes`, data),

  // Customer Address Management
  getAddresses: (customerId) => api.get(`/customers/${customerId}/addresses`),
  addAddress: (customerId, data) => api.post(`/customers/${customerId}/addresses`, data),
  updateAddress: (customerId, addressId, data) =>
    api.put(`/customers/${customerId}/addresses/${addressId}`, data),
  setDefaultAddress: (customerId, addressId) =>
    api.patch(`/customers/${customerId}/addresses/${addressId}/default`),
  deleteAddress: (customerId, addressId) =>
    api.delete(`/customers/${customerId}/addresses/${addressId}`),

  // Customer Portal APIs
  getPortalDashboard: () => api.get('/customer-portal/dashboard'),
  getPortalProfile: () => api.get('/customer-portal/profile'),
  updatePortalProfile: (data) => api.put('/customer-portal/profile', data),
  getPortalSubscriptions: () => api.get('/customer-portal/subscriptions'),
  getPortalQuotations: () => api.get('/customer-portal/quotations'),
  getPortalInvoices: () => api.get('/customer-portal/invoices'),
  getPortalPayments: () => api.get('/customer-portal/payments'),
  getPortalAddresses: () => api.get('/customer-portal/addresses')
};

export default customerService;
