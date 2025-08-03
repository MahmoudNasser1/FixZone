import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "shadow-sm hover:shadow-md",
        elevated: "shadow-md hover:shadow-lg",
        outlined: "border-2 shadow-none hover:shadow-sm",
        ghost: "border-none shadow-none hover:bg-gray-50",
        gradient: "bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-md",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
)

const Card = React.forwardRef(({ className, variant, padding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardVariants({ variant, padding }), className)}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// مكون بطاقة الإحصائيات
const StatsCard = React.forwardRef(({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon, 
  className,
  ...props 
}, ref) => {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card ref={ref} variant="elevated" className={cn("p-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={cn("text-sm mt-1", getChangeColor())}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});
StatsCard.displayName = "StatsCard";

// مكون بطاقة الميزات
const FeatureCard = React.forwardRef(({ 
  title, 
  description, 
  icon, 
  action,
  className,
  ...props 
}, ref) => (
  <Card ref={ref} variant="outlined" className={cn("p-6 hover:border-blue-300 transition-colors", className)} {...props}>
    <div className="text-center">
      {icon && (
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      )}
      <CardTitle className="text-xl mb-2">{title}</CardTitle>
      <CardDescription className="mb-4">{description}</CardDescription>
      {action && action}
    </div>
  </Card>
));
FeatureCard.displayName = "FeatureCard";

// مكون بطاقة المنتج
const ProductCard = React.forwardRef(({ 
  image, 
  title, 
  description, 
  price, 
  badge,
  actions,
  className,
  ...props 
}, ref) => (
  <Card ref={ref} variant="elevated" padding="none" className={cn("overflow-hidden", className)} {...props}>
    {image && (
      <div className="relative">
        <img src={image} alt={title} className="w-full h-48 object-cover" />
        {badge && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium">
            {badge}
          </div>
        )}
      </div>
    )}
    <div className="p-6">
      <CardTitle className="text-lg mb-2">{title}</CardTitle>
      <CardDescription className="mb-4">{description}</CardDescription>
      {price && (
        <p className="text-2xl font-bold text-blue-600 mb-4">{price}</p>
      )}
      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  </Card>
));
ProductCard.displayName = "ProductCard";

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  StatsCard,
  FeatureCard,
  ProductCard,
  cardVariants
}
