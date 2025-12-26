import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Warehouse, MapPin, Phone, Mail, Package, AlertTriangle } from 'lucide-react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import Breadcrumb from '../../components/layout/Breadcrumb';
import apiService from '../../services/api';
import inventoryService from '../../services/inventoryService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

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
      setWarehouses(warehousesRes?.data || []);
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

      if (res.id) {
        notifications.success('تم إنشاء المخزن بنجاح');
        setShowCreateModal(false);
        resetForm();
        await loadWarehouses();
      } else {
        throw new Error(res.message || 'فشل في إنشاء المخزن');
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

      if (response.message) {
        notifications.success('تم حذف المخزن بنجاح');
        await loadWarehouses();
      } else {
        throw new Error(response.error || 'فشل في حذف المخزن');
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل بيانات المخازن...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
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
              <h1 className="text-3xl font-bold text-foreground">إدارة المخازن</h1>
              <p className="text-muted-foreground mt-2">إضافة وتعديل وحذف المخازن</p>
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
              <Warehouse className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{warehouses.length}</div>
              <div className="text-sm text-muted-foreground">إجمالي المخازن</div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="text-center">
              <Package className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {warehouses.filter(w => w.isActive !== false).length}
              </div>
              <div className="text-sm text-muted-foreground">مخازن نشطة</div>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardContent className="text-center">
              <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {warehouses.filter(w => w.isActive === false).length}
              </div>
              <div className="text-sm text-muted-foreground">مخازن معطلة</div>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* Warehouses List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map(warehouse => (
            <SimpleCard key={warehouse.id} className="hover:shadow-lg transition-shadow">
              <SimpleCardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">{warehouse.name}</h3>
                  <SimpleBadge
                    variant={warehouse.isActive !== false ? 'success' : 'destructive'}
                  >
                    {warehouse.isActive !== false ? 'نشط' : 'معطل'}
                  </SimpleBadge>
                </div>
              </SimpleCardHeader>
              <SimpleCardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 ml-2" />
                    {warehouse.location || 'غير محدد'}
                  </div>

                  {warehouse.address && (
                    <div className="text-sm text-muted-foreground">
                      {warehouse.address}
                    </div>
                  )}

                  {warehouse.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="w-4 h-4 ml-2" />
                      {warehouse.phone}
                    </div>
                  )}

                  {warehouse.email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="w-4 h-4 ml-2" />
                      {warehouse.email}
                    </div>
                  )}

                  {warehouse.manager && (
                    <div className="text-sm text-muted-foreground">
                      المدير: {warehouse.manager}
                    </div>
                  )}

                  {warehouse.capacity && (
                    <div className="text-sm text-muted-foreground">
                      السعة: {warehouse.capacity}
                    </div>
                  )}

                  {warehouse.description && (
                    <div className="text-sm text-muted-foreground">
                      {warehouse.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
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
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWarehouse(warehouse.id)}
                    className="text-destructive hover:bg-destructive/10"
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
            <Warehouse className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">لا توجد مخازن مضافة بعد</p>
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
      <Modal open={showCreateModal} onOpenChange={setShowCreateModal}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>إضافة مخزن جديد</ModalTitle>
            <ModalDescription>أدخل تفاصيل المخزن الجديد</ModalDescription>
          </ModalHeader>

          <form className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">اسم المخزن *</label>
              <Input
                type="text"
                name="name"
                value={warehouseForm.name}
                onChange={handleFormChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">الموقع *</label>
              <Input
                type="text"
                name="location"
                value={warehouseForm.location}
                onChange={handleFormChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">العنوان</label>
              <textarea
                name="address"
                value={warehouseForm.address}
                onChange={handleFormChange}
                rows="2"
                className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">الهاتف</label>
                <Input
                  type="tel"
                  name="phone"
                  value={warehouseForm.phone}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">البريد الإلكتروني</label>
                <Input
                  type="email"
                  name="email"
                  value={warehouseForm.email}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">المدير</label>
                <Input
                  type="text"
                  name="manager"
                  value={warehouseForm.manager}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">السعة</label>
                <Input
                  type="text"
                  name="capacity"
                  value={warehouseForm.capacity}
                  onChange={handleFormChange}
                  placeholder="مثال: 1000 قطعة"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">الوصف</label>
              <textarea
                name="description"
                value={warehouseForm.description}
                onChange={handleFormChange}
                rows="3"
                className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActiveCreate"
                name="isActive"
                checked={warehouseForm.isActive}
                onChange={handleFormChange}
                className="w-4 h-4 text-primary border-border rounded"
              />
              <label htmlFor="isActiveCreate" className="text-sm text-foreground">مخزن نشط</label>
            </div>
          </form>

          <ModalFooter>
            <SimpleButton
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              إلغاء
            </SimpleButton>
            <SimpleButton
              onClick={handleCreateWarehouse}
              disabled={saving}
            >
              {saving ? 'جاري الحفظ...' : 'إنشاء المخزن'}
            </SimpleButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} onOpenChange={setShowEditModal}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>تعديل المخزن</ModalTitle>
            <ModalDescription>تحديث بيانات المخزن المحدد</ModalDescription>
          </ModalHeader>

          <form className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">اسم المخزن *</label>
              <Input
                type="text"
                name="name"
                value={warehouseForm.name}
                onChange={handleFormChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">الموقع *</label>
              <Input
                type="text"
                name="location"
                value={warehouseForm.location}
                onChange={handleFormChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">العنوان</label>
              <textarea
                name="address"
                value={warehouseForm.address}
                onChange={handleFormChange}
                rows="2"
                className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">الهاتف</label>
                <Input
                  type="tel"
                  name="phone"
                  value={warehouseForm.phone}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">البريد الإلكتروني</label>
                <Input
                  type="email"
                  name="email"
                  value={warehouseForm.email}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">المدير</label>
                <Input
                  type="text"
                  name="manager"
                  value={warehouseForm.manager}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">السعة</label>
                <Input
                  type="text"
                  name="capacity"
                  value={warehouseForm.capacity}
                  onChange={handleFormChange}
                  placeholder="مثال: 1000 قطعة"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">الوصف</label>
              <textarea
                name="description"
                value={warehouseForm.description}
                onChange={handleFormChange}
                rows="3"
                className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActiveEdit"
                name="isActive"
                checked={warehouseForm.isActive}
                onChange={handleFormChange}
                className="w-4 h-4 text-primary border-border rounded"
              />
              <label htmlFor="isActiveEdit" className="text-sm text-foreground">مخزن نشط</label>
            </div>
          </form>

          <ModalFooter>
            <SimpleButton
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingWarehouse(null);
                resetForm();
              }}
            >
              إلغاء
            </SimpleButton>
            <SimpleButton
              onClick={handleEditWarehouse}
              disabled={saving}
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </SimpleButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default WarehouseManagementPage;
