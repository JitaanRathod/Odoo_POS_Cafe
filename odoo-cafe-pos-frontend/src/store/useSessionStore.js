import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSessionStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,        // { id, name, email, role }
      terminalId: null,
      sessionId: null,
      branchId: null,

      setAuth: ({ token, user }) => set({ token, user }),

      openPosSession: ({ sessionId, terminalId, branchId }) =>
        set({ sessionId, terminalId, branchId }),

      closePosSession: () => set({ sessionId: null }),

      clearSession: () =>
        set({ token: null, user: null, terminalId: null, sessionId: null, branchId: null }),
    }),
    {
      name: "pos-session",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        terminalId: state.terminalId,
        sessionId: state.sessionId,
        branchId: state.branchId,
      }),
    }
  )
);
