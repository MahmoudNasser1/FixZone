import React from 'react';

/**
 * SkeletonDashboard - Loading placeholder for dashboard
 * 
 * Features:
 * - Animated skeleton cards
 * - Matches dashboard layout
 * - Smooth pulse animation
 */

const SkeletonCard = ({ className = '' }) => (
    <div className={`bg-card rounded-xl p-6 animate-pulse ${className}`}>
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <div className="h-4 bg-muted rounded w-24 mb-3" />
                <div className="h-8 bg-muted rounded w-16 mb-2" />
                <div className="h-3 bg-muted rounded w-20" />
            </div>
            <div className="w-14 h-14 bg-muted rounded-xl" />
        </div>
        <div className="mt-4 pt-4 border-t border-border">
            <div className="h-3 bg-muted rounded w-20" />
        </div>
    </div>
);

const SkeletonQuickAction = () => (
    <div className="bg-card rounded-xl p-4 animate-pulse">
        <div className="w-12 h-12 bg-muted rounded-xl mx-auto mb-3" />
        <div className="h-4 bg-muted rounded w-20 mx-auto" />
    </div>
);

const SkeletonListItem = () => (
    <div className="p-4 rounded-lg border border-border animate-pulse">
        <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
                <div className="h-4 bg-muted rounded w-20 mb-2" />
                <div className="h-3 bg-muted rounded w-32" />
            </div>
            <div className="h-6 bg-muted rounded-full w-20" />
        </div>
        <div className="h-3 bg-muted rounded w-full mt-3" />
    </div>
);

export default function SkeletonDashboard() {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Welcome Banner Skeleton */}
            <div className="mb-8 p-6 rounded-2xl bg-muted animate-pulse">
                <div className="h-8 bg-muted-foreground/10 rounded w-64 mb-3" />
                <div className="h-4 bg-muted-foreground/10 rounded w-96" />
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>

                {/* Quick Actions Skeleton */}
                <div className="mb-8">
                    <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <SkeletonQuickAction key={i} />
                        ))}
                    </div>
                </div>

                {/* Lists Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Repairs List */}
                    <div className="bg-card rounded-xl p-6 border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-6 bg-muted rounded w-40 animate-pulse" />
                            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <SkeletonListItem key={i} />
                            ))}
                        </div>
                    </div>

                    {/* Invoices List */}
                    <div className="bg-card rounded-xl p-6 border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
                            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <SkeletonListItem key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export individual skeleton components for reuse
export { SkeletonCard, SkeletonListItem, SkeletonQuickAction };

