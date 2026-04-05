import { useState, useEffect, useCallback } from "react";
import { ChefHat, Clock, CheckCircle, Coffee, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { orderAPI } from "../../api/order.api";
import { socket } from "../../lib/socket";
import Badge from "../../components/UI/Badge";
import Spinner from "../../components/UI/Spinner";
import Button from "../../components/UI/Button";

const STATUS_COLOR = {
  CREATED: "orange",
  IN_PROGRESS: "blue",
  READY: "green",
};

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const res = await orderAPI.kitchenOrders();
      setOrders(res.orders || []);
    } catch {
      toast.error("Failed to load kitchen orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Socket real-time
  useEffect(() => {
    const handler = () => loadOrders();
    socket.on("order:new", handler);
    socket.on("order:updated", handler);
    socket.on("kitchen:new-order", handler);
    return () => {
      socket.off("order:new", handler);
      socket.off("order:updated", handler);
      socket.off("kitchen:new-order", handler);
    };
  }, [loadOrders]);

  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      toast.success(`Order marked as ${newStatus}`);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  };

  const activeOrders = orders.filter((o) => ["CREATED", "IN_PROGRESS", "READY"].includes(o.status));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
            <ChefHat size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Kitchen Display</h1>
            <p className="text-xs text-gray-400">{activeOrders.length} active order{activeOrders.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={loadOrders} className="text-gray-300 hover:text-white">
            <RefreshCw size={16} /> Refresh
          </Button>
          <a href="/" className="text-sm text-gray-400 hover:text-white flex items-center gap-1"><Coffee size={14} /> Back to POS</a>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500">
          <ChefHat size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">No active orders</p>
          <p className="text-sm text-gray-600 mt-1">Waiting for new orders...</p>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeOrders.map((order) => (
            <div key={order.id} className={`bg-gray-800 rounded-2xl border overflow-hidden transition-all animate-fadeIn ${
              order.status === "CREATED" ? "border-amber-500/50" : order.status === "IN_PROGRESS" ? "border-blue-500/50" : "border-emerald-500/50"
            }`}>
              {/* Order Header */}
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">#{order.id?.slice(0, 6).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{order.orderType}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={STATUS_COLOR[order.status]}>{order.status}</Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={11} />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="px-4 py-3 space-y-2">
                {order.orderItems?.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-400 w-6">{item.quantity}×</span>
                    <span className="text-sm text-gray-200 flex-1">{item.productName}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="px-4 py-3 border-t border-gray-700 flex gap-2">
                {order.status === "CREATED" && (
                  <button onClick={() => handleStatusChange(order.id, "IN_PROGRESS")}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1">
                    <Clock size={12} /> Start Preparing
                  </button>
                )}
                {order.status === "IN_PROGRESS" && (
                  <button onClick={() => handleStatusChange(order.id, "READY")}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1">
                    <CheckCircle size={12} /> Mark Ready
                  </button>
                )}
                {order.status === "READY" && (
                  <button onClick={() => handleStatusChange(order.id, "COMPLETED")}
                    className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1">
                    <CheckCircle size={12} /> Served
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
