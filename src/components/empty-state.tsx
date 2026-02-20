import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-12 text-center ${className}`}>
      {Icon && (
        <div className="mb-4">
          <Icon className="w-12 h-12 text-gray-300 mx-auto" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <div>
          {action.href ? (
            <Link 
              href={action.href}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              {action.label}
            </Link>
          ) : action.onClick ? (
            <button 
              onClick={action.onClick}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function EmptyStateSmall({ icon: Icon, title, description }: {
  icon?: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-8">
      {Icon && (
        <Icon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
      )}
      <h4 className="text-base font-medium text-gray-700 mb-1">{title}</h4>
      <p className="text-gray-400 text-sm max-w-sm mx-auto">{description}</p>
    </div>
  );
}