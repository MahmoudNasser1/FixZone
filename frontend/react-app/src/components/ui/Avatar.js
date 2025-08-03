import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva } from "class-variance-authority";
import { User } from "lucide-react";

import { cn } from "../../lib/utils";

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
        "2xl": "h-20 w-20",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const Avatar = React.forwardRef(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size }), className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// مكون Avatar محسن مع ميزات إضافية
const EnhancedAvatar = React.forwardRef(({ 
  src,
  alt,
  name,
  size = "md",
  showStatus = false,
  status = "offline",
  className,
  fallbackClassName,
  ...props 
}, ref) => {
  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar ref={ref} size={size} className={className} {...props}>
        <AvatarImage src={src} alt={alt || name} />
        <AvatarFallback className={cn("bg-primary/10 text-primary", fallbackClassName)}>
          {name ? getInitials(name) : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white",
            getStatusColor()
          )}
        />
      )}
    </div>
  );
});
EnhancedAvatar.displayName = "EnhancedAvatar";

// مكون Avatar مع Badge
const AvatarWithBadge = React.forwardRef(({ 
  badge,
  badgePosition = "bottom-right",
  ...props 
}, ref) => {
  const getBadgePosition = () => {
    switch (badgePosition) {
      case "top-left":
        return "top-0 left-0";
      case "top-right":
        return "top-0 right-0";
      case "bottom-left":
        return "bottom-0 left-0";
      default:
        return "bottom-0 right-0";
    }
  };

  return (
    <div className="relative inline-block">
      <EnhancedAvatar ref={ref} {...props} />
      {badge && (
        <div className={cn("absolute", getBadgePosition())}>
          {badge}
        </div>
      )}
    </div>
  );
});
AvatarWithBadge.displayName = "AvatarWithBadge";

// مجموعة من الـ Avatars
const AvatarGroup = React.forwardRef(({ 
  avatars = [],
  max = 3,
  size = "md",
  className,
  ...props 
}, ref) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div ref={ref} className={cn("flex -space-x-2", className)} {...props}>
      {visibleAvatars.map((avatar, index) => (
        <EnhancedAvatar
          key={index}
          size={size}
          className="border-2 border-white"
          {...avatar}
        />
      ))}
      
      {remainingCount > 0 && (
        <Avatar size={size} className="border-2 border-white">
          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});
AvatarGroup.displayName = "AvatarGroup";

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  EnhancedAvatar,
  AvatarWithBadge,
  AvatarGroup,
};
