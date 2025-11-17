import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import vendorService from '../../services/vendorService';
import vendorPaymentService from '../../services/vendorPaymentService';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import VendorPaymentsTab from './VendorPaymentsTab';
import { 
  ArrowRight, Building2, Phone, Mail, MapPin, Calendar, 
  Edit, DollarSign, TrendingUp, Package, FileText
} from 'lucide-react';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const VendorDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [vendor, setVendor] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVendor();
    fetchBalance();
  }, [id]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vendorService.getVendorById(id);
      if (response && response.success && response.data) {
        setVendor(response.data.vendor || response.data);
      } else if (response && response.id) {
        setVendor(response);
      } else {
        throw new Error('Failed to fetch vendor');
      }
    } catch (err) {
      console.error('Error fetching vendor:', err);
      setError('حدث خطأ في تحميل بيانات المورد');
      addNotification('error', 'خطأ في جلب بيانات المورد');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await vendorPaymentService.getVendorBalance(id);
      if (response && response.success && response.data) {
        setBalance(response.data);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '0.00';
    return parseFloat(amount).toLocaleString('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ج.م';
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'المورد غير موجود'}</p>
        <SimpleButton onClick={() => navigate('/vendors')} variant="outline">
          العودة إلى الموردين
        </SimpleButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link to="/vendors" className="text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة إلى الموردين
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{vendor.name}</h1>
          <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2">
            <SimpleBadge color={vendor.status === 'active' ? 'green' : 'red'}>
              {vendor.status === 'active' ? 'نشط' : 'غير نشط'}
            </SimpleBadge>
            {balance && (
              <SimpleBadge color={balance.isOverLimit ? 'red' : 'green'}>
                {balance.isOverLimit ? 'تجاوز حد الائتمان' : 'ضمن حد الائتمان'}
              </SimpleBadge>
            )}
          </div>
        </div>
        <SimpleButton onClick={() => navigate(`/vendors/${id}/edit`)} variant="default">
          <Edit className="w-4 h-4 ml-2" />
          تعديل
        </SimpleButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الرصيد المستحق</p>
                <p className={`text-2xl font-bold ${balance?.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatAmount(balance?.balance)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-blue-600">
                  {vendor.totalOrders || 0}
                </p>
              </div>
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">حد الائتمان</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(vendor.creditLimit)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
          </SimpleCardContent>
        </SimpleCard>

        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">استخدام الائتمان</p>
                <p className="text-2xl font-bold text-orange-600">
                  {balance?.creditUtilization ? `${balance.creditUtilization.toFixed(1)}%` : '0%'}
                </p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 rtl:space-x-reverse">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            معلومات عامة
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            المدفوعات
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            طلبات الشراء
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>معلومات المورد</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">اسم المورد</label>
                    <p className="text-gray-900">{vendor.name}</p>
                  </div>
                  {vendor.contactPerson && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">الشخص المسؤول</label>
                      <p className="text-gray-900">{vendor.contactPerson}</p>
                    </div>
                  )}
                  {vendor.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">الهاتف</label>
                      <p className="text-gray-900 flex items-center">
                        <Phone className="w-4 h-4 ml-2 text-gray-400" />
                        {vendor.phone}
                      </p>
                    </div>
                  )}
                  {vendor.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                      <p className="text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 ml-2 text-gray-400" />
                        {vendor.email}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {vendor.address && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">العنوان</label>
                      <p className="text-gray-900 flex items-center">
                        <MapPin className="w-4 h-4 ml-2 text-gray-400" />
                        {vendor.address}
                      </p>
                    </div>
                  )}
                  {vendor.taxNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">الرقم الضريبي</label>
                      <p className="text-gray-900">{vendor.taxNumber}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700">شروط الدفع</label>
                    <p className="text-gray-900">{vendor.paymentTerms || 'net30'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">تاريخ الإنشاء</label>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 ml-2 text-gray-400" />
                      {formatDate(vendor.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              {vendor.notes && (
                <div className="mt-6">
                  <label className="text-sm font-medium text-gray-700">ملاحظات</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded mt-2">{vendor.notes}</p>
                </div>
              )}
            </SimpleCardContent>
          </SimpleCard>
        )}

        {activeTab === 'payments' && (
          <VendorPaymentsTab vendorId={id} />
        )}

        {activeTab === 'orders' && (
          <SimpleCard>
            <SimpleCardHeader>
              <SimpleCardTitle>طلبات الشراء</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">سيتم إضافة قائمة طلبات الشراء قريباً</p>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        )}
      </div>
    </div>
  );
};

export default VendorDetailsPage;

