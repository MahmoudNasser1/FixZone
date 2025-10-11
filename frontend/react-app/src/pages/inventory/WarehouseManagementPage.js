import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Warehouse, 
  MapPin, 
  Phone, 
  Mail,
  Package,
  AlertTriangle
} from 'lucide-react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import Breadcrumb from '../../components/layout/Breadcrumb';
import apiService from '../../services/api';
import inventoryService from '../../services/inventoryService';
import { useNotifications } from '../../components/notifications/NotificationSystem';

const WarehouseManagementPage = () => {
  const notifications = useNotifications();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    capacity: '',
    description: '',
    isActive: true
  });

  // Load warehouses
  const loadWarehouses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const warehousesRes = await inventoryService.listWarehouses();
      setWarehouses(Array.isArray(warehousesRes) ? warehousesRes : []);
    } catch (err) {
      setError('تعذر تحميل بيانات المخازن');
      console.error('Error loading warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWarehouseForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle create warehouse
  const handleCreateWarehouse = async () => {
    if (!warehouseForm.name || !warehouseForm.location) {
      notifications.error('اسم المخزن والموقع مطلوبان');
      return;
    }

    try {
      setSaving(true);
      const res = await apiService.request('/warehouses', {
        method: 'POST',
        body: JSON.stringify(warehouseForm)
      });

      if (res.ok) {
        notifications.success('تم إنشاء المخزن بنجاح');
        setShowCreateModal(false);
        resetForm();
        await loadWarehouses();
      } else {
        throw new Error('فشل في إنشاء المخزن');
      }
    } catch (err) {
      notifications.error(err.message || 'فشل في إنشاء المخزن');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit warehouse
  const handleEditWarehouse = async () => {
    if (!warehouseForm.name || !warehouseForm.location) {
      notifications.error('اسم المخزن والموقع مطلوبان');
      return;
    }

    try {
      setSaving(true);
      const res = await apiService.request(`/warehouses/${editingWarehouse.id}`, {
        method: 'PUT',
        body: JSON.stringify(warehouseForm)
      });

      if (res.ok) {
        notifications.success('تم تحديث المخزن بنجاح');
        setShowEditModal(false);
        setEditingWarehouse(null);
        resetForm();
        await loadWarehouses();
      } else {
        throw new Error('فشل في تحديث المخزن');
      }
    } catch (err) {
      notifications.error(err.message || 'فشل في تحديث المخزن');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete warehouse
  const handleDeleteWarehouse = async (warehouseId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المخزن؟')) return;

    try {
      const response = await apiService.request(`/warehouses/${warehouseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        notifications.success('تم حذف المخزن بنجاح');
        await loadWarehouses();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل في حذف المخزن');
      }
    } catch (err) {
      console.error('Error deleting warehouse:', err);
      notifications.error(err.message || 'فشل في حذف المخزن');
    }
  };

  // Start editing
  const startEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setWarehouseForm({
      name: warehouse.name || '',
      location: warehouse.location || '',
      address: warehouse.address || '',
      phone: warehouse.phone || '',
      email: warehouse.email || '',
      manager: warehouse.manager || '',
      capacity: warehouse.capacity || '',
      description: warehouse.description || '',
      isActive: warehouse.isActive !== false
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setWarehouseForm({
      name: '',
      location: '',
      address: '',
      phone: '',
      email: '',
      manager: '',
      capacity: '',
      description: '',
      isActive: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات المخازن...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb 
            items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'إدارة المخزون', href: '/inventory' },
              { label: 'إدارة المخازن', href: '/inventory/warehouses', active: true }
            ]} 
          />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">إدارة المخازن</h1>
              <p className="text-gray-600 mt-2">إضافة وتعديل وحذف المخازن</p>
            </div>
            <SimpleButton onClick={() => setShowCreateModal(true)} size="lg">
              <Plus className="w-5 h-5 ml-2" />
              إضافة مخزن جديد
            </SimpleButton>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SimpleCard>
            <SimpleCardContent className="text-center">
              <Warehouse className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{warehouses.length}</div>
              <div className="text-sm text-gray-600">إجمالي المخازن</div>
            </SimpleCardContent>
          </SimpleCard>
          
          <SimpleCard>
            <SimpleCardContent className="text-center">
              <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {warehouses.filter(w => w.isActive !== false).length}
              </div>
              <div className="text-sm text-gray-600">مخازن نشطة</div>
            </SimpleCardContent>
          </SimpleCard>
          
          <SimpleCard>
            <SimpleCardContent className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {warehouses.filter(w => w.isActive === false).length}
              </div>
              <div className="text-sm text-gray-600">مخازن معطلة</div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Warehouses List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map(warehouse => (
            <SimpleCard key={warehouse.id} className="hover:shadow-lg transition-shadow">
              <SimpleCardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{warehouse.name}</h3>
                  <SimpleBadge 
                    className={warehouse.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                  >
                    {warehouse.isActive !== false ? 'نشط' : 'معطل'}
                  </SimpleBadge>
                </div>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 ml-2" />
                    {warehouse.location || 'غير محدد'}
                  </div>
                  
                  {warehouse.address && (
                    <div className="text-sm text-gray-600">
                      {warehouse.address}
                    </div>
                  )}
                  
                  {warehouse.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 ml-2" />
                      {warehouse.phone}
                    </div>
                  )}
                  
                  {warehouse.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 ml-2" />
                      {warehouse.email}
                    </div>
                  )}
                  
                  {warehouse.manager && (
                    <div className="text-sm text-gray-600">
                      المدير: {warehouse.manager}
                    </div>
                  )}
                  
                  {warehouse.capacity && (
                    <div className="text-sm text-gray-600">
                      السعة: {warehouse.capacity}
                    </div>
                  )}
                  
                  {warehouse.description && (
                    <div className="text-sm text-gray-600">
                      {warehouse.description}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  <SimpleButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => startEdit(warehouse)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    تعديل
                  </SimpleButton>
                  <SimpleButton 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteWarehouse(warehouse.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </SimpleButton>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          ))}
        </div>

        {warehouses.length === 0 && (
          <div className="text-center py-12">
            <Warehouse className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">لا توجد مخازن مضافة بعد</p>
            <SimpleButton 
              onClick={() => setShowCreateModal(true)}
              className="mt-4"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة أول مخزن
            </SimpleButton>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">إضافة مخزن جديد</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المخزن *</label>
                <input
                  type="text"
                  name="name"
                  value={warehouseForm.name}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموقع *</label>
                <input
                  type="text"
                  name="location"
                  value={warehouseForm.location}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <textarea
                  name="address"
                  value={warehouseForm.address}
                  onChange={handleFormChange}
                  rows="2"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                  <input
                    type="tel"
                    name="phone"
                    value={warehouseForm.phone}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    name="email"
                    value={warehouseForm.email}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدير</label>
                  <input
                    type="text"
                    name="manager"
                    value={warehouseForm.manager}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعة</label>
                  <input
                    type="text"
                    name="capacity"
                    value={warehouseForm.capacity}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="مثال: 1000 قطعة"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  name="description"
                  value={warehouseForm.description}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={warehouseForm.isActive}
                  onChange={handleFormChange}
                  className="ml-2"
                />
                <label className="text-sm text-gray-700">مخزن نشط</label>
              </div>
            </form>
            
            <div className="flex items-center gap-3 mt-6">
              <SimpleButton 
                onClick={handleCreateWarehouse}
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'جاري الحفظ...' : 'إنشاء المخزن'}
              </SimpleButton>
              <SimpleButton 
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1"
              >
                إلغاء
              </SimpleButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">تعديل المخزن</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المخزن *</label>
                <input
                  type="text"
                  name="name"
                  value={warehouseForm.name}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموقع *</label>
                <input
                  type="text"
                  name="location"
                  value={warehouseForm.location}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <textarea
                  name="address"
                  value={warehouseForm.address}
                  onChange={handleFormChange}
                  rows="2"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                  <input
                    type="tel"
                    name="phone"
                    value={warehouseForm.phone}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    name="email"
                    value={warehouseForm.email}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدير</label>
                  <input
                    type="text"
                    name="manager"
                    value={warehouseForm.manager}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعة</label>
                  <input
                    type="text"
                    name="capacity"
                    value={warehouseForm.capacity}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="مثال: 1000 قطعة"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  name="description"
                  value={warehouseForm.description}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={warehouseForm.isActive}
                  onChange={handleFormChange}
                  className="ml-2"
                />
                <label className="text-sm text-gray-700">مخزن نشط</label>
              </div>
            </form>
            
            <div className="flex items-center gap-3 mt-6">
              <SimpleButton 
                onClick={handleEditWarehouse}
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </SimpleButton>
              <SimpleButton 
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingWarehouse(null);
                  resetForm();
                }}
                className="flex-1"
              >
                إلغاء
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseManagementPage;
