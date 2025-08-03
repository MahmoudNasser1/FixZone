import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

// Simple Switch Component without Radix
const Switch = forwardRef(({ 
  checked, 
  onCheckedChange, 
  disabled = false, 
  className,
  id,
  ...props 
}, ref) => {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      disabled={disabled}
      id={id}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked 
          ? "bg-blue-600 dark:bg-blue-500" 
          : "bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
});

Switch.displayName = "Switch";

// Labeled Switch Component
const LabeledSwitch = ({ 
  label, 
  description, 
  checked, 
  onCheckedChange, 
  disabled = false,
  className,
  ...props 
}) => {
  return (
    <div className={cn("flex items-center space-x-2 space-x-reverse", className)}>
      <Switch 
        checked={checked} 
        onCheckedChange={onCheckedChange} 
        disabled={disabled}
        {...props}
      />
      <div className="grid gap-1.5 leading-none">
        {label && (
          <label 
            htmlFor={props.id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

// Settings Switch Component
const SettingsSwitch = ({ 
  title, 
  description, 
  checked, 
  onCheckedChange, 
  disabled = false,
  className,
  ...props 
}) => {
  return (
    <div className={cn("flex items-center justify-between space-x-2", className)}>
      <div className="space-y-0.5">
        <div className="text-base">{title}</div>
        {description && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </div>
        )}
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={onCheckedChange} 
        disabled={disabled}
        {...props}
      />
    </div>
  );
};

export default Switch;
export { Switch, LabeledSwitch, SettingsSwitch };
