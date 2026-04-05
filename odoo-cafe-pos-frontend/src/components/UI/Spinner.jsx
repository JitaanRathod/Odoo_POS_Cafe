export default function Spinner({ size = "md", className = "" }) {
  const sizeMap = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div className={`${sizeMap[size] || sizeMap.md} border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin ${className}`} />
  );
}