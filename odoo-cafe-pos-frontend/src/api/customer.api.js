import api from "./axios";

export const customerAPI = {
  list: (params) => api.get("/customers", { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post("/customers", data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  remove: (id) => api.delete(`/customers/${id}`),
  top: (limit) => api.get("/customers/top", { params: { limit } }),
};
