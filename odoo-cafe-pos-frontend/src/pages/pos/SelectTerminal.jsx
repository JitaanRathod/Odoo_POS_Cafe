import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Monitor, Plus, LogOut, Coffee } from "lucide-react";
import toast from "react-hot-toast";
import { terminalAPI } from "../../api/terminal.api";
import { sessionAPI } from "../../api/session.api";
import { useSessionStore } from "../../store/useSessionStore";
import Button from "../../components/UI/Button";
import Spinner from "../../components/UI/Spinner";

export default function SelectTerminal() {
  const navigate = useNavigate();
  const { user, clearSession, openPosSession } = useSessionStore();
  const isManager = user?.role === "ADMIN" || user?.role === "MANAGER";
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(null);

  useEffect(() => {
    terminalAPI.getAll().then((r) => setTerminals(r.terminals || r)).catch(() => toast.error("Failed to load terminals")).finally(() => setLoading(false));
  }, []);

  const handleSelect = async (terminal) => {
    setOpening(terminal.id);
    try {
      // Try to open a session — if already open (409), fetch active
      let session;
      try {
        const res = await sessionAPI.open({ terminalId: terminal.id, openingCash: 0 });
        session = res.session;
      } catch (err) {
        if (err.response?.status === 409) {
          const cur = await sessionAPI.getCurrent(terminal.id);
          session = cur.session;
        } else throw err;
      }
      openPosSession({ sessionId: session.id, terminalId: terminal.id, branchId: terminal.branchId });
      toast.success(`Session opened on ${terminal.name}`);
      navigate("/pos/floor");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to open session");
    } finally {
      setOpening(null);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
    toast.success("Logged out");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center"><Coffee size={16} className="text-white" /></div>
          <span className="font-bold text-gray-900">Odoo Cafe POS</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Hi, <span className="font-semibold text-gray-800">{user?.name}</span></span>
          {isManager && (
            <button onClick={() => navigate("/dashboard")} className="text-sm text-brand-600 font-medium hover:underline">Dashboard</button>
          )}
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl animate-fadeIn">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Select Terminal</h1>
            <p className="text-sm text-gray-500 mt-1">Choose a POS counter to start your session</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {terminals.map((t) => (
                <button
                  key={t.id} onClick={() => handleSelect(t)} disabled={!!opening}
                  className="group relative flex flex-col gap-3 p-6 bg-white rounded-2xl border border-gray-100 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-50 transition-all duration-300 text-left disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-brand-50 group-hover:bg-brand-100 rounded-xl flex items-center justify-center transition-colors">
                      <Monitor size={20} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.branch?.name || "Main Branch"}</p>
                    </div>
                  </div>
                  {t.sessions?.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active session
                    </span>
                  )}
                  {opening === t.id && <Spinner className="absolute top-6 right-6" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
