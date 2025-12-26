import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Plus, ClipboardList, Calendar, Check, X, Eye, Edit, Trash2,
  AlertTriangle, FileText, Package, CheckCircle2,
  Clock, RotateCcw, Search
} from 'lucide-react';

import stockCountService from '../../services/stockCountService';
import warehouseService from '../../services/warehouseService';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { Input } from '../../components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import DataView from '../../components/ui/DataView';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorHandler from '../../components/common/ErrorHandler';
import { useNotifications } from '../../components/notifications/NotificationSystem';

const StockCountPage = () => {
  const { addNotification } = useNotifications();
  const [stockCounts, setStockCounts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStockCount, setSelectedStockCount] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    warehouseId: '',
    countDate: format(new Date(), 'yyyy-MM-dd'),
    type: 'full',
    notes: '',
    countedBy: 1 // TODO: Get from auth context
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [stockCountsData, warehousesData, statsData] = await Promise.all([
        stockCountService.getStockCounts(),
        warehouseService.getWarehouses(),
        stockCountService.getStockCountStats()
      ]);

      setStockCounts(stockCountsData.stockCounts || []);
      setWarehouses(warehousesData?.data || warehousesData || []);
      setStats(statsData || null);
    } catch (err) {
      setError(err.message || 'حدث خطأ في تحميل البيانات');
      console.error('Error loading stock count data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStockCount = async () => {
    try {
      setLoading(true);
      await stockCountService.createStockCount(formData);
      setOpenDialog(false);
      setFormData({
        warehouseId: '',
        countDate: format(new Date(), 'yyyy-MM-dd'),
        type: 'full',
        notes: '',
        countedBy: 1
      });
      addNotification({ type: 'success', message: 'تم إنشاء الجرد بنجاح' });
      await loadData();
    } catch (err) {
      addNotification({ type: 'error', message: err.message || 'حدث خطأ في إنشاء الجرد' });
      console.error('Error creating stock count:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      setLoading(true);
      await stockCountService.updateStockCountStatus(id, status);
      addNotification({ type: 'success', message: 'تم تحديث حالة الجرد بنجاح' });
      await loadData();
    } catch (err) {
      addNotification({ type: 'error', message: err.message || 'حدث خطأ في تحديث حالة الجرد' });
      console.error('Error updating stock count status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStockCount = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الجرد؟')) {
      try {
        setLoading(true);
        await stockCountService.deleteStockCount(id);
        addNotification({ type: 'success', message: 'تم حذف الجرد بنجاح' });
        await loadData();
      } catch (err) {
        addNotification({ type: 'error', message: err.message || 'حدث خطأ في حذف الجرد' });
        console.error('Error deleting stock count:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'scheduled': return { label: 'مجدول', color: 'default', icon: Calendar };
      case 'in_progress': return { label: 'جاري العمل', color: 'warning', icon: Clock };
      case 'pending_review': return { label: 'قيد المراجعة', color: 'info', icon: Eye };
      case 'approved': return { label: 'معتمد', color: 'primary', icon: CheckCircle2 };
      case 'completed': return { label: 'مكتمل', color: 'success', icon: Check };
      case 'cancelled': return { label: 'ملغي', color: 'destructive', icon: X };
      default: return { label: status, color: 'default', icon: FileText };
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'full': return 'جرد كامل';
      case 'partial': return 'جرد جزئي';
      case 'cycle': return 'جرد دوري';
      case 'spot': return 'جرد عشوائي';
      default: return type;
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'referenceNumber',
      header: 'رقم المرجع',
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.referenceNumber}</span>
      )
    },
    {
      accessorKey: 'warehouseName',
      header: 'المخزن',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{row.original.warehouseName}</span>
        </div>
      )
    },
    {
      accessorKey: 'countDate',
      header: 'تاريخ الجرد',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(row.original.countDate), 'dd/MM/yyyy', { locale: ar })}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => {
        const info = getStatusInfo(row.original.status);
        const Icon = info.icon;
        return (
          <SimpleBadge variant={info.color} className="flex items-center gap-1">
            <Icon className="w-3 h-3" />
            {info.label}
          </SimpleBadge>
        );
      }
    },
    {
      accessorKey: 'itemsCount',
      header: 'عدد العناصر',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span>{row.original.itemsCount || 0}</span>
        </div>
      )
    },
    {
      accessorKey: 'discrepancies',
      header: 'الفروقات',
      cell: ({ row }) => {
        const count = row.original.discrepancies || 0;
        return (
          <span className={`font-bold ${count > 0 ? 'text-destructive' : 'text-green-600'}`}>
            {count > 0 ? `-${count}` : count}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }) => {
        const stockCount = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={() => setSelectedStockCount(stockCount)}
              className="h-8 w-8 p-0"
              title="عرض التفاصيل"
            >
              <Eye className="w-4 h-4" />
            </SimpleButton>

            {stockCount.status === 'scheduled' && (
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={() => handleStatusUpdate(stockCount.id, 'in_progress')}
                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                title="بدء الجرد"
              >
                <Check className="w-4 h-4" />
              </SimpleButton>
            )}

            {stockCount.status === 'in_progress' && (
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={() => handleStatusUpdate(stockCount.id, 'pending_review')}
                className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                title="إرسال للمراجعة"
              >
                <CheckCircle2 className="w-4 h-4" />
              </SimpleButton>
            )}

            {stockCount.status === 'pending_review' && (
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={() => handleStatusUpdate(stockCount.id, 'approved')}
                className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                title="الموافقة"
              >
                <Check className="w-4 h-4" />
              </SimpleButton>
            )}

            {stockCount.status === 'approved' && (
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={() => handleStatusUpdate(stockCount.id, 'completed')}
                className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                title="إكمال الجرد"
              >
                <CheckCircle2 className="w-4 h-4" />
              </SimpleButton>
            )}

            {(stockCount.status === 'scheduled' || stockCount.status === 'in_progress') && (
              <SimpleButton
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteStockCount(stockCount.id)}
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                title="إلغاء"
              >
                <Trash2 className="w-4 h-4" />
              </SimpleButton>
            )}
          </div>
        );
      }
    }
  ], []);

  const filteredStockCounts = useMemo(() => {
    return stockCounts.filter(item =>
      searchTerm === '' ||
      item.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stockCounts, searchTerm]);

  if (loading && stockCounts.length === 0) {
    return <LoadingSpinner message="جاري تحميل الجردات..." />;
  }

  if (error) {
    return <ErrorHandler message={error} onRetry={loadData} />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-primary" />
            جرد المخزون
          </h1>
          <p className="text-muted-foreground mt-1">إدارة عمليات الجرد ومتابعة الفروقات</p>
        </div>
        <SimpleButton onClick={() => setOpenDialog(true)}>
          <Plus className="w-5 h-5 ml-2" />
          إنشاء جرد جديد
        </SimpleButton>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الجردات</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stats.totalCounts || 0}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <ClipboardList className="w-6 h-6 text-primary" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">مكتملة</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">{stats.completedCounts || 0}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">جاري العمل</p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">{stats.inProgressCounts || 0}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الفروقات</p>
                  <p className="text-2xl font-bold text-destructive mt-2">{stats.totalDiscrepancies || 0}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>
      )}

      {/* Search & Filter */}
      <SimpleCard>
        <SimpleCardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="البحث برقم المرجع أو اسم المخزن..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Data Table */}
      <SimpleCard>
        <SimpleCardContent className="p-0">
          <DataView
            data={filteredStockCounts}
            columns={columns}
            viewModes={['table', 'cards']}
            defaultViewMode="table"
            emptyState={{
              title: "لا يوجد جردات",
              description: "لم يتم العثور على أي عمليات جرد. جرب تغيير معايير البحث أو أنشئ جرد جديد.",
              action: (
                <SimpleButton onClick={() => setOpenDialog(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء جرد جديد
                </SimpleButton>
              )
            }}
          />
        </SimpleCardContent>
      </SimpleCard>

      {/* Create Modal */}
      <Modal
        isOpen={openDialog}
        onClose={() => setOpenDialog(false)}
        title="إنشاء جرد جديد"
        size="md"
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">المخزن <span className="text-destructive">*</span></label>
            <Select
              value={formData.warehouseId}
              onValueChange={(value) => setFormData({ ...formData, warehouseId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المخزن" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">تاريخ الجرد <span className="text-destructive">*</span></label>
            <Input
              type="date"
              value={formData.countDate}
              onChange={(e) => setFormData({ ...formData, countDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">نوع الجرد</label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">جرد كامل</SelectItem>
                <SelectItem value="partial">جرد جزئي</SelectItem>
                <SelectItem value="cycle">جرد دوري</SelectItem>
                <SelectItem value="spot">جرد عشوائي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">ملاحظات</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أي ملاحظات إضافية..."
            />
          </div>
        </div>
        <ModalFooter>
          <SimpleButton variant="outline" onClick={() => setOpenDialog(false)}>
            إلغاء
          </SimpleButton>
          <SimpleButton
            onClick={handleCreateStockCount}
            disabled={!formData.warehouseId || loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : 'إنشاء'}
          </SimpleButton>
        </ModalFooter>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedStockCount}
        onClose={() => setSelectedStockCount(null)}
        title={selectedStockCount ? `تفاصيل الجرد - ${selectedStockCount.referenceNumber}` : ''}
        size="lg"
      >
        {selectedStockCount && (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">المخزن</p>
                <p className="text-base font-semibold">{selectedStockCount.warehouseName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">تاريخ الجرد</p>
                <p className="text-base font-semibold">
                  {format(new Date(selectedStockCount.countDate), 'dd/MM/yyyy', { locale: ar })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">الحالة</p>
                <div className="flex">
                  <SimpleBadge variant={getStatusInfo(selectedStockCount.status).color}>
                    {getStatusInfo(selectedStockCount.status).label}
                  </SimpleBadge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">عدد العناصر</p>
                <p className="text-base font-semibold">{selectedStockCount.itemsCount || 0}</p>
              </div>
            </div>

            {selectedStockCount.notes && (
              <div className="space-y-1 bg-muted/30 p-4 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">ملاحظات</p>
                <p className="text-sm">{selectedStockCount.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <SimpleButton variant="outline" onClick={() => setSelectedStockCount(null)}>
                إغلاق
              </SimpleButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StockCountPage;
