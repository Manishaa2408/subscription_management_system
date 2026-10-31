import api from '../api/axiosClient';

export const authService = {
  // Auth endpoints
  register: (data) => api.post('/auth/register', data),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),

  // User Management endpoints (Admin only)
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createStaff: (data) => api.post('/users/staff', data),
  updateUserStatus: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),
  updateUserRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
};

export default authService;
