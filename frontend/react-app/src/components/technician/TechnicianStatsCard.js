import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

/**
 * 📊 Technician Stats Card
 * 
 * المميزات:
 * - تصميم عصري مع Gradient
 * - أيقونة مع خلفية شفافة
 * - مؤشر التغيير (Change Indicator)
 * - Hover Effects
 */

export default function TechnicianStatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    gradient,
    change,
    changeType = 'neutral',
    onClick
}) {
    const getChangeColor = () => {
        if (changeType === 'increase') return 'text-green-600 bg-green-50';
        if (changeType === 'decrease') return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
    };

    const getChangeIcon = () => {
        if (changeType === 'increase') return ArrowUpRight;
        if (changeType === 'decrease') return ArrowDownRight;
        return Minus;
    };

    const ChangeIcon = getChangeIcon();

    return (
        <div
            onClick={onClick}
            className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group"
        >
            {/* Background Gradient Overlay */}
            <div
                className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full transition-transform duration-500 group-hover:scale-110 bg-gradient-to-br ${gradient}`}
            />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    {/* Icon Container */}
                    <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md transform transition-transform duration-300 group-hover:rotate-6`}
                    >
                        <Icon className="w-6 h-6" />
                    </div>

                    {/* Change Indicator */}
                    {change && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${getChangeColor()}`}>
                            <ChangeIcon className="w-3 h-3" />
                            {change}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{value}</h3>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
