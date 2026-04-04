import { clsx } from "clsx";

export default function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <label
      className={clsx(
        "flex items-center gap-3 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          "relative w-11 h-6 rounded-full transition-colors duration-200",
          checked ? "bg-orange-500" : "bg-gray-300"
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
            checked && "translate-x-5"
          )}
        />
      </div>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
