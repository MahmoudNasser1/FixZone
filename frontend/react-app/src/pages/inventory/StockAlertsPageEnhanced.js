import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Tabs,
  Tab,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  ShoppingCart as CartIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import inventoryService from '../../services/inventoryService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorHandler from '../../components/common/ErrorHandler';

const StockAlertsPageEnhanced = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // استخدام v_low_stock_items view
      const [statsData] = await Promise.all([
        inventoryService.getStatistics()
      ]);

      setStats(statsData);

      // جلب الأصناف المنخفضة والمنتهية
      const itemsData = await inventoryService.listItems({ lowStock: true });
      
      // تحويل البيانات لصيغة Alerts
      const alertsData = itemsData
        .filter(item => {
          const totalQty = parseInt(item.totalQuantity || 0);
          const reorderPoint = parseInt(item.reorderPoint || 10);
          return totalQty <= reorderPoint;
        })
        .map(item => {
          const totalQty = parseInt(item.totalQuantity || 0);
          const reorderPoint = parseInt(item.reorderPoint || 10);
          
          return {
            id: item.id,
            name: item.name,
            sku: item.sku,
            category: item.categoryName || 'غير محدد',
            quantity: totalQty,
            reorderPoint: reorderPoint,
            alertLevel: totalQty === 0 ? 'out_of_stock' : 'low_stock',
            deficit: reorderPoint - totalQty,
            purchasePrice: parseFloat(item.purchasePrice || 0),
            suggestedOrderQty: Math.max(reorderPoint - totalQty, item.reorderQuantity || 50)
          };
        });

      setAlerts(alertsData);
    } catch (err) {
      setError(err.message || 'حدث خطأ في تحميل البيانات');
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (alertLevel) => {
    return alertLevel === 'out_of_stock' ? 'error' : 'warning';
  };

  const getAlertText = (alertLevel) => {
    return alertLevel === 'out_of_stock' ? 'نفذ من المخزون' : 'مخزون منخفض';
  };

  const getAlertIcon = (alertLevel) => {
    return alertLevel === 'out_of_stock' ? <ErrorIcon /> : <WarningIcon />;
  };

  const handleCreatePurchaseOrder = (item) => {
    // TODO: فتح dialog لإنشاء أمر شراء
    console.log('Create PO for:', item);
  };

  if (loading && alerts.length === 0) {
    return <LoadingSpinner message="جاري تحميل التنبيهات..." />;
  }

  if (error) {
    return <ErrorHandler message={error} onRetry={loadData} />;
  }

  const outOfStockAlerts = alerts.filter(a => a.alertLevel === 'out_of_stock');
  const lowStockAlerts = alerts.filter(a => a.alertLevel === 'low_stock');

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon />
          تنبيهات المخزون
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadData}
          disabled={loading}
        >
          تحديث
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ErrorIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h3">{outOfStockAlerts.length}</Typography>
                  <Typography>نفذ من المخزون</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h3">{lowStockAlerts.length}</Typography>
                  <Typography>مخزون منخفض</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignments: 'center', gap: 2 }}>
                <NotificationsIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h3">{alerts.length}</Typography>
                  <Typography>إجمالي التنبيهات</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label={`الكل (${alerts.length})`} />
          <Tab label={`نفذ من المخزون (${outOfStockAlerts.length})`} />
          <Tab label={`منخفض (${lowStockAlerts.length})`} />
        </Tabs>
      </Box>

      {/* Alerts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الحالة</TableCell>
              <TableCell>اسم الصنف</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>الفئة</TableCell>
              <TableCell>الكمية الحالية</TableCell>
              <TableCell>حد إعادة الطلب</TableCell>
              <TableCell>النقص</TableCell>
              <TableCell>الكمية المقترحة للطلب</TableCell>
              <TableCell>القيمة المتوقعة</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(activeTab === 0 ? alerts : 
              activeTab === 1 ? outOfStockAlerts : 
              lowStockAlerts
            ).map((alert) => (
              <TableRow key={alert.id} sx={{ 
                bgcolor: alert.alertLevel === 'out_of_stock' ? 'error.50' : 'warning.50'
              }}>
                <TableCell>
                  <Chip
                    icon={getAlertIcon(alert.alertLevel)}
                    label={getAlertText(alert.alertLevel)}
                    color={getAlertColor(alert.alertLevel)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{alert.name}</Typography>
                </TableCell>
                <TableCell>{alert.sku}</TableCell>
                <TableCell>{alert.category}</TableCell>
                <TableCell>
                  <Typography 
                    color={alert.quantity === 0 ? 'error' : 'warning'}
                    fontWeight="bold"
                  >
                    {alert.quantity}
                  </Typography>
                </TableCell>
                <TableCell>{alert.reorderPoint}</TableCell>
                <TableCell>
                  <Typography color="error" fontWeight="bold">
                    {alert.deficit}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="primary" fontWeight="bold">
                    {alert.suggestedOrderQty}
                  </Typography>
                </TableCell>
                <TableCell>
                  {(alert.suggestedOrderQty * alert.purchasePrice).toFixed(2)} ج.م
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<CartIcon />}
                    onClick={() => handleCreatePurchaseOrder(alert)}
                  >
                    طلب شراء
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {alerts.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" color="success.main">
            🎉 لا توجد تنبيهات!
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            جميع الأصناف في مستويات مخزون جيدة
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StockAlertsPageEnhanced;
