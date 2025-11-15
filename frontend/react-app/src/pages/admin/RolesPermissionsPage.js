import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { 
  Modal as DialogRoot, 
  ModalHeader, 
  ModalTitle, 
  ModalDescription, 
  ModalContent, 
  ModalFooter 
} from '../../components/ui/Modal';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  Plus, Edit, Trash2, Save, X, Shield, Eye, EyeOff, Check, Search,
  User, Users, Settings, AlertCircle, Lock
} from 'lucide-react';

// All available permissions grouped by module
const PERMISSIONS_BY_MODULE = {
  repairs: {
    label: 'الإصلاحات',
    permissions: [
      { key: 'repairs.view', label: 'عرض الإصلاحات' },
      { key: 'repairs.view_own', label: 'عرض إصلاحاته' },
      { key: 'repairs.view_all', label: 'عرض جميع الإصلاحات' },
      { key: 'repairs.create', label: 'إنشاء إصلاح' },
      { key: 'repairs.update', label: 'تعديل إصلاح' },
      { key: 'repairs.delete', label: 'حذف إصلاح' },
      { key: 'repairs.track', label: 'تتبع الإصلاح' }
    ]
  },
  invoices: {
    label: 'الفواتير',
    permissions: [
      { key: 'invoices.view', label: 'عرض الفواتير' },
      { key: 'invoices.view_own', label: 'عرض فواتيره' },
      { key: 'invoices.view_all', label: 'عرض جميع الفواتير' },
      { key: 'invoices.create', label: 'إنشاء فاتورة' },
      { key: 'invoices.update', label: 'تعديل فاتورة' },
      { key: 'invoices.delete', label: 'حذف فاتورة' },
      { key: 'invoices.print', label: 'طباعة فاتورة' }
    ]
  },
  customers: {
    label: 'العملاء',
    permissions: [
      { key: 'customers.view', label: 'عرض العملاء' },
      { key: 'customers.view_all', label: 'عرض جميع العملاء' },
      { key: 'customers.create', label: 'إنشاء عميل' },
      { key: 'customers.update', label: 'تعديل عميل' },
      { key: 'customers.delete', label: 'حذف عميل' }
    ]
  },
  users: {
    label: 'المستخدمين',
    permissions: [
      { key: 'users.view', label: 'عرض المستخدمين' },
      { key: 'users.create', label: 'إنشاء مستخدم' },
      { key: 'users.update', label: 'تعديل مستخدم' },
      { key: 'users.delete', label: 'حذف مستخدم' }
    ]
  },
  roles: {
    label: 'الأدوار',
    permissions: [
      { key: 'roles.view', label: 'عرض الأدوار' },
      { key: 'roles.create', label: 'إنشاء دور' },
      { key: 'roles.update', label: 'تعديل دور' },
      { key: 'roles.delete', label: 'حذف دور' }
    ]
  },
  inventory: {
    label: 'المخزون',
    permissions: [
      { key: 'inventory.view', label: 'عرض المخزون' },
      { key: 'inventory.create', label: 'إضافة صنف' },
      { key: 'inventory.update', label: 'تعديل صنف' },
      { key: 'inventory.delete', label: 'حذف صنف' }
    ]
  },
  devices: {
    label: 'الأجهزة',
    permissions: [
      { key: 'devices.view', label: 'عرض الأجهزة' },
      { key: 'devices.view_own', label: 'عرض أجهزته' },
      { key: 'devices.create', label: 'إضافة جهاز' },
      { key: 'devices.update', label: 'تعديل جهاز' },
      { key: 'devices.delete', label: 'حذف جهاز' }
    ]
  },
  payments: {
    label: 'المدفوعات',
    permissions: [
      { key: 'payments.view', label: 'عرض المدفوعات' },
      { key: 'payments.view_own', label: 'عرض مدفوعاته' },
      { key: 'payments.create', label: 'إضافة دفعة' },
      { key: 'payments.update', label: 'تعديل دفعة' }
    ]
  },
  reports: {
    label: 'التقارير',
    permissions: [
      { key: 'reports.view', label: 'عرض التقارير' },
      { key: 'reports.export', label: 'تصدير التقارير' }
    ]
  },
  companies: {
    label: 'الشركات',
    permissions: [
      { key: 'companies.view', label: 'عرض الشركات' },
      { key: 'companies.create', label: 'إضافة شركة' },
      { key: 'companies.update', label: 'تعديل شركة' },
      { key: 'companies.delete', label: 'حذف شركة' }
    ]
  },
  settings: {
    label: 'الإعدادات',
    permissions: [
      { key: 'settings.view', label: 'عرض الإعدادات' },
      { key: 'settings.update', label: 'تعديل الإعدادات' }
    ]
  }
};

export default function RolesPermissionsPage() {
  const notifications = useNotifications();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {},
    parentRoleId: null,
    isActive: true
  });
  const [formLoading, setFormLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.listRoles();
      const rolesData = res.success ? res.data : res;
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      
      // Set available roles for parent selection (exclude the current role when editing)
      setAvailableRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (e) {
      console.error('Error loading roles:', e);
      setError('تعذر تحميل الأدوار');
      notifications.error('خطأ', { message: 'فشل تحميل الأدوار' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      permissions: {},
      parentRoleId: null,
      isActive: true
    });
    setSelectedRole(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (role) => {
    setFormData({
      name: role.name || '',
      description: role.description || '',
      permissions: role.permissions || {},
      parentRoleId: role.parentRoleId || null,
      isActive: role.isActive !== false
    });
    setSelectedRole(role);
    setIsEditModalOpen(true);
  };

  const handleDelete = (role) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };

  const handleManagePermissions = (role) => {
    setFormData({
      ...formData,
      permissions: role.permissions || {}
    });
    setSelectedRole(role);
    setIsPermissionsModalOpen(true);
  };

  const handleSaveRole = async () => {
    try {
      setFormLoading(true);
      
      if (!formData.name.trim()) {
        notifications.error('خطأ', { message: 'اسم الدور مطلوب' });
        return;
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        permissions: formData.permissions,
        parentRoleId: formData.parentRoleId || null,
        isActive: formData.isActive
      };

      let result;
      if (selectedRole && isEditModalOpen) {
        result = await api.updateRole(selectedRole.id, payload);
      } else {
        result = await api.createRole(payload);
      }

      if (result.success) {
        notifications.success('نجاح', { 
          message: selectedRole ? 'تم تحديث الدور بنجاح' : 'تم إنشاء الدور بنجاح' 
        });
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setIsPermissionsModalOpen(false);
        setSelectedRole(null);
        loadRoles();
      } else {
        throw new Error(result.message || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      notifications.error('خطأ', { 
        message: error.message || 'فشل حفظ الدور' 
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    try {
      setFormLoading(true);
      const result = await api.deleteRole(selectedRole.id);
      
      if (result.success) {
        notifications.success('نجاح', { message: 'تم حذف الدور بنجاح' });
        setIsDeleteModalOpen(false);
        setSelectedRole(null);
        loadRoles();
      } else {
        throw new Error(result.message || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      notifications.error('خطأ', { 
        message: error.message || 'فشل حذف الدور' 
      });
    } finally {
      setFormLoading(false);
    }
  };

  const togglePermission = (permissionKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionKey]: !prev.permissions[permissionKey]
      }
    }));
  };

  const toggleAllPermissions = (module) => {
    const modulePermissions = PERMISSIONS_BY_MODULE[module].permissions.map(p => p.key);
    const allEnabled = modulePermissions.every(key => formData.permissions[key]);
    
    setFormData(prev => {
      const newPermissions = { ...prev.permissions };
      modulePermissions.forEach(key => {
        newPermissions[key] = !allEnabled;
      });
      return { ...prev, permissions: newPermissions };
    });
  };

  const filteredRoles = roles.filter(role => 
    !searchQuery || 
    role.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الأدوار والصلاحيات</h1>
          <p className="text-sm text-gray-600 mt-1">
            إدارة أدوار المستخدمين وصلاحياتهم في النظام
          </p>
        </div>
        <SimpleButton onClick={handleCreate} variant="default">
          <Plus className="w-4 h-4 mr-2" />
          إضافة دور جديد
        </SimpleButton>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="البحث عن دور..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map((role) => (
          <SimpleCard key={role.id} className="hover:shadow-md transition-shadow">
            <SimpleCardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <SimpleCardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    {role.name}
                  </SimpleCardTitle>
                  {role.description && (
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {role.isSystem && (
                    <SimpleBadge variant="default" className="text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      نظامي
                    </SimpleBadge>
                  )}
                  {!role.isActive && (
                    <SimpleBadge variant="destructive" className="text-xs">معطل</SimpleBadge>
                  )}
                </div>
              </div>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">الصلاحيات:</span>
                  <span className="font-medium">
                    {Object.values(role.permissions || {}).filter(Boolean).length}
                  </span>
                </div>
                
                {role.parentRoleId && (
                  <div className="text-sm text-gray-600">
                    الدور الأساسي: {availableRoles.find(r => r.id === role.parentRoleId)?.name || role.parentRoleId}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <SimpleButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleManagePermissions(role)}
                    className="flex-1"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    الصلاحيات
                  </SimpleButton>
                  {!role.isSystem && (
                    <>
                      <SimpleButton
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(role)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        تعديل
                      </SimpleButton>
                      <SimpleButton
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(role)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </SimpleButton>
                    </>
                  )}
                </div>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        ))}
      </div>

      {filteredRoles.length === 0 && !loading && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">لا توجد أدوار</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <DialogRoot 
        open={isCreateModalOpen || isEditModalOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedRole(null);
          }
        }}
      >
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>
              {selectedRole ? 'تعديل الدور' : 'إضافة دور جديد'}
            </ModalTitle>
            <ModalDescription>
              {selectedRole ? 'قم بتعديل بيانات الدور' : 'أدخل بيانات الدور الجديد'}
            </ModalDescription>
          </ModalHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">اسم الدور *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: فني"
                disabled={selectedRole?.isSystem}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">الوصف</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف الدور..."
                rows="3"
                className="min-h-[80px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">الدور الأساسي (اختياري)</label>
              <select
                value={formData.parentRoleId || ''}
                onChange={(e) => setFormData({ ...formData, parentRoleId: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={selectedRole?.isSystem}
              >
                <option value="">لا يوجد</option>
                {availableRoles
                  .filter(r => !selectedRole || r.id !== selectedRole.id)
                  .map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                disabled={selectedRole?.isSystem}
              />
              <label htmlFor="isActive" className="mr-2 text-sm font-medium">
                نشط
              </label>
            </div>
          </div>
          <ModalFooter>
            <SimpleButton
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              إلغاء
            </SimpleButton>
            <SimpleButton
              onClick={handleSaveRole}
              loading={formLoading}
              disabled={selectedRole?.isSystem}
            >
              <Save className="w-4 h-4 mr-2" />
              حفظ
            </SimpleButton>
          </ModalFooter>
        </ModalContent>
      </DialogRoot>

      {/* Permissions Modal */}
      <DialogRoot 
        open={isPermissionsModalOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsPermissionsModalOpen(false);
            setSelectedRole(null);
          }
        }}
      >
        <ModalContent size="5xl" className="max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>إدارة صلاحيات: {selectedRole?.name}</ModalTitle>
            <ModalDescription>
              اختر الصلاحيات المتاحة لهذا الدور
            </ModalDescription>
          </ModalHeader>
          <div className="space-y-6 py-4">
            {Object.entries(PERMISSIONS_BY_MODULE).map(([moduleKey, moduleData]) => (
              <div key={moduleKey} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-lg">{moduleData.label}</h4>
                  <SimpleButton
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAllPermissions(moduleKey)}
                  >
                    {moduleData.permissions.every(p => formData.permissions[p.key]) 
                      ? 'إلغاء الكل' 
                      : 'تحديد الكل'}
                  </SimpleButton>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  {moduleData.permissions.map((permission) => (
                    <label
                      key={permission.key}
                      className="flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions[permission.key] || false}
                        onChange={() => togglePermission(permission.key)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="mr-2 text-sm">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <ModalFooter>
            <SimpleButton
              variant="outline"
              onClick={() => setIsPermissionsModalOpen(false)}
            >
              إلغاء
            </SimpleButton>
            <SimpleButton onClick={handleSaveRole} loading={formLoading}>
              <Save className="w-4 h-4 mr-2" />
              حفظ الصلاحيات
            </SimpleButton>
          </ModalFooter>
        </ModalContent>
      </DialogRoot>

      {/* Delete Confirmation Modal */}
      <DialogRoot 
        open={isDeleteModalOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteModalOpen(false);
            setSelectedRole(null);
          }
        }}
      >
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>تأكيد الحذف</ModalTitle>
            <ModalDescription>
              هل أنت متأكد من حذف الدور "{selectedRole?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <SimpleButton
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedRole(null);
              }}
            >
              إلغاء
            </SimpleButton>
            <SimpleButton
              variant="destructive"
              onClick={handleDeleteRole}
              loading={formLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              حذف
            </SimpleButton>
          </ModalFooter>
        </ModalContent>
      </DialogRoot>
    </div>
  );
}
