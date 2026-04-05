export default function Button({ children, variant = "primary", size = "md", loading, disabled, className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2.5", lg: "text-base px-6 py-3" };
  const variants = {
    primary: "bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-200 active:scale-[0.98]",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-[0.98]",
    outline: "border border-gray-300 hover:border-gray-400 text-gray-700 bg-white active:scale-[0.98]",
    danger: "bg-red-500 hover:bg-red-600 text-white active:scale-[0.98]",
    ghost: "hover:bg-gray-100 text-gray-600",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}