import { Navigate } from "react-router-dom";
import { useSessionStore } from "../../store/useSessionStore";

/**
 * RoleGuard — wraps a route and redirects if the user's role is not in the allowed list.
 * @param {string[]} roles - allowed roles e.g. ['ADMIN', 'MANAGER']
 * @param {string} redirectTo - where to redirect on failure (default: /pos/floor)
 */
export default function RoleGuard({ roles, children, redirectTo = "/pos/floor" }) {
  const user = useSessionStore((s) => s.user);
  if (!user || !roles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}
