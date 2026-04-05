import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Coffee, ShoppingBag, LogOut, BarChart3, RefreshCw,
  Users, Clock, ChefHat, CheckCircle2, Circle,
} from "lucide-react";
import toast from "react-hot-toast";
import { floorAPI } from "../../api/floor.api";
import { useSessionStore } from "../../store/useSessionStore";
import { socket } from "../../lib/socket";
import Spinner from "../../components/UI/Spinner";

// ── Status config ────────────────────────────────────────────────
const STATUS_CFG = {
  FREE: {
    label: "Free",
    dot: "bg-emerald-500",
    card: "bg-white border-gray-200 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-50 cursor-pointer",
    badge: "bg-emerald-50 text-emerald-700",
    icon: Circle,
  },
  OCCUPIED: {
    label: "Occupied",
    dot: "bg-red-500",
    card: "bg-red-50 border-red-200 hover:border-red-400 hover:shadow-md hover:shadow-red-50 cursor-pointer",
    badge: "bg-red-100 text-red-700",
    icon: CheckCircle2,
  },
  RESERVED: {
    label: "Reserved",
    dot: "bg-purple-500",
    card: "bg-purple-50 border-purple-200 hover:border-purple-400 hover:shadow-md hover:shadow-purple-50 cursor-pointer",
    badge: "bg-purple-100 text-purple-700",
    icon: Clock,
  },
};

// ── Small sub-components ─────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.FREE;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function TableCard({ table, onClick }) {
  const cfg = STATUS_CFG[table.status] || STATUS_CFG.FREE;
  const order = table.activeOrder;

  return (
    <button
      onClick={() => onClick(table)}
      className={`relative flex flex-col p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.97] ${cfg.card}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-base font-bold text-gray-900">T{table.tableNumber}</span>
        <StatusBadge status={table.status} />
      </div>

      {/* Seats */}
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Users size={12} />
        <span>{table.seats} seats</span>
      </div>

      {/* Active order info */}
      {order ? (
        <div className="border-t border-current border-opacity-10 pt-2 space-y-1">
          <p className="text-xs font-semibold text-gray-700">
            {order.orderItems?.length} item{order.orderItems?.length !== 1 ? "s" : ""}
            &nbsp;·&nbsp;
            <span className="text-red-600">₹{Number(order.totalAmount).toFixed(0)}</span>
          </p>
          <p className="text-[10px] text-gray-400">
            {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      ) : table.status === "FREE" ? (
        <p className="text-[10px] text-gray-400 italic">Tap to start order</p>
      ) : null}
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function FloorView() {
  const navigate = useNavigate();
  const { user, clearSession, terminalId, branchId } = useSessionStore();
  const isManager = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFloor, setActiveFloor] = useState(null);

  // ── Fetch floor data ─────────────────────────────────────────
  const loadFloors = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await floorAPI.getFloors(branchId || undefined);
      const data = res.floors || [];
      setFloors(data);
      setActiveFloor((prev) => {
        if (prev === null && data.length > 0) return data[0].id;
        return prev;
      });
    } catch {
      if (!silent) toast.error("Failed to load floor plan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => { loadFloors(); }, [loadFloors]);

  // ── Socket: live table updates ───────────────────────────────
  useEffect(() => {
    const handleTableChange = ({ tableId, status }) => {
      setFloors((prev) =>
        prev.map((floor) => ({
          ...floor,
          tables: floor.tables.map((t) =>
            t.id === tableId
              ? { ...t, status, activeOrder: status === "FREE" ? null : t.activeOrder }
              : t
          ),
        }))
      );
    };
    socket.on("table:statusChange", handleTableChange);
    return () => socket.off("table:statusChange", handleTableChange);
  }, []);

  // ── Handle click on a table card ────────────────────────────
  const handleTableClick = (table) => {
    if (table.status === "OCCUPIED" && table.activeOrder) {
      // Navigate to the existing order's payment screen or order screen
      navigate(`/pos/order/${table.id}`);
    } else {
      navigate(`/pos/order/${table.id}`);
    }
  };

  // ── Stats for active floor ───────────────────────────────────
  const currentFloor = floors.find((f) => f.id === activeFloor);
  const tables = currentFloor?.tables || [];
  const counts = {
    FREE: tables.filter((t) => t.status === "FREE").length,
    OCCUPIED: tables.filter((t) => t.status === "OCCUPIED").length,
    RESERVED: tables.filter((t) => t.status === "RESERVED").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
            <Coffee size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Floor Plan</p>
            <p className="text-xs text-gray-500">{user?.name} · {user?.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Refresh */}
          <button
            onClick={() => loadFloors(true)}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>

          {/* Takeaway shortcut */}
          <button
            onClick={() => navigate("/pos/order/takeaway")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors"
          >
            <ShoppingBag size={13} /> Takeaway
          </button>

          {/* Kitchen */}
          <button
            onClick={() => navigate("/kitchen")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 text-xs text-gray-600 font-medium transition-colors"
          >
            <ChefHat size={13} /> Kitchen
          </button>

          {/* Dashboard — only for ADMIN / MANAGER */}
          {isManager && (
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 text-xs text-gray-600 font-medium transition-colors"
            >
              <BarChart3 size={13} /> Dashboard
            </button>
          )}

          <button
            onClick={() => { clearSession(); navigate("/login"); }}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-5 max-w-6xl mx-auto w-full animate-fadeIn">

          {/* ── Status Legend + Counts ── */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {Object.entries(STATUS_CFG).map(([status, cfg]) => (
              <div key={status} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-xs font-semibold text-gray-700">{cfg.label}</span>
                <span className="text-xs text-gray-400 font-mono">{counts[status]}</span>
              </div>
            ))}
            <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live
            </span>
          </div>

          {/* ── Floor Tabs ── */}
          {floors.length > 1 && (
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() => setActiveFloor(floor.id)}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    activeFloor === floor.id
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-brand-300"
                  }`}
                >
                  {floor.name}
                  <span className="ml-2 text-[10px] opacity-70">
                    {floor.tables.filter((t) => t.status === "FREE").length} free
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ── Table Grid ── */}
          {floors.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-20">
              <Coffee size={48} className="mb-4 opacity-20" />
              <p className="font-semibold text-lg">No floor plan found</p>
              <p className="text-sm mt-1">Run the seed script to set up floors and tables.</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm">No tables on this floor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {tables.map((table) => (
                <TableCard key={table.id} table={table} onClick={handleTableClick} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
