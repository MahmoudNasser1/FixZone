import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import apiService from '../../services/api';
import SimpleButton from '../../components/ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { 
  ArrowRight, User, Phone, Mail, Shield, Edit, Trash2, UserCheck, UserX,
  Calendar, Clock, AlertCircle, CheckCircle, XCircle, Key, Settings
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const UserDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id === 'new') {
      return;
    }
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  if (id === 'new') {
    return <Navigate to="/users/new" replace />;
  }

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // apiService.getUser() يرجع JSON مباشر وليس Response object
      const result = await apiService.getUserById?.(id) || await apiService.request(`/users/${id}`);
      
      // Backend يرجع { success: true, data: {...} } أو { ... } مباشر
      let userData = null;
      if (result?.success && result?.data) {
        userData = result.data;
      } else if (result?.id) {
        userData = result;
      } else {
        throw new Error('User not found');
      }
      
      setUser(userData);
      
      // جلب معلومات الدور
      if (userData.roleId) {
        try {
          const rolesResult = await apiService.listRoles();
          const rolesArray = Array.isArray(rolesResult) ? rolesResult : (rolesResult?.items || rolesResult?.data || []);
          const userRole = rolesArray.find(r => r.id === userData.roleId);
          if (userRole) {
            setRole(userRole);
          }
        } catch (err) {
          console.error('Error fetching role:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err.message || 'تعذر تحميل بيانات المستخدم');
      notifications.error('خطأ في تحميل بيانات المستخدم', { message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    
    const newStatus = !user.isActive;
    
    try {
      const result = await apiService.updateUser(user.id, { isActive: newStatus });
      
      if (result?.success || result?.message) {
        setUser({ ...user, isActive: newStatus });
        notifications.success(`تم ${newStatus ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`);
      } else {
        throw new Error(result?.message || 'فشل تحديث حالة المستخدم');
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      notifications.error('حدث خطأ في تحديث حالة المستخدم', { message: err.message });
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return;
    }

    try {
      setDeleting(true);
      const result = await apiService.deleteUser(id);
      
      if (result?.success || result?.message) {
        notifications.success('تم حذف المستخدم بنجاح');
        navigate('/users');
      } else {
        throw new Error(result?.message || 'فشل حذف المستخدم');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      notifications.error('حدث خطأ في حذف المستخدم', { message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadge = (roleId) => {
    const roleMap = {
      1: { name: 'Admin', color: 'bg-red-100 text-red-800' },
      2: { name: 'Manager', color: 'bg-blue-100 text-blue-800' },
      3: { name: 'Employee', color: 'bg-green-100 text-green-800' },
      6: { name: 'Technician', color: 'bg-purple-100 text-purple-800' }
    };
    return roleMap[roleId] || { name: 'User', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <SimpleCard>
          <SimpleCardContent>
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
              <p className="text-gray-500 mb-4">{error || 'المستخدم غير موجود'}</p>
              {/* NOTE: هذا العرض لا يزال يستخدم صفحة التفاصيل كتحقق ثانٍ قبل إعادة التوجيه في الأماكن الأخرى */}
              <SimpleButton onClick={() => navigate('/users')} variant="outline">
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة لقائمة المستخدمين
              </SimpleButton>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    );
  }

  const roleBadge = getRoleBadge(user.roleId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SimpleButton
            onClick={() => navigate('/users')}
            variant="ghost"
            size="sm"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة
          </SimpleButton>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تفاصيل المستخدم</h1>
            <p className="text-sm text-gray-500">معلومات المستخدم والصلاحيات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SimpleButton
            onClick={() => navigate(`/users/${id}/edit`)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            تعديل
          </SimpleButton>
          <SimpleButton
            onClick={handleDeleteUser}
            variant="outline"
            className="text-red-600 hover:text-red-700 flex items-center gap-2"
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'جاري الحذف...' : 'حذف'}
          </SimpleButton>
        </div>
      </div>

      {/* User Info Card */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>معلومات المستخدم</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Avatar & Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {(user.name?.[0] || user.firstName?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{user.name || `${user.firstName} ${user.lastName}`}</h2>
                  <SimpleBadge className={roleBadge.color}>
                    {role?.name || roleBadge.name}
                  </SimpleBadge>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                {user.isActive ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <UserCheck className="w-4 h-4 ml-1" />
                    نشط
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <UserX className="w-4 h-4 ml-1" />
                    غير نشط
                  </span>
                )}
                <SimpleButton
                  onClick={handleToggleActive}
                  variant="ghost"
                  size="sm"
                  className="text-sm"
                >
                  {user.isActive ? 'تعطيل' : 'تفعيل'}
                </SimpleButton>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-5 h-5" />
                <div>
                  <p className="text-xs text-gray-500">البريد الإلكتروني</p>
                  <p className="text-sm font-medium">{user.email || '-'}</p>
                </div>
              </div>
              
              {user.phone && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5" />
                  <div>
                    <p className="text-xs text-gray-500">رقم الهاتف</p>
                    <p className="text-sm font-medium">{user.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-gray-600">
                <Shield className="w-5 h-5" />
                <div>
                  <p className="text-xs text-gray-500">الدور</p>
                  <p className="text-sm font-medium">{role?.name || roleBadge.name}</p>
                </div>
              </div>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>

      {/* Additional Info */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>معلومات إضافية</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="text-xs text-gray-500">تاريخ الإنشاء</p>
                <p className="text-sm font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="w-5 h-5" />
              <div>
                <p className="text-xs text-gray-500">آخر تحديث</p>
                <p className="text-sm font-medium">
                  {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('ar-EG') : '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <Key className="w-5 h-5" />
              <div>
                <p className="text-xs text-gray-500">معرف المستخدم</p>
                <p className="text-sm font-medium">#{user.id}</p>
              </div>
            </div>
          </div>
        </SimpleCardContent>
      </SimpleCard>
    </div>
  );
};
export default UserDetailsPage;

