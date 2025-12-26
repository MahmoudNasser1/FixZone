import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import {
  Plus, Search, Filter, Download, Eye, Edit, Trash2,
  FileText, DollarSign, Calendar, User, Building2,
  CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react';

const InvoicesPage = () => {
  const { formatMoney } = useSettings();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('all'); // 'all', 'sale', 'purchase'
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, [invoiceTypeFilter, selectedFilter, searchTerm]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (invoiceTypeFilter !== 'all') {
        params.invoiceType = invoiceTypeFilter;
      }
      if (selectedFilter !== 'all') {
        params.status = selectedFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      const data = await apiService.getInvoices(params);
      console.log('API Response:', data);
      // Handle different response structures from the API
      if (data.success && Array.isArray(data.data)) {
        setInvoices(data.data);
      } else if (data.invoices && Array.isArray(data.invoices)) {
        setInvoices(data.invoices);
      } else if (Array.isArray(data)) {
        setInvoices(data);
      } else if (data.data && Array.isArray(data.data.invoices)) {
        setInvoices(data.data.invoices);
      } else {
        console.warn('Unexpected API response format:', data);
        setInvoices([]);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('حدث خطأ في تحميل الفواتير');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    // Normalize status - handle both paymentStatus and status
    let normalizedStatus = status?.toLowerCase() || 'unpaid';

    // Map backend statuses to frontend statuses
    if (normalizedStatus === 'partially_paid') {
      normalizedStatus = 'partial';
    } else if (normalizedStatus === 'sent' || normalizedStatus === 'draft') {
      normalizedStatus = 'unpaid';
    }

    const statusConfig = {
      'paid': { variant: 'default', icon: CheckCircle, text: 'مدفوعة', color: 'text-green-600' },
      'unpaid': { variant: 'destructive', icon: XCircle, text: 'غير مدفوعة', color: 'text-red-600' },
      'partial': { variant: 'secondary', icon: Clock, text: 'مدفوعة جزئياً', color: 'text-yellow-600' },
      'partially_paid': { variant: 'secondary', icon: Clock, text: 'مدفوعة جزئياً', color: 'text-yellow-600' },
      'overdue': { variant: 'destructive', icon: AlertCircle, text: 'متأخرة', color: 'text-red-600' },
      'cancelled': { variant: 'outline', icon: XCircle, text: 'ملغاة', color: 'text-gray-600' }
    };

    const config = statusConfig[normalizedStatus] || statusConfig['unpaid'];
    const Icon = config.icon;

    return (
      <SimpleBadge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </SimpleBadge>
    );
  };

  const formatCurrency = (amount, currency = 'EGP') => {
    return formatMoney(amount || 0, currency);
  };

  const formatDate = (date) => {
    if (!date) return 'غير محدد';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
      return dateObj.toLocaleDateString('en-GB');
    } catch (error) {
      console.error('Error formatting date:', error, 'Date value:', date);
      return 'تاريخ غير صحيح';
    }
  };

  const filteredInvoices = invoices || [];

  const handleDeleteInvoice = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        await apiService.deleteInvoice(id);
        setInvoices((invoices || []).filter(invoice => invoice.id !== id));
      } catch (err) {
        console.error('Error deleting invoice:', err);
        alert('حدث خطأ في حذف الفاتورة');
      }
    }
  };

  const handleBulkAction = async (action, selectedIds) => {
    try {
      await apiService.bulkActionInvoices(action, selectedIds);
      fetchInvoices(); // Refresh the list
    } catch (err) {
      console.error('Error in bulk action:', err);
      alert('حدث خطأ في تنفيذ العملية');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الفواتير...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل الفواتير</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <SimpleButton onClick={fetchInvoices}>
          إعادة المحاولة
        </SimpleButton>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">إدارة الفواتير</h1>
          <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5">إدارة فواتير طلبات الإصلاح والمدفوعات</p>
        </div>
        <Link to="/invoices/new" className="shrink-0">
          <SimpleButton size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 sm:gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">فاتورة جديدة</span>
            <span className="xs:hidden">جديدة</span>
          </SimpleButton>
        </Link>
      </div>

      {/* Filters and Search */}
      <SimpleCard>
        <SimpleCardContent className="p-3 sm:p-6">
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="البحث في الفواتير..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pr-10 pl-4 text-sm border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={invoiceTypeFilter}
                onChange={(e) => setInvoiceTypeFilter(e.target.value)}
                className="w-full h-9 px-2 text-xs sm:text-sm border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground appearance-none cursor-pointer"
              >
                <option value="all">جميع الأنواع</option>
                <option value="sale">فاتورة بيع</option>
                <option value="purchase">فاتورة شراء</option>
              </select>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full h-9 px-2 text-xs sm:text-sm border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground appearance-none cursor-pointer"
              >
                <option value="all">جميع الحالات</option>
                <option value="paid">مدفوعة</option>
                <option value="unpaid">غير مدفوعة</option>
                <option value="partial">مدفوعة جزئياً</option>
                <option value="overdue">متأخرة</option>
                <option value="cancelled">ملغاة</option>
              </select>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SimpleCard className="hover:shadow-lg transition-shadow hover:bg-accent/5">
          <SimpleCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">إجمالي الفواتير</p>
                <p className="text-3xl font-bold text-foreground">{(invoices || []).length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard className="hover:shadow-lg transition-shadow hover:bg-accent/5">
          <SimpleCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">المبلغ الإجمالي</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency((invoices || []).reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0), 'EGP')}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard className="hover:shadow-lg transition-shadow hover:bg-accent/5">
          <SimpleCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">المدفوع</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency((invoices || []).reduce((sum, invoice) => sum + (invoice.amountPaid || 0), 0), 'EGP')}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard className="hover:shadow-lg transition-shadow hover:bg-accent/5">
          <SimpleCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">غير مدفوعة</p>
                <p className="text-3xl font-bold text-foreground">
                  {(invoices || []).filter(invoice => invoice.status === 'unpaid').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Invoices List */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>قائمة الفواتير ({filteredInvoices.length})</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد فواتير</h3>
              <p className="text-gray-500 mb-6">ابدأ بإنشاء فاتورة جديدة</p>
              <Link to="/invoices/new">
                <SimpleButton>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء فاتورة جديدة
                </SimpleButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="border border-border rounded-lg p-4 hover:shadow-md hover:bg-accent/5 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          فاتورة #{invoice.id}
                        </h3>
                        {getStatusBadge(invoice.paymentStatus || invoice.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>المبلغ: {formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                        </div>
                        {invoice.invoiceType === 'purchase' && invoice.vendorName ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>المورد: {invoice.vendorName}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>العميل: {invoice.customerName || 'غير محدد'}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>التاريخ: {formatDate(invoice.createdAt)}</span>
                        </div>
                      </div>
                      {invoice.repairRequestId && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground/80">
                          <FileText className="w-4 h-4" />
                          <span>طلب الإصلاح: #{invoice.repairRequestId}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <SimpleBadge variant={invoice.invoiceType === 'purchase' ? 'secondary' : 'default'} className="text-xs">
                          {invoice.invoiceType === 'purchase' ? 'فاتورة شراء' : 'فاتورة بيع'}
                        </SimpleBadge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {invoice.id && (
                        <Link to={`/invoices/${invoice.id}`}>
                          <SimpleButton variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </SimpleButton>
                        </Link>
                      )}
                      {invoice.id && (
                        <Link to={`/invoices/${invoice.id}/edit`}>
                          <SimpleButton variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </SimpleButton>
                        </Link>
                      )}
                      {invoice.id && (
                        <SimpleButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </SimpleButton>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
};

export default InvoicesPage;