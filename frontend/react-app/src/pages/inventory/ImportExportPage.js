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
import * as ExcelJS from 'exceljs';
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
  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    // Validation: Check file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (uploadedFile.size > MAX_FILE_SIZE) {
      showError('حجم الملف كبير جداً. الحد الأقصى 10MB');
      return;
    }

    setFile(uploadedFile);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(arrayBuffer);
          
          // Get first worksheet
          const worksheet = workbook.getWorksheet(1);
          if (!worksheet) {
            showError('الملف لا يحتوي على أوراق عمل');
            return;
          }

          // Convert to JSON (first row as headers)
          const jsonData = [];
          let headers = [];
          let isFirstRow = true;

          worksheet.eachRow((row, rowNumber) => {
            if (isFirstRow) {
              // First row is headers
              headers = row.values.slice(1); // Remove first empty value
              isFirstRow = false;
            } else {
              // Data rows
              const rowData = {};
              row.values.slice(1).forEach((value, index) => {
                const header = headers[index];
                if (header) {
                  rowData[header] = value || '';
                }
              });
              if (Object.keys(rowData).length > 0) {
                jsonData.push(rowData);
              }
            }
          });
          
          setPreviewData(jsonData.slice(0, 10)); // أول 10 صفوف للمعاينة
          validateData(jsonData);
        } catch (error) {
          console.error('Error reading file:', error);
          showError('فشل قراءة الملف: ' + (error.message || 'خطأ غير معروف'));
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    } catch (error) {
      console.error('Error handling file upload:', error);
      showError('فشل معالجة الملف');
    }
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
        try {
          const arrayBuffer = e.target.result;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(arrayBuffer);
          
          const worksheet = workbook.getWorksheet(1);
          if (!worksheet) {
            showError('الملف لا يحتوي على أوراق عمل');
            setImporting(false);
            return;
          }

          // Convert to JSON
          const jsonData = [];
          let headers = [];
          let isFirstRow = true;

          worksheet.eachRow((row, rowNumber) => {
            if (isFirstRow) {
              headers = row.values.slice(1);
              isFirstRow = false;
            } else {
              const rowData = {};
              row.values.slice(1).forEach((value, index) => {
                const header = headers[index];
                if (header) {
                  rowData[header] = value || '';
                }
              });
              if (Object.keys(rowData).length > 0) {
                jsonData.push(rowData);
              }
            }
          });
          
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
              console.error('Error importing item:', error);
              failCount++;
            }
          }
          
          setImportResults({ successCount, failCount, total: jsonData.length });
          showSuccess(`تم استيراد ${successCount} صنف بنجاح`);
        } catch (error) {
          console.error('Error processing file:', error);
          showError('فشل معالجة الملف: ' + (error.message || 'خطأ غير معروف'));
        } finally {
          setImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing:', error);
      showError('فشل الاستيراد');
      setImporting(false);
    }
  };

  // تصدير البيانات
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await inventoryService.listItems({ limit: 10000 });
      const items = response.data.data.items;
      
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('الأصناف');
      
      // Define columns
      worksheet.columns = [
        { header: 'الاسم', key: 'name', width: 30 },
        { header: 'رمز الصنف', key: 'sku', width: 15 },
        { header: 'الفئة', key: 'category', width: 20 },
        { header: 'سعر الشراء', key: 'purchasePrice', width: 15 },
        { header: 'سعر البيع', key: 'sellingPrice', width: 15 },
        { header: 'الحد الأدنى', key: 'minStockLevel', width: 12 },
        { header: 'الحد الأقصى', key: 'maxStockLevel', width: 12 },
        { header: 'الوحدة', key: 'unit', width: 10 },
        { header: 'الوصف', key: 'description', width: 40 }
      ];
      
      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' }
      };
      worksheet.getRow(1).font = { ...worksheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
      
      // Add data
      items.forEach(item => {
        worksheet.addRow({
          name: item.name,
          sku: item.sku,
          category: item.category || '',
          purchasePrice: item.purchasePrice || 0,
          sellingPrice: item.sellingPrice || 0,
          minStockLevel: item.minStockLevel || 0,
          maxStockLevel: item.maxStockLevel || 0,
          unit: item.unit || '',
          description: item.description || ''
        });
      });
      
      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess('تم التصدير بنجاح');
    } catch (error) {
      console.error('Error exporting:', error);
      showError('فشل التصدير: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setExporting(false);
    }
  };

  // تحميل قالب
  const handleDownloadTemplate = async () => {
    try {
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
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Template');
      
      // Define columns
      worksheet.columns = [
        { header: 'name', key: 'name', width: 30 },
        { header: 'sku', key: 'sku', width: 15 },
        { header: 'category', key: 'category', width: 20 },
        { header: 'purchasePrice', key: 'purchasePrice', width: 15 },
        { header: 'sellingPrice', key: 'sellingPrice', width: 15 },
        { header: 'minStockLevel', key: 'minStockLevel', width: 12 },
        { header: 'maxStockLevel', key: 'maxStockLevel', width: 12 },
        { header: 'unit', key: 'unit', width: 10 },
        { header: 'description', key: 'description', width: 40 }
      ];
      
      // Style header row
      worksheet.getRow(1).font = { bold: true };
      
      // Add template data
      template.forEach(item => {
        worksheet.addRow(item);
      });
      
      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'inventory_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess('تم تحميل القالب');
    } catch (error) {
      console.error('Error generating template:', error);
      showError('فشل تحميل القالب');
    }
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

