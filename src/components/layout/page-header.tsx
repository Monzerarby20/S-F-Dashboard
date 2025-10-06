import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  backPath?: string;
  backLabel?: string;
  onBack?: () => void;
}

export default function PageHeader({ 
  title, 
  subtitle, 
  actions, 
  backPath, 
  backLabel = "العودة",
  onBack 
}: PageHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      window.location.href = backPath;
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {(backPath || onBack) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
          >
            <ArrowRight className="h-4 w-4" />
            {backLabel}
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}