import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BarChart3, DollarSign, ShoppingCart, TrendingUp, Coffee, LogOut, Monitor, ChefHat, Users, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { reportAPI } from "../../api/report.api";
import { useSessionStore } from "../../store/useSessionStore";
import { socket } from "../../lib/socket";
import Card from "../../components/UI/Card";
import Spinner from "../../components/UI/Spinner";
import Badge from "../../components/UI/Badge";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, clearSession } = useSessionStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const r = await reportAPI.dashboard();
      setStats(r.dashboard || r);
      setLastUpdated(new Date());
    } catch {
      if (!silent) toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Socket: re-fetch whenever a payment is completed
  useEffect(() => {
    const handlePaymentDone = () => fetchStats(true);
    socket.on("payment:completed", handlePaymentDone);
    socket.on("order:paid", handlePaymentDone);
    return () => {
      socket.off("payment:completed", handlePaymentDone);
      socket.off("order:paid", handlePaymentDone);
    };
  }, [fetchStats]);

  // Polling: refresh every 30 seconds as a safety net
  useEffect(() => {
    const interval = setInterval(() => fetchStats(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const metrics = stats ? [
    { label: "Today's Revenue", value: `₹${Number(stats.todayRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
    { label: "Total Orders", value: stats.todayOrders || 0, icon: ShoppingCart, color: "text-brand-600 bg-brand-50" },
    { label: "Avg. Order Value", value: `₹${Number(stats.averageOrderValue || 0).toFixed(0)}`, icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
    { label: "Active Sessions", value: stats.activeSessions || 0, icon: Monitor, color: "text-purple-600 bg-purple-50" },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center"><Coffee size={16} className="text-white" /></div>
          <span className="font-bold text-gray-900">Dashboard</span>
          {/* Live indicator */}
          <span className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Manual refresh */}
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            title={lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : "Refresh"}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>
          <Link to="/pos/select-terminal" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors">
            <Monitor size={14} /> Open POS
          </Link>
          <Link to="/kitchen" className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-gray-600 font-medium">
            <ChefHat size={14} /> Kitchen
          </Link>
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button onClick={() => { clearSession(); navigate("/login"); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><LogOut size={16} /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fadeIn">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <Card key={m.label} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{m.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{m.value}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${m.color}`}>
                    <m.icon size={20} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Top Products & Payment Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-brand-500" /> Top Products</h3>
              {stats?.topProducts?.length > 0 ? (
                <div className="space-y-3">
                  {stats.topProducts.slice(0, 8).map((p, i) => (
                    <div key={p.name || i} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{p.name || p.productName}</p>
                        <p className="text-xs text-gray-400">{p.count || p._count} orders</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">₹{Number(p.revenue || p.totalRevenue || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">No data yet</p>}
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-brand-500" /> Payment Methods</h3>
              {stats?.paymentBreakdown?.length > 0 ? (
                <div className="space-y-3">
                  {stats.paymentBreakdown.map((p) => (
                    <div key={p.method} className="flex items-center gap-3">
                      <Badge color={p.method === "CASH" ? "green" : p.method === "UPI" ? "purple" : "blue"}>{p.method}</Badge>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-brand-400 rounded-full h-2 transition-all" style={{ width: `${Math.min(100, (p.count / (stats.todayOrders || 1)) * 100)}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">{p.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">No data yet</p>}
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Users size={16} className="text-brand-500" /> Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link to="/pos/select-terminal" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-brand-50 hover:bg-brand-100 transition-colors">
                <Monitor size={20} className="text-brand-600" />
                <span className="text-xs font-semibold text-brand-700">Open POS</span>
              </Link>
              <Link to="/kitchen" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors">
                <ChefHat size={20} className="text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">Kitchen</span>
              </Link>
              <Link to="/pos/floor" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors">
                <ShoppingCart size={20} className="text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">New Order</span>
              </Link>
              <Link to="/" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <Coffee size={20} className="text-gray-600" />
                <span className="text-xs font-semibold text-gray-700">Home</span>
              </Link>
            </div>
          </Card>

          {lastUpdated && (
            <p className="text-center text-xs text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 30s
            </p>
          )}
        </div>
      )}
    </div>
  );
}