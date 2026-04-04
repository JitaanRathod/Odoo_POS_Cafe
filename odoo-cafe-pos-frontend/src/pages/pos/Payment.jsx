import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Wallet, CreditCard, Smartphone, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { paymentAPI } from "../../api/payment.api";
import { orderAPI } from "../../api/order.api";
import { useCartStore } from "../../store/useCartStore";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";

const METHOD_META = {
  CASH: { label: "Cash", icon: Wallet, desc: "Collect cash from customer" },
  DIGITAL: { label: "Digital / Card", icon: CreditCard, desc: "Swipe card or tap to pay" },
  UPI: { label: "UPI QR", icon: Smartphone, desc: "Scan QR code to pay" },
};

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getTotal, clearCart } = useCartStore();
  const [methods, setMethods] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const tax = getTotal() * 0.05;
  const total = getTotal() + tax;

  useEffect(() => {
    paymentAPI.getMethods().then((data) => {
      setMethods(data.filter((m) => m.is_enabled));
    }).finally(() => setLoading(false));
  }, []);

  const handlePay = async () => {
    if (!selected) return toast.error("Select a payment method");
    if (selected === "UPI") {
      navigate(`/pos/upi/${orderId}`);
      return;
    }
    setPaying(true);
    try {
      await paymentAPI.record({ order_id: orderId, method: selected, amount: total });
      await orderAPI.updateStatus(orderId, "PAID");
      clearCart();
      navigate("/pos/success");
    } catch {
      toast.error("Payment failed. Try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-orange-500 px-6 py-5 text-white">
          <p className="text-sm opacity-80">Order #{orderId?.slice(0, 8).toUpperCase()}</p>
          <p className="text-3xl font-extrabold mt-1">₹{total.toFixed(2)}</p>
          <p className="text-sm opacity-70 mt-0.5">incl. 5% tax</p>
        </div>

        <div className="p-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Select Payment Method</p>

          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="flex flex-col gap-3">
              {methods.map((method) => {
                const meta = METHOD_META[method.type];
                const Icon = meta?.icon;
                const isSelected = selected === method.type;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelected(method.type)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${isSelected ? "bg-orange-100" : "bg-gray-100"}`}>
                      {Icon && <Icon size={20} className={isSelected ? "text-orange-600" : "text-gray-500"} />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-semibold text-sm ${isSelected ? "text-orange-700" : "text-gray-800"}`}>{meta?.label}</p>
                      <p className="text-xs text-gray-500">{meta?.desc}</p>
                    </div>
                    {isSelected && <CheckCircle size={18} className="text-orange-500" />}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">Back</Button>
            <Button onClick={handlePay} loading={paying} disabled={!selected} className="flex-1">
              {selected === "UPI" ? "Generate QR" : "Confirm Payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}