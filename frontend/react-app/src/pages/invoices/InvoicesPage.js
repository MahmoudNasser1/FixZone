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
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getInvoices();
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        // Handle the nested structure from the API
        if (data.success && data.data && data.data.invoices) {
          setInvoices(data.data.invoices);
        } else if (Array.isArray(data)) {
          setInvoices(data);
        } else {
          setInvoices([]);
        }
      } else {
        throw new Error('Failed to fetch invoices');
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
    const statusConfig = {
      'paid': { variant: 'default', icon: CheckCircle, text: 'مدفوعة', color: 'text-green-600' },
      'unpaid': { variant: 'destructive', icon: XCircle, text: 'غير مدفوعة', color: 'text-red-600' },
      'partial': { variant: 'secondary', icon: Clock, text: 'مدفوعة جزئياً', color: 'text-yellow-600' },
      'overdue': { variant: 'destructive', icon: AlertCircle, text: 'متأخرة', color: 'text-red-600' },
      'cancelled': { variant: 'outline', icon: XCircle, text: 'ملغاة', color: 'text-gray-600' }
    };

    const config = statusConfig[status] || statusConfig['unpaid'];
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
    return new Date(date).toLocaleDateString('ar-SA');
  };

  const filteredInvoices = (invoices || []).filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.id?.toString().includes(searchTerm) ||
      invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.repairRequestId?.toString().includes(searchTerm);
    
    const matchesFilter = selectedFilter === 'all' || invoice.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const handleDeleteInvoice = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        const response = await apiService.deleteInvoice(id);
        if (response.ok) {
          setInvoices((invoices || []).filter(invoice => invoice.id !== id));
        } else {
          alert('حدث خطأ في حذف الفاتورة');
        }
      } catch (err) {
        console.error('Error deleting invoice:', err);
        alert('حدث خطأ في حذف الفاتورة');
      }
    }
  };

  const handleBulkAction = async (action, selectedIds) => {
    try {
      const response = await apiService.bulkActionInvoices(action, selectedIds);
      if (response.ok) {
        fetchInvoices(); // Refresh the list
      } else {
        alert('حدث خطأ في تنفيذ العملية');
      }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الفواتير</h1>
          <p className="text-gray-600 mt-1">إدارة فواتير طلبات الإصلاح والمدفوعات</p>
          </div>
        <div className="flex items-center gap-3">
          <Link to="/invoices/new">
            <SimpleButton className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 ml-2" />
              فاتورة جديدة
            </SimpleButton>
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
        <SimpleCard>
          <SimpleCardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="البحث في الفواتير..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="paid">مدفوعة</option>
                <option value="unpaid">غير مدفوعة</option>
                <option value="partial">مدفوعة جزئياً</option>
                <option value="overdue">متأخرة</option>
                <option value="cancelled">ملغاة</option>
              </select>
              <SimpleButton variant="outline">
                <Filter className="w-4 h-4 ml-2" />
                فلترة
              </SimpleButton>
                </div>
                </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SimpleCard className="hover:shadow-lg transition-shadow">
          <SimpleCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الفواتير</p>
                <p className="text-3xl font-bold text-gray-900">{(invoices || []).length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard className="hover:shadow-lg transition-shadow">
          <SimpleCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">المبلغ الإجمالي</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency((invoices || []).reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0), 'EGP')}
                </p>
                </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
              
        <SimpleCard className="hover:shadow-lg transition-shadow">
          <SimpleCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">المدفوع</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency((invoices || []).reduce((sum, invoice) => sum + (invoice.amountPaid || 0), 0), 'EGP')}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
              
        <SimpleCard className="hover:shadow-lg transition-shadow">
          <SimpleCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">غير مدفوعة</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(invoices || []).filter(invoice => invoice.status === 'unpaid').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
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
                <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          فاتورة #{invoice.id}
                        </h3>
                        {getStatusBadge(invoice.status)}
              </div>
              
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>المبلغ: {formatCurrency(invoice.totalAmount, invoice.currency)}</span>
              </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>التاريخ: {formatDate(invoice.createdAt)}</span>
              </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>طلب الإصلاح: #{invoice.repairRequestId}</span>
              </div>
            </div>
            
                      {invoice.customerName && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>العميل: {invoice.customerName}</span>
                        </div>
                      )}
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