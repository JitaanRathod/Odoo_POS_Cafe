import { Link } from "react-router-dom";
import { Coffee, MonitorSmartphone, ChefHat, CreditCard, BarChart3, Zap, ArrowRight } from "lucide-react";

const features = [
  { icon: MonitorSmartphone, title: "Multi-Terminal POS", desc: "Run multiple POS counters with independent sessions and cash tracking." },
  { icon: Coffee, title: "Menu & Categories", desc: "40+ products organized across 6 categories with instant search." },
  { icon: ChefHat, title: "Kitchen Display", desc: "Real-time order display for kitchen staff with live socket updates." },
  { icon: CreditCard, title: "Smart Payments", desc: "Accept Cash, Card & UPI with dynamic QR code generation." },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Daily revenue, top products, and session-wise P&L at a glance." },
  { icon: Zap, title: "Lightning Fast", desc: "Built with React 19 — instant UI with zero page reloads." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
            <Coffee size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">Odoo Cafe POS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2">Login</Link>
          <Link to="/signup" className="text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-5 py-2.5 rounded-xl transition-colors">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-12 pt-16 pb-20 md:pt-24 md:pb-28 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 border border-brand-200 rounded-full text-xs font-semibold text-brand-700 mb-6">
          <Zap size={12} /> Built for speed & simplicity
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
          Modern POS for your <br />
          <span className="bg-gradient-to-r from-brand-500 to-amber-500 bg-clip-text text-transparent">Cafe & Restaurant</span>
        </h1>
        <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          A sleek, minimalistic point-of-sale system that handles orders, kitchen display,
          UPI payments with QR codes, and real-time analytics — all in one place.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/login" className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-2xl shadow-lg shadow-brand-200 transition-all hover:shadow-xl hover:shadow-brand-200 active:scale-[0.98]">
            Open POS <ArrowRight size={16} />
          </Link>
          <Link to="/kitchen" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl border border-gray-200 transition-all active:scale-[0.98]">
            <ChefHat size={16} /> Kitchen Display
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-12 pb-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-50 transition-all duration-300">
              <div className="w-11 h-11 bg-brand-50 group-hover:bg-brand-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                <f.icon size={20} className="text-brand-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 md:px-12 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <span>&copy; 2026 Odoo Cafe POS</span>
          <span>Built with React & Express</span>
        </div>
      </footer>
    </div>
  );
}
