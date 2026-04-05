import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import SelectTerminal from "./pages/pos/SelectTerminal";
import FloorView from "./pages/pos/FloorView";
import OrderScreen from "./pages/pos/OrderScreen";
import Payment from "./pages/pos/Payment";
import UPIPayment from "./pages/pos/UPIPayment";
import PaymentSuccess from "./pages/pos/PaymentSuccess";
import Dashboard from "./pages/backend/Dashboard";
import KitchenDisplay from "./pages/kitchen/KitchenDisplay";

// Components
import AuthGuard from "./components/Layout/AuthGuard";
import RoleGuard from "./components/Layout/RoleGuard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />

        {/* Protected — POS Flow */}
        <Route path="/pos/select-terminal" element={<AuthGuard><SelectTerminal /></AuthGuard>} />
        <Route path="/pos/floor" element={<AuthGuard><FloorView /></AuthGuard>} />
        <Route path="/pos/order/:tableId" element={<AuthGuard><OrderScreen /></AuthGuard>} />
        <Route path="/pos/payment/:orderId" element={<AuthGuard><Payment /></AuthGuard>} />
        <Route path="/pos/upi/:orderId" element={<AuthGuard><UPIPayment /></AuthGuard>} />
        <Route path="/pos/success" element={<AuthGuard><PaymentSuccess /></AuthGuard>} />

        {/* Protected — Admin / Manager only */}
        <Route path="/dashboard" element={
          <AuthGuard>
            <RoleGuard roles={["ADMIN", "MANAGER"]}>
              <Dashboard />
            </RoleGuard>
          </AuthGuard>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
