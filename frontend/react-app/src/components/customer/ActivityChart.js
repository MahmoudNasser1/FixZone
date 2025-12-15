import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

/**
 * ActivityChart - Mini Chart for Dashboard
 * 
 * Features:
 * - Shows repair activity over last 7 days
 * - Animated bars
 * - Trend indicator
 * - Responsive design
 * - Dark mode support
 */

export default function ActivityChart({ 
    data = [], 
    title = 'نشاط الإصلاحات',
    subtitle = 'آخر 7 أيام',
    color = '#3B82F6'
}) {
    // Generate sample data if none provided
    const chartData = useMemo(() => {
        if (data.length > 0) return data;
        
        // Generate sample data for visualization
        const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
        const today = new Date().getDay();
        
        return days.map((day, index) => ({
            day,
            value: Math.floor(Math.random() * 5) + 1,
            isToday: index === today
        }));
    }, [data]);

    // Calculate max value for scaling
    const maxValue = Math.max(...chartData.map(d => d.value), 1);

    // Calculate trend (comparing last 3 days to previous 3 days)
    const trend = useMemo(() => {
        if (chartData.length < 6) return 0;
        const recent = chartData.slice(-3).reduce((sum, d) => sum + d.value, 0);
        const previous = chartData.slice(-6, -3).reduce((sum, d) => sum + d.value, 0);
        if (previous === 0) return recent > 0 ? 100 : 0;
        return Math.round(((recent - previous) / previous) * 100);
    }, [chartData]);

    // Total repairs this period
    const totalRepairs = chartData.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="bg-card rounded-xl border border-border p-5 h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-bold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${color}15` }}
                    >
                        <Activity className="w-5 h-5" style={{ color }} />
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 mb-4">
                <div>
                    <p className="text-2xl font-bold text-foreground">{totalRepairs}</p>
                    <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
                </div>
                
                {trend !== 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${
                        trend > 0 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                        {trend > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-medium">{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className="flex items-end justify-between gap-2 h-24">
                {chartData.map((item, index) => {
                    const height = (item.value / maxValue) * 100;
                    return (
                        <div 
                            key={index} 
                            className="flex-1 flex flex-col items-center gap-1"
                        >
                            {/* Bar */}
                            <div className="w-full h-20 flex items-end justify-center">
                                <div
                                    className={`w-full max-w-8 rounded-t-md transition-all duration-500 ease-out ${
                                        item.isToday ? 'animate-pulse' : ''
                                    }`}
                                    style={{
                                        height: `${height}%`,
                                        minHeight: item.value > 0 ? '8px' : '4px',
                                        backgroundColor: item.isToday ? color : `${color}60`,
                                        animationDuration: '2s'
                                    }}
                                />
                            </div>
                            {/* Label */}
                            <span className={`text-[10px] ${
                                item.isToday 
                                    ? 'text-foreground font-bold' 
                                    : 'text-muted-foreground'
                            }`}>
                                {item.day.slice(0, 2)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>الأقل: {Math.min(...chartData.map(d => d.value))}</span>
                <span>الأكثر: {maxValue}</span>
            </div>
        </div>
    );
}

/**
 * MiniActivityIndicator - Compact version for tight spaces
 */
export function MiniActivityIndicator({ 
    value = 0, 
    maxValue = 10, 
    label = 'نشاط',
    color = '#3B82F6' 
}) {
    const percentage = Math.min((value / maxValue) * 100, 100);

    return (
        <div className="flex items-center gap-3">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-bold text-foreground">{value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                            width: `${percentage}%`,
                            backgroundColor: color
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

