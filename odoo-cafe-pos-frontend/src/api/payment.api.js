import api from "./axios";

export const paymentAPI = {
  process: (data) => api.post("/payments/process", data),
  list: (params) => api.get("/payments", { params }),
  getReceipt: (orderId) => api.get(`/payments/receipt/${orderId}`),
};
