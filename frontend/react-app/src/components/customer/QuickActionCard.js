import React from 'react';

/**
 * 🎯 Quick Action Card
 * 
 * المميزات:
 * - Gradient background
 * - Icon واضح
 * - Hover animation
 * - Badge اختياري
 */

export default function QuickActionCard({
    icon: Icon,
    label,
    gradient,
    onClick,
    badge
}) {
    return (
        <button
            onClick={onClick}
            className="relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 group text-white p-6 flex flex-col items-center justify-center gap-3 min-h-[140px]"
            style={{
                background: gradient || 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            }}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/30 blur-xl"></div>
                <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/20 blur-xl"></div>
            </div>

            {/* Badge */}
            {badge && (
                <span
                    className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold shadow-lg"
                    style={{
                        background: '#EF4444',
                        color: 'white'
                    }}
                >
                    {badge}
                </span>
            )}

            {/* Icon */}
            <div className="relative w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-10 h-10" />
            </div>

            {/* Label */}
            <span className="relative text-base font-semibold group-hover:scale-105 transition-transform duration-300">
                {label}
            </span>

            {/* Hover Arrow */}
            <div className="absolute bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-sm">←</span>
            </div>
        </button>
    );
}
