import { useEffect } from "react";
import { Tv2 } from "lucide-react";
import dayjs from "dayjs";
import { socket } from "../../lib/socket";
import { useDisplayStore } from "../../store/useDisplayStore";
import Badge from "../../components/ui/Badge";

export default function CustomerDisplay() {
  const { order, paymentStatus, updateOrder, setPaymentStatus } = useDisplayStore();

  useEffect(() => {
    socket.emit("join", "display");

    socket.on("display:update", (data) => {
      updateOrder(data);
    });

    socket.on("display:paid", () => {
      setPaymentStatus("PAID");
    });

    return () => {
      socket.off("display:update");
      socket.off("display:paid");
    };
  }, [updateOrder, setPaymentStatus]);

  const tax = (order?.subtotal ?? 0) * 0.05;
  const total = (order?.subtotal ?? 0) + tax;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Top Banner */}
      <div className="bg-orange-500 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tv2 size={28} />
          <div>
            <p className="text-xl font-extrabold">OdooPOS Cafe</p>
            <p className="text-sm opacity-80">Customer Order Display</p>
          </div>
        </div>
        <p className="text-sm opacity-80">{dayjs().format("hh:mm A · DD MMM YYYY")}</p>
      </div>

      {paymentStatus === "PAID" ? (
        /* Payment confirmed screen */
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-8xl animate-bounce">✅</div>
          <h2 className="text-4xl font-extrabold text-green-400">Payment Successful!</h2>
          <p className="text-gray-400 text-lg">Thank you for dining with us. See you again!</p>
        </div>
      ) : !order ? (
        /* Idle state */
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-500">
          <Tv2 size={64} />
          <p className="text-xl font-semibold">Waiting for order...</p>
        </div>
      ) : (
        /* Live order view */
        <div className="flex-1 flex flex-col lg:flex-row gap-0">
          {/* Items List */}
          <div className="flex-1 px-10 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Order</h2>
              <Badge label={order.status ?? "OPEN"} variant="info" />
            </div>

            <div className="flex flex-col gap-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div className="flex items-center gap-4">
                    <span className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-bold text-sm">
                      {item.qty}
                    </span>
                    <span className="text-lg font-medium">{item.name}</span>
                  </div>
                  <span className="text-lg font-semibold text-orange-400">
                    ₹{(item.price * item.qty).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Panel */}
          <div className="lg:w-72 bg-gray-800 px-8 py-8 flex flex-col justify-center gap-4">
            <h3 className="text-lg font-bold text-gray-300">Bill Summary</h3>
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span><span>₹{(order?.subtotal ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-extrabold text-white border-t border-gray-600 pt-4">
              <span>Total</span><span>₹{total.toFixed(2)}</span>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Awaiting payment...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}