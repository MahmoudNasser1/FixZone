import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const tabsVariants = cva(
  "w-full",
  {
    variants: {
      orientation: {
        horizontal: "w-full",
        vertical: "flex gap-4",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
);

const tabsListVariants = cva(
  "inline-flex items-center justify-center rounded-md p-1 text-muted-foreground",
  {
    variants: {
      variant: {
        default: "bg-muted",
        underline: "bg-transparent border-b border-border",
        pills: "bg-gray-100 gap-1",
        buttons: "bg-transparent gap-2",
      },
      orientation: {
        horizontal: "h-10 w-full",
        vertical: "h-auto w-48 flex-col",
      },
    },
    defaultVariants: {
      variant: "default",
      orientation: "horizontal",
    },
  }
);

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        underline: "border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:text-primary",
        pills: "rounded-full data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        buttons: "border border-transparent rounded-md data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
      },
      orientation: {
        horizontal: "",
        vertical: "w-full justify-start",
      },
    },
    defaultVariants: {
      variant: "default",
      orientation: "horizontal",
    },
  }
);

const Tabs = React.forwardRef(({ 
  className, 
  orientation = "horizontal",
  ...props 
}, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    orientation={orientation}
    className={cn(tabsVariants({ orientation }), className)}
    {...props}
  />
));
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef(({ 
  className, 
  variant = "default",
  orientation = "horizontal",
  ...props 
}, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant, orientation }), className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ 
  className, 
  variant = "default",
  orientation = "horizontal",
  ...props 
}, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant, orientation }), className)}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// مكون Tabs محسن مع ميزات إضافية
const EnhancedTabs = React.forwardRef(({ 
  items = [],
  defaultValue,
  variant = "default",
  orientation = "horizontal",
  className,
  onValueChange,
  ...props 
}, ref) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue || items[0]?.value);

  const handleValueChange = (value) => {
    setActiveTab(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <Tabs
      ref={ref}
      value={activeTab}
      onValueChange={handleValueChange}
      orientation={orientation}
      className={className}
      {...props}
    >
      <TabsList variant={variant} orientation={orientation}>
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            variant={variant}
            orientation={orientation}
            disabled={item.disabled}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
            {item.badge && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {item.badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
});
EnhancedTabs.displayName = "EnhancedTabs";

// مكون Tabs للإعدادات
const SettingsTabs = React.forwardRef(({ 
  sections = [],
  className,
  ...props 
}, ref) => {
  return (
    <EnhancedTabs
      ref={ref}
      items={sections}
      variant="underline"
      className={cn("w-full", className)}
      {...props}
    />
  );
});
SettingsTabs.displayName = "SettingsTabs";

// مكون Tabs للتنقل
const NavigationTabs = React.forwardRef(({ 
  routes = [],
  className,
  ...props 
}, ref) => {
  return (
    <EnhancedTabs
      ref={ref}
      items={routes}
      variant="buttons"
      className={cn("w-full", className)}
      {...props}
    />
  );
});
NavigationTabs.displayName = "NavigationTabs";

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  EnhancedTabs,
  SettingsTabs,
  NavigationTabs,
};
