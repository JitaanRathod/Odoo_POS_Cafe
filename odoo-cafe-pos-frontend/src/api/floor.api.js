import api from "./axios";

export const floorAPI = {
  // GET /api/floors?branchId=  — returns floors + tables with status + active order
  getFloors: (branchId) => api.get("/floors", { params: { branchId } }),
};
