import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSessionStore = create(
  persist(
    (set) => ({
      sessionId: null,
      cashier: null,
      token: null,
      isOpen: false,

      openSession: ({ sessionId, cashier, token }) =>
        set({ sessionId, cashier, token, isOpen: true }),

      closeSession: () =>
        set({ sessionId: null, cashier: null, isOpen: false }),

      setToken: (token) => set({ token }),

      clearSession: () =>
        set({ sessionId: null, cashier: null, token: null, isOpen: false }),
    }),
    {
      name: "pos-session",
      partialize: (state) => ({
        token: state.token,
        cashier: state.cashier,
      }),
    }
  )
);
