import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { paymentAPI } from "../../api/payment.api";
import { orderAPI } from "../../api/order.api";
import { useCartStore } from "../../store/useCartStore";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";

export default function UPIPayment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getTotal, clearCart } = useCartStore();
  const [upiId, setUpiId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const tax = getTotal() * 0.05;
  const total = (getTotal() + tax).toFixed(2);

  useEffect(() => {
    paymentAPI.getMethods().then((data) => {
      const upi = data.find((m) => m.type === "UPI");
      setUpiId(upi?.upi_id || null);
    }).finally(() => setLoading(false));
  }, []);

  const upiLink = upiId
    ? `upi://pay?pa=${upiId}&am=${total}&cu=INR&tn=OdooPOSCafe`
    : null;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await paymentAPI.record({ order_id: orderId, method: "UPI", amount: total });
      await orderAPI.updateStatus(orderId, "PAID");
      clearCart();
      navigate("/pos/success");
    } catch {
      toast.error("Failed to confirm payment");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-orange-500 px-6 py-5 text-white text-center">
          <p className="text-sm opacity-80">Scan & Pay</p>
          <p className="text-3xl font-extrabold mt-1">₹{total}</p>
          <p className="text-sm opacity-70">UPI Payment</p>
        </div>

        <div className="p-6 flex flex-col items-center gap-5">
          {loading ? (
            <div className="py-10"><Spinner size="lg" /></div>
          ) : !upiId ? (
            <div className="text-center py-6 text-gray-500">
              <p className="font-medium text-gray-700">UPI not configured</p>
              <p className="text-sm mt-1">Set UPI ID in Payment Methods settings</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-2 border-orange-200 rounded-2xl bg-orange-50">
                <QRCodeSVG value={upiLink} size={200} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">UPI ID: {upiId}</p>
                <p className="text-xs text-gray-400 mt-1">Ask customer to scan this QR with any UPI app</p>
              </div>
            </>
          )}

          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              <XCircle size={15} /> Cancel
            </Button>
            <Button
              className="flex-1"
              loading={confirming}
              onClick={handleConfirm}
              disabled={!upiId}
            >
              <CheckCircle size={15} /> Payment Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}