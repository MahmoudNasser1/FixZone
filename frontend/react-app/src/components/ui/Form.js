import * as React from "react";
import { cva } from "class-variance-authority";
import { AlertCircle, CheckCircle } from "lucide-react";

import { cn } from "../../lib/utils";
import { Label } from "./Label";
import { Input } from "./Input";
import { Textarea } from "./Textarea";

const formVariants = cva(
  "space-y-6",
  {
    variants: {
      layout: {
        vertical: "space-y-6",
        horizontal: "space-y-4",
        inline: "flex flex-wrap gap-4",
      },
    },
    defaultVariants: {
      layout: "vertical",
    },
  }
);

const Form = React.forwardRef(({ className, layout, ...props }, ref) => (
  <form
    ref={ref}
    className={cn(formVariants({ layout }), className)}
    {...props}
  />
));
Form.displayName = "Form";

const FormField = React.forwardRef(({ 
  className, 
  error,
  success,
  children,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "space-y-2",
      error && "space-y-1",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
FormField.displayName = "FormField";

const FormLabel = React.forwardRef(({ 
  className, 
  required,
  children,
  ...props 
}, ref) => (
  <Label
    ref={ref}
    className={cn(
      "text-sm font-medium text-gray-700",
      className
    )}
    {...props}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </Label>
));
FormLabel.displayName = "FormLabel";

const FormInput = React.forwardRef(({ 
  className, 
  error,
  success,
  ...props 
}, ref) => (
  <Input
    ref={ref}
    className={cn(
      error && "border-red-500 focus:border-red-500 focus:ring-red-500",
      success && "border-green-500 focus:border-green-500 focus:ring-green-500",
      className
    )}
    {...props}
  />
));
FormInput.displayName = "FormInput";

const FormTextarea = React.forwardRef(({ 
  className, 
  error,
  success,
  ...props 
}, ref) => (
  <Textarea
    ref={ref}
    className={cn(
      error && "border-red-500 focus:border-red-500 focus:ring-red-500",
      success && "border-green-500 focus:border-green-500 focus:ring-green-500",
      className
    )}
    {...props}
  />
));
FormTextarea.displayName = "FormTextarea";

const FormSelect = React.forwardRef(({ 
  className, 
  error,
  success,
  children,
  ...props 
}, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      error && "border-red-500 focus:border-red-500 focus:ring-red-500",
      success && "border-green-500 focus:border-green-500 focus:ring-green-500",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
FormSelect.displayName = "FormSelect";

const FormError = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-2 text-sm text-red-600",
      className
    )}
    {...props}
  >
    <AlertCircle className="h-4 w-4" />
    {children}
  </div>
));
FormError.displayName = "FormError";

const FormSuccess = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-2 text-sm text-green-600",
      className
    )}
    {...props}
  >
    <CheckCircle className="h-4 w-4" />
    {children}
  </div>
));
FormSuccess.displayName = "FormSuccess";

const FormHelp = React.forwardRef(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-gray-500",
      className
    )}
    {...props}
  >
    {children}
  </p>
));
FormHelp.displayName = "FormHelp";

// مكون حقل النموذج المتكامل
const FormFieldGroup = React.forwardRef(({ 
  label,
  name,
  type = "text",
  required = false,
  error,
  success,
  help,
  placeholder,
  value,
  onChange,
  className,
  inputClassName,
  ...props 
}, ref) => {
  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <FormTextarea
            ref={ref}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            error={error}
            success={success}
            className={inputClassName}
            {...props}
          />
        );
      case "select":
        return (
          <FormSelect
            ref={ref}
            name={name}
            value={value}
            onChange={onChange}
            error={error}
            success={success}
            className={inputClassName}
            {...props}
          />
        );
      default:
        return (
          <FormInput
            ref={ref}
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            error={error}
            success={success}
            className={inputClassName}
            {...props}
          />
        );
    }
  };

  return (
    <FormField className={className}>
      {label && (
        <FormLabel htmlFor={name} required={required}>
          {label}
        </FormLabel>
      )}
      {renderInput()}
      {error && <FormError>{error}</FormError>}
      {success && <FormSuccess>{success}</FormSuccess>}
      {help && <FormHelp>{help}</FormHelp>}
    </FormField>
  );
});
FormFieldGroup.displayName = "FormFieldGroup";

export {
  Form,
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
  FormError,
  FormSuccess,
  FormHelp,
  FormFieldGroup,
};
