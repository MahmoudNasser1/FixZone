import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import {
    User,
    LogOut,
    Settings,
    HelpCircle,
    Bell,
    ChevronDown,
    Shield,
    CheckCircle,
    FileText,
    Tag,
    Clock,
    Wrench,
    CreditCard,
    AlertCircle
} from 'lucide-react';

/**
 * 🎨 Enhanced Header للـ Customer Dashboard
 * 
 * المميزات:
 * - ألوان البراند (#053887)
 * - User Menu Dropdown
 * - Notification Popover with real API data
 * - Logo
 * - Responsive
 */

export default function CustomerHeader({ user, notificationCount: initialCount = 0 }) {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(initialCount);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    // Fetch notifications when popover opens
    const loadNotifications = useCallback(async () => {
        if (loadingNotifications) return;
        
        try {
            setLoadingNotifications(true);
            const response = await api.getCustomerNotifications({ limit: 5 });
            
            if (response.success && response.data) {
                const notifs = response.data.notifications || [];
                setNotifications(notifs.map(n => ({
                    id: n.id,
                    title: n.title || getNotificationTitle(n.type),
                    message: n.message || n.content || '',
                    time: formatTimeAgo(n.createdAt),
                    type: n.type || 'general',
                    read: n.isRead || false
                })));
                setNotificationCount(response.data.unreadCount || 0);
            }
        } catch (error) {
            console.warn('Failed to load notifications:', error);
        } finally {
            setLoadingNotifications(false);
        }
    }, [loadingNotifications]);

    // Load notifications on mount and when popover opens
    useEffect(() => {
        // Initial load of unread count
        const loadUnreadCount = async () => {
            try {
                const response = await api.getCustomerNotifications({ unreadOnly: 'true', limit: 1 });
                if (response.success && response.data) {
                    setNotificationCount(response.data.unreadCount || 0);
                }
            } catch (error) {
                console.warn('Failed to load notification count:', error);
            }
        };
        loadUnreadCount();
    }, []);

    useEffect(() => {
        if (isNotificationsOpen) {
            loadNotifications();
        }
    }, [isNotificationsOpen, loadNotifications]);

    // Helper to format time ago
    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        return date.toLocaleDateString('ar-EG');
    };

    // Helper to get notification title by type
    const getNotificationTitle = (type) => {
        const titles = {
            repair: 'تحديث حالة الإصلاح',
            repair_status: 'تحديث حالة الإصلاح',
            invoice: 'فاتورة جديدة',
            payment: 'تحديث الدفع',
            general: 'إشعار',
            system: 'إشعار النظام'
        };
        return titles[type] || 'إشعار';
    };

    const handleMarkAsRead = async (notifId) => {
        try {
            await api.markCustomerNotificationRead(notifId);
            setNotifications(prev => 
                prev.map(n => n.id === notifId ? { ...n, read: true } : n)
            );
            setNotificationCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.warn('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.markAllCustomerNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setNotificationCount(0);
        } catch (error) {
            console.warn('Failed to mark all notifications as read:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await api.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.log('Logout API failed, continuing with local logout');
        }
        logout();
        navigate('/login');
    };

    const getIcon = (type) => {
        switch (type) {
            case 'repair':
            case 'repair_status':
                return <Wrench className="w-5 h-5 text-blue-500" />;
            case 'invoice': 
                return <FileText className="w-5 h-5 text-green-500" />;
            case 'payment':
                return <CreditCard className="w-5 h-5 text-purple-500" />;
            case 'system':
            case 'alert':
                return <AlertCircle className="w-5 h-5 text-orange-500" />;
            default: 
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <header
            className="shadow-lg relative z-10"
            style={{
                background: 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)'
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    {/* Right Side - Logo + Welcome */}
                    <div className="flex items-center gap-4">
                        {/* Logo */}
                        <div className="flex items-center">
                            <img
                                src="/Fav.png"
                                alt="FixZone"
                                className="h-10 w-auto object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            {/* Fallback */}
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center hidden"
                                style={{ background: 'rgba(255, 255, 255, 0.2)' }}
                            >
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        {/* Welcome Text */}
                        <div className="text-white">
                            <h1 className="text-xl font-bold">مرحباً، {user?.name || 'عميل'}</h1>
                            <p className="text-sm opacity-90">لوحة تحكم العميل</p>
                        </div>
                    </div>

                    {/* Left Side - Actions */}
                    <div className="flex items-center gap-3">

                        {/* Notifications Popover */}
                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative p-2 rounded-lg transition-all duration-200 hover:shadow-lg"
                                style={{
                                    background: isNotificationsOpen ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <Bell className="w-6 h-6 text-white" />
                                {notificationCount > 0 && (
                                    <span
                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white shadow-lg"
                                        style={{ background: '#EF4444' }}
                                    >
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                    </span>
                                )}
                            </button>

                            {isNotificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden z-20 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                            <h3 className="font-bold text-gray-900 dark:text-white">الإشعارات</h3>
                                            <div className="flex items-center gap-3">
                                                {notificationCount > 0 && (
                                                    <button
                                                        onClick={handleMarkAllAsRead}
                                                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                    >
                                                        تحديد الكل كمقروء
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setIsNotificationsOpen(false);
                                                        navigate('/customer/notifications');
                                                    }}
                                                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    عرض الكل
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {loadingNotifications ? (
                                                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                                    جاري التحميل...
                                                </div>
                                            ) : notifications.length > 0 ? (
                                                notifications.map((notif) => (
                                                    <div 
                                                        key={notif.id} 
                                                        className={`p-4 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                                                        onClick={() => {
                                                            if (!notif.read) handleMarkAsRead(notif.id);
                                                        }}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className="mt-1">{getIcon(notif.type)}</div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{notif.title}</p>
                                                                    {!notif.read && (
                                                                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">{notif.message}</p>
                                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" /> {notif.time}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    لا توجد إشعارات جديدة
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
                                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:shadow-lg"
                                style={{
                                    background: isMenuOpen ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-white font-medium hidden sm:block">
                                    {user?.name?.split(' ')[0] || 'عميل'}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 text-white transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <>
                                    {/* Overlay لإغلاق القائمة */}
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsMenuOpen(false)}
                                    />

                                    {/* القائمة */}
                                    <div
                                        className="absolute left-0 mt-2 w-56 rounded-lg shadow-2xl overflow-hidden z-20 border"
                                        style={{
                                            background: 'white',
                                            borderColor: '#E5E7EB'
                                        }}
                                    >
                                        {/* User Info */}
                                        <div className="px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
                                            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="py-2">
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    navigate('/customer/profile');
                                                }}
                                                className="w-full px-4 py-2 text-right flex items-center gap-2 transition-colors duration-150"
                                                style={{ color: '#374151' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <User className="w-4 h-4" />
                                                <span>الملف الشخصي</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    navigate('/customer/settings');
                                                }}
                                                className="w-full px-4 py-2 text-right flex items-center gap-2 transition-colors duration-150"
                                                style={{ color: '#374151' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <Settings className="w-4 h-4" />
                                                <span>الإعدادات</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    navigate('/customer/help');
                                                }}
                                                className="w-full px-4 py-2 text-right flex items-center gap-2 transition-colors duration-150"
                                                style={{ color: '#374151' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <HelpCircle className="w-4 h-4" />
                                                <span>المساعدة</span>
                                            </button>
                                        </div>

                                        {/* Logout */}
                                        <div className="border-t" style={{ borderColor: '#E5E7EB' }}>
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    handleLogout();
                                                }}
                                                className="w-full px-4 py-2 text-right flex items-center gap-2 transition-colors duration-150"
                                                style={{ color: '#EF4444' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>تسجيل الخروج</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
