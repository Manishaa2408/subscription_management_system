import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

// Interceptor to attach development role header and mock headers dynamically
apiClient.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem("brightloop_current_user");
  let currentRole = localStorage.getItem("brightloop_dev_role") || "admin";
  let userId = "usr_admin_001";
  let userEmail = "admin@brightloop.com";

  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      currentRole = parsed.role || currentRole;
      userId = parsed.id || parsed._id || userId;
      userEmail = parsed.email || userEmail;
    } catch (e) {}
  }

  config.headers["x-dev-role"] = currentRole;
  config.headers["x-mock-role"] = currentRole;
  config.headers["x-mock-user-id"] = userId;
  config.headers["x-mock-user-email"] = userEmail;

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;
