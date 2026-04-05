import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Wallet, CreditCard, Smartphone, CheckCircle, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { paymentAPI } from "../../api/payment.api";
import { paymentSettingsAPI } from "../../api/payment-settings.api";
import { orderAPI } from "../../api/order.api";
import { useCartStore } from "../../store/useCartStore";
import { useSessionStore } from "../../store/useSessionStore";
import Button from "../../components/UI/Button";
import Spinner from "../../components/UI/Spinner";

const METHOD_META = {
  CASH: { label: "Cash", icon: Wallet, desc: "Collect cash from customer", key: "enableCash" },
  CARD: { label: "Card", icon: CreditCard, desc: "Swipe card or tap to pay", key: "enableCard" },
  UPI:  { label: "UPI QR Code", icon: Smartphone, desc: "Scan QR code with any UPI app", key: "enableUpi" },
};

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { clearCart, getTotal } = useCartStore();
  const { terminalId } = useSessionStore();

  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [orderRes, settingsRes] = await Promise.all([
          orderAPI.getById(orderId),
          paymentSettingsAPI.get(terminalId),
        ]);
        setOrder(orderRes.order || orderRes);
        setSettings(settingsRes.settings || settingsRes);
      } catch {
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, terminalId]);

  const total = order?.totalAmount || getTotal();
  const tax = order?.taxAmount || 0;

  const enabledMethods = Object.entries(METHOD_META).filter(
    ([key]) => settings && settings[METHOD_META[key].key]
  );

  const handlePay = async () => {
    if (!selected) return toast.error("Select a payment method");
    if (selected === "UPI") {
      navigate(`/pos/upi/${orderId}`);
      return;
    }
    setPaying(true);
    try {
      await paymentAPI.process({ orderId, method: selected, amount: total });
      clearCart();
      toast.success("Payment successful!");
      navigate(`/pos/success?orderId=${orderId}&method=${selected}&amount=${total}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-brand-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slideUp">
        <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-white/20 transition-colors"><ArrowLeft size={18} /></button>
              <p className="text-sm opacity-80">Order #{orderId?.slice(0, 8).toUpperCase()}</p>
            </div>
            <p className="text-4xl font-extrabold">₹{Number(total).toFixed(2)}</p>
            <p className="text-sm opacity-70 mt-1">Incl. ₹{Number(tax).toFixed(2)} tax</p>
          </div>

          <div className="p-6">
            <p className="text-sm font-semibold text-gray-700 mb-4">Select Payment Method</p>

            {loading ? (
              <div className="flex justify-center py-8"><Spinner size="lg" /></div>
            ) : (
              <div className="flex flex-col gap-3">
                {enabledMethods.map(([key, meta]) => {
                  const Icon = meta.icon;
                  const isSelected = selected === key;
                  return (
                    <button key={key} onClick={() => setSelected(key)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${isSelected ? "border-brand-500 bg-brand-50" : "border-gray-100 hover:border-gray-300"}`}>
                      <div className={`p-3 rounded-xl ${isSelected ? "bg-brand-100" : "bg-gray-100"}`}>
                        <Icon size={20} className={isSelected ? "text-brand-600" : "text-gray-500"} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-semibold text-sm ${isSelected ? "text-brand-700" : "text-gray-800"}`}>{meta.label}</p>
                        <p className="text-xs text-gray-500">{meta.desc}</p>
                      </div>
                      {isSelected && <CheckCircle size={20} className="text-brand-500" />}
                    </button>
                  );
                })}
                {enabledMethods.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No payment methods configured for this terminal.</p>
                )}
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
    </div>
  );
}