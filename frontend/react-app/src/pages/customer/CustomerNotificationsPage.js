import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { isCustomerRole } from '../../constants/roles';
import api from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { 
    Bell, Wrench, FileText, CreditCard, AlertCircle, CheckCircle, 
    Clock, Trash2, CheckCheck, Filter, RefreshCw
} from 'lucide-react';

/**
 * CustomerNotificationsPage - Real API Integration with Filtering
 * 
 * Features:
 * - Real API data fetching
 * - Filter by notification type
 * - Mark as read/unread
 * - Delete notifications
 * - Infinite scroll
 * - Empty states
 */

const notificationTypes = [
    { id: 'all', label: 'الكل', icon: Bell },
    { id: 'repair', label: 'الإصلاحات', icon: Wrench },
    { id: 'invoice', label: 'الفواتير', icon: FileText },
    { id: 'payment', label: 'المدفوعات', icon: CreditCard },
    { id: 'system', label: 'النظام', icon: AlertCircle }
];

export default function CustomerNotificationsPage() {
    const navigate = useNavigate();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);
    
    const [notificationsList, setNotificationsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    // Auth check
    useEffect(() => {
        const roleId = user?.roleId || user?.role;
        const numericRoleId = Number(roleId);
        const isCustomer = user && (user.type === 'customer' || isCustomerRole(numericRoleId));

        if (!user || !isCustomer) {
            notifications.error('خطأ', { message: 'يجب تسجيل الدخول كعميل للوصول لهذه الصفحة' });
            navigate('/login');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load notifications
    const loadNotifications = useCallback(async (isLoadMore = false) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            const params = {
                page: isLoadMore ? page : 1,
                limit: 20
            };

            if (activeFilter !== 'all') {
                params.type = activeFilter;
            }

            const response = await api.getCustomerNotifications(params);

            if (response.success && response.data) {
                const newNotifications = response.data.notifications || [];
                
                if (isLoadMore) {
                    setNotificationsList(prev => [...prev, ...newNotifications]);
                } else {
                    setNotificationsList(newNotifications);
                }

                setUnreadCount(response.data.unreadCount || 0);
                setHasMore(newNotifications.length === 20);
                
                if (isLoadMore) {
                    setPage(prev => prev + 1);
                }
            } else {
                if (!isLoadMore) {
                    setNotificationsList([]);
                }
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
            if (!isLoadMore) {
                // Show empty state with mock data for demo if API fails
                setNotificationsList([]);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeFilter, page]);

    // Initial load
    useEffect(() => {
        setPage(1);
        loadNotifications(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilter]);

    // Mark as read
    const handleMarkAsRead = async (notifId) => {
        try {
            await api.markCustomerNotificationRead(notifId);
            setNotificationsList(prev => 
                prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await api.markAllCustomerNotificationsRead();
            setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            notifications.success('تم', { message: 'تم تحديد جميع الإشعارات كمقروءة' });
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            notifications.error('خطأ', { message: 'فشل تحديد الإشعارات كمقروءة' });
        }
    };

    // Delete notification
    const handleDelete = async (notifId) => {
        try {
            await api.request(`/customer/notifications/${notifId}`, { method: 'DELETE' });
            setNotificationsList(prev => prev.filter(n => n.id !== notifId));
            notifications.success('تم', { message: 'تم حذف الإشعار' });
        } catch (error) {
            console.error('Failed to delete notification:', error);
            notifications.error('خطأ', { message: 'فشل حذف الإشعار' });
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

    // Get icon for notification type
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
                return <Bell className="w-5 h-5 text-muted-foreground" />;
        }
    };

    // Get notification title by type
    const getTitle = (notif) => {
        if (notif.title) return notif.title;
        const titles = {
            repair: 'تحديث حالة الإصلاح',
            repair_status: 'تحديث حالة الإصلاح',
            invoice: 'فاتورة جديدة',
            payment: 'تحديث الدفع',
            general: 'إشعار',
            system: 'إشعار النظام'
        };
        return titles[notif.type] || 'إشعار';
    };

    // Skeleton loading
    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
                        <div>
                            <div className="h-6 w-32 bg-muted rounded animate-pulse mb-2" />
                            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-card rounded-xl p-4 border border-border animate-pulse">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-muted" />
                                    <div className="flex-1">
                                        <div className="h-5 w-40 bg-muted rounded mb-2" />
                                        <div className="h-4 w-full bg-muted rounded mb-2" />
                                        <div className="h-3 w-24 bg-muted rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">الإشعارات</h1>
                            <p className="text-sm text-muted-foreground">
                                {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => loadNotifications(false)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="تحديث"
                        >
                            <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-colors font-medium"
                            >
                                <CheckCheck className="w-4 h-4" />
                                <span className="hidden sm:inline">تحديد الكل كمقروء</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
                    <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    {notificationTypes.map((type) => {
                        const Icon = type.icon;
                        const isActive = activeFilter === type.id;
                        return (
                            <button
                                key={type.id}
                                onClick={() => setActiveFilter(type.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                    isActive 
                                        ? 'bg-brand-blue text-white shadow-md' 
                                        : 'bg-muted text-foreground hover:bg-muted/80'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {type.label}
                            </button>
                        );
                    })}
                </div>

                {/* Notifications List */}
                {notificationsList.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-muted">
                            <Bell className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد إشعارات</h3>
                        <p className="text-muted-foreground">
                            {activeFilter !== 'all' 
                                ? 'لا توجد إشعارات من هذا النوع'
                                : 'سيتم إشعارك عند وجود تحديثات جديدة'
                            }
                        </p>
                        {activeFilter !== 'all' && (
                            <button
                                onClick={() => setActiveFilter('all')}
                                className="mt-4 px-4 py-2 bg-brand-blue text-white rounded-lg font-medium"
                            >
                                عرض الكل
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notificationsList.map((notif) => (
                            <div
                                key={notif.id}
                                className={`bg-card rounded-xl p-4 border transition-all hover:shadow-md group ${
                                    notif.isRead ? 'border-border' : 'border-brand-blue/50 bg-brand-blue/5'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        notif.isRead ? 'bg-muted' : 'bg-brand-blue/10'
                                    }`}>
                                        {getIcon(notif.type)}
                                    </div>

                                    {/* Content */}
                                    <div 
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => {
                                            if (!notif.isRead) handleMarkAsRead(notif.id);
                                            // Navigate based on type
                                            if (notif.type === 'repair' && notif.repairId) {
                                                navigate(`/customer/repairs/${notif.repairId}`);
                                            } else if (notif.type === 'invoice' && notif.invoiceId) {
                                                navigate(`/customer/invoices/${notif.invoiceId}`);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={`font-semibold ${
                                                notif.isRead ? 'text-foreground' : 'text-brand-blue'
                                            }`}>
                                                {getTitle(notif)}
                                            </h3>
                                            {!notif.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-brand-blue flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {notif.message || notif.content}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {formatTimeAgo(notif.createdAt)}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notif.isRead && (
                                            <button
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                                                title="تحديد كمقروء"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notif.id)}
                                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Load More */}
                        {hasMore && (
                            <div className="flex justify-center py-4">
                                <button
                                    onClick={() => loadNotifications(true)}
                                    disabled={loadingMore}
                                    className="px-6 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                                >
                                    {loadingMore ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                                            جاري التحميل...
                                        </div>
                                    ) : (
                                        'تحميل المزيد'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
