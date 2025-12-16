import React, { useState, useEffect } from 'react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import SimpleBadge from '../../components/ui/SimpleBadge';
import { DataTable } from '../../components/ui/DataTable';
import invoiceTemplatesService from '../../services/invoiceTemplatesService';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import { Plus, Edit, Eye, Trash2, Star, Copy } from 'lucide-react';
import DOMPurify from 'dompurify';

const InvoiceTemplatesPage = () => {
  const notifications = useNotifications();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'standard',
    description: '',
    headerHTML: '',
    footerHTML: '',
    stylesCSS: '',
    settings: {
      companyName: 'شركة فيكس زون',
      companyAddress: 'الرياض، المملكة العربية السعودية',
      companyPhone: '+966-11-1234567',
      companyEmail: 'info@fixzone.sa',
      currency: 'جنية',
      footerText: 'جميع الحقوق محفوظة'
    },
    isDefault: false,
    isActive: true
  });
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const templateColumns = [
    {
      accessorKey: "name",
      header: "اسم القالب",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{row.getValue("name")}</span>
          {row.original.isDefault && (
            <SimpleBadge className="bg-yellow-100 text-yellow-800">
              <Star className="w-3 h-3 ml-1" />
              افتراضي
            </SimpleBadge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "النوع",
      cell: ({ row }) => {
        const typeMap = {
          standard: 'أساسي',
          tax: 'ضريبي',
          commercial: 'تجاري',
          service: 'خدمي',
          receipt: 'إيصال'
        };
        return typeMap[row.getValue("type")] || row.getValue("type");
      },
    },
    {
      accessorKey: "isActive",
      header: "الحالة",
      cell: ({ row }) => (
        <SimpleBadge className={row.getValue("isActive") ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
          {row.getValue("isActive") ? 'نشط' : 'غير نشط'}
        </SimpleBadge>
      ),
    },
    {
      id: "actions",
      header: "إجراءات",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <SimpleButton
            variant="outline"
            size="sm"
            onClick={() => handlePreview(row.original)}
          >
            <Eye className="w-4 h-4" />
          </SimpleButton>
          <SimpleButton
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="w-4 h-4" />
          </SimpleButton>
          <SimpleButton
            variant="outline"
            size="sm"
            onClick={() => handleDuplicate(row.original)}
          >
            <Copy className="w-4 h-4" />
          </SimpleButton>
          {!row.original.isDefault && (
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={() => handleSetDefault(row.original.id)}
            >
              <Star className="w-4 h-4" />
            </SimpleButton>
          )}
          {!row.original.isDefault && (
            <SimpleButton
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="w-4 h-4" />
            </SimpleButton>
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await invoiceTemplatesService.listTemplates();
      setTemplates(response.success ? response.data : response);
    } catch (error) {
      setError('تعذر تحميل قوالب الفواتير');
      notifications.error('تعذر تحميل قوالب الفواتير');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: 'standard',
      description: '',
      headerHTML: '',
      footerHTML: '',
      stylesCSS: '',
      settings: {
        companyName: 'شركة فيكس زون',
        companyAddress: 'الرياض، المملكة العربية السعودية',
        companyPhone: '+966-11-1234567',
        companyEmail: 'info@fixzone.sa',
        currency: 'جنية',
        footerText: 'جميع الحقوق محفوظة'
      },
      isDefault: false,
      isActive: true
    });
    setShowModal(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      description: template.description || '',
      headerHTML: template.headerHTML || '',
      footerHTML: template.footerHTML || '',
      stylesCSS: template.stylesCSS || '',
      settings: template.settings || {},
      isDefault: template.isDefault,
      isActive: template.isActive
    });
    setShowModal(true);
  };

  const handleDuplicate = (template) => {
    setEditingTemplate(null);
    setFormData({
      name: `${template.name} - نسخة`,
      type: template.type,
      description: template.description || '',
      headerHTML: template.headerHTML || '',
      footerHTML: template.footerHTML || '',
      stylesCSS: template.stylesCSS || '',
      settings: template.settings || {},
      isDefault: false,
      isActive: true
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingTemplate) {
        await invoiceTemplatesService.updateTemplate(editingTemplate.id, formData);
        notifications.success('تم تحديث القالب بنجاح');
      } else {
        await invoiceTemplatesService.createTemplate(formData);
        notifications.success('تم إنشاء القالب بنجاح');
      }
      setShowModal(false);
      await loadTemplates();
    } catch (error) {
      notifications.error('تعذر حفظ القالب');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القالب؟')) return;
    
    try {
      await invoiceTemplatesService.deleteTemplate(id);
      notifications.success('تم حذف القالب بنجاح');
      await loadTemplates();
    } catch (error) {
      notifications.error('تعذر حذف القالب');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await invoiceTemplatesService.setAsDefault(id);
      notifications.success('تم تعيين القالب كافتراضي');
      await loadTemplates();
    } catch (error) {
      notifications.error('تعذر تعيين القالب كافتراضي');
    }
  };

  const handlePreview = async (template) => {
    try {
      const response = await invoiceTemplatesService.previewTemplate(template.id);
      setPreviewData(response.success ? response.data : response);
      setShowPreview(true);
    } catch (error) {
      notifications.error('تعذر معاينة القالب');
    }
  };

  const handleFormChange = (field, value) => {
    if (field.startsWith('settings.')) {
      const settingKey = field.replace('settings.', '');
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingKey]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل قوالب الفواتير...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">قوالب الفواتير</h1>
          <p className="text-gray-600">إدارة قوالب الفواتير المختلفة</p>
        </div>
        <SimpleButton onClick={handleCreate}>
          <Plus className="w-4 h-4 ml-2" />
          قالب جديد
        </SimpleButton>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Templates Table */}
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>قائمة القوالب</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent>
          <DataTable columns={templateColumns} data={templates} />
        </SimpleCardContent>
      </SimpleCard>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingTemplate ? 'تعديل القالب' : 'إنشاء قالب جديد'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">المعلومات الأساسية</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم القالب</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="اسم القالب"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleFormChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="standard">أساسي</option>
                      <option value="tax">ضريبي</option>
                      <option value="commercial">تجاري</option>
                      <option value="service">خدمي</option>
                      <option value="receipt">إيصال</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="وصف القالب"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => handleFormChange('isDefault', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mr-2 text-sm">قالب افتراضي</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleFormChange('isActive', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mr-2 text-sm">نشط</span>
                    </label>
                  </div>
                </div>

                {/* Company Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">إعدادات الشركة</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة</label>
                    <input
                      type="text"
                      value={formData.settings.companyName || ''}
                      onChange={(e) => handleFormChange('settings.companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الشركة</label>
                    <input
                      type="text"
                      value={formData.settings.companyAddress || ''}
                      onChange={(e) => handleFormChange('settings.companyAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">هاتف الشركة</label>
                    <input
                      type="text"
                      value={formData.settings.companyPhone || ''}
                      onChange={(e) => handleFormChange('settings.companyPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">إيميل الشركة</label>
                    <input
                      type="email"
                      value={formData.settings.companyEmail || ''}
                      onChange={(e) => handleFormChange('settings.companyEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
                    <input
                      type="text"
                      value={formData.settings.currency || ''}
                      onChange={(e) => handleFormChange('settings.currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="جنية"
                    />
                  </div>
                </div>
              </div>

              {/* HTML/CSS Customization */}
              <div className="mt-6 space-y-4">
                <h4 className="font-medium text-gray-900">تخصيص القالب</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HTML الرأس</label>
                    <textarea
                      value={formData.headerHTML}
                      onChange={(e) => handleFormChange('headerHTML', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows="4"
                      placeholder="<div>محتوى الرأس...</div>"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HTML التذييل</label>
                    <textarea
                      value={formData.footerHTML}
                      onChange={(e) => handleFormChange('footerHTML', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows="4"
                      placeholder="<div>محتوى التذييل...</div>"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">أنماط CSS</label>
                  <textarea
                    value={formData.stylesCSS}
                    onChange={(e) => handleFormChange('stylesCSS', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows="6"
                    placeholder=".invoice-container { margin: 0 auto; }"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
                <SimpleButton
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  إلغاء
                </SimpleButton>
                <SimpleButton
                  onClick={handleSave}
                  disabled={saving || !formData.name}
                >
                  {saving ? 'جاري الحفظ...' : editingTemplate ? 'تحديث' : 'إنشاء'}
                </SimpleButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">معاينة القالب</h3>
                <SimpleButton variant="outline" onClick={() => setShowPreview(false)}>
                  إغلاق
                </SimpleButton>
              </div>
              {/* استخدام iframe مع DOMPurify لعزل المحتوى ومنع XSS */}
              <iframe
                title="معاينة القالب"
                className="border rounded-lg w-full min-h-[600px] bg-white"
                sandbox="allow-same-origin allow-scripts"
                srcDoc={DOMPurify.sanitize(previewData.previewHTML, {
                  ALLOWED_TAGS: ['html', 'head', 'body', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'strong', 'em', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'style', 'meta', 'title'],
                  ALLOWED_ATTR: ['class', 'dir', 'lang', 'charset', 'name', 'content', 'style', 'colspan', 'rowspan'],
                  ALLOW_DATA_ATTR: false
                })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceTemplatesPage;
