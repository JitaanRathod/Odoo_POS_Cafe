import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

// Backend
import Dashboard from "./pages/backend/Dashboard";
import Products from "./pages/backend/Products";
import PaymentMethods from "./pages/backend/PaymentMethods";
import Floors from "./pages/backend/Floors";
import Terminal from "./pages/backend/Terminal";

// POS
import FloorView from "./pages/pos/FloorView";
import OrderScreen from "./pages/pos/OrderScreen";
import Payment from "./pages/pos/Payment";
import UPIPayment from "./pages/pos/UPIPayment";
import PaymentSuccess from "./pages/pos/PaymentSuccess";

// Kitchen & Customer
import KitchenDisplay from "./pages/kitchen/KitchenDisplay";
import CustomerDisplay from "./pages/customer/CustomerDisplay";

// Booking
import Booking from "./pages/booking/Booking";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />

        {/* Auth */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />

        {/* Backend / Admin */}
        <Route path="/backend/dashboard" element={<Dashboard />} />
        <Route path="/backend/products" element={<Products />} />
        <Route path="/backend/payment-methods" element={<PaymentMethods />} />
        <Route path="/backend/floors" element={<Floors />} />
        <Route path="/backend/terminal" element={<Terminal />} />
        <Route path="/backend/booking" element={<Booking />} />

        {/* POS Flow */}
        <Route path="/pos/floor" element={<FloorView />} />
        <Route path="/pos/order/:tableId" element={<OrderScreen />} />
        <Route path="/pos/payment/:orderId" element={<Payment />} />
        <Route path="/pos/upi/:orderId" element={<UPIPayment />} />
        <Route path="/pos/success" element={<PaymentSuccess />} />

        {/* Displays */}
        <Route path="/kitchen" element={<KitchenDisplay />} />
        <Route path="/display" element={<CustomerDisplay />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
