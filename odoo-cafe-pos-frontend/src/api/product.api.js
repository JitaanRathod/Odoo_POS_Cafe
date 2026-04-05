import api from "./axios";

export const productAPI = {
  list: (params) => api.get("/products", { params }),
};
