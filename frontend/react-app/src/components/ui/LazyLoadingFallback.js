import React from 'react';

/**
 * LazyLoadingFallback - Loading indicator for lazy-loaded components
 * 
 * Features:
 * - Smooth loading animation
 * - Brand-consistent design
 * - Responsive layout
 */

export default function LazyLoadingFallback({ message = 'جاري التحميل...' }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
            <div className="text-center">
                {/* Animated Logo/Spinner */}
                <div className="relative mb-6">
                    <div className="w-16 h-16 mx-auto">
                        {/* Outer ring */}
                        <div className="absolute inset-0 border-4 border-muted rounded-full" />
                        {/* Spinning ring */}
                        <div 
                            className="absolute inset-0 border-4 border-transparent border-t-brand-blue rounded-full animate-spin"
                            style={{ animationDuration: '1s' }}
                        />
                        {/* Inner pulsing dot */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-brand-blue animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Loading Text */}
                <p className="text-muted-foreground font-medium animate-pulse">
                    {message}
                </p>
            </div>
        </div>
    );
}

/**
 * Compact loading indicator for smaller areas
 */
export function CompactLoader({ size = 'md' }) {
    const sizes = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    return (
        <div className="flex items-center justify-center p-4">
            <div 
                className={`${sizes[size]} border-muted border-t-brand-blue rounded-full animate-spin`}
            />
        </div>
    );
}

/**
 * Skeleton loader for cards
 */
export function CardSkeleton() {
    return (
        <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-4" />
            <div className="h-3 bg-muted rounded w-1/2 mb-3" />
            <div className="h-3 bg-muted rounded w-2/3" />
        </div>
    );
}

/**
 * Page-level skeleton loader
 */
export function PageSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-pulse" dir="rtl">
            {/* Header skeleton */}
            <div className="mb-8">
                <div className="h-8 bg-muted rounded w-48 mb-2" />
                <div className="h-4 bg-muted rounded w-32" />
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card rounded-xl border border-border p-6">
                        <div className="h-10 bg-muted rounded mb-2" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                ))}
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}

