import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../stores/authStore';
import { isCustomerRole } from '../../constants/roles';
import CustomerHeader from '../../components/customer/CustomerHeader';
import RepairCard from '../../components/customer/RepairCard';
import RepairFilters from '../../components/customer/RepairFilters';
import { Wrench, PackageOpen, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * 📋 Customer Repairs Page
 * 
 * المميزات:
 * - قائمة بجميع طلبات الإصلاح
 * - فلترة حسب الحالة
 * - بحث
 * - Pagination
 * - Brand colors
 */

export default function CustomerRepairsPage() {
    const navigate = useNavigate();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);

    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [stats, setStats] = useState({
        totalRepairs: 0,
        pendingRepairs: 0,
        activeRepairs: 0,
        completedRepairs: 0,
        cancelledRepairs: 0
    });
    const [notificationCount, setNotificationCount] = useState(0);

    const itemsPerPage = 9;

    // Initial load - check auth and load stats
    useEffect(() => {
        const roleId = user?.roleId || user?.role;
        const numericRoleId = Number(roleId);
        const isCustomer = user && (user.type === 'customer' || isCustomerRole(numericRoleId));

        if (!user || !isCustomer) {
            notifications.error('خطأ', { message: 'يجب تسجيل الدخول كعميل للوصول لهذه الصفحة' });
            navigate('/login');
            return;
        }

        // Load stats once
        loadStats();
        loadNotificationCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reload repairs when filters change
    useEffect(() => {
        if (user) {
            loadRepairs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, activeFilter, searchQuery]);

    const loadStats = async () => {
        try {
            const response = await api.getCustomerDashboardStats();
            if (response.success && response.data) {
                setStats({
                    totalRepairs: response.data.totalRepairs || 0,
                    pendingRepairs: response.data.pendingRepairs || 0,
                    activeRepairs: response.data.activeRepairs || 0,
                    completedRepairs: response.data.completedRepairs || 0,
                    cancelledRepairs: response.data.cancelledRepairs || 0
                });
            }
        } catch (error) {
            console.warn('Failed to load stats:', error);
        }
    };

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

    const loadRepairs = async () => {
        try {
            setLoading(true);
            const customerId = user?.customerId || user?.id;

            const params = {
                customerId,
                page: currentPage,
                limit: itemsPerPage
            };

            // Only add status if it's not 'all'
            if (activeFilter !== 'all') {
                params.status = activeFilter;
            }

            // Only add search if it has a value
            if (searchQuery && searchQuery.trim()) {
                params.search = searchQuery.trim();
            }

            const response = await api.getCustomerRepairs(params);

            if (response.success) {
                const { repairs, pagination } = response.data;
                
                setRepairs(repairs || []);
                setTotalPages(pagination?.totalPages || 1);
                setTotalItems(pagination?.totalItems || 0);
            } else {
                setRepairs([]);
            }

        } catch (error) {
            console.error('Error loading repairs:', error);
            notifications.error('خطأ', { message: 'فشل تحميل طلبات الإصلاح' });
        } finally {
            setLoading(false);
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <CustomerHeader user={user} notificationCount={notificationCount} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-blue-light"
                        >
                            <Wrench className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">طلبات الإصلاح</h1>
                            <p className="text-sm text-muted-foreground">إدارة ومتابعة طلبات إصلاح الأجهزة</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <RepairFilters
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    stats={stats}
                />

                {/* Results Count */}
                <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                        عرض <span className="font-semibold">{repairs.length}</span> من{' '}
                        <span className="font-semibold">{totalItems}</span> طلب
                    </p>
                </div>

                {/* Repairs Grid */}
                {repairs.length === 0 ? (
                    <div className="text-center py-16">
                        <div
                            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-muted"
                        >
                            <PackageOpen className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            لا توجد طلبات إصلاح
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {searchQuery
                                ? 'لم يتم العثور على نتائج مطابقة للبحث'
                                : activeFilter !== 'all'
                                    ? `لا توجد طلبات ${activeFilter === 'pending' ? 'قيد الانتظار' : activeFilter === 'in_progress' ? 'قيد التنفيذ' : activeFilter === 'completed' ? 'مكتملة' : 'ملغاة'}`
                                    : 'لم تقم بإضافة أي طلبات إصلاح بعد'
                            }
                        </p>
                        {activeFilter !== 'all' || searchQuery ? (
                            <button
                                onClick={() => {
                                    setActiveFilter('all');
                                    setSearchQuery('');
                                }}
                                className="px-6 py-2 rounded-lg font-medium transition-colors bg-gradient-to-r from-brand-blue to-brand-blue-light text-white hover:from-brand-blue-light hover:to-brand-blue"
                            >
                                إظهار الكل
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {repairs.map((repair) => (
                                <RepairCard key={repair.id} repair={repair} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-card border border-border hover:border-brand-blue"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>

                                {[...Array(totalPages)].map((_, index) => {
                                    const page = index + 1;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className={`w-10 h-10 rounded-lg font-medium transition-all ${currentPage === page
                                                    ? 'bg-gradient-to-r from-brand-blue to-brand-blue-light text-white border-brand-blue'
                                                    : 'bg-card text-foreground border-border hover:border-brand-blue'
                                                } border`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-card border border-border hover:border-brand-blue"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
