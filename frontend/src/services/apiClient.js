import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach development persona and role headers dynamically
apiClient.interceptors.request.use(
  (config) => {
    const currentRole = localStorage.getItem('brightloop_dev_role') || 'admin';
    config.headers['x-dev-role'] = currentRole;
    config.headers['x-mock-role'] = currentRole;

    const savedUser = localStorage.getItem('brightloop_current_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.id) config.headers['x-mock-user-id'] = u.id;
        if (u.email) config.headers['x-mock-user-email'] = u.email;
      } catch (e) {}
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
