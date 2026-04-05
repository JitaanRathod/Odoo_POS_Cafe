import api from "./axios";

export const paymentSettingsAPI = {
  get: (terminalId) => api.get(`/payment-settings/${terminalId}`),
  update: (terminalId, data) => api.put(`/payment-settings/${terminalId}`, data),
};
