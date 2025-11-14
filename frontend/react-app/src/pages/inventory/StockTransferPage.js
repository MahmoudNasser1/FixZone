import React, { useState, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  LocalShipping as ShippingIcon,
  Inventory2 as TransferIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TransferIcon />
          نقل بين المخازن
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          إنشاء نقل جديد
        </Button>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  إجمالي النقلات
                </Typography>
                <Typography variant="h4">
                  {stats.totalTransfers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  مكتملة
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.completedTransfers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  الكمية المنقولة
                </Typography>
                <Typography variant="h4">
                  {stats.totalQuantityTransferred || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  القيمة الإجمالية
                </Typography>
                <Typography variant="h4">
                  {parseFloat(stats.totalValueTransferred || 0).toFixed(2)} ج.م
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Transfers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>رقم المرجع</TableCell>
              <TableCell>من مخزن</TableCell>
              <TableCell>إلى مخزن</TableCell>
              <TableCell>التاريخ</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>عدد العناصر</TableCell>
              <TableCell>السبب</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
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
                  <Chip
                    label={getStatusText(transfer.status)}
                    color={getStatusColor(transfer.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{transfer.items?.length || transfer.totalItems || 0}</TableCell>
                <TableCell>{transfer.reason || '-'}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedTransfer(transfer)}
                  >
                    <ViewIcon />
                  </IconButton>
                  
                  {transfer.status === 'pending' && (
                    <IconButton
                      size="small"
                      onClick={() => handleApprove(transfer.id)}
                      color="success"
                      title="موافقة"
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                  
                  {(transfer.status === 'approved' || transfer.status === 'pending') && (
                    <IconButton
                      size="small"
                      onClick={() => handleShip(transfer.id)}
                      color="primary"
                      title="شحن"
                    >
                      <ShippingIcon />
                    </IconButton>
                  )}
                  
                  {(transfer.status === 'shipped' || transfer.status === 'in_transit') && (
                    <IconButton
                      size="small"
                      onClick={() => handleReceive(transfer.id)}
                      color="info"
                      title="استلام"
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                  
                  {transfer.status === 'received' && (
                    <IconButton
                      size="small"
                      onClick={() => handleComplete(transfer.id)}
                      color="success"
                      title="إكمال"
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                  
                  {(transfer.status === 'pending' || transfer.status === 'approved') && (
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(transfer.id)}
                      color="error"
                      title="حذف"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Transfer Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>إنشاء نقل جديد</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>من مخزن</InputLabel>
                <Select
                  value={formData.fromWarehouseId}
                  onChange={(e) => setFormData({ ...formData, fromWarehouseId: e.target.value })}
                >
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>إلى مخزن</InputLabel>
                <Select
                  value={formData.toWarehouseId}
                  onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
                >
                  {warehouses
                    .filter(w => w.id !== formData.fromWarehouseId)
                    .map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="تاريخ النقل"
                type="date"
                value={formData.transferDate}
                onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="السبب"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>

            {/* Add Items Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                العناصر المراد نقلها
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>الصنف</InputLabel>
                <Select
                  value={selectedItem}
                  onChange={(e) => {
                    setSelectedItem(e.target.value);
                    const item = items.find(i => i.id === parseInt(e.target.value));
                    if (item) setItemPrice(item.purchasePrice || 0);
                  }}
                >
                  {items.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} - {item.sku}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="الكمية"
                type="number"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="السعر"
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAddItem}
                disabled={!selectedItem}
                sx={{ height: '56px' }}
              >
                إضافة
              </Button>
            </Grid>

            {/* Items List */}
            {formData.items.length > 0 && (
              <Grid item xs={12}>
                <List>
                  {formData.items.map((item, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveItem(index)} color="error">
                          <RemoveIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={item.itemName}
                        secondary={`الكمية: ${item.quantity} | السعر: ${item.unitPrice.toFixed(2)} ج.م | الإجمالي: ${(item.quantity * item.unitPrice).toFixed(2)} ج.م`}
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider />
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="h6">
                    الإجمالي: {formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)} ج.م
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>إلغاء</Button>
          <Button
            onClick={handleCreateTransfer}
            variant="contained"
            disabled={!formData.fromWarehouseId || !formData.toWarehouseId || formData.items.length === 0 || loading}
          >
            {loading ? <CircularProgress size={20} /> : 'إنشاء'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Details Dialog */}
      <Dialog
        open={!!selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedTransfer && (
          <>
            <DialogTitle>
              تفاصيل النقل - {selectedTransfer.transferNumber || selectedTransfer.referenceNumber || `#${selectedTransfer.id}`}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    من مخزن
                  </Typography>
                  <Typography>{selectedTransfer.fromWarehouseName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    إلى مخزن
                  </Typography>
                  <Typography>{selectedTransfer.toWarehouseName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    التاريخ
                  </Typography>
                  <Typography>
                    {format(new Date(selectedTransfer.transferDate), 'dd/MM/yyyy', { locale: ar })}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    الحالة
                  </Typography>
                  <Chip
                    label={getStatusText(selectedTransfer.status)}
                    color={getStatusColor(selectedTransfer.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    عدد العناصر
                  </Typography>
                  <Typography>{selectedTransfer.totalItems || 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    القيمة الإجمالية
                  </Typography>
                  <Typography>{parseFloat(selectedTransfer.totalValue || 0).toFixed(2)} ج.م</Typography>
                </Grid>
                {selectedTransfer.reason && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      السبب
                    </Typography>
                    <Typography>{selectedTransfer.reason}</Typography>
                  </Grid>
                )}
                {selectedTransfer.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      ملاحظات
                    </Typography>
                    <Typography>{selectedTransfer.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedTransfer(null)}>إغلاق</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default StockTransferPage;
