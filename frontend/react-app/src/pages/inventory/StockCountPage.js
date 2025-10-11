import React, { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import stockCountService from '../../services/stockCountService';
import warehouseService from '../../services/warehouseService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorHandler from '../../components/common/ErrorHandler';

const StockCountPage = () => {
  const [stockCounts, setStockCounts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStockCount, setSelectedStockCount] = useState(null);
  const [stats, setStats] = useState(null);

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
      setWarehouses(warehousesData || []);
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
      await loadData();
    } catch (err) {
      setError(err.message || 'حدث خطأ في إنشاء الجرد');
      console.error('Error creating stock count:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      setLoading(true);
      await stockCountService.updateStockCountStatus(id, status);
      await loadData();
    } catch (err) {
      setError(err.message || 'حدث خطأ في تحديث حالة الجرد');
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
        await loadData();
      } catch (err) {
        setError(err.message || 'حدث خطأ في حذف الجرد');
        console.error('Error deleting stock count:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'in_progress': return 'warning';
      case 'pending_review': return 'info';
      case 'approved': return 'success';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled': return 'مجدول';
      case 'in_progress': return 'جاري العمل';
      case 'pending_review': return 'قيد المراجعة';
      case 'approved': return 'معتمد';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  if (loading && stockCounts.length === 0) {
    return <LoadingSpinner message="جاري تحميل الجردات..." />;
  }

  if (error) {
    return <ErrorHandler message={error} onRetry={loadData} />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon />
          جرد المخزون
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          إنشاء جرد جديد
        </Button>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  إجمالي الجردات
                </Typography>
                <Typography variant="h4">
                  {stats.totalCounts || 0}
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
                  {stats.completedCounts || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  جاري العمل
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.inProgressCounts || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  الفروقات
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.totalDiscrepancies || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Stock Counts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>رقم المرجع</TableCell>
              <TableCell>المخزن</TableCell>
              <TableCell>تاريخ الجرد</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>عدد العناصر</TableCell>
              <TableCell>الفروقات</TableCell>
              <TableCell>تاريخ الإنشاء</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockCounts.map((stockCount) => (
              <TableRow key={stockCount.id}>
                <TableCell>{stockCount.referenceNumber}</TableCell>
                <TableCell>{stockCount.warehouseName}</TableCell>
                <TableCell>
                  {format(new Date(stockCount.countDate), 'dd/MM/yyyy', { locale: ar })}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusText(stockCount.status)}
                    color={getStatusColor(stockCount.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{stockCount.itemsCount || 0}</TableCell>
                <TableCell>
                  <Typography color={stockCount.discrepancies > 0 ? 'error' : 'success'}>
                    {stockCount.discrepancies || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  {format(new Date(stockCount.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedStockCount(stockCount)}
                  >
                    <ViewIcon />
                  </IconButton>
                  
                  {stockCount.status === 'scheduled' && (
                    <IconButton
                      size="small"
                      onClick={() => handleStatusUpdate(stockCount.id, 'in_progress')}
                      title="بدء الجرد"
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                  
                  {stockCount.status === 'in_progress' && (
                    <IconButton
                      size="small"
                      onClick={() => handleStatusUpdate(stockCount.id, 'pending_review')}
                      title="إرسال للمراجعة"
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                  
                  {stockCount.status === 'pending_review' && (
                    <IconButton
                      size="small"
                      onClick={() => handleStatusUpdate(stockCount.id, 'approved')}
                      title="الموافقة"
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                  
                  {stockCount.status === 'approved' && (
                    <IconButton
                      size="small"
                      onClick={() => handleStatusUpdate(stockCount.id, 'completed')}
                      title="إكمال الجرد"
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                  
                  {(stockCount.status === 'scheduled' || stockCount.status === 'in_progress') && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteStockCount(stockCount.id)}
                      color="error"
                      title="إلغاء"
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

      {/* Create Stock Count Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إنشاء جرد جديد</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>المخزن</InputLabel>
                <Select
                  value={formData.warehouseId}
                  onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                >
                  {warehouses.map((warehouse) => (
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
                label="تاريخ الجرد"
                type="date"
                value={formData.countDate}
                onChange={(e) => setFormData({ ...formData, countDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>نوع الجرد</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <MenuItem value="full">جرد كامل</MenuItem>
                  <MenuItem value="partial">جرد جزئي</MenuItem>
                  <MenuItem value="cycle">جرد دوري</MenuItem>
                  <MenuItem value="spot">جرد عشوائي</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>إلغاء</Button>
          <Button
            onClick={handleCreateStockCount}
            variant="contained"
            disabled={!formData.warehouseId || loading}
          >
            {loading ? <CircularProgress size={20} /> : 'إنشاء'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Count Details Dialog */}
      <Dialog
        open={!!selectedStockCount}
        onClose={() => setSelectedStockCount(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedStockCount && (
          <>
            <DialogTitle>
              تفاصيل الجرد - {selectedStockCount.referenceNumber}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    المخزن
                  </Typography>
                  <Typography>{selectedStockCount.warehouseName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    تاريخ الجرد
                  </Typography>
                  <Typography>
                    {format(new Date(selectedStockCount.countDate), 'dd/MM/yyyy', { locale: ar })}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    الحالة
                  </Typography>
                  <Chip
                    label={getStatusText(selectedStockCount.status)}
                    color={getStatusColor(selectedStockCount.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    عدد العناصر
                  </Typography>
                  <Typography>{selectedStockCount.itemsCount || 0}</Typography>
                </Grid>
                {selectedStockCount.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      ملاحظات
                    </Typography>
                    <Typography>{selectedStockCount.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedStockCount(null)}>إغلاق</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default StockCountPage;


