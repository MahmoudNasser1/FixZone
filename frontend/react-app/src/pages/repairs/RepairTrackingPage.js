import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  QrCode, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Package,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Wrench,
  DollarSign,
  FileText,
  ArrowRight,
  RefreshCw,
  Download,
  Printer,
  Eye,
  Smartphone,
  Monitor,
  Laptop,
  Tablet,
  ShoppingCart
} from 'lucide-react';
import apiService from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';

const RepairTrackingPage = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const notify = (type, message) => {
    notifications.addNotification({ type, message });
  };

  // State management
  const [trackingCode, setTrackingCode] = useState('');
  const [repairId, setRepairId] = useState('');
  const [repairData, setRepairData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('id'); // 'trackingToken' or 'id'

  // Repair status configuration
  const statusConfig = {
    'RECEIVED': {
      label: 'مستلم',
      color: 'bg-blue-100 text-blue-800',
      icon: Package,
      description: 'تم استلام الجهاز في الورشة'
    },
    'INSPECTION': {
      label: 'قيد الفحص',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Eye,
      description: 'يتم فحص الجهاز وتحديد المشكلة'
    },
    'QUOTATION_SENT': {
      label: 'تم إرسال العرض',
      color: 'bg-purple-100 text-purple-800',
      icon: FileText,
      description: 'تم إرسال عرض السعر للعميل'
    },
    'QUOTATION_APPROVED': {
      label: 'تم قبول العرض',
      color: 'bg-indigo-100 text-indigo-800',
      icon: CheckCircle,
      description: 'وافق العميل على السعر'
    },
    'UNDER_REPAIR': {
      label: 'قيد الإصلاح',
      color: 'bg-orange-100 text-orange-800',
      icon: Wrench,
      description: 'يتم إصلاح الجهاز حالياً'
    },
    'WAITING_PARTS': {
      label: 'بانتظار قطع غيار',
      color: 'bg-orange-100 text-orange-800',
      icon: ShoppingCart,
      description: 'في انتظار وصول قطع الغيار'
    },
    'READY_FOR_PICKUP': {
      label: 'جاهز للاستلام',
      color: 'bg-green-100 text-green-800',
      icon: Package,
      description: 'انتهى الإصلاح والجهاز جاهز للاستلام'
    },
    'READY_FOR_DELIVERY': {
      label: 'جاهز للتسليم',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      description: 'انتهى الإصلاح والجهاز جاهز'
    },
    'DELIVERED': {
      label: 'تم التسليم',
      color: 'bg-emerald-100 text-emerald-800',
      icon: Package,
      description: 'تم تسليم الجهاز للعميل'
    },
    'COMPLETED': {
      label: 'مكتمل',
      color: 'bg-gray-100 text-gray-800',
      icon: CheckCircle,
      description: 'انتهى الطلب بالكامل'
    }
  };

  // Convert Arabic status to English status code
  const normalizeStatus = (status) => {
    const statusMap = {
      'تم الاستلام': 'RECEIVED',
      'قيد الفحص': 'INSPECTION',
      'في انتظار الموافقة': 'QUOTATION_SENT',
      'قيد الإصلاح': 'UNDER_REPAIR',
      'جاهز للتسليم': 'READY_FOR_DELIVERY',
      'تم التسليم': 'DELIVERED',
      'مكتمل': 'COMPLETED',
      'RECEIVED': 'RECEIVED',
      'INSPECTION': 'INSPECTION',
      'QUOTATION_SENT': 'QUOTATION_SENT',
      'QUOTATION_APPROVED': 'QUOTATION_APPROVED',
      'UNDER_REPAIR': 'UNDER_REPAIR',
      'READY_FOR_DELIVERY': 'READY_FOR_DELIVERY',
      'DELIVERED': 'DELIVERED',
      'COMPLETED': 'COMPLETED'
    };
    return statusMap[status] || status;
  };

  // Get device icon based on type
  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'smartphone':
      case 'هاتف':
        return Smartphone;
      case 'laptop':
      case 'لابتوب':
        return Laptop;
      case 'desktop':
      case 'كمبيوتر':
        return Monitor;
      case 'tablet':
      case 'تابلت':
        return Tablet;
      default:
        return Package;
    }
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!trackingCode && !repairId) {
      notify('warning', 'يرجى إدخال رمز التتبع أو رقم الطلب');
      return;
    }

    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchType === 'trackingToken' && trackingCode) {
        params.append('trackingToken', trackingCode);
      } else if (searchType === 'id' && repairId) {
        params.append('id', repairId);
      }

      const data = await apiService.request(`/repairs/tracking?${params.toString()}`);
      
      setRepairData(data);
      notify('success', 'تم العثور على طلب الإصلاح بنجاح');
    } catch (error) {
      console.error('Error tracking repair:', error);
      notify('error', error.message || 'خطأ في البحث عن طلب الإصلاح');
      setRepairData(null);
    } finally {
      setLoading(false);
    }
  };

  // Clear search
  const handleClear = () => {
    setTrackingCode('');
    setRepairId('');
    setRepairData(null);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status progress percentage
  const getStatusProgress = (status) => {
    const statusOrder = [
      'RECEIVED', 'INSPECTION', 'QUOTATION_SENT', 'QUOTATION_APPROVED',
      'UNDER_REPAIR', 'READY_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'
    ];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <SimpleCard>
        <SimpleCardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
              <h1 className="text-2xl font-bold text-foreground">تتبع طلب الإصلاح</h1>
              <p className="text-muted-foreground mt-1">ابحث عن طلب الإصلاح باستخدام رمز التتبع أو رقم الطلب (ID)</p>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <SimpleButton
              onClick={() => navigate('/repairs')}
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة لطلبات الإصلاح
            </SimpleButton>
          </div>
        </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Search Section */}
      <SimpleCard>
        <SimpleCardHeader>
          <div className="flex items-center space-x-4 space-x-reverse">
            <SimpleCardTitle>البحث عن طلب الإصلاح</SimpleCardTitle>
          <QrCode className="w-5 h-5 text-blue-600" />
        </div>
        </SimpleCardHeader>
        <SimpleCardContent>

        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Type Toggle */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <label className="flex items-center">
              <input
                type="radio"
                name="searchType"
                value="trackingToken"
                checked={searchType === 'trackingToken'}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="mr-2 text-sm font-medium text-gray-700">رمز التتبع</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="searchType"
                value="id"
                checked={searchType === 'id'}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="mr-2 text-sm font-medium text-gray-700">رقم الطلب (ID)</span>
            </label>
          </div>

          {/* Search Input */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex-1">
              {searchType === 'trackingToken' ? (
                <Input
                  type="text"
                  placeholder="أدخل رمز التتبع (مثال: REP-2025-10-02-001)"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="w-full"
                />
              ) : (
                <Input
                  type="number"
                  placeholder="أدخل رقم الطلب (ID) - مثال: 1"
                  value={repairId}
                  onChange={(e) => setRepairId(e.target.value)}
                  className="w-full"
                  min="1"
                />
              )}
            </div>
            <SimpleButton
              type="submit"
              disabled={loading || (!trackingCode && !repairId)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 ml-2" />
              )}
              {loading ? 'جاري البحث...' : 'بحث'}
            </SimpleButton>
            <SimpleButton
              type="button"
              onClick={handleClear}
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              مسح
            </SimpleButton>
          </div>
        </form>
        </SimpleCardContent>
      </SimpleCard>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loading size="xl" text="جاري البحث عن طلب الإصلاح..." />
        </div>
      )}

      {/* No Results */}
      {!loading && !repairData && (
        <SimpleCard>
          <SimpleCardContent className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">ابحث عن طلب الإصلاح</h3>
            <p className="text-muted-foreground">
            أدخل رمز التتبع أو رقم الطلب للعثور على حالة طلب الإصلاح
          </p>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Repair Data Display */}
      {repairData && (
        <div className="space-y-6">
          {/* Status Progress */}
          <SimpleCard>
            <SimpleCardHeader>
              <div className="flex items-center justify-between">
                <SimpleCardTitle>حالة الطلب</SimpleCardTitle>
                <span className="text-sm text-muted-foreground">
                {formatDate(repairData.createdAt)}
              </span>
            </div>
            </SimpleCardHeader>
            <SimpleCardContent>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>0%</span>
                <span className="font-medium">{getStatusProgress(repairData.status)}% مكتمل</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getStatusProgress(repairData.status)}%` }}
                ></div>
              </div>
            </div>

            {/* Current Status */}
            <div className="flex items-center justify-center">
              {(() => {
                const normalizedStatus = normalizeStatus(repairData.status);
                const config = statusConfig[normalizedStatus] || statusConfig['RECEIVED'];
                const Icon = config.icon;
                return (
                  <div className="text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${config.color} mb-2`}>
                      <Icon className="w-4 h-4 mr-2" />
                      {config.label}
                    </div>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                );
              })()}
            </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Repair Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Device Information */}
              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle>معلومات الجهاز</SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    {(() => {
                      const DeviceIcon = getDeviceIcon(repairData.deviceType);
                      return <DeviceIcon className="w-5 h-5 text-blue-600" />;
                    })()}
                    <div>
                      <h4 className="font-medium text-foreground">نوع الجهاز</h4>
                      <p className="text-muted-foreground">{repairData.deviceType || 'غير محدد'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Package className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-foreground">الماركة</h4>
                      <p className="text-muted-foreground">{repairData.deviceBrand || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Wrench className="w-5 h-5 text-orange-600" />
                    <div>
                      <h4 className="font-medium text-foreground">الموديل</h4>
                      <p className="text-muted-foreground">{repairData.deviceModel || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 space-x-reverse">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-foreground">وصف المشكلة</h4>
                      <p className="text-muted-foreground">{repairData.problemDescription || 'لا توجد تفاصيل'}</p>
                    </div>
                  </div>
                </div>
                </SimpleCardContent>
              </SimpleCard>

              {/* Customer Information */}
              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle>معلومات العميل</SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-foreground">اسم العميل</h4>
                      <p className="text-muted-foreground">{repairData.customerName || 'غير محدد'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Phone className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-foreground">رقم الهاتف</h4>
                      <p className="text-muted-foreground">{repairData.customerPhone || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Mail className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-foreground">البريد الإلكتروني</h4>
                      <p className="text-muted-foreground">{repairData.customerEmail || 'غير محدد'}</p>
                    </div>
                  </div>
                </div>
                </SimpleCardContent>
              </SimpleCard>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Repair Information */}
              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle>معلومات الإصلاح</SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-foreground">تاريخ الاستلام</h4>
                      <p className="text-muted-foreground">{formatDate(repairData.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <h4 className="font-medium text-foreground">التسليم المتوقع</h4>
                      <p className="text-muted-foreground">{formatDate(repairData.estimatedCompletionDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 space-x-reverse">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-foreground">التكلفة المقدرة</h4>
                      <p className="text-muted-foreground">
                        {repairData.estimatedCost ? `${repairData.estimatedCost} ج.م` : 'غير محدد'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 space-x-reverse">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <h4 className="font-medium text-foreground">الأولوية</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        repairData.priority === 'high' ? 'bg-red-100 text-red-800' :
                        repairData.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {repairData.priority === 'high' ? 'عالية' :
                         repairData.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </span>
                    </div>
                  </div>
                </div>
                </SimpleCardContent>
              </SimpleCard>

              {/* Tracking Information */}
              <SimpleCard>
                <SimpleCardHeader>
                  <SimpleCardTitle>معلومات التتبع</SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <QrCode className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-foreground">رمز التتبع</h4>
                      <p className="text-muted-foreground font-mono">{repairData.trackingToken || 'غير محدد'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-foreground">رقم الطلب</h4>
                      <p className="text-muted-foreground font-mono">{repairData.requestNumber || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 space-x-reverse">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-foreground">الفرع</h4>
                      <p className="text-muted-foreground">{repairData.branchName || 'غير محدد'}</p>
                    </div>
                  </div>
                </div>
                </SimpleCardContent>
              </SimpleCard>
            </div>
          </div>

          {/* Action Buttons */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>الإجراءات</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <SimpleButton
                  onClick={() => navigate(`/repairs/${repairData.id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Eye className="w-4 h-4 ml-2" />
                  عرض التفاصيل الكاملة
                </SimpleButton>
                
                <SimpleButton
                  onClick={() => window.print()}
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة
                </SimpleButton>
                
                <SimpleButton
                  onClick={handleClear}
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  بحث جديد
                </SimpleButton>
              </div>
            </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>
      )}
    </div>
  );
};

export default RepairTrackingPage;
