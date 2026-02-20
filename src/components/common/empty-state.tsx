import { Package } from "lucide-react";
import { ReactNode } from "react";

// interface EmptyStateProps {
//   icon: React.ElementType; // component reference, not ReactNode
//   title: string;
//   description: string;
//   action?: ReactNode;
// }

// export default function EmptyState({ 
//   icon, 
//   title, 
//   description, 
//   action 
// }: EmptyStateProps) {
//   return (
//     <div className="text-center py-12">
//       <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
//         {icon || <Package className="h-12 w-12" />}
//       </div>
//       <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
//         {title}
//       </h3>
//       <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
//         {description}
//       </p>
//       {action && action}
//     </div>
//   );
// }
interface EmptyStateProps {
  icon: React.ElementType; // component reference, not ReactNode
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
