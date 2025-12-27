import React, { useState, useEffect, useRef } from 'react';
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
  Scan, // QrCodeScanner
  Search, // SearchIcon
  History, // HistoryIcon
  Camera, // CameraIcon
  Package, // InventoryIcon
  X, // ClearIcon
  CheckCircle, // SuccessIcon
  AlertCircle // ErrorIcon
} from 'lucide-react';
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
    <div className="container mx-auto p-4 py-8 max-w-7xl">
      {/* Header */}
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Scan className="mr-2 inline-block" size={32} />
          مسح الباركود
        </h1>
        <p className="text-gray-500">
          امسح الباركود للبحث عن الأصناف والتحقق من المخزون
        </p>
      </div>

      {/* Stats Cards */}
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-2">
                إجمالي المسح
              </p>
              <h3 className="text-2xl font-bold">
                {stats.overview?.totalScans || 0}
              </h3>
            </CardContent>
          </Card>

          <Card className="bg-green-500 text-white border-green-600">
            <CardContent className="pt-6">
              <p className="text-green-100 mb-2">
                ناجح
              </p>
              <h3 className="text-2xl font-bold text-white">
                {stats.overview?.successfulScans || 0}
              </h3>
            </CardContent>
          </Card>

          <Card className="bg-red-500 text-white border-red-600">
            <CardContent className="pt-6">
              <p className="text-red-100 mb-2">
                غير موجود
              </p>
              <h3 className="text-2xl font-bold text-white">
                {stats.overview?.notFoundScans || 0}
              </h3>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 mb-2">
                أصناف فريدة
              </p>
              <h3 className="text-2xl font-bold">
                {stats.overview?.uniqueItems || 0}
              </h3>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scanner Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <form onSubmit={handleScan}>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <Label htmlFor="barcode" className="mb-2 block">
                      الباركود
                    </Label>
                    <div className="relative">
                      <Input
                        id="barcode"
                        ref={inputRef}
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="امسح أو أدخل الباركود..."
                        autoFocus
                        disabled={loading}
                        className="pl-10 text-right"
                      />
                      {barcode && (
                        <button
                          type="button"
                          onClick={handleClear}
                          className="absolute left-2 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-full md:w-[150px]">
                    <Label className="mb-2 block">نوع المسح</Label>
                    <Select value={scanType} onValueChange={setScanType}>
                      <SelectTrigger>
                        <SelectValue placeholder="نوع المسح" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lookup">بحث</SelectItem>
                        <SelectItem value="receive">استلام</SelectItem>
                        <SelectItem value="issue">صرف</SelectItem>
                        <SelectItem value="count">جرد</SelectItem>
                        <SelectItem value="transfer">نقل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    size="default"
                    disabled={loading || !barcode.trim()}
                    className="w-full md:w-auto"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    مسح
                  </Button>
                </div>
              </form>
            </div>

            <div className="flex items-end justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCameraMode(!cameraMode)}
                disabled
              >
                <Camera className="mr-2 h-4 w-4" />
                كاميرا
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="mr-2 h-4 w-4" />
                السجل
              </Button>
            </div>
          </div>

          {/* Scan Result */}
          {scanResult && (
            <div className="mt-6">
              {scanResult.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>الصنف غير موجود</AlertTitle>
                  <AlertDescription>{scanResult.message}</AlertDescription>
                </Alert>
              ) : scanResult.item ? (
                <Alert variant="success" className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="ml-2 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2">
                        <h4 className="text-lg font-semibold">{scanResult.item.name}</h4>
                      </div>
                      <div>
                        <p className="text-sm opacity-90">
                          رمز الصنف: <strong>{scanResult.item.sku}</strong>
                        </p>
                        <p className="text-sm opacity-90">
                          الفئة: <strong>{scanResult.item.category || 'غير محدد'}</strong>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm opacity-90">
                          الكمية المتاحة: <strong>{scanResult.item.totalQuantity || 0}</strong>
                        </p>
                        <p className="text-sm opacity-90">
                          السعر: <strong>{scanResult.item.sellingPrice || 0} ج.م</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </Alert>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan History */}
      {showHistory && scanHistory.length > 0 && (
        <Card className="p-4 mt-6">
          <h3 className="text-lg font-bold mb-4">
            آخر عمليات المسح
          </h3>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الباركود</TableHead>
                  <TableHead className="text-right">الصنف</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">النتيجة</TableHead>
                  <TableHead className="text-right">الوقت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanHistory.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>{scan.barcode}</TableCell>
                    <TableCell>{scan.itemName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{scan.scanType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={scan.result === 'success' ? 'success' : 'destructive'}
                      >
                        {scan.result}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(scan.scannedAt).toLocaleString('ar-EG')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Camera Mode (placeholder) */}
      {/* Camera Mode (placeholder) */}
      <Dialog open={cameraMode} onOpenChange={setCameraMode}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>مسح بالكاميرا</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="info">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>معلومة</AlertTitle>
              <AlertDescription>
                مسح الكاميرا قيد التطوير. استخدم الماسح الضوئي أو الإدخال اليدوي.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={() => setCameraMode(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BarcodeScannerPage;

