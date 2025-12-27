import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    LogOut,
    User,
    Settings,
    ChevronDown,
    Menu,
    Wrench,
    CheckCircle,
    Clock,
    Circle,
    AlertTriangle,
    Sun,
    Moon,
    Search,
    Command
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { useNotifications } from '../notifications/NotificationSystem';
import { useTheme } from '../ThemeProvider';
import CommandPalette, { useCommandPalette } from './CommandPalette';
import useTechnicianNotifications from '../../hooks/useTechnicianNotifications';

/**
 * 🛠️ Technician Header Component
 * 
 * المميزات:
 * - Logo الشركة
 * - User Menu Dropdown
 * - Notifications Popover (New)
 * - Status Toggle (Available/Busy/Offline)
 */

export default function TechnicianHeader({ user, notificationCount = 0 }) {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const notifications = useNotifications();
    const { theme, setTheme } = useTheme();
    const { isOpen: isCommandOpen, openPalette, closePalette } = useCommandPalette();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [status, setStatus] = useState('available'); // available, busy, offline
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Real Notifications Hook
    const {
        notifications: techNotifications,
        unreadCount: realNotificationCount,
        markAsRead,
        markAllAsRead,
        loading: notificationsLoading
    } = useTechnicianNotifications();

    // Use real count or prop
    const displayNotificationCount = realNotificationCount || notificationCount;

    const handleLogout = () => {
        logout();
        navigate('/login');
        notifications.success('نجاح', { message: 'تم تسجيل الخروج بنجاح' });
    };

    const statusConfig = {
        available: { label: 'متاح', color: '#10B981', icon: CheckCircle },
        busy: { label: 'مشغول', color: '#EF4444', icon: Wrench },
        offline: { label: 'غير متصل', color: '#6B7280', icon: Circle }
    };

    const CurrentStatusIcon = statusConfig[status].icon;

    return (
        <header className="bg-card shadow-md sticky top-0 z-50 border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* Logo & Brand */}
                    <div className="flex items-center gap-3">
                        <img src="/Fav.png" alt="FixZone Logo" className="h-10 w-auto" />
                        <div className="hidden md:block">
                            <h1 className="text-xl font-bold text-foreground">FixZone</h1>
                            <p className="text-xs text-muted-foreground font-medium">بوابة الفنيين</p>
                        </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-4">

                        {/* Search Button - Command Palette Trigger */}
                        <button
                            onClick={openPalette}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary rounded-xl transition-colors text-sm text-muted-foreground"
                        >
                            <Search className="w-4 h-4" />
                            <span>بحث...</span>
                            <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-background text-xs rounded border border-border">
                                <Command className="w-3 h-3" />K
                            </kbd>
                        </button>

                        {/* Mobile Search Button */}
                        <button
                            onClick={openPalette}
                            className="md:hidden p-2 hover:bg-secondary/50 rounded-full transition-colors text-muted-foreground"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        {/* Status Toggle */}
                        <div className="relative hidden sm:block">
                            <button
                                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:shadow-sm"
                                style={{
                                    borderColor: statusConfig[status].color,
                                    background: `${statusConfig[status].color}10`
                                }}
                            >
                                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: statusConfig[status].color }} />
                                <span className="text-sm font-medium text-foreground">{statusConfig[status].label}</span>
                                <ChevronDown className="w-3 h-3 text-muted-foreground" />
                            </button>

                            {isStatusMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusMenuOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-40 bg-popover rounded-lg shadow-xl border border-border py-1 animate-in fade-in zoom-in-95 duration-200 z-20">
                                        {Object.entries(statusConfig).map(([key, config]) => {
                                            const Icon = config.icon;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => {
                                                        setStatus(key);
                                                        setIsStatusMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                                                    style={{ color: key === status ? config.color : 'var(--foreground)' }}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {config.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="relative p-2 rounded-full transition-colors hover:bg-muted"
                            aria-label="تبديل المظهر"
                            title={theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
                        >
                            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-muted-foreground" />
                            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-muted-foreground" />
                        </button>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className={`relative p-2 rounded-full transition-colors ${isNotificationsOpen ? 'bg-muted' : 'hover:bg-muted'}`}
                            >
                                <Bell className="w-6 h-6 text-muted-foreground" />
                                {displayNotificationCount > 0 && (
                                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-card animate-pulse">
                                        {displayNotificationCount > 9 ? '9+' : displayNotificationCount}
                                    </span>
                                )}
                            </button>

                            {isNotificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-80 bg-popover rounded-xl shadow-xl border border-border overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-3 border-b border-border bg-muted/50 flex items-center justify-between">
                                            <h3 className="font-bold text-foreground text-sm">الإشعارات</h3>
                                            {displayNotificationCount > 0 && (
                                                <button
                                                    onClick={markAllAsRead}
                                                    className="text-xs text-primary hover:text-primary/80 font-medium"
                                                >
                                                    تحديد الكل كمقروء
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notificationsLoading ? (
                                                <div className="p-8 text-center">
                                                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                                </div>
                                            ) : techNotifications.length > 0 ? (
                                                techNotifications.map((notif) => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => markAsRead(notif.id)}
                                                        className={`p-3 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`mt-1 p-1.5 rounded-full ${notif.typeConfig?.color || 'bg-blue-100 text-blue-600'}`}>
                                                                {notif.type === 'alert' || notif.type === 'urgent' ? <AlertTriangle className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-bold text-foreground">{notif.title}</p>
                                                                    {!notif.isRead && (
                                                                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                                                                <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" /> {notif.timeAgo || notif.time}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center">
                                                    <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                                    <p className="text-sm text-muted-foreground">لا توجد إشعارات</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-3 hover:bg-muted p-2 rounded-lg transition-colors"
                            >
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-bold text-foreground">{user?.name || 'فني'}</p>
                                    <p className="text-xs text-muted-foreground">فني صيانة</p>
                                </div>
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                                    style={{ background: 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)' }}
                                >
                                    {user?.name?.charAt(0).toUpperCase() || 'T'}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown */}
                            {isMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsMenuOpen(false)}
                                    />
                                    <div className="absolute left-0 mt-2 w-56 bg-popover rounded-xl shadow-xl border border-border py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-3 border-b border-border md:hidden">
                                            <p className="text-sm font-bold text-foreground">{user?.name}</p>
                                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                                        </div>

                                        <button
                                            onClick={() => navigate('/technician/profile')}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                                        >
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            الملف الشخصي
                                        </button>

                                        <button
                                            onClick={() => navigate('/technician/settings')}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                                        >
                                            <Settings className="w-4 h-4 text-muted-foreground" />
                                            الإعدادات
                                        </button>

                                        <div className="h-px bg-border my-1" />

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            تسجيل الخروج
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Command Palette */}
            <CommandPalette isOpen={isCommandOpen} onClose={closePalette} />
        </header>
    );
}
