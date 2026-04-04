import { clsx } from "clsx";

export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={clsx(
        "bg-white rounded-xl border border-gray-200 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between px-6 pt-6 pb-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return (
    <div className={clsx("px-6 pb-6", className)}>{children}</div>
  );
}