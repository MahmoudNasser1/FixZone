import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Eye, Edit, Trash2, FileText, Download, Search, Filter, 
  Calendar, DollarSign, Send, CheckCircle, AlertCircle, Clock,
  MoreHorizontal, Printer, Mail, Archive, RefreshCw
} from 'lucide-react';
import SimpleCard from '../../components/SimpleCard';
import SimpleButton from '../../components/SimpleButton';
import SimpleBadge from '../../components/SimpleBadge';
import DataTable from '../../components/DataTable';
import { useNotifications } from '../../hooks/useNotifications';
import { apiService } from '../../services/api';

function InvoicesPage() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    customerId: ''
  });
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Load invoices with filters
  useEffect(() => {
    loadInvoices();
  }, [filters, pagination.currentPage]);

  async function loadInvoices(page = 1) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });
      
      const response = await apiService.request(`/invoices?${params}`);
      if (response.success) {
        setInvoices(response.data.invoices || []);
        setPagination(response.data.pagination || {});
        setStats(response.data.stats || {});
      } else {
        throw new Error(response.error || 'فشل في تحميل الفواتير');
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError('فشل في تحميل الفواتير');
      notifications.error('فشل في تحميل الفواتير');
    } finally {
      setLoading(false);
    }
  }

  // Status badge configuration
  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'secondary', text: 'مسودة', icon: Edit },
      sent: { color: 'info', text: 'مرسلة', icon: Send },
      paid: { color: 'success', text: 'مدفوعة', icon: CheckCircle },
      overdue: { color: 'danger', text: 'متأخرة', icon: AlertCircle },
      cancelled: { color: 'secondary', text: 'ملغية', icon: Archive }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const IconComponent = config.icon;
    
    return (
      <SimpleBadge color={config.color} className="inline-flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.text}
      </SimpleBadge>
    );
  };

  // Handle bulk actions
  async function handleBulkAction(action, selectedIds) {
    if (selectedIds.length === 0) {
      notifications.error('يرجى اختيار فواتير للتنفيذ');
      return;
    }

    setBulkActionLoading(true);
    try {
      const response = await apiService.request('/invoices/bulk-action', {
        method: 'POST',
        body: JSON.stringify({
          action,
          invoiceIds: selectedIds,
          data: action === 'updateStatus' ? { status: 'sent' } : {}
        })
      });

      if (response.success) {
        notifications.success(`تم تنفيذ العملية على ${response.affectedRows} فاتورة`);
        setSelectedInvoices([]);
        loadInvoices();
      } else {
        throw new Error(response.error || 'فشل في تنفيذ العملية');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      notifications.error('فشل في تنفيذ العملية');
    } finally {
      setBulkActionLoading(false);
    }
  }

  // Handle single invoice actions
  async function handleDeleteInvoice(invoiceId) {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;

    try {
      const response = await apiService.request(`/invoices/${invoiceId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        notifications.success('تم حذف الفاتورة بنجاح');
        loadInvoices();
      } else {
        throw new Error(response.error || 'فشل في حذف الفاتورة');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      notifications.error('فشل في حذف الفاتورة');
    }
  }

  async function handlePrintInvoice(invoiceId) {
    try {
      const response = await apiService.request(`/invoices/${invoiceId}/pdf`);
      if (response.success) {
        notifications.success('جاري تحضير الفاتورة للطباعة...');
        // Here you would handle PDF generation/download
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      notifications.error('فشل في إنشاء ملف PDF');
    }
  }

  // Table columns configuration
  const columns = [
    {
      key: 'id',
      title: 'رقم الفاتورة',
      render: (invoice) => `#${invoice.id}`,
      sortable: true
    },
    {
      key: 'customerName',
      title: 'العميل',
      render: (invoice) => (
        <div>
          <div className="font-medium">{invoice.customerName || 'غير محدد'}</div>
          {invoice.customerPhone && (
            <div className="text-sm text-gray-500">{invoice.customerPhone}</div>
          )}
        </div>
      ),
      sortable: true
    },
    {
      key: 'deviceModel',
      title: 'الجهاز',
      render: (invoice) => invoice.deviceModel ? (
        <div>
          <div className="font-medium">{invoice.deviceBrand}</div>
          <div className="text-sm text-gray-500">{invoice.deviceModel}</div>
        </div>
      ) : 'غير محدد'
    },
    {
      key: 'totalAmount',
      title: 'المبلغ الإجمالي',
      render: (invoice) => (
        <div className="text-right">
          <div className="font-medium">{invoice.totalAmount?.toFixed(2)} {invoice.currency}</div>
          {invoice.amountPaid > 0 && (
            <div className="text-sm text-green-600">مدفوع: {invoice.amountPaid?.toFixed(2)}</div>
          )}
        </div>
      ),
      sortable: true
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (invoice) => getStatusBadge(invoice.status),
      sortable: true
    },
    {
      key: 'createdAt',
      title: 'تاريخ الإنشاء',
      render: (invoice) => new Date(invoice.createdAt).toLocaleDateString('ar-EG'),
      sortable: true
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      render: (invoice) => (
        <div className="flex items-center gap-1">
          <SimpleButton
            variant="outline"
            size="sm"
            onClick={() => navigate(`/invoices/${invoice.id}`)}
          >
            <Eye className="w-4 h-4" />
          </SimpleButton>
          <SimpleButton
            variant="outline"
            size="sm"
            onClick={() => handlePrintInvoice(invoice.id)}
          >
            <Printer className="w-4 h-4" />
          </SimpleButton>
          <SimpleButton
            variant="outline"
            size="sm"
            onClick={() => handleDeleteInvoice(invoice.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </SimpleButton>
        </div>
      )
    }
  ];

  // Bulk actions configuration
  const bulkActions = [
    {
      label: 'إرسال الفواتير',
      action: 'send',
      icon: Send,
      variant: 'default'
    },
    {
      label: 'تحديد كمدفوعة',
      action: 'markPaid',
      icon: CheckCircle,
      variant: 'success'
    },
    {
      label: 'طباعة',
      action: 'print',
      icon: Printer,
      variant: 'outline'
    },
    {
      label: 'حذف',
      action: 'delete',
      icon: Trash2,
      variant: 'danger'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <SimpleButton onClick={() => loadInvoices()} className="mt-4">
            <RefreshCw className="w-4 h-4 ml-1" />
            إعادة المحاولة
          </SimpleButton>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">إدارة الفواتير</h1>
          <div className="flex items-center gap-2">
            <SimpleButton
              variant="outline"
              onClick={() => loadInvoices()}
            >
              <RefreshCw className="w-4 h-4 ml-1" />
              تحديث
            </SimpleButton>
            <SimpleButton onClick={() => navigate('/invoices/create')}>
              <Plus className="w-4 h-4 ml-1" />
              فاتورة جديدة
            </SimpleButton>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <SimpleCard className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg ml-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الفواتير</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </SimpleCard>

          <SimpleCard className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg ml-3">
                <Edit className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">مسودات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.draft || 0}</p>
              </div>
            </div>
          </SimpleCard>

          <SimpleCard className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg ml-3">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">مرسلة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.sent || 0}</p>
              </div>
            </div>
          </SimpleCard>

          <SimpleCard className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg ml-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">مدفوعة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paid || 0}</p>
              </div>
            </div>
          </SimpleCard>

          <SimpleCard className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg ml-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">متأخرة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue || 0}</p>
              </div>
            </div>
          </SimpleCard>
        </div>
      </div>

      {/* Advanced DataTable */}
      <SimpleCard>
        <DataTable
          data={invoices}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => loadInvoices(page)}
          searchable={true}
          searchPlaceholder="البحث في الفواتير..."
          onSearch={(search) => setFilters(prev => ({ ...prev, search }))}
          selectable={true}
          selectedItems={selectedInvoices}
          onSelectionChange={setSelectedInvoices}
          bulkActions={bulkActions}
          onBulkAction={handleBulkAction}
          bulkActionLoading={bulkActionLoading}
          filters={[
            {
              key: 'status',
              label: 'الحالة',
              type: 'select',
              options: [
                { value: '', label: 'جميع الحالات' },
                { value: 'draft', label: 'مسودة' },
                { value: 'sent', label: 'مرسلة' },
                { value: 'paid', label: 'مدفوعة' },
                { value: 'overdue', label: 'متأخرة' }
              ],
              value: filters.status,
              onChange: (value) => setFilters(prev => ({ ...prev, status: value }))
            },
            {
              key: 'dateFrom',
              label: 'من تاريخ',
              type: 'date',
              value: filters.dateFrom,
              onChange: (value) => setFilters(prev => ({ ...prev, dateFrom: value }))
            },
            {
              key: 'dateTo',
              label: 'إلى تاريخ',
              type: 'date',
              value: filters.dateTo,
              onChange: (value) => setFilters(prev => ({ ...prev, dateTo: value }))
            }
          ]}
          emptyState={{
            icon: FileText,
            title: 'لا توجد فواتير',
            description: 'لم يتم إنشاء أي فواتير بعد',
            action: {
              label: 'إنشاء فاتورة جديدة',
              onClick: () => navigate('/invoices/create')
            }
          }}
        />
      </SimpleCard>
    </div>
  );
}

export default InvoicesPage;
