import { create } from "zustand";

export const useDisplayStore = create((set) => ({
  order: null,
  paymentStatus: null, // null | "PENDING" | "PAID"

  updateOrder: (order) =>
    set({
      order,
      paymentStatus: order?.status === "PAID" ? "PAID" : "PENDING",
    }),

  setPaymentStatus: (status) => set({ paymentStatus: status }),

  clearDisplay: () => set({ order: null, paymentStatus: null }),
}));