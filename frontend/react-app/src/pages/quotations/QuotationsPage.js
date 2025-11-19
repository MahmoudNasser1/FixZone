import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import DataView from '../../components/ui/DataView';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner, { TableLoadingSkeleton, CardLoadingSkeleton } from '../../components/ui/LoadingSpinner';
import QuotationForm from './QuotationForm';
import { 
  Plus, Search, Filter, Download, RefreshCw,
  DollarSign, Calendar, Tag, FileText,
  Eye, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, X,
  Wrench, CheckCircle, XCircle, Send, Clock, Users, Monitor
} from 'lucide-react';

const QuotationsPage = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  
  // مساعد تنبيهات بسيط لتقليل الإزعاج
  const notify = useCallback((type, message) => {
    if (notifications?.addNotification) {
      notifications.addNotification({ type, message });
    } else if (notifications?.[type]) {
      notifications[type](message);
    }
  }, [notifications]);

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRepair, setSelectedRepair] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  
  // Sorting state
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  
  // Repairs for filter
  const [repairs, setRepairs] = useState([]);

  const isInitialMount = useRef(true);

  // جلب البيانات
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadRepairs(),
        fetchQuotations()
      ]);
      isInitialMount.current = false;
    } catch (error) {
      console.error('Error loading initial data:', error);
      notify('error', 'خطأ في تحميل البيانات');
      isInitialMount.current = false;
    }
  };

  const loadRepairs = async () => {
    try {
      const response = await apiService.request('/repairs?limit=100');
      if (Array.isArray(response)) {
        setRepairs(response);
      } else if (response?.data && Array.isArray(response.data)) {
        setRepairs(response.data);
      }
    } catch (error) {
      console.error('Error loading repairs:', error);
      setRepairs([]);
    }
  };

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sort: sortField,
        sortDir: sortDirection
      };

      if (selectedStatus) {
        params.status = selectedStatus;
      }

      if (selectedRepair) {
        params.repairRequestId = selectedRepair;
      }

      if (dateFrom) {
        params.dateFrom = dateFrom;
      }

      if (dateTo) {
        params.dateTo = dateTo;
      }

      // Search (server-side via 'q' parameter)
      if (searchTerm && searchTerm.trim()) {
        params.q = searchTerm.trim();
      }

      const response = await apiService.getQuotations(params);
      
      let quotationsData = [];
      let totalCount = 0;

      if (response?.success && response?.data && Array.isArray(response.data)) {
        quotationsData = response.data;
        totalCount = response.pagination?.total || 0;
      } else if (Array.isArray(response)) {
        quotationsData = response;
        totalCount = response.length;
      } else if (response?.data && Array.isArray(response.data)) {
        quotationsData = response.data;
        totalCount = response.pagination?.total || 0;
      }

      setQuotations(quotationsData);
      setTotalItems(totalCount);
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setError('حدث خطأ في تحميل بيانات العروض السعرية');
      setQuotations([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, selectedStatus, selectedRepair, dateFrom, dateTo, sortField, sortDirection, searchTerm]);

  // Re-fetch when filters change (with debounce for search)
  useEffect(() => {
    // Skip initial mount (already fetched in loadInitialData)
    if (isInitialMount.current) return;
    
    const timer = setTimeout(() => {
      fetchQuotations();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timer);
  }, [fetchQuotations, searchTerm]);

  // Handle create quotation
  const handleCreateQuotation = () => {
    setEditingQuotation(null);
    setIsFormModalOpen(true);
  };

  // Handle edit quotation
  const handleEditQuotation = (quotation) => {
    setEditingQuotation(quotation);
    setIsFormModalOpen(true);
  };

  // Handle delete quotation
  const handleDeleteQuotation = async (quotationId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العرض السعري؟')) {
      return;
    }

    try {
      await apiService.deleteQuotation(quotationId);
      notify('success', 'تم حذف العرض السعري بنجاح');
      fetchQuotations();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      notify('error', 'خطأ في حذف العرض السعري');
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setEditingQuotation(null);
    fetchQuotations();
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedRepair('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // Get status badge variant
  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { label: 'قيد الانتظار', variant: 'secondary', icon: Clock },
      'SENT': { label: 'تم الإرسال', variant: 'default', icon: Send },
      'APPROVED': { label: 'موافق عليه', variant: 'success', icon: CheckCircle },
      'REJECTED': { label: 'مرفوض', variant: 'destructive', icon: XCircle }
    };
    return statusMap[status] || { label: status, variant: 'secondary', icon: Tag };
  };

  // Columns definition for DataView
  const columns = [
    {
      id: 'repairRequest',
      key: 'repairRequest',
      header: (
        <button
          onClick={() => handleSort('id')}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          طلب الإصلاح
          {renderSortIcon('id')}
        </button>
      ),
      label: 'طلب الإصلاح',
      description: 'طلب الإصلاح المرتبط',
      defaultVisible: true,
      accessorKey: 'trackingToken',
      cell: ({ row }) => {
        const quotation = row.original;
        return (
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-500" />
            <div>
              {quotation.trackingToken ? (
                <button
                  className="text-sm text-blue-600 hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/repairs/${quotation.repairRequestId}`);
                  }}
                >
                  {quotation.trackingToken}
                </button>
              ) : (
                <span className="text-sm text-gray-700">طلب #{quotation.repairRequestId}</span>
              )}
              {quotation.customerName && (
                <p className="text-xs text-gray-500">{quotation.customerName}</p>
              )}
            </div>
          </div>
        );
      }
    },
    {
      id: 'status',
      key: 'status',
      header: (
        <button
          onClick={() => handleSort('status')}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          الحالة
          {renderSortIcon('status')}
        </button>
      ),
      label: 'الحالة',
      description: 'حالة العرض السعري',
      defaultVisible: true,
      accessorKey: 'status',
      cell: ({ row }) => {
        const quotation = row.original;
        const statusInfo = getStatusBadge(quotation.status);
        const StatusIcon = statusInfo.icon;
        return (
          <SimpleBadge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {statusInfo.label}
          </SimpleBadge>
        );
      }
    },
    {
      id: 'totalAmount',
      key: 'totalAmount',
      header: (
        <button
          onClick={() => handleSort('totalAmount')}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          المبلغ الإجمالي
          {renderSortIcon('totalAmount')}
        </button>
      ),
      label: 'المبلغ الإجمالي',
      description: 'المبلغ الإجمالي للعرض',
      defaultVisible: true,
      accessorKey: 'totalAmount',
      cell: ({ row }) => {
        const quotation = row.original;
        const amount = parseFloat(quotation.totalAmount || 0);
        return (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="font-semibold text-green-600">
              {amount.toFixed(2)} {quotation.currency || 'EGP'}
            </span>
          </div>
        );
      }
    },
    {
      id: 'taxAmount',
      key: 'taxAmount',
      header: (
        <button
          onClick={() => handleSort('taxAmount')}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          الضريبة
          {renderSortIcon('taxAmount')}
        </button>
      ),
      label: 'الضريبة',
      description: 'مبلغ الضريبة',
      defaultVisible: true,
      accessorKey: 'taxAmount',
      cell: ({ row }) => {
        const quotation = row.original;
        const tax = parseFloat(quotation.taxAmount || 0);
        return (
          <span className="text-sm text-gray-700">
            {tax.toFixed(2)} {quotation.currency || 'EGP'}
          </span>
        );
      }
    },
    {
      id: 'device',
      key: 'device',
      header: 'الجهاز',
      label: 'الجهاز',
      description: 'معلومات الجهاز',
      defaultVisible: true,
      accessorKey: 'deviceModel',
      cell: ({ row }) => {
        const quotation = row.original;
        return (
          <div className="text-sm">
            {quotation.deviceType && (
              <p className="text-gray-700">{quotation.deviceType}</p>
            )}
            {quotation.deviceBrand && quotation.deviceModel && (
              <p className="text-xs text-gray-500">
                {quotation.deviceBrand} {quotation.deviceModel}
              </p>
            )}
          </div>
        );
      }
    },
    {
      id: 'createdAt',
      key: 'createdAt',
      header: (
        <button
          onClick={() => handleSort('createdAt')}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          التاريخ
          {renderSortIcon('createdAt')}
        </button>
      ),
      label: 'تاريخ الإنشاء',
      description: 'تاريخ إنشاء العرض',
      defaultVisible: true,
      accessorKey: 'createdAt',
      cell: ({ row }) => {
        const quotation = row.original;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900">
              {quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString('ar-EG') : '-'}
            </span>
          </div>
        );
      }
    },
    {
      id: 'sentAt',
      key: 'sentAt',
      header: 'تاريخ الإرسال',
      label: 'تاريخ الإرسال',
      description: 'تاريخ إرسال العرض',
      defaultVisible: false,
      accessorKey: 'sentAt',
      cell: ({ row }) => {
        const quotation = row.original;
        return quotation.sentAt ? (
          <span className="text-sm text-gray-700">
            {new Date(quotation.sentAt).toLocaleDateString('ar-EG')}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );
      }
    },
    {
      id: 'responseAt',
      key: 'responseAt',
      header: 'تاريخ الرد',
      label: 'تاريخ الرد',
      description: 'تاريخ رد العميل',
      defaultVisible: false,
      accessorKey: 'responseAt',
      cell: ({ row }) => {
        const quotation = row.original;
        return quotation.responseAt ? (
          <span className="text-sm text-gray-700">
            {new Date(quotation.responseAt).toLocaleDateString('ar-EG')}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );
      }
    },
    {
      id: 'notes',
      key: 'notes',
      header: 'الملاحظات',
      label: 'الملاحظات',
      description: 'ملاحظات العرض',
      defaultVisible: false,
      accessorKey: 'notes',
      cell: ({ row }) => {
        const quotation = row.original;
        return (
          <div className="max-w-xs">
            <p className="text-sm text-gray-700 truncate">
              {quotation.notes || 'لا توجد ملاحظات'}
            </p>
          </div>
        );
      }
    },
    {
      id: 'actions',
      key: 'actions',
      header: 'الإجراءات',
      label: 'الإجراءات',
      description: 'إجراءات العرض السعري',
      defaultVisible: true,
      enableSorting: false,
      cell: ({ row }) => {
        const quotation = row.original;
        return (
          <div className="flex items-center gap-1">
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditQuotation(quotation);
              }}
              className="h-8 w-8 p-0"
              title="تعديل"
            >
              <Edit className="w-4 h-4" />
            </SimpleButton>
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteQuotation(quotation.id);
              }}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </SimpleButton>
          </div>
        );
      }
    }
  ];

  // Render card
  const renderCard = (quotation) => {
    const amount = parseFloat(quotation.totalAmount || 0);
    const tax = parseFloat(quotation.taxAmount || 0);
    const statusInfo = getStatusBadge(quotation.status);
    const StatusIcon = statusInfo.icon;
    
    return (
      <SimpleCard className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200" onClick={() => handleEditQuotation(quotation)}>
        <SimpleCardContent className="p-5">
          {/* Header with Status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <SimpleBadge variant={statusInfo.variant} className="flex items-center gap-1.5 px-2.5 py-1">
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{statusInfo.label}</span>
                </SimpleBadge>
              </div>
              
              {/* Amount */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {amount.toFixed(2)} <span className="text-base font-semibold text-gray-600">{quotation.currency || 'EGP'}</span>
              </h3>
              
              {/* Customer & Repair Info */}
              <div className="space-y-2 mb-3">
                {quotation.customerName && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium">العميل:</span>
                    <span className="text-gray-900">{quotation.customerName}</span>
                  </div>
                )}
                {quotation.trackingToken && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Wrench className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium">طلب:</span>
                    <span className="text-blue-600 hover:text-blue-700 font-mono text-xs">
                      {quotation.trackingToken.length > 20 
                        ? `${quotation.trackingToken.substring(0, 20)}...` 
                        : quotation.trackingToken}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Notes */}
              {quotation.notes && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2 bg-gray-50 p-2 rounded">
                  {quotation.notes}
                </p>
              )}
            </div>
          </div>
          
          {/* Footer with Meta Info */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString('ar-EG') : '-'}</span>
              </div>
              {tax > 0 && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span>ضريبة: <span className="font-medium">{tax.toFixed(2)}</span></span>
                </div>
              )}
              {quotation.deviceType && (
                <div className="flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{quotation.deviceType}</span>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1">
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditQuotation(quotation);
                }}
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                title="تعديل"
              >
                <Edit className="w-4 h-4" />
              </SimpleButton>
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteQuotation(quotation.id);
                }}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </SimpleButton>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>
    );
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة العروض السعرية</h1>
          <p className="text-gray-600 mt-1">إنشاء وإدارة عروض الأسعار للعملاء</p>
        </div>
        <SimpleButton onClick={handleCreateQuotation}>
          <Plus className="w-5 h-5 ml-2" />
          إضافة عرض سعري جديد
        </SimpleButton>
      </div>

      {/* Filters */}
      <SimpleCard>
        <SimpleCardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في العروض السعرية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 w-64"
                />
              </div>

              {/* Status Filter */}
              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الحالات</SelectItem>
                  <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                  <SelectItem value="SENT">تم الإرسال</SelectItem>
                  <SelectItem value="APPROVED">موافق عليه</SelectItem>
                  <SelectItem value="REJECTED">مرفوض</SelectItem>
                </SelectContent>
              </Select>

              {/* Repair Filter */}
              <Select
                value={selectedRepair}
                onValueChange={(value) => {
                  setSelectedRepair(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="جميع طلبات الإصلاح" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع طلبات الإصلاح</SelectItem>
                  {repairs.slice(0, 50).map(repair => (
                    <SelectItem key={repair.id} value={repair.id.toString()}>
                      {repair.trackingToken || `طلب #${repair.id}`} - {repair.customerName || 'عميل'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date From */}
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="من تاريخ"
                className="w-40"
              />

              {/* Date To */}
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="إلى تاريخ"
                className="w-40"
              />

              {/* Clear Filters */}
              {(selectedStatus || selectedRepair || dateFrom || dateTo || searchTerm) && (
                <SimpleButton
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-gray-600"
                >
                  <X className="w-4 h-4 ml-1" />
                  مسح
                </SimpleButton>
              )}

              {/* Refresh */}
              <SimpleButton
                variant="outline"
                size="sm"
                onClick={fetchQuotations}
                title="تحديث"
              >
                <RefreshCw className="w-4 h-4" />
              </SimpleButton>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Quotations List */}
      {loading ? (
        <TableLoadingSkeleton rows={10} columns={6} />
      ) : error ? (
        <SimpleCard>
          <SimpleCardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <SimpleButton onClick={fetchQuotations} className="mt-4">
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </SimpleButton>
          </SimpleCardContent>
        </SimpleCard>
      ) : quotations.length === 0 ? (
        <SimpleCard>
          <SimpleCardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد عروض سعرية</h3>
            <p className="text-gray-600 mb-4">ابدأ بإنشاء عرض سعري جديد</p>
            <SimpleButton onClick={handleCreateQuotation}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة عرض سعري جديد
            </SimpleButton>
          </SimpleCardContent>
        </SimpleCard>
      ) : (
        <>
          <DataView
            data={quotations}
            columns={columns}
            renderCard={renderCard}
            viewMode="table"
            pagination={{
              currentPage,
              totalPages,
              itemsPerPage,
              totalItems,
              onPageChange: setCurrentPage,
              onItemsPerPageChange: setItemsPerPage
            }}
            emptyMessage="لا توجد عروض سعرية"
          />
        </>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingQuotation(null);
        }}
        title={editingQuotation ? 'تعديل عرض سعري' : 'إضافة عرض سعري جديد'}
        size="lg"
      >
        <QuotationForm
          quotation={editingQuotation}
          onSave={(data) => {
            handleFormSuccess();
          }}
          onCancel={() => {
            setIsFormModalOpen(false);
            setEditingQuotation(null);
          }}
          onSuccess={handleFormSuccess}
        />
      </Modal>
    </div>
  );
};

export default QuotationsPage;

