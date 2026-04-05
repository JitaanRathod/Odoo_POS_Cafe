import axios from "axios";
import { useSessionStore } from "../store/useSessionStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT
api.interceptors.request.use(
  (config) => {
    const token = useSessionStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useSessionStore.getState().clearSession();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;