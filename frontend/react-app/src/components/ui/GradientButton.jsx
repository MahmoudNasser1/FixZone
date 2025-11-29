import React from 'react';
import { cn } from "../../lib/utils";

/**
 * GradientButton Component - Button with dynamic gradient backgrounds
 * 
 * Features:
 * - Multiple color variants with gradients
 * - Smooth hover and active states
 * - Loading state support
 * - Full dark mode support
 * - Icon support
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant: 'primary' | 'success' | 'purple' | 'orange' | 'ghost'
 * @param {string} props.size - Button size: 'sm' | 'md' | 'lg'
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.disabled - Disabled state
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.iconPosition - Icon position: 'left' | 'right'
 */
export const GradientButton = React.forwardRef(({
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    ...props
}, ref) => {
    const variants = {
        primary: 'bg-gradient-to-r from-brand-blue to-brand-blue-light hover:from-brand-blue-light hover:to-brand-blue text-white shadow-md hover:shadow-lg',
        success: 'bg-gradient-to-r from-brand-green to-emerald-600 hover:from-emerald-600 hover:to-brand-green text-white shadow-md hover:shadow-lg',
        purple: 'bg-gradient-to-r from-brand-purple to-purple-600 hover:from-purple-600 hover:to-brand-purple text-white shadow-md hover:shadow-lg',
        orange: 'bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-600 hover:to-brand-orange text-white shadow-md hover:shadow-lg',
        ghost: 'bg-transparent hover:bg-accent text-foreground border border-border',
        outline: 'bg-transparent hover:bg-brand-blue/10 text-brand-blue border-2 border-brand-blue',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
                'transition-all duration-base ease-in-out',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {loading && (
                <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {icon && iconPosition === 'left' && !loading && icon}
            {children}
            {icon && iconPosition === 'right' && !loading && icon}
        </button>
    );
});

GradientButton.displayName = 'GradientButton';
