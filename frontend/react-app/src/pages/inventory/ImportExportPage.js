
import React, { useState } from 'react';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  FileText as FileIcon,
  CheckCircle as SuccessIcon,
  AlertCircle as ErrorIcon,
  AlertTriangle as WarningIcon,
  Trash2 as DeleteIcon
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import { Progress } from '../../components/ui/Progress';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import * as ExcelJS from 'exceljs';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import inventoryService from '../../services/inventoryService';

const ImportExportPage = () => {
  // const [tabValue, setTabValue] = useState(0); // Removed in favor of Radix Tabs internal state or string state if needed
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
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <FileIcon className="h-8 w-8 text-blue-600" />
          استيراد وتصدير الأصناف
        </h1>
        <p className="text-muted-foreground">
          استيراد الأصناف من Excel أو تصدير البيانات الحالية
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="import" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <UploadIcon className="h-4 w-4" />
            استيراد
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <DownloadIcon className="h-4 w-4" />
            تصدير
          </TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        <TabsContent value="import">
          <div className="grid gap-6">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">
                  رفع ملف Excel
                </h2>

                <div className="mb-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2"
                    >
                      <DownloadIcon className="h-4 w-4" />
                      تحميل قالب Excel
                    </Button>

                    <div className="relative">
                      <Button className="flex items-center gap-2">
                        <UploadIcon className="h-4 w-4" />
                        اختر ملف
                      </Button>
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>

                  {file && (
                    <Alert className="bg-blue-50 text-blue-900 border-blue-200">
                      <AlertTitle>ملف محدد</AlertTitle>
                      <AlertDescription>
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTitle>
                        {validationErrors.length} خطأ في التحقق
                      </AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside mt-2">
                          {validationErrors.slice(0, 3).map((err, idx) => (
                            <li key={idx}>
                              صف {err.row}: {err.message}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {previewData.length > 0 && (
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b">
                        <h3 className="font-medium text-sm">
                          معاينة البيانات (أول 10 صفوف):
                        </h3>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>الاسم</TableHead>
                            <TableHead>رمز الصنف</TableHead>
                            <TableHead>الفئة</TableHead>
                            <TableHead>السعر</TableHead>
                          </TableRow>
                        </TableHeader>
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
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={handleImport}
                      disabled={!file || validationErrors.length > 0 || importing}
                      className="w-full"
                    >
                      {importing ? 'جاري الاستيراد...' : 'استيراد البيانات'}
                    </Button>
                    {importing && <Progress value={30} className="w-full" />}
                  </div>

                  {importResults && (
                    <Alert variant="default" className="border-green-200 bg-green-50 text-green-900">
                      <SuccessIcon className="h-4 w-4 text-green-600 mb-1" />
                      <AlertTitle>نتائج الاستيراد</AlertTitle>
                      <AlertDescription>
                        <div className="flex flex-col gap-1 mt-1">
                          <span>• الإجمالي: {importResults.total}</span>
                          <span>• ناجح: {importResults.successCount}</span>
                          <span>• فاشل: {importResults.failCount}</span>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export">
          <div className="grid gap-6">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">
                  تصدير البيانات
                </h2>

                <p className="text-muted-foreground mb-6">
                  تصدير جميع الأصناف الحالية إلى ملف Excel
                </p>

                <Button
                  size="lg"
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full"
                >
                  {exporting ? (
                    <>
                      <span className="mr-2">جاري التصدير...</span>
                      <Progress value={50} className="w-20 inline-block h-2 bg-blue-700" />
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      تصدير جميع الأصناف
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportExportPage;

