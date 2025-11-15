import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../stores/authStore';
import {
  User, LogOut, Phone, Mail, MapPin, Shield,
  Wrench, FileText, CreditCard, Package,
  Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const [profile, setProfile] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRepairs: 0,
    activeRepairs: 0,
    completedRepairs: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    totalDevices: 0
  });
  
  // Use ref to prevent multiple calls
  const loadingRef = useRef(false);
  
  useEffect(() => {
    const roleId = user?.roleId || user?.role;
    const isCustomer = user && (user.type === 'customer' || roleId === 8 || roleId === '8');
    
    if (!user || !isCustomer) {
      notifications.error('خطأ', { message: 'يجب تسجيل الدخول كعميل للوصول لهذه الصفحة' });
      navigate('/login');
      return;
    }
    
    // Load dashboard data when user is available
    // Use ref to prevent multiple simultaneous calls
    if (!loadingRef.current) {
      loadingRef.current = true;
      loadDashboardData().finally(() => {
        loadingRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id to prevent loops

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get customerId from user first
      let customerId = user?.customerId || user?.id;
      let loadedProfile = null;
      
      // Load profile - use user data from auth store if profile API fails
      try {
        const profileRes = await api.request('/auth/customer/profile');
        if (profileRes.success && profileRes.data) {
          loadedProfile = profileRes.data;
          setProfile(loadedProfile);
          // Update customerId from profile if available
          if (loadedProfile.id) {
            customerId = loadedProfile.id;
          }
        } else {
          // Fallback: use user data from auth store
          if (user) {
            loadedProfile = {
              id: customerId,
              name: user.name,
              email: user.email,
              phone: user.phone
            };
            setProfile(loadedProfile);
          }
        }
      } catch (profileError) {
        console.warn('Profile API failed, using user data from store:', profileError);
        // Fallback: use user data from auth store
        if (user) {
          loadedProfile = {
            id: customerId,
            name: user.name,
            email: user.email,
            phone: user.phone
          };
          setProfile(loadedProfile);
        }
      }

      // Use customerId from loaded profile if available, otherwise from user
      const finalCustomerId = loadedProfile?.id || customerId;
      
      // Load repairs (customer's own)
      let repairsData = [];
      let invoicesData = [];
      let devicesData = [];

      try {
        const repairsRes = await api.request(`/repairs?customerId=${finalCustomerId}`);
        repairsData = repairsRes.success 
          ? (repairsRes.data?.repairs || repairsRes.data || [])
          : (Array.isArray(repairsRes) ? repairsRes : []);
      } catch (e) {
        console.warn('Could not load repairs:', e);
      }

      try {
        const invoicesRes = await api.request(`/invoices?customerId=${finalCustomerId}`);
        invoicesData = invoicesRes.success
          ? (invoicesRes.data?.invoices || invoicesRes.data || [])
          : (Array.isArray(invoicesRes) ? invoicesRes : []);
      } catch (e) {
        console.warn('Could not load invoices:', e);
      }

      try {
        const devicesRes = await api.request(`/devices?customerId=${finalCustomerId}`);
        devicesData = devicesRes.success
          ? (devicesRes.data?.devices || devicesRes.data || [])
          : (Array.isArray(devicesRes) ? devicesRes : []);
      } catch (e) {
        console.warn('Could not load devices:', e);
      }

      setRepairs(repairsData);
      setInvoices(invoicesData);
      setDevices(devicesData);

      // Calculate stats
      const activeRepairs = repairsData.filter(r => r.status && !['completed', 'cancelled'].includes(r.status)).length;
      const completedRepairs = repairsData.filter(r => r.status === 'completed').length;
      const pendingInvoices = invoicesData.filter(i => i.status === 'pending' || i.paymentStatus === 'pending').length;
      const paidInvoices = invoicesData.filter(i => i.paymentStatus === 'paid').length;

      setStats({
        totalRepairs: repairsData.length,
        activeRepairs,
        completedRepairs,
        totalInvoices: invoicesData.length,
        pendingInvoices,
        paidInvoices,
        totalDevices: devicesData.length
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      notifications.error('خطأ', { message: 'فشل تحميل البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.request('/auth/logout', { method: 'POST' });
      logout();
      navigate('/login');
      notifications.success('نجاح', { message: 'تم تسجيل الخروج بنجاح' });
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate('/login');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'قيد الانتظار', variant: 'warning', icon: Clock },
      in_progress: { label: 'قيد التنفيذ', variant: 'info', icon: Wrench },
      completed: { label: 'مكتمل', variant: 'success', icon: CheckCircle },
      cancelled: { label: 'ملغي', variant: 'destructive', icon: XCircle },
      paid: { label: 'مدفوع', variant: 'success', icon: CheckCircle },
      pending_payment: { label: 'في انتظار الدفع', variant: 'warning', icon: AlertCircle }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'default', icon: AlertCircle };
    const Icon = statusInfo.icon;

    return (
      <SimpleBadge variant={statusInfo.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {statusInfo.label}
      </SimpleBadge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">لوحة تحكم العميل</h1>
                <p className="text-sm text-gray-600">{profile?.name || user?.name}</p>
              </div>
            </div>
            <SimpleButton variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              تسجيل الخروج
            </SimpleButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إجمالي طلبات الإصلاح</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRepairs}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.activeRepairs} نشط
                  </p>
                </div>
                <Wrench className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إجمالي الفواتير</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.pendingInvoices} في الانتظار
                  </p>
                </div>
                <FileText className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إجمالي الأجهزة</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDevices}</p>
                </div>
                <Package className="w-12 h-12 text-purple-500 opacity-20" />
              </div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">الفواتير المدفوعة</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.paidInvoices}</p>
                </div>
                <CreditCard className="w-12 h-12 text-indigo-500 opacity-20" />
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Profile Card */}
        {profile && (
          <SimpleCard className="mb-8">
            <SimpleCardHeader>
              <SimpleCardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                معلوماتي الشخصية
              </SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">رقم الهاتف</p>
                    <p className="font-medium">{profile.phone || 'غير متوفر'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                    <p className="font-medium">{profile.email || profile.userEmail || 'غير متوفر'}</p>
                  </div>
                </div>
                {profile.address && (
                  <div className="flex items-center gap-3 md:col-span-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">العنوان</p>
                      <p className="font-medium">{profile.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </SimpleCardContent>
          </SimpleCard>
        )}

        {/* Recent Repairs */}
        <SimpleCard className="mb-8">
          <SimpleCardHeader>
            <div className="flex items-center justify-between">
              <SimpleCardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                طلبات الإصلاح الأخيرة
              </SimpleCardTitle>
              <SimpleButton 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/customer/repairs')}
              >
                عرض الكل
              </SimpleButton>
            </div>
          </SimpleCardHeader>
          <SimpleCardContent>
            {repairs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد طلبات إصلاح
              </div>
            ) : (
              <div className="space-y-4">
                {repairs && repairs.length > 0 && repairs.slice(0, 5).map((repair) => (
                  <div
                    key={repair.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/customer/repairs/${repair.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">طلب #{repair.id}</p>
                        {getStatusBadge(repair.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {repair.deviceType} - {repair.brand}
                      </p>
                      {repair.createdAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(repair.createdAt).toLocaleDateString('ar-EG')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SimpleCardContent>
        </SimpleCard>

        {/* Recent Invoices */}
        <SimpleCard>
          <SimpleCardHeader>
            <div className="flex items-center justify-between">
              <SimpleCardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                الفواتير الأخيرة
              </SimpleCardTitle>
              <SimpleButton 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/customer/invoices')}
              >
                عرض الكل
              </SimpleButton>
            </div>
          </SimpleCardHeader>
          <SimpleCardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد فواتير
              </div>
            ) : (
              <div className="space-y-4">
                {invoices && invoices.length > 0 && invoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/customer/invoices/${invoice.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">فاتورة #{invoice.id}</p>
                        {getStatusBadge(invoice.paymentStatus || invoice.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        المبلغ: {invoice.totalAmount || 0} جنيه
                      </p>
                      {invoice.createdAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(invoice.createdAt).toLocaleDateString('ar-EG')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );
}

