import { clsx } from "clsx";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  iconBg = "bg-orange-100",
  iconColor = "text-orange-600",
}) {
  const isPositive = trend === "up";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
          {trendValue && (
            <div
              className={clsx(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                isPositive ? "text-green-600" : "text-red-500"
              )}
            >
              {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {trendValue}
            </div>
          )}
        </div>
        {Icon && (
          <div className={clsx("p-3 rounded-xl", iconBg)}>
            <Icon size={20} className={iconColor} />
          </div>
        )}
      </div>
    </div>
  );
}