import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg",
        outline: 
          "border-2 border-gray-300 bg-transparent hover:bg-gray-50 hover:border-gray-400 text-gray-700",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm",
        ghost: 
          "hover:bg-gray-100 hover:text-gray-900 text-gray-600",
        link: 
          "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700",
        success:
          "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg",
        warning:
          "bg-yellow-500 text-white hover:bg-yellow-600 shadow-md hover:shadow-lg",
        info:
          "bg-cyan-600 text-white hover:bg-cyan-700 shadow-md hover:shadow-lg",
        gradient:
          "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-sm",
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-lg",
        xl: "h-14 px-8 text-xl",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {loading ? (loadingText || "جاري التحميل...") : children}
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// مكونات إضافية للأزرار المتخصصة
const IconButton = React.forwardRef(
  ({ icon, className, size = "icon", ...props }, ref) => (
    <Button
      ref={ref}
      size={size}
      className={cn("shrink-0", className)}
      {...props}
    >
      {icon}
    </Button>
  )
);
IconButton.displayName = "IconButton";

const LoadingButton = React.forwardRef(
  ({ loading, children, loadingText, ...props }, ref) => (
    <Button
      ref={ref}
      loading={loading}
      loadingText={loadingText}
      {...props}
    >
      {children}
    </Button>
  )
);
LoadingButton.displayName = "LoadingButton";

export { Button, IconButton, LoadingButton, buttonVariants };
