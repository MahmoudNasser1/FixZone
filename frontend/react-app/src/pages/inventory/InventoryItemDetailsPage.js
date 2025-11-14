import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorHandler from '../../components/common/ErrorHandler';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { 
  ArrowLeft, Edit, Trash2, Package, DollarSign, 
  Hash, FileText, Tag, ShoppingCart, TrendingUp,
  AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import apiService from '../../services/api';

const InventoryItemDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [stockLevels, setStockLevels] = useState([]);

  useEffect(() => {
    if (id) {
      fetchItemDetails();
    }
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.request(`/inventory/${id}`);
      setItem(data);
      
      // Fetch stock levels if available
      try {
        const stockData = await apiService.request(`/inventory/${id}/stock-levels`);
        setStockLevels(Array.isArray(stockData) ? stockData : stockData.data || []);
      } catch (e) {
        console.log('Stock levels not available:', e);
      }
    } catch (err) {
      console.error('Error fetching item details:', err);
      setError('فشل في تحميل تفاصيل الصنف');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      return;
    }
    
    try {
      await apiService.request(`/inventory/${id}`, { method: 'DELETE' });
      notifications.success('تم حذف الصنف بنجاح');
      navigate('/inventory');
    } catch (err) {
      console.error('Error deleting item:', err);
      notifications.error('فشل في حذف الصنف');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner message="جاري تحميل تفاصيل الصنف..." />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorHandler 
          error={{ message: error || 'الصنف غير موجود' }}
          onRetry={() => navigate('/inventory')}
          title="خطأ في تحميل البيانات"
        />
      </div>
    );
  }

  const getStockStatus = () => {
    const totalStock = stockLevels.reduce((sum, level) => sum + (parseFloat(level.quantity) || 0), 0);
    if (totalStock === 0) {
      return { label: 'نفد المخزون', color: 'bg-red-100 text-red-800', icon: AlertCircle };
    }
    if (totalStock < (item.minStockLevel || 10)) {
      return { label: 'مخزون منخفض', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
    return { label: 'متوفر', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const stockStatus = getStockStatus();
  const totalStock = stockLevels.reduce((sum, level) => sum + (parseFloat(level.quantity) || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/inventory')}
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة
          </SimpleButton>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-sm text-gray-500 mt-1">تفاصيل الصنف</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SimpleButton
            variant="outline"
            onClick={() => navigate(`/inventory/${id}/edit`)}
          >
            <Edit className="w-4 h-4 ml-2" />
            تعديل
          </SimpleButton>
          <SimpleButton
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 ml-2" />
            حذف
          </SimpleButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                المعلومات الأساسية
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">الرمز SKU</label>
                  <p className="mt-1 text-sm font-mono bg-gray-100 px-3 py-2 rounded">{item.sku || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الاسم</label>
                  <p className="mt-1 text-sm font-semibold">{item.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الفئة</label>
                  <p className="mt-1">
                    {item.category ? (
                      <SimpleBadge variant="outline">{item.category}</SimpleBadge>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">النوع</label>
                  <p className="mt-1 text-sm">{item.type || '-'}</p>
                </div>
                {item.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">الوصف</label>
                    <p className="mt-1 text-sm text-gray-700">{item.description}</p>
                  </div>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Pricing */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                الأسعار
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">سعر الشراء</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {item.purchasePrice ? `${parseFloat(item.purchasePrice).toFixed(2)} ج.م` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">سعر البيع</label>
                  <p className="mt-1 text-lg font-semibold text-green-600">
                    {item.sellingPrice ? `${parseFloat(item.sellingPrice).toFixed(2)} ج.م` : '-'}
                  </p>
                </div>
                {item.purchasePrice && item.sellingPrice && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">هامش الربح</label>
                    <p className="mt-1 text-sm">
                      {((parseFloat(item.sellingPrice) - parseFloat(item.purchasePrice)) / parseFloat(item.purchasePrice) * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Stock Levels */}
          {stockLevels.length > 0 && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  مستويات المخزون
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-3">
                  {stockLevels.map((level, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{level.warehouseName || 'مخزن غير محدد'}</p>
                        <p className="text-xs text-gray-500">{level.location || ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{parseFloat(level.quantity) || 0}</p>
                        <p className="text-xs text-gray-500">{item.unit || 'قطعة'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SimpleCardContent>
            </SimpleCard>
          )}
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Stock Status */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>حالة المخزون</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${stockStatus.color} mb-4`}>
                  <stockStatus.icon className="w-5 h-5" />
                  <span className="font-medium">{stockStatus.label}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalStock}</p>
                <p className="text-sm text-gray-500 mt-1">{item.unit || 'قطعة'} متاحة</p>
                {item.minStockLevel && (
                  <p className="text-xs text-gray-400 mt-2">الحد الأدنى: {item.minStockLevel}</p>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Additional Info */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>معلومات إضافية</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent className="space-y-3">
              {item.serialNumber && (
                <div>
                  <label className="text-xs font-medium text-gray-500">الرقم التسلسلي</label>
                  <p className="text-sm font-mono mt-1">{item.serialNumber}</p>
                </div>
              )}
              {item.createdAt && (
                <div>
                  <label className="text-xs font-medium text-gray-500">تاريخ الإنشاء</label>
                  <p className="text-sm mt-1">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
              )}
              {item.updatedAt && (
                <div>
                  <label className="text-xs font-medium text-gray-500">آخر تحديث</label>
                  <p className="text-sm mt-1">{new Date(item.updatedAt).toLocaleDateString('ar-EG')}</p>
                </div>
              )}
            </SimpleCardContent>
          </SimpleCard>
        </div>
      </div>
    </div>
  );
};

export default InventoryItemDetailsPage;

import { useNavigate, useParams, Link } from 'react-router-dom';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorHandler from '../../components/common/ErrorHandler';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { 
  ArrowLeft, Edit, Trash2, Package, DollarSign, 
  Hash, FileText, Tag, ShoppingCart, TrendingUp,
  AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import apiService from '../../services/api';

const InventoryItemDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [stockLevels, setStockLevels] = useState([]);

  useEffect(() => {
    if (id) {
      fetchItemDetails();
    }
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.request(`/inventory/${id}`);
      setItem(data);
      
      // Fetch stock levels if available
      try {
        const stockData = await apiService.request(`/inventory/${id}/stock-levels`);
        setStockLevels(Array.isArray(stockData) ? stockData : stockData.data || []);
      } catch (e) {
        console.log('Stock levels not available:', e);
      }
    } catch (err) {
      console.error('Error fetching item details:', err);
      setError('فشل في تحميل تفاصيل الصنف');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      return;
    }
    
    try {
      await apiService.request(`/inventory/${id}`, { method: 'DELETE' });
      notifications.success('تم حذف الصنف بنجاح');
      navigate('/inventory');
    } catch (err) {
      console.error('Error deleting item:', err);
      notifications.error('فشل في حذف الصنف');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner message="جاري تحميل تفاصيل الصنف..." />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorHandler 
          error={{ message: error || 'الصنف غير موجود' }}
          onRetry={() => navigate('/inventory')}
          title="خطأ في تحميل البيانات"
        />
      </div>
    );
  }

  const getStockStatus = () => {
    const totalStock = stockLevels.reduce((sum, level) => sum + (parseFloat(level.quantity) || 0), 0);
    if (totalStock === 0) {
      return { label: 'نفد المخزون', color: 'bg-red-100 text-red-800', icon: AlertCircle };
    }
    if (totalStock < (item.minStockLevel || 10)) {
      return { label: 'مخزون منخفض', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
    return { label: 'متوفر', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const stockStatus = getStockStatus();
  const totalStock = stockLevels.reduce((sum, level) => sum + (parseFloat(level.quantity) || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/inventory')}
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة
          </SimpleButton>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-sm text-gray-500 mt-1">تفاصيل الصنف</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SimpleButton
            variant="outline"
            onClick={() => navigate(`/inventory/${id}/edit`)}
          >
            <Edit className="w-4 h-4 ml-2" />
            تعديل
          </SimpleButton>
          <SimpleButton
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 ml-2" />
            حذف
          </SimpleButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                المعلومات الأساسية
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">الرمز SKU</label>
                  <p className="mt-1 text-sm font-mono bg-gray-100 px-3 py-2 rounded">{item.sku || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الاسم</label>
                  <p className="mt-1 text-sm font-semibold">{item.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الفئة</label>
                  <p className="mt-1">
                    {item.category ? (
                      <SimpleBadge variant="outline">{item.category}</SimpleBadge>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">النوع</label>
                  <p className="mt-1 text-sm">{item.type || '-'}</p>
                </div>
                {item.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">الوصف</label>
                    <p className="mt-1 text-sm text-gray-700">{item.description}</p>
                  </div>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Pricing */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                الأسعار
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">سعر الشراء</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {item.purchasePrice ? `${parseFloat(item.purchasePrice).toFixed(2)} ج.م` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">سعر البيع</label>
                  <p className="mt-1 text-lg font-semibold text-green-600">
                    {item.sellingPrice ? `${parseFloat(item.sellingPrice).toFixed(2)} ج.م` : '-'}
                  </p>
                </div>
                {item.purchasePrice && item.sellingPrice && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">هامش الربح</label>
                    <p className="mt-1 text-sm">
                      {((parseFloat(item.sellingPrice) - parseFloat(item.purchasePrice)) / parseFloat(item.purchasePrice) * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Stock Levels */}
          {stockLevels.length > 0 && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  مستويات المخزون
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-3">
                  {stockLevels.map((level, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{level.warehouseName || 'مخزن غير محدد'}</p>
                        <p className="text-xs text-gray-500">{level.location || ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{parseFloat(level.quantity) || 0}</p>
                        <p className="text-xs text-gray-500">{item.unit || 'قطعة'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SimpleCardContent>
            </SimpleCard>
          )}
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Stock Status */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>حالة المخزون</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${stockStatus.color} mb-4`}>
                  <stockStatus.icon className="w-5 h-5" />
                  <span className="font-medium">{stockStatus.label}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalStock}</p>
                <p className="text-sm text-gray-500 mt-1">{item.unit || 'قطعة'} متاحة</p>
                {item.minStockLevel && (
                  <p className="text-xs text-gray-400 mt-2">الحد الأدنى: {item.minStockLevel}</p>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Additional Info */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>معلومات إضافية</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent className="space-y-3">
              {item.serialNumber && (
                <div>
                  <label className="text-xs font-medium text-gray-500">الرقم التسلسلي</label>
                  <p className="text-sm font-mono mt-1">{item.serialNumber}</p>
                </div>
              )}
              {item.createdAt && (
                <div>
                  <label className="text-xs font-medium text-gray-500">تاريخ الإنشاء</label>
                  <p className="text-sm mt-1">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
              )}
              {item.updatedAt && (
                <div>
                  <label className="text-xs font-medium text-gray-500">آخر تحديث</label>
                  <p className="text-sm mt-1">{new Date(item.updatedAt).toLocaleDateString('ar-EG')}</p>
                </div>
              )}
            </SimpleCardContent>
          </SimpleCard>
        </div>
      </div>
    </div>
  );
};

export default InventoryItemDetailsPage;

import { useNavigate, useParams, Link } from 'react-router-dom';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorHandler from '../../components/common/ErrorHandler';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { 
  ArrowLeft, Edit, Trash2, Package, DollarSign, 
  Hash, FileText, Tag, ShoppingCart, TrendingUp,
  AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import apiService from '../../services/api';

const InventoryItemDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [stockLevels, setStockLevels] = useState([]);

  useEffect(() => {
    if (id) {
      fetchItemDetails();
    }
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.request(`/inventory/${id}`);
      setItem(data);
      
      // Fetch stock levels if available
      try {
        const stockData = await apiService.request(`/inventory/${id}/stock-levels`);
        setStockLevels(Array.isArray(stockData) ? stockData : stockData.data || []);
      } catch (e) {
        console.log('Stock levels not available:', e);
      }
    } catch (err) {
      console.error('Error fetching item details:', err);
      setError('فشل في تحميل تفاصيل الصنف');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      return;
    }
    
    try {
      await apiService.request(`/inventory/${id}`, { method: 'DELETE' });
      notifications.success('تم حذف الصنف بنجاح');
      navigate('/inventory');
    } catch (err) {
      console.error('Error deleting item:', err);
      notifications.error('فشل في حذف الصنف');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner message="جاري تحميل تفاصيل الصنف..." />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorHandler 
          error={{ message: error || 'الصنف غير موجود' }}
          onRetry={() => navigate('/inventory')}
          title="خطأ في تحميل البيانات"
        />
      </div>
    );
  }

  const getStockStatus = () => {
    const totalStock = stockLevels.reduce((sum, level) => sum + (parseFloat(level.quantity) || 0), 0);
    if (totalStock === 0) {
      return { label: 'نفد المخزون', color: 'bg-red-100 text-red-800', icon: AlertCircle };
    }
    if (totalStock < (item.minStockLevel || 10)) {
      return { label: 'مخزون منخفض', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
    return { label: 'متوفر', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const stockStatus = getStockStatus();
  const totalStock = stockLevels.reduce((sum, level) => sum + (parseFloat(level.quantity) || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/inventory')}
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة
          </SimpleButton>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-sm text-gray-500 mt-1">تفاصيل الصنف</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SimpleButton
            variant="outline"
            onClick={() => navigate(`/inventory/${id}/edit`)}
          >
            <Edit className="w-4 h-4 ml-2" />
            تعديل
          </SimpleButton>
          <SimpleButton
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 ml-2" />
            حذف
          </SimpleButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                المعلومات الأساسية
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">الرمز SKU</label>
                  <p className="mt-1 text-sm font-mono bg-gray-100 px-3 py-2 rounded">{item.sku || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الاسم</label>
                  <p className="mt-1 text-sm font-semibold">{item.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الفئة</label>
                  <p className="mt-1">
                    {item.category ? (
                      <SimpleBadge variant="outline">{item.category}</SimpleBadge>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">النوع</label>
                  <p className="mt-1 text-sm">{item.type || '-'}</p>
                </div>
                {item.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">الوصف</label>
                    <p className="mt-1 text-sm text-gray-700">{item.description}</p>
                  </div>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Pricing */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                الأسعار
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">سعر الشراء</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {item.purchasePrice ? `${parseFloat(item.purchasePrice).toFixed(2)} ج.م` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">سعر البيع</label>
                  <p className="mt-1 text-lg font-semibold text-green-600">
                    {item.sellingPrice ? `${parseFloat(item.sellingPrice).toFixed(2)} ج.م` : '-'}
                  </p>
                </div>
                {item.purchasePrice && item.sellingPrice && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">هامش الربح</label>
                    <p className="mt-1 text-sm">
                      {((parseFloat(item.sellingPrice) - parseFloat(item.purchasePrice)) / parseFloat(item.purchasePrice) * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Stock Levels */}
          {stockLevels.length > 0 && (
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  مستويات المخزون
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-3">
                  {stockLevels.map((level, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{level.warehouseName || 'مخزن غير محدد'}</p>
                        <p className="text-xs text-gray-500">{level.location || ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{parseFloat(level.quantity) || 0}</p>
                        <p className="text-xs text-gray-500">{item.unit || 'قطعة'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SimpleCardContent>
            </SimpleCard>
          )}
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Stock Status */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>حالة المخزون</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${stockStatus.color} mb-4`}>
                  <stockStatus.icon className="w-5 h-5" />
                  <span className="font-medium">{stockStatus.label}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalStock}</p>
                <p className="text-sm text-gray-500 mt-1">{item.unit || 'قطعة'} متاحة</p>
                {item.minStockLevel && (
                  <p className="text-xs text-gray-400 mt-2">الحد الأدنى: {item.minStockLevel}</p>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>

          {/* Additional Info */}
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>معلومات إضافية</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent className="space-y-3">
              {item.serialNumber && (
                <div>
                  <label className="text-xs font-medium text-gray-500">الرقم التسلسلي</label>
                  <p className="text-sm font-mono mt-1">{item.serialNumber}</p>
                </div>
              )}
              {item.createdAt && (
                <div>
                  <label className="text-xs font-medium text-gray-500">تاريخ الإنشاء</label>
                  <p className="text-sm mt-1">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
              )}
              {item.updatedAt && (
                <div>
                  <label className="text-xs font-medium text-gray-500">آخر تحديث</label>
                  <p className="text-sm mt-1">{new Date(item.updatedAt).toLocaleDateString('ar-EG')}</p>
                </div>
              )}
            </SimpleCardContent>
          </SimpleCard>
        </div>
      </div>
    </div>
  );
};

export default InventoryItemDetailsPage;




