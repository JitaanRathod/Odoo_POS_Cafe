import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, XCircle, Smartphone, Copy, Timer } from "lucide-react";
import toast from "react-hot-toast";
import { paymentAPI } from "../../api/payment.api";
import { paymentSettingsAPI } from "../../api/payment-settings.api";
import { orderAPI } from "../../api/order.api";
import { useCartStore } from "../../store/useCartStore";
import { useSessionStore } from "../../store/useSessionStore";
import Button from "../../components/UI/Button";
import Spinner from "../../components/UI/Spinner";

export default function UPIPayment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { clearCart, getTotal } = useCartStore();
  const { terminalId } = useSessionStore();

  const [settings, setSettings] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min timer

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, orderRes] = await Promise.all([
          paymentSettingsAPI.get(terminalId),
          orderAPI.getById(orderId),
        ]);
        setSettings(settingsRes.settings || settingsRes);
        setOrder(orderRes.order || orderRes);
      } catch {
        toast.error("Failed to load payment settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [terminalId, orderId]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const upiId = settings?.upiId;
  const upiName = settings?.upiName || "Odoo Cafe POS";
  const total = order?.totalAmount || getTotal();
  const formattedTotal = Number(total).toFixed(2);

  // Standard UPI deep link
  const upiLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${formattedTotal}&cu=INR&tn=${encodeURIComponent(`Order-${orderId?.slice(0, 8)}`)}`
    : null;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await paymentAPI.process({ orderId, method: "UPI", amount: Number(formattedTotal) });
      clearCart();
      toast.success("UPI payment confirmed!");
      navigate(`/pos/success?orderId=${orderId}&method=UPI&amount=${formattedTotal}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to confirm payment");
    } finally {
      setConfirming(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    toast.success("UPI ID copied!");
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-brand-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slideUp">
        <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-6 text-center text-white">
            <Smartphone size={28} className="mx-auto mb-2 opacity-80" />
            <p className="text-sm font-medium opacity-80">Scan & Pay</p>
            <p className="text-4xl font-extrabold mt-1">₹{formattedTotal}</p>
            <p className="text-xs opacity-60 mt-1">UPI Payment</p>
          </div>

          <div className="p-6 flex flex-col items-center gap-5">
            {loading ? (
              <div className="py-10"><Spinner size="lg" /></div>
            ) : !upiId ? (
              <div className="text-center py-6">
                <p className="font-semibold text-gray-700">UPI Not Configured</p>
                <p className="text-sm text-gray-500 mt-1">Set UPI ID in Payment Settings from the admin panel.</p>
              </div>
            ) : (
              <>
                {/* QR Code */}
                <div className="p-5 bg-white border-2 border-brand-100 rounded-2xl shadow-inner animate-pulse-glow">
                  <QRCodeSVG
                    value={upiLink}
                    size={200}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#1e1b2e"
                  />
                </div>

                {/* UPI Info */}
                <div className="text-center space-y-2 w-full">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-sm font-semibold text-gray-700">UPI ID:</p>
                    <code className="text-sm text-brand-600 bg-brand-50 px-2 py-0.5 rounded font-mono">{upiId}</code>
                    <button onClick={copyUpiId} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Copy size={14} /></button>
                  </div>
                  <p className="text-xs text-gray-400">Payee: {upiName}</p>

                  {/* Timer */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mt-3">
                    <Timer size={12} />
                    <span>Expires in {minutes}:{seconds.toString().padStart(2, "0")}</span>
                  </div>
                </div>

                {/* Steps */}
                <div className="bg-gray-50 rounded-xl p-4 w-full">
                  <p className="text-xs font-semibold text-gray-600 mb-2">How to pay:</p>
                  <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
                    <li>Open any UPI app (GPay, PhonePe, Paytm)</li>
                    <li>Scan the QR code above</li>
                    <li>Verify amount ₹{formattedTotal} and pay</li>
                    <li>Click "Payment Received" below to confirm</li>
                  </ol>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                <XCircle size={14} /> Cancel
              </Button>
              <Button className="flex-1" loading={confirming} onClick={handleConfirm} disabled={!upiId || countdown <= 0}>
                <CheckCircle size={14} /> Payment Received
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}