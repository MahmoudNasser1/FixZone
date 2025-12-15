import React, { useMemo } from 'react';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * RepairProgressBar - Shows estimated repair progress and time
 * 
 * Features:
 * - Visual progress indicator
 * - Time remaining estimation
 * - Status-based coloring
 * - Overdue warning
 */

const statusProgress = {
    'pending': 10,
    'received': 15,
    'diagnosed': 25,
    'in_progress': 50,
    'waiting-parts': 60,
    'testing': 75,
    'quality-check': 85,
    'ready-for-pickup': 95,
    'completed': 100,
    'delivered': 100,
    'cancelled': 0
};

const statusColors = {
    'pending': '#F59E0B',
    'received': '#F59E0B',
    'diagnosed': '#3B82F6',
    'in_progress': '#3B82F6',
    'waiting-parts': '#F97316',
    'testing': '#8B5CF6',
    'quality-check': '#8B5CF6',
    'ready-for-pickup': '#10B981',
    'completed': '#10B981',
    'delivered': '#059669',
    'cancelled': '#EF4444'
};

export default function RepairProgressBar({ 
    status, 
    createdAt, 
    expectedDate,
    estimatedDays = 3,
    showDetails = true 
}) {
    const progress = statusProgress[status] || statusProgress['pending'];
    const color = statusColors[status] || '#6B7280';
    const isCancelled = status === 'cancelled';
    const isCompleted = ['completed', 'delivered', 'ready-for-pickup'].includes(status);

    // Calculate time remaining
    const timeInfo = useMemo(() => {
        if (isCancelled) return { text: 'ملغي', isOverdue: false };
        if (isCompleted) return { text: 'مكتمل', isOverdue: false };

        const now = new Date();
        const created = createdAt ? new Date(createdAt) : now;
        const expected = expectedDate 
            ? new Date(expectedDate) 
            : new Date(created.getTime() + estimatedDays * 24 * 60 * 60 * 1000);

        const diffMs = expected - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { 
                text: `متأخر ${Math.abs(diffDays)} يوم`, 
                isOverdue: true,
                daysRemaining: diffDays
            };
        } else if (diffDays === 0) {
            return { text: 'اليوم', isOverdue: false, daysRemaining: 0 };
        } else if (diffDays === 1) {
            return { text: 'غداً', isOverdue: false, daysRemaining: 1 };
        } else {
            return { 
                text: `${diffDays} أيام متبقية`, 
                isOverdue: false,
                daysRemaining: diffDays
            };
        }
    }, [createdAt, expectedDate, estimatedDays, isCancelled, isCompleted]);

    if (isCancelled) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">تم إلغاء هذا الطلب</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Progress Bar */}
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div 
                    className="absolute inset-y-0 right-0 rounded-full transition-all duration-500 ease-out"
                    style={{ 
                        width: `${progress}%`,
                        backgroundColor: timeInfo.isOverdue ? '#EF4444' : color
                    }}
                />
                {/* Animated shimmer effect for active progress */}
                {!isCompleted && (
                    <div 
                        className="absolute inset-y-0 right-0 rounded-full overflow-hidden"
                        style={{ width: `${progress}%` }}
                    >
                        <div 
                            className="absolute inset-0 bg-gradient-to-l from-white/30 to-transparent animate-shimmer"
                            style={{ animationDuration: '2s' }}
                        />
                    </div>
                )}
            </div>

            {/* Details */}
            {showDetails && (
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        {isCompleted ? (
                            <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>مكتمل</span>
                            </>
                        ) : (
                            <>
                                <Clock className="w-4 h-4" />
                                <span className={timeInfo.isOverdue ? 'text-red-500 font-medium' : ''}>
                                    {timeInfo.text}
                                </span>
                            </>
                        )}
                    </div>
                    <span 
                        className="font-bold"
                        style={{ color: timeInfo.isOverdue ? '#EF4444' : color }}
                    >
                        {progress}%
                    </span>
                </div>
            )}
        </div>
    );
}

/**
 * MiniProgressBar - Compact version for cards
 */
export function MiniProgressBar({ status }) {
    const progress = statusProgress[status] || statusProgress['pending'];
    const color = statusColors[status] || '#6B7280';

    return (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                    width: `${progress}%`,
                    backgroundColor: color
                }}
            />
        </div>
    );
}

/**
 * StatusStep indicator for detailed view
 */
export function StatusSteps({ currentStatus }) {
    const steps = [
        { id: 'pending', label: 'استلام' },
        { id: 'in_progress', label: 'إصلاح' },
        { id: 'ready-for-pickup', label: 'جاهز' },
        { id: 'delivered', label: 'تسليم' }
    ];

    const currentIndex = steps.findIndex(s => {
        if (currentStatus === 'completed') return s.id === 'ready-for-pickup';
        return s.id === currentStatus || 
               (currentStatus === 'waiting-parts' && s.id === 'in_progress') ||
               (currentStatus === 'testing' && s.id === 'in_progress');
    });

    return (
        <div className="flex items-center justify-between">
            {steps.map((step, index) => {
                const isActive = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const color = statusColors[step.id] || '#6B7280';

                return (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center">
                            <div 
                                className={`
                                    w-8 h-8 rounded-full flex items-center justify-center
                                    transition-all duration-300
                                    ${isCurrent ? 'ring-4 ring-opacity-30' : ''}
                                `}
                                style={{
                                    backgroundColor: isActive ? color : 'var(--muted)',
                                    ringColor: isCurrent ? color : 'transparent'
                                }}
                            >
                                {isActive ? (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                ) : (
                                    <span className="text-xs text-muted-foreground">{index + 1}</span>
                                )}
                            </div>
                            <span className={`
                                text-xs mt-1 whitespace-nowrap
                                ${isCurrent ? 'font-bold text-foreground' : 'text-muted-foreground'}
                            `}>
                                {step.label}
                            </span>
                        </div>
                        
                        {index < steps.length - 1 && (
                            <div 
                                className="flex-1 h-0.5 mx-2"
                                style={{
                                    backgroundColor: index < currentIndex ? color : 'var(--muted)'
                                }}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

