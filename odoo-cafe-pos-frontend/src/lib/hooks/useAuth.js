import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../api/auth.api";
import { useSessionStore } from "../store/useSessionStore";

export const useAuth = () => {
  const navigate = useNavigate();
  const { token, cashier, openSession, clearSession } = useSessionStore();

  const isAuthenticated = !!token;

  const login = useCallback(
    async ({ email, password }) => {
      const res = await authAPI.login({ email, password });
      openSession({
        token: res.token,
        cashier: res.user.name,
        sessionId: res.user.id,
      });
      toast.success(`Welcome, ${res.user.name}!`);
      navigate("/backend/dashboard");
    },
    [openSession, navigate]
  );

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore — clear locally regardless
    } finally {
      clearSession();
      toast.success("Logged out");
      navigate("/auth/login");
    }
  }, [clearSession, navigate]);

  return { isAuthenticated, cashier, login, logout };
};