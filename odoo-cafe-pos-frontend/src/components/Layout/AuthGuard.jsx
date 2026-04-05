import { Navigate } from "react-router-dom";
import { useSessionStore } from "../../store/useSessionStore";

export default function AuthGuard({ children }) {
  const token = useSessionStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
