import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cva } from "class-variance-authority";
import { Check, X } from "lucide-react";

import { cn } from "../../lib/utils";

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
        lg: "h-7 w-12",
      },
      variant: {
        default: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        success: "data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-input",
        warning: "data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-input",
        destructive: "data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-input",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

const switchThumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
  {
    variants: {
      size: {
        sm: "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        md: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        lg: "h-6 w-6 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const Switch = React.forwardRef(({ 
  className, 
  size = "md",
  variant = "default",
  ...props 
}, ref) => (
  <SwitchPrimitives.Root
    className={cn(switchVariants({ size, variant }), className)}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb className={cn(switchThumbVariants({ size }))} />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

// مكون Switch محسن مع الأيقونات والنصوص
const EnhancedSwitch = React.forwardRef(({ 
  className,
  size = "md",
  variant = "default",
  showIcons = false,
  showLabels = false,
  checkedLabel = "تشغيل",
  uncheckedLabel = "إيقاف",
  checked,
  onCheckedChange,
  ...props 
}, ref) => {
  const getIconSize = () => {
    switch (size) {
      case "sm": return "h-3 w-3";
      case "lg": return "h-4 w-4";
      default: return "h-3.5 w-3.5";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {showLabels && !checked && (
        <span className="text-sm text-gray-600">{uncheckedLabel}</span>
      )}
      
      <SwitchPrimitives.Root
        className={cn(
          switchVariants({ size, variant }),
          "relative",
          className
        )}
        checked={checked}
        onCheckedChange={onCheckedChange}
        {...props}
        ref={ref}
      >
        <SwitchPrimitives.Thumb 
          className={cn(
            switchThumbVariants({ size }),
            "flex items-center justify-center"
          )}
        >
          {showIcons && (
            <>
              {checked ? (
                <Check className={cn(getIconSize(), "text-primary")} />
              ) : (
                <X className={cn(getIconSize(), "text-gray-400")} />
              )}
            </>
          )}
        </SwitchPrimitives.Thumb>
      </SwitchPrimitives.Root>
      
      {showLabels && checked && (
        <span className="text-sm text-gray-600">{checkedLabel}</span>
      )}
    </div>
  );
});
EnhancedSwitch.displayName = "EnhancedSwitch";

// مكون Switch مع Label
const SwitchWithLabel = React.forwardRef(({ 
  label,
  description,
  className,
  labelClassName,
  switchClassName,
  ...props 
}, ref) => (
  <div className={cn("flex items-center justify-between", className)}>
    <div className="space-y-0.5">
      <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", labelClassName)}>
        {label}
      </label>
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
    <Switch ref={ref} className={switchClassName} {...props} />
  </div>
));
SwitchWithLabel.displayName = "SwitchWithLabel";

// مكون Switch للإعدادات
const SettingsSwitch = React.forwardRef(({ 
  title,
  description,
  icon,
  className,
  ...props 
}, ref) => (
  <div className={cn("flex items-start space-x-3 space-x-reverse", className)}>
    {icon && (
      <div className="flex-shrink-0 mt-1">
        {icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <Switch ref={ref} {...props} />
      </div>
    </div>
  </div>
));
SettingsSwitch.displayName = "SettingsSwitch";

export {
  Switch,
  EnhancedSwitch,
  SwitchWithLabel,
  SettingsSwitch,
};
