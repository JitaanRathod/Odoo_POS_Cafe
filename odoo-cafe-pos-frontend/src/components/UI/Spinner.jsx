import { clsx } from "clsx";

const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-7 h-7 border-2",
  lg: "w-10 h-10 border-[3px]",
};

export default function Spinner({ size = "md", className = "" }) {
  return (
    <div
      className={clsx(
        "rounded-full border-gray-200 border-t-orange-500 animate-spin",
        sizes[size],
        className
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/70 z-50">
      <Spinner size="lg" />
    </div>
  );
}