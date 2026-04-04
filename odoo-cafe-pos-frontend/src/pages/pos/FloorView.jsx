import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Table2 } from "lucide-react";
import { useFloors } from "../../hooks/useFloors";
import { orderAPI } from "../../api/order.api";
import { useSessionStore } from "../../store/useSessionStore";
import { useCartStore } from "../../store/useCartStore";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import toast from "react-hot-toast";

const STATUS_VARIANT = { FREE: "free", OCCUPIED: "occupied", BILL_READY: "ready" };
const STATUS_LABEL = { FREE: "Free", OCCUPIED: "Occupied", BILL_READY: "Bill Ready" };

export default function FloorView() {
  const navigate = useNavigate();
  const { sessionId } = useSessionStore();
  const { clearCart } = useCartStore();
  const { data: floors = [], isLoading } = useFloors();
  const [activeFloor, setActiveFloor] = useState(null);
  const [creating, setCreating] = useState(null);

  const currentFloor = activeFloor
    ? floors.find((f) => f.id === activeFloor)
    : floors[0];

  const handleTableClick = async (table) => {
    if (table.status === "OCCUPIED") {
      navigate(`/pos/order/${table.id}`);
      return;
    }
    if (table.status !== "FREE") {
      toast.error("Table is not available");
      return;
    }
    setCreating(table.id);
    try {
      await orderAPI.create({ table_id: table.id, session_id: sessionId });
      clearCart();
      navigate(`/pos/order/${table.id}`);
    } catch {
      toast.error("Failed to open table");
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Floor View</h1>
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400" /> Free</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Occupied</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Bill Ready</span>
        </div>
      </div>

      {/* Floor Tabs */}
      {!isLoading && (
        <div className="flex gap-2 px-6 py-3 bg-white border-b border-gray-100 overflow-x-auto">
          {floors.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFloor(f.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                currentFloor?.id === f.id
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Table Grid */}
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : !currentFloor?.tables?.length ? (
          <EmptyState icon={Table2} title="No tables on this floor" description="Add tables from the Floor Plan settings" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {currentFloor.tables.filter((t) => t.is_active).map((table) => (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                disabled={creating === table.id}
                className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all hover:shadow-md active:scale-95 ${
                  table.status === "FREE"
                    ? "border-green-300 bg-green-50 hover:border-green-400"
                    : table.status === "OCCUPIED"
                    ? "border-red-300 bg-red-50 hover:border-red-400"
                    : "border-blue-300 bg-blue-50 hover:border-blue-400"
                }`}
              >
                {creating === table.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-2xl">
                    <Spinner size="sm" />
                  </div>
                )}
                <span className="text-2xl font-extrabold text-gray-800">T{table.table_number}</span>
                <span className="text-xs text-gray-500">{table.seats} seats</span>
                <Badge label={STATUS_LABEL[table.status]} variant={STATUS_VARIANT[table.status]} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
