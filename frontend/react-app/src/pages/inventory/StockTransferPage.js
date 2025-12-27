import React, { useState, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Badge } from '../../components/ui/Badge';
import { Separator } from '../../components/ui/Separator';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/Dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import {
  Plus,
  Eye,
  Trash2,
  Check,
  Truck,
  ArrowLeftRight,
  Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import stockTransferService from '../../services/stockTransferService';
import warehouseService from '../../services/warehouseService';
import inventoryService from '../../services/inventoryService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorHandler from '../../components/common/ErrorHandler';

const StockTransferPage = () => {
  const user = useAuthStore((state) => state.user);
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [stats, setStats] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    transferDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    notes: '',
    items: []
  });

  // Item selection state
  const [selectedItem, setSelectedItem] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [transfersData, warehousesData, itemsData, statsData] = await Promise.all([
        stockTransferService.getStockTransfers(),
        warehouseService.getWarehouses(),
        inventoryService.listItems(),
        stockTransferService.getStockTransferStats()
      ]);

      // Parse API response
      let transfers = [];
      if (transfersData && transfersData.success) {
        transfers = transfersData.data?.transfers || transfersData.data || [];
      } else if (Array.isArray(transfersData)) {
        transfers = transfersData;
      } else if (transfersData && transfersData.transfers) {
        transfers = transfersData.transfers;
      }

      // Parse warehouses
      let warehouses = [];
      if (Array.isArray(warehousesData)) {
        warehouses = warehousesData;
      } else if (warehousesData && warehousesData.success) {
        warehouses = warehousesData.data || [];
      }

      // Parse items
      let items = [];
      if (Array.isArray(itemsData)) {
        items = itemsData;
      } else if (itemsData && itemsData.success) {
        items = itemsData.data?.items || itemsData.data || [];
      }

      // Parse stats
      let statsDataParsed = null;
      if (statsData && statsData.success) {
        statsDataParsed = statsData.data || statsData;
      } else if (statsData) {
        statsDataParsed = statsData;
      }

      setTransfers(transfers);
      setWarehouses(warehouses);
      setItems(items);
      setStats(statsDataParsed);
    } catch (err) {
      setError(err.message || 'حدث خطأ في تحميل البيانات');
      console.error('Error loading transfer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedItem || itemQuantity <= 0) return;

    const item = items.find(i => i.id === parseInt(selectedItem));
    if (!item) return;

    const newItem = {
      inventoryItemId: item.id,
      itemName: item.name,
      quantity: itemQuantity,
      unitPrice: itemPrice || item.purchasePrice || 0,
      notes: ''
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });

    setSelectedItem('');
    setItemQuantity(1);
    setItemPrice(0);
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleCreateTransfer = async () => {
    try {
      if (formData.fromWarehouseId === formData.toWarehouseId) {
        setError('المخزن المرسل والمستقبل يجب أن يكونا مختلفين');
        return;
      }

      if (formData.items.length === 0) {
        setError('يجب إضافة عنصر واحد على الأقل');
        return;
      }

      setLoading(true);
      await stockTransferService.createStockTransfer(formData);
      setOpenDialog(false);
      setFormData({
        fromWarehouseId: '',
        toWarehouseId: '',
        transferDate: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
        notes: '',
        items: []
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'حدث خطأ في إنشاء النقل');
      console.error('Error creating transfer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await stockTransferService.approveStockTransfer(id); // Will use req.user.id from authMiddleware
      await loadData();
    } catch (err) {
      setError(err.message || 'حدث خطأ في الموافقة على النقل');
      console.error('Error approving transfer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await stockTransferService.shipStockTransfer(id); // Will use req.user.id from authMiddleware
      await loadData();
    } catch (err) {
      setError(err.message || 'حدث خطأ في شحن النقل');
      console.error('Error shipping transfer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await stockTransferService.receiveStockTransfer(id); // Will use req.user.id from authMiddleware
      await loadData();
    } catch (err) {
      setError(err.message || 'حدث خطأ في استلام النقل');
      console.error('Error receiving transfer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      setLoading(true);
      await stockTransferService.completeStockTransfer(id);
      await loadData();
    } catch (err) {
      setError(err.message || 'حدث خطأ في إكمال النقل');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا النقل؟')) {
      try {
        setLoading(true);
        await stockTransferService.deleteStockTransfer(id);
        await loadData();
      } catch (err) {
        setError(err.message || 'حدث خطأ في حذف النقل');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'approved': return 'info';
      case 'in_transit': return 'warning';
      case 'shipped': return 'warning';
      case 'received': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'approved': return 'معتمد';
      case 'in_transit': return 'في الطريق';
      case 'shipped': return 'تم الشحن';
      case 'received': return 'تم الاستلام';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  if (loading && transfers.length === 0) {
    return <LoadingSpinner message="جاري تحميل النقلات..." />;
  }

  if (error) {
    return <ErrorHandler message={error} onRetry={loadData} />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ArrowLeftRight className="h-8 w-8" />
          نقل بين المخازن
        </h1>
        <Button onClick={() => setOpenDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          إنشاء نقل جديد
        </Button>
      </div>

      {/* Stats Cards */}
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 mb-2">
                إجمالي النقلات
              </div>
              <div className="text-2xl font-bold">
                {stats.totalTransfers || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 mb-2">
                مكتملة
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats.completedTransfers || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 mb-2">
                الكمية المنقولة
              </div>
              <div className="text-2xl font-bold">
                {stats.totalQuantityTransferred || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 mb-2">
                القيمة الإجمالية
              </div>
              <div className="text-2xl font-bold">
                {parseFloat(stats.totalValueTransferred || 0).toFixed(2)} ج.م
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transfers Table */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم المرجع</TableHead>
                <TableHead>من مخزن</TableHead>
                <TableHead>إلى مخزن</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>عدد العناصر</TableHead>
                <TableHead>السبب</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>{transfer.transferNumber || transfer.referenceNumber || `#${transfer.id}`}</TableCell>
                  <TableCell>{transfer.fromWarehouseName}</TableCell>
                  <TableCell>{transfer.toWarehouseName}</TableCell>
                  <TableCell>
                    {format(new Date(transfer.transferDate), 'dd/MM/yyyy', { locale: ar })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      transfer.status === 'completed' || transfer.status === 'received' ? 'success' :
                        transfer.status === 'cancelled' || transfer.status === 'rejected' ? 'destructive' :
                          transfer.status === 'in_transit' || transfer.status === 'shipped' ? 'warning' :
                            'outline'
                    }>
                      {getStatusText(transfer.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{transfer.items?.length || transfer.totalItems || 0}</TableCell>
                  <TableCell>{transfer.reason || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTransfer(transfer)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {transfer.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleApprove(transfer.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="موافقة"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}

                      {(transfer.status === 'approved' || transfer.status === 'pending') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShip(transfer.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="شحن"
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                      )}

                      {(transfer.status === 'shipped' || transfer.status === 'in_transit') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReceive(transfer.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="استلام"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}

                      {transfer.status === 'received' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleComplete(transfer.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="إكمال"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}

                      {(transfer.status === 'pending' || transfer.status === 'approved') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(transfer.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Transfer Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء نقل جديد</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>من مخزن</Label>
              <Select
                value={formData.fromWarehouseId}
                onValueChange={(val) => setFormData({ ...formData, fromWarehouseId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المخزن" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id?.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>إلى مخزن</Label>
              <Select
                value={formData.toWarehouseId}
                onValueChange={(val) => setFormData({ ...formData, toWarehouseId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المخزن" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses
                    .filter(w => w.id !== formData.fromWarehouseId)
                    .map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id?.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تاريخ النقل</Label>
              <Input
                type="date"
                value={formData.transferDate}
                onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>السبب</Label>
              <Input
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>
            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label>ملاحظات</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Add Items Section */}
            <div className="col-span-1 md:col-span-2">
              <Separator className="my-4" />
              <h3 className="text-lg font-semibold mb-2">
                العناصر المراد نقلها
              </h3>
            </div>

            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
              <div className="md:col-span-5 space-y-2">
                <Label>الصنف</Label>
                <Select
                  value={selectedItem}
                  onValueChange={(val) => {
                    setSelectedItem(val);
                    const item = items.find(i => i.id === parseInt(val));
                    if (item) setItemPrice(item.purchasePrice || 0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصنف" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id?.toString()}>
                        {item.name} - {item.sku}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label>الكمية</Label>
                <Input
                  type="number"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label>السعر</Label>
                <Input
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="md:col-span-1">
                <Button
                  onClick={handleAddItem}
                  disabled={!selectedItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Items List */}
            {formData.items.length > 0 && (
              <div className="col-span-1 md:col-span-2">
                <div className="border rounded-md mt-4">
                  <Table>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell>
                            <span className="text-muted-foreground text-sm">
                              الكمية: {item.quantity} | السعر: {item.unitPrice.toFixed(2)} | الإجمالي: {(item.quantity * item.unitPrice).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-2 text-left">
                  <p className="text-lg font-bold">
                    الإجمالي: {formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)} ج.م
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setOpenDialog(false)}>إلغاء</Button>
            <Button
              onClick={handleCreateTransfer}
              disabled={!formData.fromWarehouseId || !formData.toWarehouseId || formData.items.length === 0 || loading}
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Details Dialog */}
      <Dialog
        open={!!selectedTransfer}
        onOpenChange={(open) => !open && setSelectedTransfer(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          {selectedTransfer && (
            <>
              <DialogHeader>
                <DialogTitle>
                  تفاصيل النقل - {selectedTransfer.transferNumber || selectedTransfer.referenceNumber || `#${selectedTransfer.id}`}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">من مخزن</p>
                  <p>{selectedTransfer.fromWarehouseName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">إلى مخزن</p>
                  <p>{selectedTransfer.toWarehouseName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">التاريخ</p>
                  <p>
                    {format(new Date(selectedTransfer.transferDate), 'dd/MM/yyyy', { locale: ar })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">الحالة</p>
                  <Badge variant={
                    selectedTransfer.status === 'completed' || selectedTransfer.status === 'received' ? 'success' :
                      selectedTransfer.status === 'cancelled' || selectedTransfer.status === 'rejected' ? 'destructive' :
                        selectedTransfer.status === 'in_transit' || selectedTransfer.status === 'shipped' ? 'warning' :
                          'outline'
                  }>
                    {getStatusText(selectedTransfer.status)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">عدد العناصر</p>
                  <p>{selectedTransfer.totalItems || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">القيمة الإجمالية</p>
                  <p>{parseFloat(selectedTransfer.totalValue || 0).toFixed(2)} ج.م</p>
                </div>
                {selectedTransfer.reason && (
                  <div className="col-span-2 space-y-1">
                    <p className="text-sm font-medium text-gray-500">السبب</p>
                    <p>{selectedTransfer.reason}</p>
                  </div>
                )}
                {selectedTransfer.notes && (
                  <div className="col-span-2 space-y-1">
                    <p className="text-sm font-medium text-gray-500">ملاحظات</p>
                    <p>{selectedTransfer.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setSelectedTransfer(null)}>إغلاق</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockTransferPage;
