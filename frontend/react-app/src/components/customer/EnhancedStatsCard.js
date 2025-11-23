import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * 🎨 Enhanced Stats Card
 * 
 * المميزات:
 * - Gradient background
 * - Icon كبير واضح
 * - عرض التغيير (زيادة/نقصان)
 * - Action button اختياري
 * - Hover effects
 */

export default function EnhancedStatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    gradient,
    change,
    changeType = 'neutral',
    actionLabel,
    onClick
}) {
    return (
        <div
            className="relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 cursor-pointer group"
            style={{
                background: gradient || 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)'
            }}
            onClick={onClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            }}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/30 blur-2xl"></div>
                <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/20 blur-2xl"></div>
            </div>

            <div className="relative p-6">
                <div className="flex items-start justify-between">
                    {/* Left - Content */}
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white/90 mb-2">{title}</p>
                        <p className="text-3xl font-bold text-white mb-1">{value}</p>
                        {subtitle && (
                            <p className="text-sm text-white/80">{subtitle}</p>
                        )}

                        {/* Change Indicator */}
                        {change && (
                            <div className={`flex items-center gap-1 mt-2 text-sm ${changeType === 'increase' ? 'text-green-200' :
                                    changeType === 'decrease' ? 'text-red-200' :
                                        'text-white/80'
                                }`}>
                                {changeType === 'increase' && <TrendingUp className="w-4 h-4" />}
                                {changeType === 'decrease' && <TrendingDown className="w-4 h-4" />}
                                <span>{change}</span>
                            </div>
                        )}
                    </div>

                    {/* Right - Icon */}
                    {Icon && (
                        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Icon className="w-8 h-8 text-white" />
                        </div>
                    )}
                </div>

                {/* Action Label */}
                {actionLabel && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-sm text-white/90 group-hover:text-white transition-colors flex items-center gap-2">
                            {actionLabel}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">←</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
