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
    AlertTriangle
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { useNotifications } from '../notifications/NotificationSystem';

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

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [status, setStatus] = useState('available'); // available, busy, offline
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Mock Notifications
    const techNotifications = [
        { id: 1, title: 'مهمة جديدة', message: 'تم تعيين مهمة إصلاح جديدة #1024', time: 'منذ 10 دقائق', type: 'job' },
        { id: 2, title: 'تنبيه مخزون', message: 'شاشة iPhone 13 Pro قاربت على النفاد', time: 'منذ ساعة', type: 'alert' },
    ];

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
        <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* Logo & Brand */}
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="FixZone Logo" className="h-10 w-auto" />
                        <div className="hidden md:block">
                            <h1 className="text-xl font-bold text-gray-900">FixZone</h1>
                            <p className="text-xs text-gray-500 font-medium">بوابة الفنيين</p>
                        </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-4">

                        {/* Status Toggle */}
                        <div className="relative">
                            <button
                                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:shadow-sm"
                                style={{
                                    borderColor: statusConfig[status].color,
                                    background: `${statusConfig[status].color}10`
                                }}
                            >
                                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: statusConfig[status].color }} />
                                <span className="text-sm font-medium text-gray-700">{statusConfig[status].label}</span>
                                <ChevronDown className="w-3 h-3 text-gray-500" />
                            </button>

                            {isStatusMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusMenuOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 animate-in fade-in zoom-in-95 duration-200 z-20">
                                        {Object.entries(statusConfig).map(([key, config]) => {
                                            const Icon = config.icon;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => {
                                                        setStatus(key);
                                                        setIsStatusMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                                                    style={{ color: key === status ? config.color : '#374151' }}
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

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className={`relative p-2 rounded-full transition-colors ${isNotificationsOpen ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                            >
                                <Bell className="w-6 h-6 text-gray-600" />
                                {notificationCount > 0 && (
                                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                                        {notificationCount}
                                    </span>
                                )}
                            </button>

                            {isNotificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-3 border-b border-gray-100 bg-gray-50">
                                            <h3 className="font-bold text-gray-900 text-sm">الإشعارات</h3>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {techNotifications.map((notif) => (
                                                <div key={notif.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1 p-1.5 rounded-full ${notif.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {notif.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{notif.title}</p>
                                                            <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                                                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> {notif.time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                            >
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-bold text-gray-900">{user?.name || 'فني'}</p>
                                    <p className="text-xs text-gray-500">فني صيانة</p>
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
                                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                                            <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                        </div>

                                        <button
                                            onClick={() => navigate('/technician/profile')}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <User className="w-4 h-4 text-gray-500" />
                                            الملف الشخصي
                                        </button>

                                        <button
                                            onClick={() => navigate('/technician/settings')}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <Settings className="w-4 h-4 text-gray-500" />
                                            الإعدادات
                                        </button>

                                        <div className="h-px bg-gray-100 my-1" />

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
        </header>
    );
}
