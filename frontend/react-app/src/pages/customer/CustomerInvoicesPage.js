import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../stores/authStore';
import CustomerHeader from '../../components/customer/CustomerHeader';
import InvoiceCard from '../../components/customer/InvoiceCard';
import { FileText, Receipt, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

/**
 * 💰 Customer Invoices Page
 */

export default function CustomerInvoicesPage() {
    const navigate = useNavigate();
    const notifications = useNotifications();
    const user = useAuthStore((state) => state.user);

    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
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
        const isCustomer = user && (user.type === 'customer' || roleId === 8 || roleId === '8');

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

            setInvoices(invoicesData);

            // Calculate stats
            const pending = invoicesData.filter(i => i.paymentStatus === 'pending').length;
            const paid = invoicesData.filter(i => i.paymentStatus === 'paid').length;
            const overdue = invoicesData.filter(i => i.paymentStatus === 'overdue').length;
            const totalAmount = invoicesData.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
            const totalPaid = invoicesData.reduce((sum, i) => sum + (i.paidAmount || 0), 0);

            setStats({
                totalInvoices: invoicesData.length,
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
            filtered = filtered.filter(i => i.paymentStatus === activeFilter);
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
        { id: 'all', label: 'الكل', count: stats.totalInvoices },
        { id: 'pending', label: 'في الانتظار', count: stats.pendingInvoices },
        { id: 'paid', label: 'مدفوع', count: stats.paidInvoices },
        { id: 'overdue', label: 'متأخر', count: stats.overdueInvoices }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
            <CustomerHeader user={user} notificationCount={3} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                        >
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">الفواتير</h1>
                            <p className="text-sm text-gray-600">إدارة ومتابعة الفواتير والمدفوعات</p>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600">إجمالي الفواتير</p>
                        <p className="text-2xl font-bold" style={{ color: '#10B981' }}>{stats.totalAmount.toFixed(2)} جنيه</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600">المدفوع</p>
                        <p className="text-2xl font-bold text-green-600">{stats.totalPaid.toFixed(2)} جنيه</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600">المتبقي</p>
                        <p className="text-2xl font-bold text-orange-600">{(stats.totalAmount - stats.totalPaid).toFixed(2)} جنيه</p>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="space-y-4 mb-6">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ابحث برقم الفاتورة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 pl-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 transition-all"
                            style={{ borderColor: searchQuery ? '#10B981' : '#D1D5DB' }}
                            onFocus={(e) => e.target.style.borderColor = '#10B981'}
                            onBlur={(e) => e.target.style.borderColor = searchQuery ? '#10B981' : '#D1D5DB'}
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="flex gap-2">
                            {filters.map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200"
                                    style={{
                                        background: activeFilter === filter.id
                                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                            : '#F3F4F6',
                                        color: activeFilter === filter.id ? 'white' : '#374151',
                                        transform: activeFilter === filter.id ? 'scale(1.05)' : 'scale(1)'
                                    }}
                                >
                                    {filter.label}
                                    {filter.count > 0 && (
                                        <span
                                            className="mr-2 px-2 py-0.5 rounded-full text-xs font-bold"
                                            style={{
                                                background: activeFilter === filter.id ? 'rgba(255,255,255,0.3)' : '#D1D5DB',
                                                color: activeFilter === filter.id ? 'white' : '#374151'
                                            }}
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
                    <p className="text-sm text-gray-600">
                        عرض <span className="font-semibold">{currentInvoices.length}</span> من{' '}
                        <span className="font-semibold">{filteredInvoices.length}</span> فاتورة
                    </p>
                </div>

                {/* Invoices Grid */}
                {currentInvoices.length === 0 ? (
                    <div className="text-center py-16">
                        <div
                            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                            style={{ background: '#F3F4F6' }}
                        >
                            <Receipt className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد فواتير</h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery ? 'لم يتم العثور على نتائج مطابقة' : 'لم يتم إنشاء أي فواتير بعد'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {currentInvoices.map((invoice) => (
                                <InvoiceCard key={invoice.id} invoice={invoice} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ background: 'white', border: '1px solid #E5E7EB' }}
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
                                                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                    : 'white',
                                                color: currentPage === page ? 'white' : '#374151',
                                                border: `1px solid ${currentPage === page ? '#10B981' : '#E5E7EB'}`
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
                                    style={{ background: 'white', border: '1px solid #E5E7EB' }}
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
