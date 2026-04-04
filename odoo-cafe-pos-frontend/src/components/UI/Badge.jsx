import { clsx } from "clsx";

const variants = {
  free: "bg-green-100 text-green-700",
  occupied: "bg-red-100 text-red-700",
  ready: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  success: "bg-green-100 text-green-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  default: "bg-gray-100 text-gray-600",
};

export default function Badge({ label, variant = "default", className = "" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant] ?? variants.default,
        className
      )}
    >
      {label}
    </span>
  );
}