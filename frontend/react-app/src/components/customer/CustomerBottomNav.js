import React, { useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Wrench,
    FileText,
    Bell,
    User
} from 'lucide-react';

/**
 * CustomerBottomNav - Mobile Bottom Navigation
 * 
 * Features:
 * - Fixed bottom navigation for mobile devices
 * - 5 main navigation items with notification badge
 * - Active state with animation
 * - RTL support
 * - Safe area padding for notch devices
 * - Haptic feedback support
 */

const navItems = [
    {
        path: '/customer/dashboard',
        icon: LayoutDashboard,
        label: 'الرئيسية',
        color: '#053887',
        id: 'dashboard'
    },
    {
        path: '/customer/repairs',
        icon: Wrench,
        label: 'الإصلاحات',
        color: '#3B82F6',
        id: 'repairs'
    },
    {
        path: '/customer/invoices',
        icon: FileText,
        label: 'الفواتير',
        color: '#10B981',
        id: 'invoices'
    },
    {
        path: '/customer/notifications',
        icon: Bell,
        label: 'الإشعارات',
        color: '#F59E0B',
        id: 'notifications'
    },
    {
        path: '/customer/profile',
        icon: User,
        label: 'حسابي',
        color: '#8B5CF6',
        id: 'profile'
    }
];

export default function CustomerBottomNav({ notificationCount = 0, pendingInvoices = 0 }) {
    const location = useLocation();

    const isActive = (path) => {
        // Special handling for dashboard - exact match only
        if (path === '/customer/dashboard') {
            return location.pathname === path;
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    // Haptic feedback for supported devices
    const triggerHaptic = useCallback(() => {
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }, []);

    // Get badge count for specific items
    const getBadgeCount = (itemId) => {
        switch (itemId) {
            case 'notifications':
                return notificationCount;
            case 'invoices':
                return pendingInvoices;
            default:
                return 0;
        }
    };

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom">
            {/* Background Blur */}
            <div className="absolute inset-0 bg-card/80 backdrop-blur-xl" />
            
            <div className="relative flex items-center justify-around px-2 py-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    const badgeCount = getBadgeCount(item.id);

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={triggerHaptic}
                            className={`
                                flex flex-col items-center justify-center
                                min-w-[56px] py-1.5 px-2 rounded-xl
                                transition-all duration-200 active:scale-95
                                ${active ? 'scale-105' : 'opacity-70 hover:opacity-100'}
                            `}
                        >
                            {/* Icon Container */}
                            <div
                                className={`
                                    relative w-10 h-10 rounded-xl flex items-center justify-center
                                    transition-all duration-300 mb-0.5
                                    ${active 
                                        ? 'shadow-lg' 
                                        : 'bg-transparent'
                                    }
                                `}
                                style={{
                                    backgroundColor: active ? item.color : 'transparent',
                                    boxShadow: active ? `0 4px 12px ${item.color}40` : 'none'
                                }}
                            >
                                <Icon 
                                    className={`w-5 h-5 transition-colors duration-200`}
                                    style={{ 
                                        color: active ? 'white' : item.color 
                                    }}
                                />

                                {/* Notification Badge */}
                                {badgeCount > 0 && (
                                    <span 
                                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-lg animate-pulse"
                                        style={{ boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)' }}
                                    >
                                        {badgeCount > 99 ? '99+' : badgeCount}
                                    </span>
                                )}

                                {/* Active Indicator Dot */}
                                {active && (
                                    <span 
                                        className="absolute -bottom-1 w-1 h-1 rounded-full bg-white"
                                        style={{ 
                                            boxShadow: `0 0 4px ${item.color}` 
                                        }}
                                    />
                                )}
                            </div>

                            {/* Label */}
                            <span
                                className={`
                                    text-[10px] font-medium transition-colors duration-200
                                    ${active ? 'text-foreground' : 'text-muted-foreground'}
                                `}
                            >
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>

            {/* Safe Area Padding for notch devices */}
            <div className="h-safe-area-inset-bottom bg-card" />
        </nav>
    );
}

