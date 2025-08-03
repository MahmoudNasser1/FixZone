import * as React from "react";
import { cva } from "class-variance-authority";
import { Loader2, RefreshCw } from "lucide-react";

import { cn } from "../../lib/utils";

const loadingVariants = cva(
  "flex items-center justify-center",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-6 w-6", 
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        spinner: "animate-spin",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "spinner",
    },
  }
);

const Loading = React.forwardRef(({ 
  className, 
  size, 
  variant,
  text,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2", className)}
    {...props}
  >
    <Loader2 className={cn(loadingVariants({ size, variant }))} />
    {text && <span className="text-sm text-gray-600">{text}</span>}
  </div>
));
Loading.displayName = "Loading";

// مكون التحميل بملء الشاشة
const FullScreenLoading = React.forwardRef(({ 
  className,
  text = "جاري التحميل...",
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm",
      className
    )}
    {...props}
  >
    <div className="text-center">
      <Loading size="xl" />
      <p className="mt-4 text-lg text-gray-600">{text}</p>
    </div>
  </div>
));
FullScreenLoading.displayName = "FullScreenLoading";

// مكون التحميل للبطاقات
const CardLoading = React.forwardRef(({ 
  className,
  lines = 3,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn("animate-pulse space-y-4 p-6", className)}
    {...props}
  >
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-3 bg-gray-200 rounded"></div>
    ))}
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
  </div>
));
CardLoading.displayName = "CardLoading";

// مكون التحميل للجداول
const TableLoading = React.forwardRef(({ 
  className,
  rows = 5,
  columns = 4,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn("animate-pulse space-y-4", className)}
    {...props}
  >
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1"></div>
        ))}
      </div>
    ))}
  </div>
));
TableLoading.displayName = "TableLoading";

// مكون التحميل للأزرار
const ButtonLoading = React.forwardRef(({ 
  className,
  text = "جاري التحميل...",
  size = "md",
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-gray-600",
      className
    )}
    {...props}
  >
    <Loader2 className={cn(loadingVariants({ size, variant: "spinner" }))} />
    <span className="text-sm">{text}</span>
  </div>
));
ButtonLoading.displayName = "ButtonLoading";

// مكون التحميل للصفحات
const PageLoading = React.forwardRef(({ 
  className,
  title = "جاري تحميل الصفحة...",
  description,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col items-center justify-center min-h-[400px] space-y-4",
      className
    )}
    {...props}
  >
    <Loading size="xl" />
    <div className="text-center">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      )}
    </div>
  </div>
));
PageLoading.displayName = "PageLoading";

// مكون التحميل مع إعادة المحاولة
const LoadingWithRetry = React.forwardRef(({ 
  className,
  onRetry,
  retryText = "إعادة المحاولة",
  loadingText = "جاري التحميل...",
  errorText = "حدث خطأ أثناء التحميل",
  isError = false,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col items-center justify-center space-y-4 p-8",
      className
    )}
    {...props}
  >
    {isError ? (
      <>
        <RefreshCw className="h-12 w-12 text-gray-400" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">{errorText}</p>
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {retryText}
          </button>
        </div>
      </>
    ) : (
      <>
        <Loading size="xl" />
        <p className="text-lg text-gray-600">{loadingText}</p>
      </>
    )}
  </div>
));
LoadingWithRetry.displayName = "LoadingWithRetry";

export {
  Loading,
  FullScreenLoading,
  CardLoading,
  TableLoading,
  ButtonLoading,
  PageLoading,
  LoadingWithRetry,
};
