import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * usePullToRefresh - Hook for implementing pull-to-refresh functionality
 * 
 * Features:
 * - Touch gesture detection
 * - Visual feedback during pull
 * - Configurable threshold and callback
 * - Works with scrollable containers
 */

export default function usePullToRefresh({
    onRefresh,
    threshold = 80,
    refreshTimeout = 2000,
    disabled = false
}) {
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const startY = useRef(0);
    const containerRef = useRef(null);

    const handleTouchStart = useCallback((e) => {
        if (disabled || isRefreshing) return;
        
        // Only trigger when at top of container
        const container = containerRef.current;
        if (container && container.scrollTop > 0) return;
        
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
    }, [disabled, isRefreshing]);

    const handleTouchMove = useCallback((e) => {
        if (!isPulling || disabled || isRefreshing) return;
        
        const container = containerRef.current;
        if (container && container.scrollTop > 0) {
            setIsPulling(false);
            setPullDistance(0);
            return;
        }
        
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;
        
        if (diff > 0) {
            // Apply resistance
            const resistance = 0.5;
            const newPullDistance = Math.min(diff * resistance, threshold * 1.5);
            setPullDistance(newPullDistance);
            
            // Prevent scroll bounce
            if (newPullDistance > 0) {
                e.preventDefault();
            }
        }
    }, [isPulling, disabled, isRefreshing, threshold]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling || disabled) return;
        
        setIsPulling(false);
        
        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true);
            
            try {
                // Provide haptic feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                await onRefresh?.();
            } catch (error) {
                console.error('Refresh failed:', error);
            }
            
            // Reset after timeout or callback
            setTimeout(() => {
                setIsRefreshing(false);
                setPullDistance(0);
            }, refreshTimeout);
        } else {
            setPullDistance(0);
        }
    }, [isPulling, disabled, pullDistance, threshold, isRefreshing, onRefresh, refreshTimeout]);

    // Add event listeners to container
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    // Calculate progress (0-1)
    const progress = Math.min(pullDistance / threshold, 1);
    const readyToRefresh = pullDistance >= threshold;

    return {
        containerRef,
        isPulling,
        isRefreshing,
        pullDistance,
        progress,
        readyToRefresh
    };
}

/**
 * PullToRefreshIndicator - Visual component for pull-to-refresh
 */
export function PullToRefreshIndicator({ 
    progress, 
    isRefreshing, 
    readyToRefresh,
    pullDistance 
}) {
    if (pullDistance <= 0 && !isRefreshing) return null;

    return (
        <div 
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200 pointer-events-none"
            style={{ 
                height: isRefreshing ? 60 : pullDistance,
                opacity: Math.min(progress, 1)
            }}
        >
            <div className={`
                flex flex-col items-center justify-center
                ${isRefreshing ? 'animate-bounce' : ''}
            `}>
                <div 
                    className="w-10 h-10 rounded-full border-4 border-brand-blue/30 flex items-center justify-center mb-1 bg-card shadow-lg"
                    style={{
                        transform: `rotate(${progress * 360}deg)`,
                        transition: isRefreshing ? 'none' : 'transform 0.1s'
                    }}
                >
                    {isRefreshing ? (
                        <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg 
                            className={`w-5 h-5 transition-transform duration-200 ${
                                readyToRefresh ? 'text-brand-blue' : 'text-muted-foreground'
                            }`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                            style={{
                                transform: readyToRefresh ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                            />
                        </svg>
                    )}
                </div>
                <span className={`text-xs font-medium ${
                    readyToRefresh || isRefreshing ? 'text-brand-blue' : 'text-muted-foreground'
                }`}>
                    {isRefreshing ? 'جاري التحديث...' : readyToRefresh ? 'اترك للتحديث' : 'اسحب للتحديث'}
                </span>
            </div>
        </div>
    );
}

/**
 * withPullToRefresh - HOC for adding pull-to-refresh to any component
 */
export function withPullToRefresh(WrappedComponent) {
    return function PullToRefreshWrapper({ onRefresh, ...props }) {
        const { 
            containerRef, 
            progress, 
            isRefreshing, 
            readyToRefresh, 
            pullDistance 
        } = usePullToRefresh({ onRefresh });

        return (
            <>
                <PullToRefreshIndicator 
                    progress={progress}
                    isRefreshing={isRefreshing}
                    readyToRefresh={readyToRefresh}
                    pullDistance={pullDistance}
                />
                <div ref={containerRef} className="min-h-screen overflow-y-auto">
                    <WrappedComponent {...props} isRefreshing={isRefreshing} />
                </div>
            </>
        );
    };
}

