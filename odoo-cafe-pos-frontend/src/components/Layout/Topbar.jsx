import { Bell, Search } from "lucide-react";
import { useSessionStore } from "../../store/useSessionStore";
import dayjs from "dayjs";

export default function Topbar({ title }) {
  const { sessionId } = useSessionStore();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-10">
      {/* Page Title */}
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 w-52"
          />
        </div>

        {/* Session Badge */}
        {sessionId && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Session Active
          </span>
        )}

        {/* Date */}
        <span className="text-xs text-gray-500 hidden lg:block">
          {dayjs().format("ddd, D MMM YYYY")}
        </span>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={18} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}