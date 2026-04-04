import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  ShoppingCart,
  CreditCard,
  Map,
  Monitor,
  BarChart2,
  CalendarDays,
  ChefHat,
  Tv2,
  LogOut,
} from "lucide-react";
import { useSessionStore } from "../../store/useSessionStore";

const navItems = [
  { label: "Dashboard", icon: BarChart2, to: "/backend/dashboard" },
  { label: "Products", icon: ShoppingCart, to: "/backend/products" },
  { label: "Payment Methods", icon: CreditCard, to: "/backend/payment-methods" },
  { label: "Floor Plan", icon: Map, to: "/backend/floors" },
  { label: "POS Terminal", icon: Monitor, to: "/backend/terminal" },
  { label: "Booking", icon: CalendarDays, to: "/backend/booking" },
  { label: "Kitchen Display", icon: ChefHat, to: "/kitchen" },
  { label: "Customer Display", icon: Tv2, to: "/display" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { cashier, clearSession } = useSessionStore();

  const handleLogout = () => {
    clearSession();
    navigate("/auth/login");
  };

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 text-white px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10 px-2">
        <LayoutGrid className="text-orange-400" size={28} />
        <span className="text-xl font-bold tracking-tight">OdooPOS Cafe</span>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="mt-6 border-t border-gray-700 pt-4">
        {cashier && (
          <p className="text-xs text-gray-500 px-2 mb-3">
            Logged in as <span className="text-white font-medium">{cashier}</span>
          </p>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}