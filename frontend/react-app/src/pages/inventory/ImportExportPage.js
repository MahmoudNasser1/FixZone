import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import inventoryService from '../../services/inventoryService';

const ImportExportPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const { showSuccess, showError } = useNotifications();

  // رفع الملف
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setPreviewData(jsonData.slice(0, 10)); // أول 10 صفوف للمعاينة
        validateData(jsonData);
      } catch (error) {
        showError('فشل قراءة الملف');
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  // التحقق من البيانات
  const validateData = (data) => {
    const errors = [];
    const requiredFields = ['name', 'sku'];
    
    data.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field]) {
          errors.push({
            row: index + 1,
            field,
            message: `الحقل ${field} مطلوب`
          });
        }
      });
    });
    
    setValidationErrors(errors);
  };

  // استيراد البيانات
  const handleImport = async () => {
    if (!file || validationErrors.length > 0) {
      showError('يرجى التحقق من البيانات قبل الاستيراد');
      return;
    }

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        let successCount = 0;
        let failCount = 0;
        
        for (const item of jsonData) {
          try {
            await inventoryService.createItem({
              name: item.name,
              sku: item.sku,
              category: item.category || null,
              purchasePrice: parseFloat(item.purchasePrice) || 0,
              sellingPrice: parseFloat(item.sellingPrice) || 0,
              minStockLevel: parseInt(item.minStockLevel) || 0,
              maxStockLevel: parseInt(item.maxStockLevel) || 1000,
              unit: item.unit || 'قطعة',
              description: item.description || ''
            });
            successCount++;
          } catch (error) {
            failCount++;
          }
        }
        
        setImportResults({ successCount, failCount, total: jsonData.length });
        showSuccess(`تم استيراد ${successCount} صنف بنجاح`);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      showError('فشل الاستيراد');
    } finally {
      setImporting(false);
    }
  };

  // تصدير البيانات
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await inventoryService.listItems({ limit: 10000 });
      const items = response.data.data.items;
      
      const exportData = items.map(item => ({
        'الاسم': item.name,
        'رمز الصنف': item.sku,
        'الفئة': item.category || '',
        'سعر الشراء': item.purchasePrice || 0,
        'سعر البيع': item.sellingPrice || 0,
        'الحد الأدنى': item.minStockLevel || 0,
        'الحد الأقصى': item.maxStockLevel || 0,
        'الوحدة': item.unit || '',
        'الوصف': item.description || ''
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'الأصناف');
      
      XLSX.writeFile(workbook, `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      showSuccess('تم التصدير بنجاح');
    } catch (error) {
      showError('فشل التصدير');
    } finally {
      setExporting(false);
    }
  };

  // تحميل قالب
  const handleDownloadTemplate = () => {
    const template = [
      {
        name: 'صنف تجريبي',
        sku: 'ITEM001',
        category: 'إلكترونيات',
        purchasePrice: 100,
        sellingPrice: 150,
        minStockLevel: 10,
        maxStockLevel: 100,
        unit: 'قطعة',
        description: 'وصف الصنف'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    XLSX.writeFile(workbook, 'inventory_template.xlsx');
    showSuccess('تم تحميل القالب');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <FileIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          استيراد وتصدير الأصناف
        </Typography>
        <Typography variant="body2" color="text.secondary">
          استيراد الأصناف من Excel أو تصدير البيانات الحالية
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="استيراد" icon={<UploadIcon />} />
          <Tab label="تصدير" icon={<DownloadIcon />} />
        </Tabs>
      </Paper>

      {/* Import Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  رفع ملف Excel
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleDownloadTemplate}
                    startIcon={<DownloadIcon />}
                    sx={{ mr: 2 }}
                  >
                    تحميل قالب Excel
                  </Button>
                  
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadIcon />}
                  >
                    اختر ملف
                    <input
                      type="file"
                      hidden
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                    />
                  </Button>
                </Box>

                {file && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    الملف: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </Alert>
                )}

                {validationErrors.length > 0 && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      {validationErrors.length} خطأ في التحقق
                    </Typography>
                    {validationErrors.slice(0, 3).map((err, idx) => (
                      <Typography key={idx} variant="body2">
                        • صف {err.row}: {err.message}
                      </Typography>
                    ))}
                  </Alert>
                )}

                {previewData.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      معاينة البيانات (أول 10 صفوف):
                    </Typography>
                    <TableContainer sx={{ maxHeight: 400 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>الاسم</TableCell>
                            <TableCell>رمز الصنف</TableCell>
                            <TableCell>الفئة</TableCell>
                            <TableCell>السعر</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {previewData.map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>{row.sku}</TableCell>
                              <TableCell>{row.category || '-'}</TableCell>
                              <TableCell>{row.purchasePrice || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleImport}
                    disabled={!file || validationErrors.length > 0 || importing}
                    fullWidth
                  >
                    {importing ? 'جاري الاستيراد...' : 'استيراد البيانات'}
                  </Button>
                  {importing && <LinearProgress sx={{ mt: 1 }} />}
                </Box>

                {importResults && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">
                      نتائج الاستيراد:
                    </Typography>
                    <Typography variant="body2">
                      • الإجمالي: {importResults.total}
                    </Typography>
                    <Typography variant="body2">
                      • ناجح: {importResults.successCount}
                    </Typography>
                    <Typography variant="body2">
                      • فاشل: {importResults.failCount}
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Export Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  تصدير البيانات
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  تصدير جميع الأصناف الحالية إلى ملف Excel
                </Typography>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleExport}
                  disabled={exporting}
                  startIcon={<DownloadIcon />}
                  fullWidth
                >
                  {exporting ? 'جاري التصدير...' : 'تصدير جميع الأصناف'}
                </Button>
                {exporting && <LinearProgress sx={{ mt: 1 }} />}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default ImportExportPage;

