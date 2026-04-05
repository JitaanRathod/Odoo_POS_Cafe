import api from "./axios";

export const sessionAPI = {
  open: (data) => api.post("/sessions/open", data),
  close: (id, data) => api.post(`/sessions/${id}/close`, data),
  getActive: () => api.get("/sessions/active"),
  getCurrent: (terminalId) => api.get(`/sessions/current?terminalId=${terminalId}`),
  getHistory: (params) => api.get("/sessions/history", { params }),
  getById: (id) => api.get(`/sessions/${id}`),
};
