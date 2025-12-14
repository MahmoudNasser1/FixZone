import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Wrench,
    FileText,
    Package,
    User,
    Settings,
    HelpCircle,
    Bell,
    X,
    Shield,
    ChevronLeft
} from 'lucide-react';

/**
 * CustomerSidebar - Desktop Navigation Sidebar
 * 
 * Features:
 * - Animated navigation links with active states
 * - Brand gradient header
 * - Collapsible on mobile
 * - RTL support
 */

const navItems = [
    {
        path: '/customer/dashboard',
        icon: LayoutDashboard,
        label: 'لوحة التحكم',
        color: '#053887'
    },
    {
        path: '/customer/repairs',
        icon: Wrench,
        label: 'طلبات الإصلاح',
        color: '#3B82F6'
    },
    {
        path: '/customer/invoices',
        icon: FileText,
        label: 'الفواتير',
        color: '#10B981'
    },
    {
        path: '/customer/devices',
        icon: Package,
        label: 'أجهزتي',
        color: '#8B5CF6'
    },
    {
        path: '/customer/notifications',
        icon: Bell,
        label: 'الإشعارات',
        color: '#F59E0B'
    }
];

const bottomNavItems = [
    {
        path: '/customer/profile',
        icon: User,
        label: 'الملف الشخصي'
    },
    {
        path: '/customer/settings',
        icon: Settings,
        label: 'الإعدادات'
    },
    {
        path: '/customer/help',
        icon: HelpCircle,
        label: 'المساعدة'
    }
];

export default function CustomerSidebar({ isOpen, onClose, user, notificationCount = 0 }) {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 right-0 h-full w-72 bg-card border-l border-border z-50
                    transform transition-transform duration-300 ease-out
                    lg:translate-x-0 lg:static lg:z-auto
                    ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                    flex flex-col shadow-xl lg:shadow-none
                `}
            >
                {/* Header */}
                <div className="p-4 border-b border-border bg-gradient-to-l from-brand-blue to-brand-blue-light">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-white">
                                <h2 className="font-bold text-lg">Fix Zone</h2>
                                <p className="text-xs opacity-90">بوابة العملاء</p>
                            </div>
                        </div>
                        
                        {/* Mobile Close Button */}
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="mt-4 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                                {user?.name?.charAt(0) || 'م'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold truncate">{user?.name || 'عميل'}</p>
                                <p className="text-white/70 text-xs truncate">{user?.phone || user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            const showBadge = item.path === '/customer/notifications' && notificationCount > 0;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl font-medium
                                        transition-all duration-200 relative group
                                        ${active
                                            ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }
                                    `}
                                >
                                    <div
                                        className={`
                                            w-9 h-9 rounded-lg flex items-center justify-center
                                            transition-all duration-200
                                            ${active
                                                ? 'bg-white/20'
                                                : 'bg-muted group-hover:bg-white group-hover:shadow-md'
                                            }
                                        `}
                                        style={{
                                            backgroundColor: active ? undefined : `${item.color}15`
                                        }}
                                    >
                                        <Icon
                                            className="w-5 h-5"
                                            style={{ color: active ? 'white' : item.color }}
                                        />
                                    </div>
                                    <span className="flex-1">{item.label}</span>
                                    
                                    {/* Notification Badge */}
                                    {showBadge && (
                                        <span className="absolute left-4 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {notificationCount > 9 ? '9+' : notificationCount}
                                        </span>
                                    )}

                                    {/* Active Indicator */}
                                    {active && (
                                        <ChevronLeft className="w-4 h-4 text-white/70" />
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div className="my-6 border-t border-border" />

                    {/* Bottom Navigation Items */}
                    <div className="space-y-1">
                        <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            الحساب
                        </p>
                        {bottomNavItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose}
                                    className={`
                                        flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium
                                        transition-all duration-200
                                        ${active
                                            ? 'bg-muted text-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }
                                    `}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-border">
                    <div className="p-3 rounded-xl bg-gradient-to-l from-brand-blue/10 to-brand-blue-light/10 border border-brand-blue/20">
                        <p className="text-xs text-muted-foreground mb-1">تحتاج مساعدة؟</p>
                        <a
                            href="https://api.whatsapp.com/send/?phone=%2B201270388043"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-brand-blue hover:underline"
                        >
                            تواصل مع الدعم الفني
                        </a>
                    </div>
                </div>
            </aside>
        </>
    );
}

