import { useEffect } from "react";
import { ChefHat } from "lucide-react";
import dayjs from "dayjs";
import { socket } from "../../lib/socket";
import { useKitchenStore } from "../../store/useKitchenStore";

const STAGES = [
  { key: "PENDING", label: "🔴 To Cook", bg: "bg-red-50", border: "border-red-200" },
  { key: "PREPARING", label: "🟡 Preparing", bg: "bg-yellow-50", border: "border-yellow-200" },
  { key: "DONE", label: "🟢 Completed", bg: "bg-green-50", border: "border-green-200" },
];

const NEXT_STAGE = { PENDING: "PREPARING", PREPARING: "DONE" };

export default function KitchenDisplay() {
  const { orders, addOrder, advanceStage, toggleItemDone } = useKitchenStore();

  useEffect(() => {
    socket.emit("join", "kitchen");

    socket.on("order:new", (order) => {
      addOrder(order);
    });

    return () => {
      socket.off("order:new");
    };
  }, [addOrder]);

  const handleAdvance = (orderId, currentStage) => {
    const next = NEXT_STAGE[currentStage];
    if (!next) return;
    advanceStage(orderId, next);
    socket.emit("order:stage", { orderId, stage: next });
  };

  const ordersByStage = (stage) =>
    orders.filter((o) => o.kitchen_status === stage);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-gray-800 border-b border-gray-700">
        <ChefHat size={24} className="text-orange-400" />
        <h1 className="text-lg font-bold">Kitchen Display</h1>
        <span className="ml-auto text-sm text-gray-400">{dayjs().format("hh:mm A · DD MMM")}</span>
      </div>

      {/* Kanban */}
      <div className="flex-1 grid grid-cols-3 gap-4 p-5 overflow-hidden">
        {STAGES.map(({ key, label, bg, border }) => (
          <div key={key} className="flex flex-col gap-3">
            {/* Column Header */}
            <div className={`text-center py-2 rounded-xl font-semibold text-sm ${bg} ${border} border text-gray-800`}>
              {label} ({ordersByStage(key).length})
            </div>

            {/* Ticket Cards */}
            <div className="flex flex-col gap-3 overflow-y-auto">
              {ordersByStage(key).length === 0 ? (
                <div className="text-center text-gray-600 text-sm py-8">No tickets</div>
              ) : (
                ordersByStage(key).map((order) => (
                  <div
                    key={order.id}
                    className={`bg-gray-800 border ${border} rounded-xl p-4 flex flex-col gap-3`}
                  >
                    {/* Ticket Header */}
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-orange-400">#{order.order_number}</span>
                      <span className="text-xs text-gray-400">
                        Table {order.table_number} · {dayjs(order.created_at).format("hh:mm A")}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="flex flex-col gap-1.5">
                      {order.items?.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => toggleItemDone(order.id, item.id)}
                          className={`flex items-center gap-2 text-sm px-2 py-1 rounded-lg transition-colors text-left ${
                            item.done
                              ? "text-gray-500 line-through bg-gray-700/50"
                              : "text-white hover:bg-gray-700"
                          }`}
                        >
                          <span className="w-5 h-5 rounded border border-gray-600 flex items-center justify-center text-xs">
                            {item.done ? "✓" : ""}
                          </span>
                          <span className="font-medium">{item.qty}x</span>
                          <span>{item.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Advance Button */}
                    {NEXT_STAGE[key] && (
                      <button
                        onClick={() => handleAdvance(order.id, key)}
                        className="w-full py-1.5 text-sm font-semibold bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                      >
                        {key === "PENDING" ? "Start Preparing →" : "Mark Complete ✓"}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
