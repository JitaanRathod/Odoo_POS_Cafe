import api from "./axios";

export const terminalAPI = {
  getAll: () => api.get("/terminals"),
  getById: (id) => api.get(`/terminals/${id}`),
  create: (data) => api.post("/terminals", data),
  update: (id, data) => api.put(`/terminals/${id}`, data),
  remove: (id) => api.delete(`/terminals/${id}`),
};
