import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

interface AccessibleSwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  label?: string;
  description?: string;
  onLabel?: string;
  offLabel?: string;
}

const AccessibleSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  AccessibleSwitchProps
>(({ className, label, description, onLabel = "مفعل", offLabel = "غير مفعل", checked, ...props }, ref) => {
  const switchId = React.useId();
  const descriptionId = `${switchId}-description`;
  
  return (
    <div className="flex items-center justify-between space-x-2">
      {(label || description) && (
        <div className="space-y-1">
          {label && (
            <label 
              htmlFor={switchId}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </label>
          )}
          {description && (
            <p id={descriptionId} className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      
      <SwitchPrimitives.Root
        id={switchId}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
          className
        )}
        aria-describedby={description ? descriptionId : undefined}
        aria-label={label || `${checked ? onLabel : offLabel}`}
        checked={checked}
        ref={ref}
        {...props}
      >
        <SwitchPrimitives.Thumb className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )} />
      </SwitchPrimitives.Root>
      
      {/* Hidden status for screen readers */}
      <span className="sr-only" aria-live="polite">
        الحالة الحالية: {checked ? onLabel : offLabel}
      </span>
    </div>
  );
});

AccessibleSwitch.displayName = "AccessibleSwitch";

export { AccessibleSwitch };