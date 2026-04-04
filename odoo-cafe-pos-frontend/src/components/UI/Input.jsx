import { clsx } from "clsx";
import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, error, helperText, className = "", ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        ref={ref}
        className={clsx(
          "w-full px-3 py-2 text-sm border rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400",
          error
            ? "border-red-400 focus:ring-red-400"
            : "border-gray-300 hover:border-gray-400",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

export default Input;