import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Image as ImageIcon, Link as LinkIcon, RefreshCw, X } from 'lucide-react';
import apiService from '../../services/api';
import SimpleButton from '../ui/SimpleButton';
import { SimpleCard } from '../ui/SimpleCard';
import { useNotifications } from '../notifications/NotificationSystem';
import { Loading } from '../ui/Loading';

const InspectionComponentsList = ({ reportId, onComponentUpdate }) => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    componentType: '',
    status: 'WORKING',
    condition: '',
    notes: '',
    priority: 'MEDIUM',
    estimatedCost: '',
    partsUsedId: null,
    isReplaced: false,
    replacedAt: '',
  });
  const notifications = useNotifications();

  useEffect(() => {
    if (reportId) {
      loadComponents();
    }
  }, [reportId]);

  const loadComponents = async () => {
    if (!reportId) return;
    
    try {
      setLoading(true);
      const response = await apiService.listInspectionComponents(reportId);
      const componentsList = response.success && response.data ? response.data : (Array.isArray(response) ? response : []);
      setComponents(componentsList);
    } catch (error) {
      console.error('Error loading components:', error);
      notifications.error('خطأ', { message: 'تعذر تحميل المكونات' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComponent = async () => {
    if (!formData.name || !formData.status) {
      notifications.error('خطأ', { message: 'الاسم والحالة مطلوبان' });
      return;
    }

    try {
      if (editingComponent) {
        await apiService.updateInspectionComponent(editingComponent.id, {
          ...formData,
          inspectionReportId: reportId,
        });
        notifications.success('تم', { message: 'تم تحديث المكون بنجاح' });
      } else {
        await apiService.addInspectionComponent({
          ...formData,
          inspectionReportId: reportId,
        });
        notifications.success('تم', { message: 'تم إضافة المكون بنجاح' });
      }
      setFormOpen(false);
      setEditingComponent(null);
      setFormData({
        name: '',
        componentType: '',
        status: 'WORKING',
        condition: '',
        notes: '',
        priority: 'MEDIUM',
        estimatedCost: '',
        partsUsedId: null,
        isReplaced: false,
        replacedAt: '',
      });
      loadComponents();
      if (onComponentUpdate) onComponentUpdate();
    } catch (error) {
      console.error('Error saving component:', error);
      notifications.error('خطأ', { message: 'تعذر حفظ المكون' });
    }
  };

  const handleDeleteComponent = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المكون؟')) return;
    try {
      const response = await apiService.request(`/inspectioncomponents/${id}`, {
        method: 'DELETE',
      });
      if (response && response.success !== false) {
        notifications.success('تم', { message: 'تم حذف المكون بنجاح' });
        loadComponents();
        if (onComponentUpdate) onComponentUpdate();
      } else {
        throw new Error(response?.error || 'فشل حذف المكون');
      }
    } catch (error) {
      console.error('Error deleting component:', error);
      notifications.error('خطأ', { message: error.message || 'تعذر حذف المكون' });
    }
  };

  const handleEditComponent = (component) => {
    setEditingComponent(component);
    setFormData({
      name: component.name || '',
      componentType: component.componentType || '',
      status: component.status || 'WORKING',
      condition: component.condition || '',
      notes: component.notes || '',
      priority: component.priority || 'MEDIUM',
      estimatedCost: component.estimatedCost || '',
      partsUsedId: component.partsUsedId || null,
      isReplaced: component.isReplaced || false,
      replacedAt: component.replacedAt ? new Date(component.replacedAt).toISOString().slice(0, 10) : '',
    });
    setFormOpen(true);
  };

  const getStatusIcon = (status) => {
    const normalizedStatus = status?.toUpperCase();
    switch (normalizedStatus) {
      case 'WORKING':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'DEFECTIVE':
      case 'NOT_PRESENT':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'PARTIAL':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Wrench className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status) => {
    const normalizedStatus = status?.toUpperCase();
    const labels = {
      WORKING: 'سليم',
      PARTIAL: 'جزئي',
      DEFECTIVE: 'معطل',
      NOT_PRESENT: 'غير موجود',
    };
    return labels[normalizedStatus] || status || 'غير محدد';
  };

  const getPriorityColor = (priority) => {
    const normalizedPriority = priority?.toUpperCase();
    if (normalizedPriority === 'HIGH') return 'bg-red-100 text-red-800';
    if (normalizedPriority === 'MEDIUM') return 'bg-yellow-100 text-yellow-800';
    if (normalizedPriority === 'LOW') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading && components.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading size="md" text="جاري تحميل المكونات..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground flex items-center">
          <Wrench className="w-5 h-5 ml-2" />
          مكونات الفحص
        </h3>
        <div className="flex items-center gap-2">
          <SimpleButton size="sm" variant="outline" onClick={loadComponents} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </SimpleButton>
          <SimpleButton size="sm" onClick={() => {
            setEditingComponent(null);
            setFormData({
              name: '',
              componentType: '',
              status: 'WORKING',
              condition: '',
              notes: '',
              priority: 'MEDIUM',
              estimatedCost: '',
              partsUsedId: null,
              isReplaced: false,
              replacedAt: '',
            });
            setFormOpen(true);
          }}>
            <Plus className="w-4 h-4 ml-1" /> إضافة مكون
          </SimpleButton>
        </div>
      </div>

      {components.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-muted/30 rounded-lg">
          <Wrench className="w-12 h-12 text-gray-300 dark:text-muted-foreground mx-auto mb-3" />
          <p className="text-gray-600 dark:text-muted-foreground">لا توجد مكونات فحص لهذا التقرير</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {components.map(component => (
            <SimpleCard key={component.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(component.status)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-foreground">{component.name}</h4>
                    {component.componentType && (
                      <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">النوع: {component.componentType}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(component.priority)}`}>
                        أولوية: {component.priority}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-muted-foreground">
                        {getStatusLabel(component.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <SimpleButton size="sm" variant="outline" onClick={() => handleEditComponent(component)}>
                    <Edit className="w-4 h-4" />
                  </SimpleButton>
                  <SimpleButton size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteComponent(component.id)}>
                    <Trash2 className="w-4 h-4" />
                  </SimpleButton>
                </div>
              </div>

              {component.condition && (
                <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2">
                  <span className="font-medium">الحالة:</span> {component.condition}
                </p>
              )}

              {component.notes && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700 dark:text-muted-foreground mb-1">ملاحظات:</p>
                  <p className="text-sm text-gray-800 dark:text-foreground bg-gray-100 dark:bg-muted/50 p-2 rounded-md whitespace-pre-wrap">{component.notes}</p>
                </div>
              )}

              {component.estimatedCost && (
                <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
                  <span className="font-medium">التكلفة المتوقعة:</span> {Number(component.estimatedCost).toFixed(2)} جنيه
                </p>
              )}

              {component.partName && (
                <div className="mt-2 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                  <LinkIcon className="w-4 h-4" />
                  <span>مرتبط بقطعة: {component.partName}</span>
                </div>
              )}

              {component.isReplaced && (
                <div className="mt-2 flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>تم الاستبدال {component.replacedAt ? `في ${new Date(component.replacedAt).toLocaleDateString('ar-SA')}` : ''}</span>
                </div>
              )}
            </SimpleCard>
          ))}
        </div>
      )}

      {/* Modal for create/edit */}
      {formOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-foreground">{editingComponent ? 'تعديل المكون' : 'إضافة مكون جديد'}</h2>
              <button
                onClick={() => {
                  setFormOpen(false);
                  setEditingComponent(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-muted-foreground" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">اسم المكون *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md bg-white dark:bg-background text-gray-900 dark:text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">نوع المكون</label>
                <input
                  type="text"
                  value={formData.componentType}
                  onChange={(e) => setFormData({ ...formData, componentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md bg-white dark:bg-background text-gray-900 dark:text-foreground"
                  placeholder="مثل: screen, battery, keyboard"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">الحالة *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md bg-white dark:bg-background text-gray-900 dark:text-foreground"
                  required
                >
                  <option value="WORKING">سليم</option>
                  <option value="PARTIAL">جزئي</option>
                  <option value="DEFECTIVE">معطل</option>
                  <option value="NOT_PRESENT">غير موجود</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">حالة المكون</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md bg-white dark:bg-background text-gray-900 dark:text-foreground"
                >
                  <option value="">اختر الحالة</option>
                  <option value="excellent">ممتازة</option>
                  <option value="good">جيدة</option>
                  <option value="fair">متوسطة</option>
                  <option value="poor">ضعيفة</option>
                  <option value="critical">حرجة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">الأولوية</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md bg-white dark:bg-background text-gray-900 dark:text-foreground"
                >
                  <option value="HIGH">عالية</option>
                  <option value="MEDIUM">متوسطة</option>
                  <option value="LOW">منخفضة</option>
                  <option value="NONE">لا توجد</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">التكلفة المتوقعة</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md bg-white dark:bg-background text-gray-900 dark:text-foreground"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md bg-white dark:bg-background text-gray-900 dark:text-foreground"
                  rows="4"
                  placeholder="ملاحظات إضافية عن المكون..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isReplaced"
                  checked={formData.isReplaced}
                  onChange={(e) => setFormData({ ...formData, isReplaced: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isReplaced" className="text-sm font-medium text-gray-700 dark:text-foreground">تم استبدال المكون</label>
              </div>

              {formData.isReplaced && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">تاريخ الاستبدال</label>
                  <input
                    type="date"
                    value={formData.replacedAt}
                    onChange={(e) => setFormData({ ...formData, replacedAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-md bg-white dark:bg-background text-gray-900 dark:text-foreground"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <SimpleButton variant="outline" onClick={() => {
                setFormOpen(false);
                setEditingComponent(null);
              }}>
                إلغاء
              </SimpleButton>
              <SimpleButton onClick={handleSaveComponent} disabled={!formData.name || !formData.status}>
                حفظ
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionComponentsList;

