import { Package } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
        {icon || <Package className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && action}
    </div>
  );
}
