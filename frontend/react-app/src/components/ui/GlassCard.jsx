import React from 'react';
import { cn } from "../../lib/utils";

/**
 * GlassCard Component - Card with Glassmorphism effect
 * 
 * Features:
 * - Backdrop blur effect
 * - Semi-transparent background
 * - Smooth hover animations
 * - Full dark mode support
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hover - Enable hover lift effect
 * @param {string} props.variant - Card variant: 'default' | 'bordered' | 'elevated'
 */
export const GlassCard = React.forwardRef(({
    children,
    className,
    hover = false,
    variant = 'default',
    ...props
}, ref) => {
    const variants = {
        default: 'bg-card/70 backdrop-blur-glass border border-border/50',
        bordered: 'bg-card/80 backdrop-blur-glass border-2 border-border',
        elevated: 'bg-card/60 backdrop-blur-glass shadow-lg border border-border/30',
    };

    return (
        <div
            ref={ref}
            className={cn(
                'rounded-lg transition-all duration-base',
                variants[variant],
                hover && 'hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});

GlassCard.displayName = 'GlassCard';

/**
 * StatsCard Component - Card for displaying statistics
 * 
 * @param {Object} props
 * @param {string} props.title - Stat title
 * @param {string|number} props.value - Stat value
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.trend - Trend indicator: 'up' | 'down' | 'neutral'
 * @param {string} props.gradient - Gradient color: 'blue' | 'green' | 'purple' | 'orange'
 */
export const StatsCard = ({
    title,
    value,
    icon,
    trend,
    trendValue,
    gradient = 'blue',
    className,
    ...props
}) => {
    const gradients = {
        blue: 'from-brand-blue to-brand-blue-light',
        green: 'from-brand-green to-emerald-600',
        purple: 'from-brand-purple to-purple-600',
        orange: 'from-brand-orange to-orange-600',
    };

    const trendColors = {
        up: 'text-success',
        down: 'text-error',
        neutral: 'text-muted-foreground',
    };

    return (
        <GlassCard
            hover
            variant="elevated"
            className={cn('p-6', className)}
            {...props}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">{value}</h3>
                    {trend && trendValue && (
                        <p className={cn('text-sm mt-2 font-medium', trendColors[trend])}>
                            {trend === 'up' && '↑'} {trend === 'down' && '↓'} {trendValue}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className={cn(
                        'p-3 rounded-lg bg-gradient-to-br',
                        gradients[gradient],
                        'text-white shadow-md'
                    )}>
                        {icon}
                    </div>
                )}
            </div>
        </GlassCard>
    );
};

StatsCard.displayName = 'StatsCard';
