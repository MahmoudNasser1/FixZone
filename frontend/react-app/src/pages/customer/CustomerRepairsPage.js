import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import { isCustomerRole } from '../../constants/roles';
import RepairCard from '../../components/customer/RepairCard';
import RepairFiltersAdvanced from '../../components/customer/RepairFiltersAdvanced';
import RepairViewToggle from '../../components/customer/RepairViewToggle';
import { SkeletonCard } from '../../components/customer/SkeletonDashboard';
import { 
    Wrench, PackageOpen, ChevronLeft, ChevronRight,
    Calendar, Clock, CheckCircle, AlertCircle
} from 'lucide-react';

/**
 * CustomerRepairsPage - Enhanced Repairs List
 * 
 * Features:
 * - Advanced filtering with date range
 * - Multiple view modes (grid, list, timeline)
 * - Skeleton loading states
 * - URL-based filter state
 */

export default function CustomerRepairsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);

    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState(searchParams.get('status') || 'all');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState(localStorage.getItem('repairViewMode') || 'grid');
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

    const itemsPerPage = viewMode === 'list' ? 10 : 9;

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reload repairs when filters change
    useEffect(() => {
        if (user) {
            loadRepairs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, activeFilter, searchQuery, sortBy]);

    // Save view mode preference
    useEffect(() => {
        localStorage.setItem('repairViewMode', viewMode);
    }, [viewMode]);

    // Update URL params when filter changes
    useEffect(() => {
        const params = new URLSearchParams();
        if (activeFilter !== 'all') params.set('status', activeFilter);
        if (searchQuery) params.set('search', searchQuery);
        setSearchParams(params, { replace: true });
    }, [activeFilter, searchQuery, setSearchParams]);

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

            // Add sort parameter
            if (sortBy === 'oldest') {
                params.sort = 'asc';
            }

            const response = await api.getCustomerRepairs(params);

            if (response.success) {
                let repairsList = response.data.repairs || [];
                const pagination = response.data.pagination;
                
                // Client-side sort if API doesn't support it
                if (sortBy === 'status') {
                    const statusOrder = ['pending', 'in_progress', 'waiting-parts', 'ready-for-pickup', 'completed', 'delivered', 'cancelled'];
                    repairsList = [...repairsList].sort((a, b) => {
                        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
                    });
                }
                
                setRepairs(repairsList);
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

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Skeleton loading state
    if (loading && repairs.length === 0) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Page Title Skeleton */}
                    <div className="mb-6 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
                        <div>
                            <div className="h-6 w-40 bg-muted rounded animate-pulse mb-2" />
                            <div className="h-4 w-60 bg-muted rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Filter Skeleton */}
                    <div className="mb-6 h-12 bg-muted rounded-xl animate-pulse" />

                    {/* Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Get status badge for timeline view
    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'in_progress': return <Wrench className="w-4 h-4 text-blue-500" />;
            case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
            default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Page Title */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-blue-light">
                            <Wrench className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">طلبات الإصلاح</h1>
                            <p className="text-sm text-muted-foreground">إدارة ومتابعة طلبات إصلاح الأجهزة</p>
                        </div>
                    </div>
                    
                    {/* View Toggle */}
                    <RepairViewToggle activeView={viewMode} onViewChange={setViewMode} />
                </div>

                {/* Advanced Filters */}
                <RepairFiltersAdvanced
                    activeFilter={activeFilter}
                    onFilterChange={handleFilterChange}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    stats={stats}
                />

                {/* Results Count */}
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        عرض <span className="font-semibold">{repairs.length}</span> من{' '}
                        <span className="font-semibold">{totalItems}</span> طلب
                    </p>
                    {loading && (
                        <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                    )}
                </div>

                {/* Repairs Display */}
                {repairs.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-muted">
                            <PackageOpen className="w-10 h-10 text-muted-foreground" />
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
                        {(activeFilter !== 'all' || searchQuery) && (
                            <button
                                onClick={() => {
                                    handleFilterChange('all');
                                    handleSearchChange('');
                                }}
                                className="px-6 py-2 rounded-lg font-medium transition-colors bg-gradient-to-r from-brand-blue to-brand-blue-light text-white hover:from-brand-blue-light hover:to-brand-blue"
                            >
                                إظهار الكل
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Grid View */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {repairs.map((repair) => (
                                    <RepairCard key={repair.id} repair={repair} />
                                ))}
                            </div>
                        )}

                        {/* List View */}
                        {viewMode === 'list' && (
                            <div className="space-y-3 mb-8">
                                {repairs.map((repair) => (
                                    <div
                                        key={repair.id}
                                        onClick={() => navigate(`/customer/repairs/${repair.id}`)}
                                        className="bg-card rounded-xl p-4 border border-border hover:border-brand-blue hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue to-brand-blue-light flex items-center justify-center flex-shrink-0">
                                                <Wrench className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-foreground">طلب #{repair.id}</span>
                                                    <span className="text-sm text-muted-foreground">•</span>
                                                    <span className="text-sm text-muted-foreground">{repair.deviceType || 'جهاز'}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {repair.issueDescription || 'لا يوجد وصف'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {repair.estimatedCost && (
                                                    <span className="text-sm font-bold text-brand-blue hidden sm:block">
                                                        {repair.estimatedCost} جنيه
                                                    </span>
                                                )}
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    repair.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    repair.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    repair.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-muted text-muted-foreground'
                                                }`}>
                                                    {repair.status === 'completed' ? 'مكتمل' :
                                                     repair.status === 'in_progress' ? 'قيد التنفيذ' :
                                                     repair.status === 'pending' ? 'قيد الانتظار' :
                                                     repair.status}
                                                </span>
                                                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Timeline View */}
                        {viewMode === 'timeline' && (
                            <div className="relative mb-8">
                                {/* Timeline line */}
                                <div className="absolute top-0 bottom-0 right-6 w-0.5 bg-border" />
                                
                                <div className="space-y-6">
                                    {repairs.map((repair, index) => (
                                        <div key={repair.id} className="relative flex gap-4">
                                            {/* Timeline dot */}
                                            <div className="relative z-10 w-12 h-12 rounded-full bg-card border-2 border-brand-blue flex items-center justify-center flex-shrink-0">
                                                {getStatusIcon(repair.status)}
                                            </div>
                                            
                                            {/* Content */}
                                            <div 
                                                onClick={() => navigate(`/customer/repairs/${repair.id}`)}
                                                className="flex-1 bg-card rounded-xl p-4 border border-border hover:border-brand-blue hover:shadow-md transition-all cursor-pointer"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <span className="font-bold text-foreground">طلب #{repair.id}</span>
                                                        <span className="text-sm text-muted-foreground mr-2">
                                                            {repair.deviceType || 'جهاز'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(repair.createdAt).toLocaleDateString('ar-EG')}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {repair.issueDescription || 'لا يوجد وصف'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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

                                {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                                    let page;
                                    if (totalPages <= 5) {
                                        page = index + 1;
                                    } else if (currentPage <= 3) {
                                        page = index + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        page = totalPages - 4 + index;
                                    } else {
                                        page = currentPage - 2 + index;
                                    }

                                    return (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className={`w-10 h-10 rounded-lg font-medium transition-all ${
                                                currentPage === page
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
