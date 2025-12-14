import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import SimpleButton from '../../components/ui/SimpleButton';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useAuthStore from '../../stores/authStore';
import { isCustomerRole } from '../../constants/roles';
import CustomerHeader from '../../components/customer/CustomerHeader';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '../../components/ui/Modal';
import EnhancedStatsCard from '../../components/customer/EnhancedStatsCard';
import QuickActionCard from '../../components/customer/QuickActionCard';
import {
  Wrench, FileText, CreditCard, Package,
  Clock, CheckCircle, XCircle, AlertCircle,
  Plus, Search, Phone
} from 'lucide-react';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const user = useAuthStore((state) => state.user);
  const forcePasswordReset = useAuthStore((state) => state.forcePasswordReset);

  const [profile, setProfile] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [invoices, setInvoices] = useState([]);
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
  const [showPasswordReminder, setShowPasswordReminder] = useState(false);

  // Use ref to prevent multiple calls
  const loadingRef = useRef(false);

  useEffect(() => {
    const roleId = user?.roleId || user?.role;
    const numericRoleId = Number(roleId);
    const isCustomer = user && (user.type === 'customer' || isCustomerRole(numericRoleId));

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

  useEffect(() => {
    setShowPasswordReminder(forcePasswordReset);
  }, [forcePasswordReset]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Load Stats
      try {
        const statsRes = await api.getCustomerDashboardStats();
        if (statsRes.success) {
          setStats(statsRes.data);
        }
      } catch (e) {
        console.warn('Failed to load stats:', e);
      }

      // 2. Load Profile first so we can scope future requests to this customer
      let resolvedCustomerId = profile?.id || user?.customerId || user?.id;
      try {
        const profileRes = await api.request('/auth/customer/profile');
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
          if (profileRes.data.id) {
            resolvedCustomerId = profileRes.data.id;
          }
        } else if (user) {
          const fallbackCustomerId = user.customerId || user.id;
          setProfile({
            id: fallbackCustomerId,
            name: user.name,
            email: user.email,
            phone: user.phone
          });
          if (fallbackCustomerId) {
            resolvedCustomerId = fallbackCustomerId;
          }
        }
      } catch (profileError) {
        console.warn('Profile API failed, using user data from store:', profileError);
        if (user) {
          const fallbackCustomerId = user.customerId || user.id;
          setProfile({
            id: fallbackCustomerId,
            name: user.name,
            email: user.email,
            phone: user.phone
          });
          if (fallbackCustomerId) {
            resolvedCustomerId = fallbackCustomerId;
          }
        }
      }

      const scopedParams = {};
      if (resolvedCustomerId) {
        scopedParams.customerId = resolvedCustomerId;
      }

      // 2. Load Recent Repairs
      try {
        const repairsRes = await api.getCustomerRepairs({ limit: 5, ...scopedParams });
        if (repairsRes.success) {
          setRepairs(repairsRes.data.repairs || []);
        }
      } catch (e) {
        console.warn('Failed to load repairs:', e);
      }

      // 3. Load Recent Invoices
      try {
        const invoicesRes = await api.getCustomerInvoices({ limit: 5, ...scopedParams });
        if (invoicesRes.success) {
          setInvoices(invoicesRes.data.invoices || []);
        }
      } catch (e) {
        console.warn('Failed to load invoices:', e);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      notifications.error('خطأ', { message: 'فشل تحميل البيانات' });
    } finally {
      setLoading(false);
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
    <>
      <Modal open={showPasswordReminder} onOpenChange={setShowPasswordReminder}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>أهلًا بك في Fix Zone</ModalTitle>
            <ModalDescription>
              سعيدين بانضمامك! لتأمين حسابك، نقترح تغيير كلمة المرور المؤقتة الآن من الإعدادات.
            </ModalDescription>
          </ModalHeader>
          <div className="text-sm text-gray-700 space-y-2 py-2">
            <p>
              الكلمة الحالية مُنشأة تلقائيًا ومربوطة ببياناتك لتسهيل الدخول الأول. اضغط على "تغيير كلمة المرور الآن" وهنوديك مباشرة للإعدادات.
            </p>
            <p className="text-xs text-gray-500">
              لو حبيت تأجل، اضغط "أذكرني لاحقاً"؛ التنبيه هيظهر مرة ثانية في الزيارة القادمة لغاية ما تغيرها.
            </p>
          </div>
          <ModalFooter>
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordReminder(false)}
            >
              أذكرني لاحقاً
            </SimpleButton>
            <SimpleButton
              size="sm"
              onClick={() => {
                setShowPasswordReminder(false);
                navigate('/customer/settings');
              }}
            >
              خُذني للـ إعدادات
            </SimpleButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <div className="min-h-screen bg-background">
        {/* Enhanced Header */}
        <CustomerHeader user={user} notificationCount={3} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards - Enhanced */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <EnhancedStatsCard
              title="طلبات الإصلاح"
              value={stats.totalRepairs}
              subtitle={`${stats.activeRepairs} نشط`}
              icon={Wrench}
              gradient="linear-gradient(135deg, #053887 0%, #0a4da3 100%)"
              change={`+${stats.activeRepairs} نشطة`}
              changeType="increase"
              actionLabel="عرض الكل"
              onClick={() => navigate('/customer/repairs')}
            />
            <EnhancedStatsCard
              title="الفواتير"
              value={stats.totalInvoices}
              subtitle={`${stats.pendingInvoices} في الانتظار`}
              icon={FileText}
              gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
              change={`${stats.paidInvoices} مدفوعة`}
              changeType="neutral"
              actionLabel="عرض الفواتير"
              onClick={() => navigate('/customer/invoices')}
            />
            <EnhancedStatsCard
              title="الأجهزة"
              value={stats.totalDevices}
              subtitle="إجمالي الأجهزة"
              icon={Package}
              gradient="linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)"
              actionLabel="عرض التفاصيل"
              onClick={() => navigate('/customer/devices')}
            />
            <EnhancedStatsCard
              title="الفواتير المدفوعة"
              value={stats.paidInvoices}
              subtitle={`من ${stats.totalInvoices}`}
              icon={CreditCard}
              gradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
              actionLabel="عرض السجل"
              onClick={() => navigate('/customer/invoices?status=paid')}
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-foreground">إجراءات سريعة</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickActionCard
                icon={Plus}
                label="طلب إصلاح جديد"
                gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
                onClick={() => navigate('/repairs/new')}
              />
              <QuickActionCard
                icon={Search}
                label="تتبع طلب"
                gradient="linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
                onClick={() => navigate('/track')}
              />
              <QuickActionCard
                icon={FileText}
                label="فواتيري"
                gradient="linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)"
                onClick={() => navigate('/customer/invoices')}
                badge={stats.pendingInvoices > 0 ? stats.pendingInvoices : null}
              />
              <QuickActionCard
                icon={Phone}
                label="تواصل معنا"
                gradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                onClick={() => window.open('tel:+201234567890')}
              />
            </div>
          </div>

          {/* Repairs & Invoices Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Repairs */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center justify-between">
                  <span>آخر طلبات الإصلاح</span>
                  <Wrench className="w-5 h-5 text-brand-blue" />
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                {repairs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد طلبات إصلاح حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {repairs.slice(0, 5).map((repair) => (
                      <div
                        key={repair.id}
                        className="p-4 rounded-lg border border-border transition-all duration-base cursor-pointer hover:shadow-md hover:border-brand-blue"
                        onClick={() => navigate(`/repairs/${repair.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">#{repair.id}</p>
                            <p className="text-sm text-muted-foreground">{repair.deviceType || 'جهاز'}</p>
                          </div>
                          {getStatusBadge(repair.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {repair.issueDescription?.substring(0, 60) || 'لا يوجد وصف'}...
                        </p>
                      </div>
                    ))}
                    {repairs.length > 5 && (
                      <button
                        onClick={() => navigate('/customer/repairs')}
                        className="w-full py-2 text-sm font-medium text-brand-blue rounded-lg transition-colors hover:bg-accent"
                      >
                        عرض الكل ({repairs.length})
                      </button>
                    )}
                  </div>
                )}
              </SimpleCardContent>
            </SimpleCard>

            {/* Recent Invoices */}
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle className="flex items-center justify-between">
                  <span>آخر الفواتير</span>
                  <FileText className="w-5 h-5 text-brand-green" />
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد فواتير حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.slice(0, 5).map((invoice) => (
                      <div
                        key={invoice.id}
                        className="p-4 rounded-lg border border-border transition-all duration-base cursor-pointer hover:shadow-md hover:border-brand-green"
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">فاتورة #{invoice.id}</p>
                            <p className="text-sm text-muted-foreground">{invoice.totalAmount || 0} جنيه</p>
                          </div>
                          {getStatusBadge(invoice.paymentStatus || 'pending')}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(invoice.createdAt || Date.now()).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    ))}
                    {invoices.length > 5 && (
                      <button
                        onClick={() => navigate('/customer/invoices')}
                        className="w-full py-2 text-sm font-medium text-brand-green rounded-lg transition-colors hover:bg-accent"
                      >
                        عرض الكل ({invoices.length})
                      </button>
                    )}
                  </div>
                )}
              </SimpleCardContent>
            </SimpleCard>
          </div>
        </div>
      </div>
    </>
  );
}
