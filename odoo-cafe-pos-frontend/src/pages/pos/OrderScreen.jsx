import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, SendHorizonal, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { useProducts } from "../../hooks/useProducts";
import { useCartStore } from "../../store/useCartStore";
import { useSessionStore } from "../../store/useSessionStore";
import { orderAPI } from "../../api/order.api";
import { socket } from "../../lib/socket";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";

const CATEGORIES = ["All", "Pizza", "Pasta", "Burger", "Drinks", "Desserts", "Snacks"];

export default function OrderScreen() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const { items, addItem, removeItem, updateQty, clearCart, getTotal } = useCartStore();
  const { sessionId } = useSessionStore();
  const [category, setCategory] = useState("All");
  const [sending, setSending] = useState(false);

  const filtered = category === "All" ? products : products.filter((p) => p.category === category);

  const handleSendToKitchen = async () => {
    if (!items.length) return toast.error("Cart is empty");
    setSending(true);
    try {
      const order = await orderAPI.sendToKitchen({ table_id: tableId, session_id: sessionId, items });
      socket.emit("order:sent", order);
      toast.success("Order sent to kitchen!");
    } catch {
      toast.error("Failed to send to kitchen");
    } finally {
      setSending(false);
    }
  };

  const handlePay = async () => {
    if (!items.length) return toast.error("Cart is empty");
    try {
      const order = await orderAPI.getByTable(tableId);
      navigate(`/pos/payment/${order.id}`);
    } catch {
      toast.error("Could not proceed to payment");
    }
  };

  const tax = getTotal() * 0.05;
  const grandTotal = getTotal() + tax;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      {/* LEFT: Products */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <h1 className="font-bold text-gray-800">Table {tableId?.slice(0, 6).toUpperCase()}</h1>
          <button onClick={() => navigate("/pos/floor")} className="text-sm text-orange-500 hover:underline">
            ← Back to Floor
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-5 py-3 overflow-x-auto bg-white border-b border-gray-100">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addItem(product)}
                  className="flex flex-col gap-1.5 p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-400 hover:shadow-sm active:scale-95 transition-all text-left"
                >
                  <div className="w-full h-20 bg-orange-50 rounded-lg flex items-center justify-center text-3xl">🍽️</div>
                  <span className="text-sm font-semibold text-gray-800 leading-tight">{product.name}</span>
                  <span className="text-xs text-gray-500">{product.category}</span>
                  <span className="text-sm font-bold text-orange-600">₹{product.price}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart Panel */}
      <div className="w-full lg:w-80 xl:w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Current Order</h2>
          <p className="text-xs text-gray-500">{items.length} item(s)</p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3">
          {!items.length ? (
            <p className="text-center text-sm text-gray-400 py-10">No items yet. Tap a product to add.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">₹{item.price} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, item.qty - 1)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Minus size={13} />
                  </button>
                  <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Plus size={13} />
                  </button>
                </div>
                <span className="text-sm font-semibold text-gray-800 w-16 text-right">₹{item.price * item.qty}</span>
                <button onClick={() => removeItem(item.id)} className="p-1 text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>₹{getTotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200">
            <span>Total</span><span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <Button variant="secondary" onClick={handleSendToKitchen} loading={sending} className="flex-1">
            <SendHorizonal size={15} /> Kitchen
          </Button>
          <Button onClick={handlePay} className="flex-1">
            <CreditCard size={15} /> Pay
          </Button>
        </div>
      </div>
    </div>
  );
}
