export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          <Icon size={32} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}