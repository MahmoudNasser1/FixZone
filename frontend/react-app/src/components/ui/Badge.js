import * as React from "react";
import { cva } from "class-variance-authority";
import { X, Check, AlertTriangle, Info } from "lucide-react";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: "text-foreground border-gray-300 hover:bg-gray-50",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        info:
          "border-transparent bg-blue-500 text-white hover:bg-blue-600",
        ghost:
          "border-transparent hover:bg-accent hover:text-accent-foreground",
        gradient:
          "border-transparent bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
      shape: {
        rounded: "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      shape: "rounded",
    },
  }
);

const Badge = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  shape,
  dismissible = false,
  onDismiss,
  icon,
  ...props 
}, ref) => {
  const getVariantIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case "success":
        return <Check className="h-3 w-3" />;
      case "destructive":
        return <AlertTriangle className="h-3 w-3" />;
      case "warning":
        return <AlertTriangle className="h-3 w-3" />;
      case "info":
        return <Info className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, size, shape }), className)}
      {...props}
    >
      {getVariantIcon()}
      {props.children}
      {dismissible && (
        <button
          onClick={onDismiss}
          className="ml-1 rounded-full p-0.5 hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-white"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
});
Badge.displayName = "Badge";

// مكونات Badge مخصصة
const StatusBadge = React.forwardRef(({ status, ...props }, ref) => {
  const getStatusProps = () => {
    switch (status) {
      case "active":
      case "completed":
      case "approved":
        return { variant: "success", children: "نشط" };
      case "inactive":
      case "cancelled":
      case "rejected":
        return { variant: "destructive", children: "غير نشط" };
      case "pending":
      case "in-progress":
        return { variant: "warning", children: "قيد الانتظار" };
      case "draft":
        return { variant: "secondary", children: "مسودة" };
      default:
        return { variant: "outline", children: status };
    }
  };

  const statusProps = getStatusProps();
  
  return (
    <Badge
      ref={ref}
      {...statusProps}
      {...props}
    />
  );
});
StatusBadge.displayName = "StatusBadge";

const CountBadge = React.forwardRef(({ count, max = 99, ...props }, ref) => {
  const displayCount = count > max ? `${max}+` : count;
  
  return (
    <Badge
      ref={ref}
      variant="destructive"
      size="sm"
      className="min-w-[20px] justify-center"
      {...props}
    >
      {displayCount}
    </Badge>
  );
});
CountBadge.displayName = "CountBadge";

const PriorityBadge = React.forwardRef(({ priority, ...props }, ref) => {
  const getPriorityProps = () => {
    switch (priority) {
      case "high":
      case "urgent":
        return { variant: "destructive", children: "عالية" };
      case "medium":
        return { variant: "warning", children: "متوسطة" };
      case "low":
        return { variant: "success", children: "منخفضة" };
      default:
        return { variant: "outline", children: priority };
    }
  };

  const priorityProps = getPriorityProps();
  
  return (
    <Badge
      ref={ref}
      {...priorityProps}
      {...props}
    />
  );
});
PriorityBadge.displayName = "PriorityBadge";

export { 
  Badge, 
  badgeVariants, 
  StatusBadge, 
  CountBadge, 
  PriorityBadge 
};
