import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { isCustomerRole } from '../../constants/roles';
import api from '../../services/api';
import CustomerSidebar from './CustomerSidebar';
import CustomerBottomNav from './CustomerBottomNav';
import {
    Menu,
    Bell,
    Search,
    LogOut,
    ChevronLeft,
    Home,
    X
} from 'lucide-react';

/**
 * CustomerLayout - Main Layout Wrapper for Customer Portal
 * 
 * Features:
 * - Responsive layout with sidebar (desktop) and bottom nav (mobile)
 * - Top header with search and notifications
 * - Breadcrumb navigation
 * - Authentication guard
 * - Real-time notification count
 */

// Breadcrumb configuration
const breadcrumbMap = {
    '/customer/dashboard': { label: 'لوحة التحكم', parent: null },
    '/customer/repairs': { label: 'طلبات الإصلاح', parent: '/customer/dashboard' },
    '/customer/invoices': { label: 'الفواتير', parent: '/customer/dashboard' },
    '/customer/devices': { label: 'أجهزتي', parent: '/customer/dashboard' },
    '/customer/notifications': { label: 'الإشعارات', parent: '/customer/dashboard' },
    '/customer/profile': { label: 'الملف الشخصي', parent: '/customer/dashboard' },
    '/customer/settings': { label: 'الإعدادات', parent: '/customer/dashboard' },
    '/customer/help': { label: 'المساعدة', parent: '/customer/dashboard' },
};

export default function CustomerLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    // Auth check
    useEffect(() => {
        const roleId = user?.roleId || user?.role;
        const numericRoleId = Number(roleId);
        const isCustomer = user && (user.type === 'customer' || isCustomerRole(numericRoleId));

        if (!isAuthenticated || !isCustomer) {
            navigate('/customer/login');
        }
    }, [isAuthenticated, user, navigate]);

    // Load notification count
    useEffect(() => {
        const loadNotificationCount = async () => {
            try {
                const response = await api.getCustomerNotifications({ unreadOnly: 'true', limit: 1 });
                if (response.success && response.data) {
                    setNotificationCount(response.data.unreadCount || 0);
                }
            } catch (error) {
                console.warn('Failed to load notification count:', error);
            }
        };

        if (isAuthenticated && user) {
            loadNotificationCount();
            // Poll every 60 seconds
            const interval = setInterval(loadNotificationCount, 60000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, user]);

    // Load notifications when dropdown opens
    const loadNotifications = useCallback(async () => {
        if (loadingNotifications) return;
        
        try {
            setLoadingNotifications(true);
            const response = await api.getCustomerNotifications({ limit: 5 });
            
            if (response.success && response.data) {
                setNotifications(response.data.notifications || []);
                setNotificationCount(response.data.unreadCount || 0);
            }
        } catch (error) {
            console.warn('Failed to load notifications:', error);
        } finally {
            setLoadingNotifications(false);
        }
    }, [loadingNotifications]);

    useEffect(() => {
        if (showNotificationDropdown) {
            loadNotifications();
        }
    }, [showNotificationDropdown, loadNotifications]);

    // Handle logout
    const handleLogout = async () => {
        try {
            await api.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.log('Logout API failed, continuing with local logout');
        }
        logout();
        navigate('/login');
    };

    // Build breadcrumbs
    const getBreadcrumbs = () => {
        const path = location.pathname;
        const breadcrumbs = [];
        
        // Check for dynamic routes (e.g., /customer/repairs/123)
        const pathParts = path.split('/');
        let currentPath = path;
        
        // Handle detail pages
        if (pathParts.length > 3 && !isNaN(pathParts[3])) {
            const basePath = `/${pathParts[1]}/${pathParts[2]}`;
            currentPath = basePath;
            breadcrumbs.push({
                path: path,
                label: `#${pathParts[3]}`,
                isLast: true
            });
        }

        // Build breadcrumb chain
        let current = breadcrumbMap[currentPath];
        while (current) {
            breadcrumbs.unshift({
                path: currentPath,
                label: current.label,
                isLast: breadcrumbs.length === 0
            });
            currentPath = current.parent;
            current = currentPath ? breadcrumbMap[currentPath] : null;
        }

        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    // Search handling
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Navigate to repairs with search query
            navigate(`/customer/repairs?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setIsSearchOpen(false);
        }
    };

    // Format time ago
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

    return (
        <div className="min-h-screen bg-background flex" dir="rtl">
            {/* Sidebar (Desktop) - displayed on the right in RTL */}
            <CustomerSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={user}
                notificationCount={notificationCount}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen lg:mr-0">
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            {/* Left Side - Menu Button (Mobile) & Breadcrumbs */}
                            <div className="flex items-center gap-3">
                                {/* Mobile Menu Button */}
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <Menu className="w-5 h-5 text-foreground" />
                                </button>

                                {/* Breadcrumbs (Desktop) */}
                                <nav className="hidden md:flex items-center gap-2 text-sm">
                                    <button
                                        onClick={() => navigate('/customer/dashboard')}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Home className="w-4 h-4" />
                                    </button>
                                    {breadcrumbs.map((crumb, index) => (
                                        <React.Fragment key={crumb.path}>
                                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                                            {crumb.isLast ? (
                                                <span className="font-medium text-foreground">{crumb.label}</span>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(crumb.path)}
                                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {crumb.label}
                                                </button>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </nav>

                                {/* Page Title (Mobile) */}
                                <h1 className="md:hidden font-semibold text-foreground">
                                    {breadcrumbs[breadcrumbs.length - 1]?.label || 'لوحة التحكم'}
                                </h1>
                            </div>

                            {/* Right Side - Search & Actions */}
                            <div className="flex items-center gap-2">
                                {/* Search Button / Input */}
                                {isSearchOpen ? (
                                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="ابحث عن طلب إصلاح..."
                                            className="w-48 md:w-64 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsSearchOpen(false);
                                                setSearchQuery('');
                                            }}
                                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </form>
                                ) : (
                                    <button
                                        onClick={() => setIsSearchOpen(true)}
                                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <Search className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                )}

                                {/* Notifications */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                                        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <Bell className="w-5 h-5 text-muted-foreground" />
                                        {notificationCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                {notificationCount > 9 ? '9+' : notificationCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notification Dropdown */}
                                    {showNotificationDropdown && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-10" 
                                                onClick={() => setShowNotificationDropdown(false)} 
                                            />
                                            <div className="absolute left-0 top-full mt-2 w-80 bg-card rounded-xl shadow-xl border border-border z-20 overflow-hidden">
                                                <div className="p-3 border-b border-border flex justify-between items-center">
                                                    <span className="font-bold text-foreground">الإشعارات</span>
                                                    <button
                                                        onClick={() => {
                                                            setShowNotificationDropdown(false);
                                                            navigate('/customer/notifications');
                                                        }}
                                                        className="text-xs text-brand-blue hover:underline"
                                                    >
                                                        عرض الكل
                                                    </button>
                                                </div>
                                                <div className="max-h-64 overflow-y-auto">
                                                    {loadingNotifications ? (
                                                        <div className="p-4 text-center text-muted-foreground">
                                                            <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                                            جاري التحميل...
                                                        </div>
                                                    ) : notifications.length > 0 ? (
                                                        notifications.map((notif) => (
                                                            <div
                                                                key={notif.id}
                                                                className={`p-3 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-brand-blue/5' : ''}`}
                                                                onClick={() => {
                                                                    setShowNotificationDropdown(false);
                                                                    navigate('/customer/notifications');
                                                                }}
                                                            >
                                                                <p className="text-sm font-medium text-foreground line-clamp-1">
                                                                    {notif.title}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                                    {notif.message || notif.content}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                                    {formatTimeAgo(notif.createdAt)}
                                                                </p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-center text-muted-foreground text-sm">
                                                            لا توجد إشعارات جديدة
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                                    title="تسجيل الخروج"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 pb-20 lg:pb-0">
                    {children}
                </main>
            </div>

            {/* Bottom Navigation (Mobile) */}
            <CustomerBottomNav notificationCount={notificationCount} />
        </div>
    );
}

