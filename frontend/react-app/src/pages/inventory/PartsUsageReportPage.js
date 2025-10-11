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
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Build as RepairIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';
import { format, subDays, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import apiService from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorHandler from '../../components/common/ErrorHandler';

const PartsUsageReportPage = () => {
  const [partsUsage, setPartsUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب بيانات PartsUsed
      const response = await apiService.request(`/partsused?startDate=${startDate}&endDate=${endDate}`);
      const partsData = response || [];

      // معالجة البيانات
      const processed = processPartsUsage(partsData);
      setPartsUsage(processed.items);
      setStats(processed.stats);
      
    } catch (err) {
      setError(err.message || 'حدث خطأ في تحميل البيانات');
      console.error('Error loading parts usage:', err);
    } finally {
      setLoading(false);
    }
  };

  const processPartsUsage = (data) => {
    // تجميع البيانات حسب الصنف
    const itemsMap = new Map();
    
    data.forEach(usage => {
      const key = usage.inventoryItemId;
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          id: usage.inventoryItemId,
          name: usage.itemName || 'غير معروف',
          sku: usage.itemSku || '-',
          totalQuantity: 0,
          usageCount: 0,
          repairsCount: new Set()
        });
      }
      
      const item = itemsMap.get(key);
      item.totalQuantity += parseInt(usage.quantity || 0);
      item.usageCount += 1;
      if (usage.repairRequestId) {
        item.repairsCount.add(usage.repairRequestId);
      }
    });

    // تحويل Map إلى Array
    const items = Array.from(itemsMap.values()).map(item => ({
      ...item,
      repairsCount: item.repairsCount.size
    })).sort((a, b) => b.totalQuantity - a.totalQuantity);

    // حساب الإحصائيات
    const stats = {
      totalParts: data.length,
      uniqueItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.totalQuantity, 0),
      totalRepairs: new Set(data.map(d => d.repairRequestId)).size
    };

    return { items, stats };
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    const today = new Date();
    
    switch (newPeriod) {
      case 'week':
        setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(subMonths(today, 1), 'yyyy-MM-dd'));
        break;
      case '3months':
        setStartDate(format(subMonths(today, 3), 'yyyy-MM-dd'));
        break;
      case '6months':
        setStartDate(format(subMonths(today, 6), 'yyyy-MM-dd'));
        break;
      default:
        break;
    }
    setEndDate(format(today, 'yyyy-MM-dd'));
  };

  if (loading && partsUsage.length === 0) {
    return <LoadingSpinner message="جاري تحميل التقرير..." />;
  }

  if (error) {
    return <ErrorHandler message={error} onRetry={loadData} />;
  }

  // بيانات الرسم البياني - أعلى 10 أصناف
  const chartData = partsUsage.slice(0, 10).map(item => ({
    name: item.name.substring(0, 20) + (item.name.length > 20 ? '...' : ''),
    quantity: item.totalQuantity,
    repairs: item.repairsCount
  }));

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon />
          تقرير استهلاك القطع
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>الفترة</InputLabel>
                <Select value={period} onChange={(e) => handlePeriodChange(e.target.value)}>
                  <MenuItem value="week">آخر أسبوع</MenuItem>
                  <MenuItem value="month">آخر شهر</MenuItem>
                  <MenuItem value="3months">آخر 3 أشهر</MenuItem>
                  <MenuItem value="6months">آخر 6 أشهر</MenuItem>
                  <MenuItem value="custom">مخصص</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="من تاريخ"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="إلى تاريخ"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={loadData}
                sx={{ height: '56px' }}
              >
                تطبيق الفلتر
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  إجمالي الاستخدامات
                </Typography>
                <Typography variant="h4">{stats.totalParts}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  الأصناف المستخدمة
                </Typography>
                <Typography variant="h4">{stats.uniqueItems}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  الكمية الإجمالية
                </Typography>
                <Typography variant="h4">{stats.totalQuantity}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  تذاكر الصيانة
                </Typography>
                <Typography variant="h4">{stats.totalRepairs}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              أكثر 10 أصناف استخداماً
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" fill="#8884d8" name="الكمية" />
                <Bar dataKey="repairs" fill="#82ca9d" name="عدد الصيانات" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>اسم الصنف</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>الكمية المستخدمة</TableCell>
              <TableCell>عدد مرات الاستخدام</TableCell>
              <TableCell>عدد تذاكر الصيانة</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {partsUsage.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell>
                  <Typography fontWeight="bold" color="primary">
                    {item.totalQuantity}
                  </Typography>
                </TableCell>
                <TableCell>{item.usageCount}</TableCell>
                <TableCell>{item.repairsCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {partsUsage.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <InventoryIcon sx={{ fontSize: 80, color: 'textSecondary', mb: 2 }} />
          <Typography variant="h5" color="textSecondary">
            لا توجد بيانات استهلاك في هذه الفترة
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PartsUsageReportPage;
