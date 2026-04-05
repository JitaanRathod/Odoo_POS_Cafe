import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Printer, Home, ArrowRight } from "lucide-react";
import Button from "../../components/UI/Button";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId") || "";
  const method = params.get("method") || "CASH";
  const amount = params.get("amount") || "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-brand-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center animate-slideUp">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment Successful!</h1>
        <p className="text-sm text-gray-500 mb-6">Transaction completed successfully</p>

        {/* Receipt Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100 p-6 mb-6 text-left">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-500">Order ID</span>
            <span className="font-mono font-semibold text-gray-900">#{orderId.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-500">Method</span>
            <span className="font-semibold text-gray-900">{method}</span>
          </div>
          <div className="flex justify-between text-sm pt-3 border-t border-gray-100">
            <span className="text-gray-500">Amount Paid</span>
            <span className="text-lg font-bold text-emerald-600">₹{Number(amount).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/pos/floor">
            <Button className="w-full" size="lg">
              <ArrowRight size={16} /> New Order
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" className="w-full">
              <Home size={16} /> Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
