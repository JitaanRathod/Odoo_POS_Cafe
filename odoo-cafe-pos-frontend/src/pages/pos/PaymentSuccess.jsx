import { useNavigate } from "react-router-dom";
import { CheckCircle, Home, RotateCcw } from "lucide-react";
import Button from "../../components/ui/Button";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center gap-6">
        {/* Success Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <CheckCircle size={52} className="text-green-500" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Payment Successful!</h1>
          <p className="text-sm text-gray-500 mt-2">
            The order has been paid and the table is now free.
          </p>
        </div>

        {/* Receipt placeholder */}
        <div className="w-full bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300 text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Status</span>
            <span className="font-semibold text-green-600">PAID</span>
          </div>
          <div className="flex justify-between">
            <span>Table</span>
            <span className="font-medium text-gray-800">Freed</span>
          </div>
          <div className="flex justify-between">
            <span>Receipt</span>
            <span className="font-medium text-gray-800">Printed / Sent</span>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/pos/floor")}>
            <RotateCcw size={15} /> New Order
          </Button>
          <Button className="flex-1" onClick={() => navigate("/backend/dashboard")}>
            <Home size={15} /> Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
