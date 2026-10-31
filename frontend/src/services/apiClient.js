import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// Interceptor to attach development role header dynamically
apiClient.interceptors.request.use((config) => {
  const currentRole = localStorage.getItem("brightloop_dev_role") || "admin";
  config.headers["x-dev-role"] = currentRole;
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;
