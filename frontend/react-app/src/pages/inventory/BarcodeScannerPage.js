import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  QrCodeScanner as ScanIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  CameraAlt as CameraIcon,
  Inventory as InventoryIcon,
  Clear as ClearIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import barcodeService from '../../services/barcodeService';
import { useNotifications } from '../../components/notifications/NotificationSystem';

const BarcodeScannerPage = () => {
  const [barcode, setBarcode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanType, setScanType] = useState('lookup');
  const [showHistory, setShowHistory] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  
  const inputRef = useRef(null);
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    loadStats();
    loadHistory();
    
    // Auto-focus على حقل الباركود
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const loadStats = async () => {
    try {
      const response = await barcodeService.getScanStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await barcodeService.getScanHistory({ limit: 10 });
      if (response.data.success) {
        setScanHistory(response.data.data.scans);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    
    if (!barcode.trim()) {
      showError('الرجاء إدخال الباركود');
      return;
    }

    setLoading(true);
    try {
      const response = await barcodeService.scanBarcode(barcode, scanType);
      
      if (response.data.success) {
        setScanResult(response.data.data);
        showSuccess('تم المسح بنجاح');
        loadStats();
        loadHistory();
        
        // Auto-clear للمسح التالي
        setTimeout(() => {
          setBarcode('');
          setScanResult(null);
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 3000);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'فشل المسح');
      setScanResult({ error: true, message: error.response?.data?.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setBarcode('');
    setScanResult(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e) => {
    // Enter للمسح
    if (e.key === 'Enter') {
      handleScan(e);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <ScanIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          مسح الباركود
        </Typography>
        <Typography variant="body2" color="text.secondary">
          امسح الباركود للبحث عن الأصناف والتحقق من المخزون
        </Typography>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  إجمالي المسح
                </Typography>
                <Typography variant="h4">
                  {stats.overview?.totalScans || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'success.light' }}>
              <CardContent>
                <Typography color="white" gutterBottom>
                  ناجح
                </Typography>
                <Typography variant="h4" color="white">
                  {stats.overview?.successfulScans || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'error.light' }}>
              <CardContent>
                <Typography color="white" gutterBottom>
                  غير موجود
                </Typography>
                <Typography variant="h4" color="white">
                  {stats.overview?.notFoundScans || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  أصناف فريدة
                </Typography>
                <Typography variant="h4">
                  {stats.overview?.uniqueItems || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Scanner Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <form onSubmit={handleScan}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  inputRef={inputRef}
                  fullWidth
                  label="الباركود"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="امسح أو أدخل الباركود..."
                  autoFocus
                  disabled={loading}
                  InputProps={{
                    endAdornment: barcode && (
                      <IconButton size="small" onClick={handleClear}>
                        <ClearIcon />
                      </IconButton>
                    )
                  }}
                />
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>نوع المسح</InputLabel>
                  <Select
                    value={scanType}
                    label="نوع المسح"
                    onChange={(e) => setScanType(e.target.value)}
                  >
                    <MenuItem value="lookup">بحث</MenuItem>
                    <MenuItem value="receive">استلام</MenuItem>
                    <MenuItem value="issue">صرف</MenuItem>
                    <MenuItem value="count">جرد</MenuItem>
                    <MenuItem value="transfer">نقل</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || !barcode.trim()}
                  startIcon={<SearchIcon />}
                >
                  مسح
                </Button>
              </Box>
            </form>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<CameraIcon />}
                onClick={() => setCameraMode(!cameraMode)}
                disabled
              >
                كاميرا
              </Button>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => setShowHistory(!showHistory)}
              >
                السجل
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Scan Result */}
        {scanResult && (
          <Box sx={{ mt: 3 }}>
            {scanResult.error ? (
              <Alert severity="error" icon={<ErrorIcon />}>
                <Typography variant="h6">الصنف غير موجود</Typography>
                <Typography variant="body2">{scanResult.message}</Typography>
              </Alert>
            ) : scanResult.item ? (
              <Alert severity="success" icon={<SuccessIcon />}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6">{scanResult.item.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      رمز الصنف: <strong>{scanResult.item.sku}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      الفئة: <strong>{scanResult.item.category || 'غير محدد'}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      الكمية المتاحة: <strong>{scanResult.item.totalQuantity || 0}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      السعر: <strong>{scanResult.item.sellingPrice || 0} ج.م</strong>
                    </Typography>
                  </Grid>
                </Grid>
              </Alert>
            ) : null}
          </Box>
        )}
      </Paper>

      {/* Scan History */}
      {showHistory && scanHistory.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            آخر عمليات المسح
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>الباركود</TableCell>
                  <TableCell>الصنف</TableCell>
                  <TableCell>النوع</TableCell>
                  <TableCell>النتيجة</TableCell>
                  <TableCell>الوقت</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scanHistory.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>{scan.barcode}</TableCell>
                    <TableCell>{scan.itemName || '-'}</TableCell>
                    <TableCell>
                      <Chip label={scan.scanType} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={scan.result}
                        size="small"
                        color={scan.result === 'success' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(scan.scannedAt).toLocaleString('ar-EG')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Camera Mode (placeholder) */}
      {cameraMode && (
        <Dialog open={cameraMode} onClose={() => setCameraMode(false)} maxWidth="md" fullWidth>
          <DialogTitle>مسح بالكاميرا</DialogTitle>
          <DialogContent>
            <Alert severity="info">
              مسح الكاميرا قيد التطوير. استخدم الماسح الضوئي أو الإدخال اليدوي.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCameraMode(false)}>إغلاق</Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default BarcodeScannerPage;

