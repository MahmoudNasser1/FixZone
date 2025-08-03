import * as React from "react";
import { cva } from "class-variance-authority";
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  XCircle, 
  X,
  AlertTriangle 
} from "lucide-react";

import { cn } from "../../lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        success: "border-green-200 bg-green-50 text-green-800 [&>svg]:text-green-600",
        destructive: "border-red-200 bg-red-50 text-red-800 [&>svg]:text-red-600",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600",
        info: "border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

// مكون Alert محسن مع الأيقونات والإغلاق
const EnhancedAlert = React.forwardRef(({ 
  variant = "default", 
  title, 
  description, 
  dismissible = false,
  onDismiss,
  className,
  ...props 
}, ref) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const getIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "destructive":
        return <XCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <Alert ref={ref} variant={variant} className={cn("relative", className)} {...props}>
      {getIcon()}
      <div className="flex-1">
        {title && <AlertTitle>{title}</AlertTitle>}
        {description && <AlertDescription>{description}</AlertDescription>}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 rounded-md p-1 text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">إغلاق</span>
        </button>
      )}
    </Alert>
  );
});
EnhancedAlert.displayName = "EnhancedAlert";

// مكونات Alert مخصصة
const SuccessAlert = React.forwardRef(({ children, ...props }, ref) => (
  <EnhancedAlert ref={ref} variant="success" {...props}>
    {children}
  </EnhancedAlert>
));
SuccessAlert.displayName = "SuccessAlert";

const ErrorAlert = React.forwardRef(({ children, ...props }, ref) => (
  <EnhancedAlert ref={ref} variant="destructive" {...props}>
    {children}
  </EnhancedAlert>
));
ErrorAlert.displayName = "ErrorAlert";

const WarningAlert = React.forwardRef(({ children, ...props }, ref) => (
  <EnhancedAlert ref={ref} variant="warning" {...props}>
    {children}
  </EnhancedAlert>
));
WarningAlert.displayName = "WarningAlert";

const InfoAlert = React.forwardRef(({ children, ...props }, ref) => (
  <EnhancedAlert ref={ref} variant="info" {...props}>
    {children}
  </EnhancedAlert>
));
InfoAlert.displayName = "InfoAlert";

// مكون Alert للإشعارات المؤقتة
const TemporaryAlert = React.forwardRef(({ 
  duration = 5000,
  onAutoClose,
  ...props 
}, ref) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onAutoClose) {
        onAutoClose();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onAutoClose]);

  if (!isVisible) return null;

  return (
    <EnhancedAlert
      ref={ref}
      dismissible
      onDismiss={() => setIsVisible(false)}
      {...props}
    />
  );
});
TemporaryAlert.displayName = "TemporaryAlert";

export {
  Alert,
  AlertTitle,
  AlertDescription,
  EnhancedAlert,
  SuccessAlert,
  ErrorAlert,
  WarningAlert,
  InfoAlert,
  TemporaryAlert,
};
