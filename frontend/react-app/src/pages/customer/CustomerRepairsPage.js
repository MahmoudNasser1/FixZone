import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../stores/authStore';
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

    const itemsPerPage = 9;

    useEffect(() => {
        const roleId = user?.roleId || user?.role;
        const isCustomer = user && (user.type === 'customer' || roleId === 8 || roleId === '8');

        if (!user || !isCustomer) {
            notifications.error('خطأ', { message: 'يجب تسجيل الدخول كعميل للوصول لهذه الصفحة' });
            navigate('/login');
            return;
        }

        loadRepairs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, activeFilter, searchQuery]); // Reload when these change

    const loadRepairs = async () => {
        try {
            setLoading(true);
            const customerId = user?.customerId || user?.id;

            const params = {
                customerId,
                page: currentPage,
                limit: itemsPerPage,
                status: activeFilter !== 'all' ? activeFilter : undefined,
                search: searchQuery || undefined
            };

            const response = await api.getCustomerRepairs(params);

            if (response.success) {
                const { repairs, pagination } = response.data;
                setRepairs(repairs || []);
                setTotalPages(pagination?.totalPages || 1);
                setTotalItems(pagination?.totalItems || 0);

                // Update stats if available in response, otherwise we might need a separate call
                // For now, we'll keep the stats zero or fetch them separately if critical
                // Ideally, the API should return stats or we call getCustomerDashboardStats
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
        <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
            {/* Header */}
            <CustomerHeader user={user} notificationCount={3} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)' }}
                        >
                            <Wrench className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">طلبات الإصلاح</h1>
                            <p className="text-sm text-gray-600">إدارة ومتابعة طلبات إصلاح الأجهزة</p>
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
                    <p className="text-sm text-gray-600">
                        عرض <span className="font-semibold">{repairs.length}</span> من{' '}
                        <span className="font-semibold">{totalItems}</span> طلب
                    </p>
                </div>

                {/* Repairs Grid */}
                {repairs.length === 0 ? (
                    <div className="text-center py-16">
                        <div
                            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                            style={{ background: '#F3F4F6' }}
                        >
                            <PackageOpen className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            لا توجد طلبات إصلاح
                        </h3>
                        <p className="text-gray-600 mb-6">
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
                                className="px-6 py-2 rounded-lg font-medium transition-colors"
                                style={{
                                    background: 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)',
                                    color: 'white'
                                }}
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
                                    className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        background: currentPage === 1 ? '#F3F4F6' : 'white',
                                        border: '1px solid #E5E7EB'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentPage !== 1) e.currentTarget.style.borderColor = '#053887';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                    }}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>

                                {[...Array(totalPages)].map((_, index) => {
                                    const page = index + 1;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className="w-10 h-10 rounded-lg font-medium transition-all"
                                            style={{
                                                background: currentPage === page
                                                    ? 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)'
                                                    : 'white',
                                                color: currentPage === page ? 'white' : '#374151',
                                                border: `1px solid ${currentPage === page ? '#053887' : '#E5E7EB'}`
                                            }}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        background: currentPage === totalPages ? '#F3F4F6' : 'white',
                                        border: '1px solid #E5E7EB'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentPage !== totalPages) e.currentTarget.style.borderColor = '#053887';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                    }}
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
