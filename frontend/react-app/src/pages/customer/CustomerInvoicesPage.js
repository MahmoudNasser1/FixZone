import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import useAuthStore from '../../stores/authStore';
import { isCustomerRole } from '../../constants/roles';
import InvoiceCard from '../../components/customer/InvoiceCard';
import { SkeletonCard } from '../../components/customer/SkeletonDashboard';
import { 
    FileText, Receipt, ChevronLeft, ChevronRight, Search, Filter,
    AlertTriangle, Download, CreditCard, Calendar, TrendingUp
} from 'lucide-react';

/**
 * CustomerInvoicesPage - Enhanced Invoices List
 * 
 * Features:
 * - Due date alerts
 * - PDF download
 * - Enhanced stats with charts
 * - Overdue highlighting
 */

export default function CustomerInvoicesPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);

    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState(searchParams.get('status') || 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [stats, setStats] = useState({
        totalInvoices: 0,
        pendingInvoices: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        totalAmount: 0,
        totalPaid: 0
    });

    const itemsPerPage = 9;

    useEffect(() => {
        const roleId = user?.roleId || user?.role;
        const numericRoleId = Number(roleId);
        const isCustomer = user && (user.type === 'customer' || isCustomerRole(numericRoleId));

        if (!user || !isCustomer) {
            notifications.error('خطأ', { message: 'يجب تسجيل الدخول كعميل للوصول لهذه الصفحة' });
            navigate('/login');
            return;
        }

        loadInvoices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        filterInvoices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilter, searchQuery, invoices]);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const customerId = user?.customerId || user?.id;
            const response = await api.request(`/invoices?customerId=${customerId}`);

            const invoicesData = response.success
                ? (response.data?.invoices || response.data || [])
                : (Array.isArray(response) ? response : []);

            // Process invoices to add overdue status
            const processedInvoices = invoicesData.map(inv => {
                const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
                const isOverdue = dueDate && dueDate < new Date() && inv.paymentStatus !== 'paid';
                return {
                    ...inv,
                    isOverdue,
                    paymentStatus: isOverdue && inv.paymentStatus === 'pending' ? 'overdue' : inv.paymentStatus
                };
            });

            setInvoices(processedInvoices);

            // Calculate stats
            const pending = processedInvoices.filter(i => i.paymentStatus === 'pending').length;
            const paid = processedInvoices.filter(i => i.paymentStatus === 'paid').length;
            const overdue = processedInvoices.filter(i => i.paymentStatus === 'overdue' || i.isOverdue).length;
            const totalAmount = processedInvoices.reduce((sum, i) => sum + (parseFloat(i.totalAmount) || 0), 0);
            const totalPaid = processedInvoices.reduce((sum, i) => sum + (parseFloat(i.paidAmount) || 0), 0);

            setStats({
                totalInvoices: processedInvoices.length,
                pendingInvoices: pending,
                paidInvoices: paid,
                overdueInvoices: overdue,
                totalAmount,
                totalPaid
            });

        } catch (error) {
            console.error('Error loading invoices:', error);
            notifications.error('خطأ', { message: 'فشل تحميل الفواتير' });
        } finally {
            setLoading(false);
        }
    };

    const filterInvoices = () => {
        let filtered = [...invoices];

        if (activeFilter !== 'all') {
            filtered = filtered.filter(i => {
                if (activeFilter === 'overdue') {
                    return i.paymentStatus === 'overdue' || i.isOverdue;
                }
                return i.paymentStatus === activeFilter;
            });
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(i =>
                i.id?.toString().includes(query) ||
                i.invoiceNumber?.toLowerCase().includes(query)
            );
        }

        setFilteredInvoices(filtered);
        setCurrentPage(1);
    };

    const handleDownloadPDF = async (invoiceId) => {
        try {
            notifications.info('تحميل', { message: 'جاري تحضير الفاتورة...' });
            // Open PDF in new tab
            window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
        } catch (error) {
            console.error('PDF download error:', error);
            notifications.error('خطأ', { message: 'فشل تحميل الفاتورة' });
        }
    };

    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const filters = [
        { id: 'all', label: 'الكل', count: stats.totalInvoices, color: '#6B7280' },
        { id: 'pending', label: 'في الانتظار', count: stats.pendingInvoices, color: '#F59E0B' },
        { id: 'paid', label: 'مدفوع', count: stats.paidInvoices, color: '#10B981' },
        { id: 'overdue', label: 'متأخر', count: stats.overdueInvoices, color: '#EF4444' }
    ];

    // Calculate payment progress percentage
    const paymentProgress = stats.totalAmount > 0 
        ? Math.round((stats.totalPaid / stats.totalAmount) * 100) 
        : 0;

    // Skeleton loading
    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
                        <div>
                            <div className="h-6 w-32 bg-muted rounded animate-pulse mb-2" />
                            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-card rounded-lg p-4 border border-border animate-pulse">
                                <div className="h-4 w-24 bg-muted rounded mb-2" />
                                <div className="h-8 w-32 bg-muted rounded" />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Overdue Alert Banner */}
                {stats.overdueInvoices > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-4">
                        <div className="p-3 bg-red-500 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-red-800 dark:text-red-200">
                                لديك {stats.overdueInvoices} فاتورة متأخرة!
                            </h3>
                            <p className="text-sm text-red-600 dark:text-red-300">
                                يرجى سداد الفواتير المتأخرة لتجنب أي تأخير في الخدمة.
                            </p>
                        </div>
                        <button
                            onClick={() => setActiveFilter('overdue')}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                        >
                            عرض المتأخرة
                        </button>
                    </div>
                )}

                {/* Page Title */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-green to-emerald-600">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">الفواتير</h1>
                            <p className="text-sm text-muted-foreground">إدارة ومتابعة الفواتير والمدفوعات</p>
                        </div>
                    </div>
                </div>

                {/* Enhanced Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-brand-green to-emerald-600 rounded-xl p-4 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <CreditCard className="w-8 h-8 opacity-80" />
                            <span className="text-2xl font-bold">{stats.totalInvoices}</span>
                        </div>
                        <p className="text-sm opacity-90">إجمالي الفواتير</p>
                        <p className="text-lg font-bold">{stats.totalAmount.toFixed(2)} جنيه</p>
                    </div>

                    <div className="bg-card rounded-xl p-4 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                            <span className="text-xl font-bold text-green-600">{stats.paidInvoices}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">المدفوع</p>
                        <p className="text-lg font-bold text-foreground">{stats.totalPaid.toFixed(2)} جنيه</p>
                    </div>

                    <div className="bg-card rounded-xl p-4 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <Calendar className="w-6 h-6 text-amber-500" />
                            <span className="text-xl font-bold text-amber-600">{stats.pendingInvoices}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">المتبقي</p>
                        <p className="text-lg font-bold text-foreground">{(stats.totalAmount - stats.totalPaid).toFixed(2)} جنيه</p>
                    </div>

                    {/* Payment Progress */}
                    <div className="bg-card rounded-xl p-4 border border-border">
                        <p className="text-sm text-muted-foreground mb-2">نسبة السداد</p>
                        <div className="relative pt-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-2xl font-bold text-foreground">{paymentProgress}%</span>
                            </div>
                            <div className="overflow-hidden h-3 text-xs flex rounded-full bg-muted">
                                <div
                                    style={{ width: `${paymentProgress}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-brand-green to-emerald-500 transition-all duration-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="space-y-4 mb-6">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="ابحث برقم الفاتورة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-input bg-background focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Filter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex gap-2">
                            {filters.map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                                        activeFilter === filter.id
                                            ? 'text-white shadow-md scale-105'
                                            : 'bg-muted text-foreground hover:bg-muted/80'
                                    }`}
                                    style={{
                                        backgroundColor: activeFilter === filter.id ? filter.color : undefined
                                    }}
                                >
                                    {filter.label}
                                    {filter.count > 0 && (
                                        <span
                                            className={`mr-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                                                activeFilter === filter.id
                                                    ? 'bg-white/30 text-white'
                                                    : 'bg-border text-foreground'
                                            }`}
                                        >
                                            {filter.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                        عرض <span className="font-semibold">{currentInvoices.length}</span> من{' '}
                        <span className="font-semibold">{filteredInvoices.length}</span> فاتورة
                    </p>
                </div>

                {/* Invoices Grid */}
                {currentInvoices.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-muted">
                            <Receipt className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد فواتير</h3>
                        <p className="text-muted-foreground mb-6">
                            {searchQuery ? 'لم يتم العثور على نتائج مطابقة' : 'لم يتم إنشاء أي فواتير بعد'}
                        </p>
                        {(activeFilter !== 'all' || searchQuery) && (
                            <button
                                onClick={() => {
                                    setActiveFilter('all');
                                    setSearchQuery('');
                                }}
                                className="px-6 py-2 rounded-lg font-medium transition-colors bg-gradient-to-r from-brand-green to-emerald-600 text-white"
                            >
                                إظهار الكل
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {currentInvoices.map((invoice) => (
                                <div key={invoice.id} className="relative group">
                                    <InvoiceCard invoice={invoice} />
                                    {/* Download Button Overlay */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadPDF(invoice.id);
                                        }}
                                        className="absolute top-3 left-3 p-2 bg-card rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-muted"
                                        title="تحميل PDF"
                                    >
                                        <Download className="w-4 h-4 text-brand-green" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-card border border-border hover:border-brand-green"
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
                                            className={`w-10 h-10 rounded-lg font-medium transition-all border ${
                                                currentPage === page
                                                    ? 'bg-gradient-to-r from-brand-green to-emerald-600 text-white border-brand-green'
                                                    : 'bg-card text-foreground border-border hover:border-brand-green'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-card border border-border hover:border-brand-green"
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
