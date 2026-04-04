import { clsx } from "clsx";
import { forwardRef } from "react";

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder = "Select...", className = "", ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <select
        ref={ref}
        className={clsx(
          "w-full px-3 py-2 text-sm border rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none cursor-pointer",
          error
            ? "border-red-400 focus:ring-red-400"
            : "border-gray-300 hover:border-gray-400",
          className
        )}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Select;
