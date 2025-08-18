import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const progressVariants = cva(
  "relative h-4 w-full overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "bg-secondary",
        success: "bg-green-100",
        warning: "bg-yellow-100",
        destructive: "bg-red-100",
        info: "bg-blue-100",
      },
      size: {
        sm: "h-2",
        md: "h-4",
        lg: "h-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        destructive: "bg-red-500",
        info: "bg-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Progress = React.forwardRef(({ 
  className, 
  value, 
  variant = "default",
  size = "md",
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(progressVariants({ variant, size }), className)}
    {...props}
  >
    <div
      className={cn(progressIndicatorVariants({ variant }))}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
));
Progress.displayName = "Progress";

// مكون Progress محسن مع النص والنسبة المئوية
const EnhancedProgress = React.forwardRef(({ 
  value = 0,
  max = 100,
  variant = "default",
  size = "md",
  showValue = false,
  showLabel = false,
  label,
  className,
  ...props 
}, ref) => {
  const percentage = Math.round((value / max) * 100);
  
  const getVariantByPercentage = () => {
    if (percentage >= 100) return "success";
    if (percentage >= 75) return "info";
    if (percentage >= 50) return "warning";
    if (percentage >= 25) return "default";
    return "destructive";
  };

  const finalVariant = variant === "auto" ? getVariantByPercentage() : variant;

  return (
    <div className={cn("w-full space-y-2", className)}>
      {(showLabel || label) && (
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">
            {label || "التقدم"}
          </span>
          {showValue && (
            <span className="text-gray-500">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <Progress
        ref={ref}
        value={percentage}
        variant={finalVariant}
        size={size}
        {...props}
      />
    </div>
  );
});
EnhancedProgress.displayName = "EnhancedProgress";

// مكون Progress دائري
const CircularProgress = React.forwardRef(({ 
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 8,
  variant = "default",
  showValue = true,
  className,
  ...props 
}, ref) => {
  const percentage = Math.round((value / max) * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    switch (variant) {
      case "success": return "#10b981";
      case "warning": return "#f59e0b";
      case "destructive": return "#ef4444";
      case "info": return "#3b82f6";
      default: return "#6366f1";
    }
  };

  return (
    <div 
      ref={ref}
      className={cn("relative inline-flex items-center justify-center", className)}
      {...props}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-700">
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
});
CircularProgress.displayName = "CircularProgress";

// مكون Progress متعدد الخطوات
const StepProgress = React.forwardRef(({ 
  steps = [],
  currentStep = 0,
  variant = "default",
  className,
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium",
                index <= currentStep
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-gray-100 text-gray-400 border-gray-300"
              )}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-2",
                  index < currentStep
                    ? "bg-primary"
                    : "bg-gray-200"
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          {steps[currentStep]?.title}
        </p>
        {steps[currentStep]?.description && (
          <p className="text-xs text-gray-500 mt-1">
            {steps[currentStep].description}
          </p>
        )}
      </div>
    </div>
  );
});
StepProgress.displayName = "StepProgress";

export {
  Progress,
  EnhancedProgress,
  CircularProgress,
  StepProgress,
};
