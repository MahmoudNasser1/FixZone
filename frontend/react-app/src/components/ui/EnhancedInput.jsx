import React, { useState } from 'react';
import { cn } from "../../lib/utils";

/**
 * EnhancedInput Component - Enhanced input field with floating labels
 * 
 * Features:
 * - Floating label animation
 * - Focus ring with brand color
 * - Error state support
 * - Helper text support
 * - RTL support optimized
 * - Dark mode support
 * - Icon support
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.iconPosition - Icon position: 'left' | 'right'
 * @param {boolean} props.required - Required field
 */
export const EnhancedInput = React.forwardRef(({
    label,
    error,
    helperText,
    icon,
    iconPosition = 'right',
    required = false,
    className,
    ...props
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(props.value || props.defaultValue || '');

    const handleFocus = (e) => {
        setIsFocused(true);
        props.onFocus?.(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        props.onBlur?.(e);
    };

    const handleChange = (e) => {
        setHasValue(e.target.value);
        props.onChange?.(e);
    };

    const isFloating = isFocused || hasValue;

    return (
        <div className="w-full">
            <div className="relative">
                {/* Input Field */}
                <input
                    ref={ref}
                    className={cn(
                        'peer w-full px-4 py-3 rounded-lg',
                        'bg-background border-2 border-input',
                        'text-foreground placeholder-transparent',
                        'transition-all duration-base',
                        'focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue',
                        error && 'border-error focus:ring-error focus:border-error',
                        icon && iconPosition === 'left' && 'ps-12',
                        icon && iconPosition === 'right' && 'pe-12',
                        className
                    )}
                    placeholder={label}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    {...props}
                />

                {/* Floating Label */}
                {label && (
                    <label
                        className={cn(
                            'absolute text-muted-foreground pointer-events-none',
                            'transition-all duration-base',
                            'rtl:right-4 ltr:left-4',
                            isFloating
                                ? 'top-0 -translate-y-1/2 text-xs bg-background px-2 text-brand-blue'
                                : 'top-1/2 -translate-y-1/2 text-base',
                            error && isFloating && 'text-error',
                            icon && iconPosition === 'left' && !isFloating && 'rtl:right-12 ltr:left-12'
                        )}
                    >
                        {label}
                        {required && <span className="text-error ms-1">*</span>}
                    </label>
                )}

                {/* Icon */}
                {icon && (
                    <div className={cn(
                        'absolute top-1/2 -translate-y-1/2',
                        'text-muted-foreground',
                        iconPosition === 'left' ? 'rtl:right-4 ltr:left-4' : 'rtl:left-4 ltr:right-4',
                        isFocused && 'text-brand-blue',
                        error && 'text-error'
                    )}>
                        {icon}
                    </div>
                )}
            </div>

            {/* Helper Text / Error Message */}
            {(helperText || error) && (
                <p className={cn(
                    'mt-1.5 text-sm',
                    error ? 'text-error' : 'text-muted-foreground'
                )}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
});

EnhancedInput.displayName = 'EnhancedInput';

/**
 * EnhancedTextarea Component - Enhanced textarea with floating labels
 */
export const EnhancedTextarea = React.forwardRef(({
    label,
    error,
    helperText,
    required = false,
    className,
    rows = 4,
    ...props
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(props.value || props.defaultValue || '');

    const handleFocus = (e) => {
        setIsFocused(true);
        props.onFocus?.(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        props.onBlur?.(e);
    };

    const handleChange = (e) => {
        setHasValue(e.target.value);
        props.onChange?.(e);
    };

    const isFloating = isFocused || hasValue;

    return (
        <div className="w-full">
            <div className="relative">
                {/* Textarea Field */}
                <textarea
                    ref={ref}
                    rows={rows}
                    className={cn(
                        'peer w-full px-4 py-3 rounded-lg',
                        'bg-background border-2 border-input',
                        'text-foreground placeholder-transparent',
                        'transition-all duration-base resize-none',
                        'focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue',
                        error && 'border-error focus:ring-error focus:border-error',
                        className
                    )}
                    placeholder={label}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    {...props}
                />

                {/* Floating Label */}
                {label && (
                    <label
                        className={cn(
                            'absolute text-muted-foreground pointer-events-none',
                            'transition-all duration-base',
                            'rtl:right-4 ltr:left-4',
                            isFloating
                                ? 'top-0 -translate-y-1/2 text-xs bg-background px-2 text-brand-blue'
                                : 'top-4 text-base',
                            error && isFloating && 'text-error'
                        )}
                    >
                        {label}
                        {required && <span className="text-error ms-1">*</span>}
                    </label>
                )}
            </div>

            {/* Helper Text / Error Message */}
            {(helperText || error) && (
                <p className={cn(
                    'mt-1.5 text-sm',
                    error ? 'text-error' : 'text-muted-foreground'
                )}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
});

EnhancedTextarea.displayName = 'EnhancedTextarea';
