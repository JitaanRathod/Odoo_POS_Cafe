import api from "./axios";

export const orderAPI = {
  create: (data) => api.post("/orders", data),
  list: (params) => api.get("/orders", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getByTable: (tableId) => api.get(`/orders/table/${tableId}`),
  addItems: (id, data) => api.post(`/orders/${id}/items`, data),
  removeItem: (orderId, itemId) => api.delete(`/orders/${orderId}/items/${itemId}`),
  sendToKitchen: (id) => api.post(`/orders/${id}/send-to-kitchen`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  kitchenOrders: (branchId) => api.get("/orders/kitchen", { params: { branchId } }),
};
