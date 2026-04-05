import api from "./axios";

export const reportAPI = {
  dashboard: (branchId) => api.get("/reports/dashboard", { params: { branchId } }),
  sales: (params) => api.get("/reports/sales", { params }),
  session: (sessionId) => api.get(`/reports/session/${sessionId}`),
};
