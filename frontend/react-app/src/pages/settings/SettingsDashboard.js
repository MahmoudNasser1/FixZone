// frontend/react-app/src/pages/settings/SettingsDashboard.js
import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import api from '../../services/api';
import { useNotifications } from '../../components/notifications/NotificationSystem';
import {
  SettingsCategoryTabs,
  SettingsHistory,
  SettingsImportExport,
  SettingsHelp
} from '../../components/settings';
import { UnifiedBackup } from '../../components/settings/UnifiedBackup';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../../components/ui/SimpleCard';
import SimpleButton from '../../components/ui/SimpleButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Save } from 'lucide-react';

// Import new components
import ReceiptPrintSettingsPage from './ReceiptPrintSettingsPage';
import InvoicePrintSettingsPage from './InvoicePrintSettingsPage';
import MessagingSettingsPage from './MessagingSettingsPage';
import SystemVariablesPage from './SystemVariablesPage';

// Settings categories
const CATEGORIES = [
  { key: 'general', label: 'عام', icon: '⚙️' },
  { key: 'currency', label: 'العملة', icon: '💰' },
  { key: 'printing', label: 'الطباعة', icon: '🖨️' },
  { key: 'receiptPrint', label: 'إيصال الاستلام', icon: '📄' },
  { key: 'invoicePrint', label: 'إعدادات طباعة الفواتير', icon: '🧾' },
  { key: 'messaging', label: 'إعدادات المراسلة', icon: '💬' },
  { key: 'locale', label: 'المحلية واللغة', icon: '🌐' },
  { key: 'systemSettings', label: 'إعدادات النظام العامة', icon: '🖥️' },
  { key: 'variables', label: 'متغيرات النظام', icon: '📋' },
];

/**
 * Settings Dashboard - Main settings management page
 * Unified interface for all system settings with modular components
 */
export default function SettingsDashboard() {
  const { settings: contextSettings, setSettings: setContextSettings } = useSettings();
  const notifications = useNotifications();

  const [activeCategory, setActiveCategory] = useState('general');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('settings');

  // System settings state (for systemSettings tab)
  const [sysItems, setSysItems] = useState([]);
  const [sysLoading, setSysLoading] = useState(false);
  const [sysError, setSysError] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [sysForm, setSysForm] = useState({ key: '', value: '', description: '' });

  // Form state for different categories
  const [form, setForm] = useState(() => ({
    // Company / Branding
    name: contextSettings.company?.name || '',
    address: contextSettings.company?.address || '',
    phone: contextSettings.company?.phone || '',
    website: contextSettings.company?.website || '',
    logoUrl: contextSettings.company?.logoUrl || '/Fav.png',
    // Currency
    currencyCode: contextSettings.currency?.code || 'EGP',
    currencySymbol: contextSettings.currency?.symbol || 'ج.م',
    currencyName: contextSettings.currency?.name || 'الجنيه المصري',
    currencyLocale: contextSettings.currency?.locale || 'ar-EG',
    minimumFractionDigits: contextSettings.currency?.minimumFractionDigits ?? 2,
    // Printing
    defaultCopy: contextSettings.printing?.defaultCopy || 'customer',
    showWatermark: !!contextSettings.printing?.showWatermark,
    paperSize: contextSettings.printing?.paperSize || 'A4',
    showSerialBarcode: !!contextSettings.printing?.showSerialBarcode,
    // Locale
    rtl: !!contextSettings.locale?.rtl,
    dateFormat: contextSettings.locale?.dateFormat || 'yyyy/MM/dd',
    // Receipt
    receiptTerms: contextSettings.receipt?.terms || '',
  }));

  // Load system settings when systemSettings tab is active
  useEffect(() => {
    if (activeCategory !== 'systemSettings') return;

    let mounted = true;
    const loadSys = async () => {
      try {
        setSysLoading(true);
        setSysError('');
        const list = await api.listSystemSettings();
        if (!mounted) return;

        // Handle different response formats
        let items = [];
        if (list && list.success && list.data) {
          items = Array.isArray(list.data) ? list.data : [];
        } else if (Array.isArray(list)) {
          items = list;
        } else if (list && list.data && Array.isArray(list.data)) {
          items = list.data;
        }

        setSysItems(items);
      } catch (e) {
        if (!mounted) return;
        const errorMsg = e.message || 'تعذر تحميل إعدادات النظام';
        setSysError(errorMsg);
        notifications.error('خطأ في التحميل', { message: errorMsg });
      } finally {
        if (mounted) setSysLoading(false);
      }
    };
    loadSys();
    return () => { mounted = false; };
  }, [activeCategory, notifications]);

  // Load settings from API on mount
  useEffect(() => {
    const loadSettingsFromAPI = async () => {
      try {
        setLoading(true);
        
        // Load company settings
        if (activeCategory === 'general') {
          const companyRes = await api.getCompanySettings();
          if (companyRes.success && companyRes.data) {
            setForm(prev => ({
              ...prev,
              name: companyRes.data.name || prev.name,
              address: companyRes.data.address || prev.address,
              phone: companyRes.data.phone || prev.phone,
              website: companyRes.data.website || prev.website,
              logoUrl: companyRes.data.logoUrl || prev.logoUrl,
            }));
          }
        }
        
        // Load currency settings
        if (activeCategory === 'currency') {
          const currencyRes = await api.getCurrencySettings();
          if (currencyRes.success && currencyRes.data) {
            setForm(prev => ({
              ...prev,
              currencyCode: currencyRes.data.code || prev.currencyCode,
              currencySymbol: currencyRes.data.symbol || prev.currencySymbol,
              currencyName: currencyRes.data.name || prev.currencyName,
              currencyLocale: currencyRes.data.locale || prev.currencyLocale,
              minimumFractionDigits: currencyRes.data.minimumFractionDigits ?? prev.minimumFractionDigits,
            }));
          }
        }
        
        // Load printing settings
        if (activeCategory === 'printing') {
          const printingRes = await api.getPrintingSettings();
          if (printingRes.success && printingRes.data) {
            setForm(prev => ({
              ...prev,
              defaultCopy: printingRes.data.defaultCopy || prev.defaultCopy,
              showWatermark: printingRes.data.showWatermark !== undefined ? printingRes.data.showWatermark : prev.showWatermark,
              paperSize: printingRes.data.paperSize || prev.paperSize,
              showSerialBarcode: printingRes.data.showSerialBarcode !== undefined ? printingRes.data.showSerialBarcode : prev.showSerialBarcode,
            }));
          }
        }
        
        // Load locale settings
        if (activeCategory === 'locale') {
          const localeRes = await api.getLocaleSettings();
          if (localeRes.success && localeRes.data) {
            setForm(prev => ({
              ...prev,
              rtl: localeRes.data.rtl !== undefined ? localeRes.data.rtl : prev.rtl,
              dateFormat: localeRes.data.dateFormat || prev.dateFormat,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load settings from API:', err);
        // Fallback to context settings
        setForm({
          name: contextSettings.company?.name || '',
          address: contextSettings.company?.address || '',
          phone: contextSettings.company?.phone || '',
          website: contextSettings.company?.website || '',
          logoUrl: contextSettings.company?.logoUrl || '/Fav.png',
          currencyCode: contextSettings.currency?.code || 'EGP',
          currencySymbol: contextSettings.currency?.symbol || 'ج.م',
          currencyName: contextSettings.currency?.name || 'الجنيه المصري',
          currencyLocale: contextSettings.currency?.locale || 'ar-EG',
          minimumFractionDigits: contextSettings.currency?.minimumFractionDigits ?? 2,
          defaultCopy: contextSettings.printing?.defaultCopy || 'customer',
          showWatermark: !!contextSettings.printing?.showWatermark,
          paperSize: contextSettings.printing?.paperSize || 'A4',
          showSerialBarcode: !!contextSettings.printing?.showSerialBarcode,
          rtl: !!contextSettings.locale?.rtl,
          dateFormat: contextSettings.locale?.dateFormat || 'yyyy/MM/dd',
          receiptTerms: contextSettings.receipt?.terms || '',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadSettingsFromAPI();
  }, [activeCategory]); // Reload when category changes

  // Update form when context settings change (fallback)
  useEffect(() => {
    if (!loading) {
      setForm(prev => ({
        ...prev,
        name: contextSettings.company?.name || prev.name,
        address: contextSettings.company?.address || prev.address,
        phone: contextSettings.company?.phone || prev.phone,
        website: contextSettings.company?.website || prev.website,
        logoUrl: contextSettings.company?.logoUrl || prev.logoUrl,
        currencyCode: contextSettings.currency?.code || prev.currencyCode,
        currencySymbol: contextSettings.currency?.symbol || prev.currencySymbol,
        currencyName: contextSettings.currency?.name || prev.currencyName,
        currencyLocale: contextSettings.currency?.locale || prev.currencyLocale,
        minimumFractionDigits: contextSettings.currency?.minimumFractionDigits ?? prev.minimumFractionDigits,
        defaultCopy: contextSettings.printing?.defaultCopy || prev.defaultCopy,
        showWatermark: !!contextSettings.printing?.showWatermark,
        paperSize: contextSettings.printing?.paperSize || prev.paperSize,
        showSerialBarcode: !!contextSettings.printing?.showSerialBarcode,
        rtl: !!contextSettings.locale?.rtl,
        dateFormat: contextSettings.locale?.dateFormat || prev.dateFormat,
        receiptTerms: contextSettings.receipt?.terms || prev.receiptTerms,
      }));
    }
  }, [contextSettings, loading]);

  // Handle form changes
  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Save settings based on category
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      let updatedSettings = { ...contextSettings };
      let apiResponse = null;

      switch (activeCategory) {
        case 'general':
          // Validate company settings
          if (!form.name || form.name.trim().length === 0) {
            setError('اسم الشركة مطلوب');
            notifications.warning('تحذير', { message: 'اسم الشركة مطلوب' });
            return;
          }

          // Validate phone if provided
          if (form.phone && form.phone.trim()) {
            const phoneRegex = /^(\+20|0)?1[0-9]{9}$/;
            if (!phoneRegex.test(form.phone.replace(/[\s-]/g, ''))) {
              setError('رقم الهاتف غير صحيح (يجب أن يكون رقم مصري صحيح)');
              notifications.warning('تحذير', { message: 'رقم الهاتف غير صحيح' });
              return;
            }
          }

          // Validate website if provided
          if (form.website && form.website.trim() && !/^https?:\/\/.+/.test(form.website.trim())) {
            setError('رابط الموقع الإلكتروني غير صحيح (يجب أن يبدأ بـ http:// أو https://)');
            notifications.warning('تحذير', { message: 'رابط الموقع الإلكتروني غير صحيح' });
            return;
          }

          // Save to API
          apiResponse = await api.updateCompanySettings({
            name: form.name.trim(),
            address: form.address || '',
            phone: form.phone || '',
            website: form.website || '',
            logoUrl: form.logoUrl || '/Fav.png',
          });

          // Update local context
          updatedSettings.company = {
            ...updatedSettings.company,
            name: form.name,
            address: form.address,
            phone: form.phone,
            website: form.website,
            logoUrl: form.logoUrl,
          };
          break;

        case 'currency':
          // Validate currency settings
          if (!form.currencyCode || form.currencyCode.length !== 3) {
            setError('رمز العملة يجب أن يكون 3 أحرف (ISO 4217)');
            notifications.warning('تحذير', { message: 'رمز العملة يجب أن يكون 3 أحرف' });
            return;
          }

          if (!form.currencySymbol || form.currencySymbol.trim().length === 0) {
            setError('رمز العملة مطلوب');
            notifications.warning('تحذير', { message: 'رمز العملة مطلوب' });
            return;
          }

          if (form.currencyLocale && !/^[a-z]{2}-[A-Z]{2}$/.test(form.currencyLocale)) {
            setError('تنسيق اللغة غير صحيح (يجب أن يكون xx-XX)');
            notifications.warning('تحذير', { message: 'تنسيق اللغة غير صحيح' });
            return;
          }

          if (form.minimumFractionDigits < 0 || form.minimumFractionDigits > 10) {
            setError('عدد الأرقام العشرية يجب أن يكون بين 0 و 10');
            notifications.warning('تحذير', { message: 'عدد الأرقام العشرية غير صحيح' });
            return;
          }

          // Save to API
          apiResponse = await api.updateCurrencySettings({
            code: form.currencyCode.toUpperCase(),
            symbol: form.currencySymbol.trim(),
            name: form.currencyName || '',
            locale: form.currencyLocale || 'ar-EG',
            minimumFractionDigits: form.minimumFractionDigits,
            position: 'after', // Default position
          });

          // Update local context
          updatedSettings.currency = {
            ...updatedSettings.currency,
            code: form.currencyCode,
            symbol: form.currencySymbol,
            name: form.currencyName,
            locale: form.currencyLocale,
            minimumFractionDigits: form.minimumFractionDigits,
          };
          break;

        case 'printing':
          // Validate printing settings
          if (form.paperSize && !['A4', 'A5', 'Letter', 'Legal'].includes(form.paperSize)) {
            setError('حجم الورق غير صحيح');
            notifications.warning('تحذير', { message: 'حجم الورق غير صحيح' });
            return;
          }

          // Save to API
          apiResponse = await api.updatePrintingSettings({
            defaultCopy: form.defaultCopy,
            showWatermark: form.showWatermark,
            paperSize: form.paperSize,
            showSerialBarcode: form.showSerialBarcode,
          });

          // Update local context
          updatedSettings.printing = {
            ...updatedSettings.printing,
            defaultCopy: form.defaultCopy,
            showWatermark: form.showWatermark,
            paperSize: form.paperSize,
            showSerialBarcode: form.showSerialBarcode,
          };
          break;

        case 'locale':
          // Validate date format
          if (form.dateFormat && !/^[yMdHhms\/\-\s]+$/.test(form.dateFormat)) {
            setError('تنسيق التاريخ غير صحيح');
            notifications.warning('تحذير', { message: 'تنسيق التاريخ غير صحيح' });
            return;
          }

          // Save to API
          apiResponse = await api.updateLocaleSettings({
            rtl: form.rtl,
            dateFormat: form.dateFormat,
          });

          // Update local context
          updatedSettings.locale = {
            ...updatedSettings.locale,
            rtl: form.rtl,
            dateFormat: form.dateFormat,
          };
          break;

        default:
          break;
      }

      // Save to context (which saves to localStorage as fallback)
      setContextSettings(updatedSettings);

      if (apiResponse && apiResponse.success) {
        notifications.success('نجح', { message: 'تم حفظ الإعدادات بنجاح' });
      } else {
        notifications.success('نجح', { message: 'تم حفظ الإعدادات محلياً' });
      }
    } catch (err) {
      const errorMessage = err.message || err.response?.data?.message || 'فشل في حفظ الإعدادات';
      setError(errorMessage);
      notifications.error('خطأ', { message: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  // System settings handlers
  const handleSysEdit = async (key) => {
    try {
      const item = await api.getSystemSetting(key);
      if (item?.success && item.data) {
        const data = item.data;
        setEditingKey(key);
        setSysForm({ key, value: data.value ?? '', description: data.description ?? '' });
      } else if (item) {
        setEditingKey(key);
        setSysForm({ key, value: item.value ?? '', description: item.description ?? '' });
      }
    } catch (e) {
      notifications.error('تعذر جلب الإعداد', {
        message: e.message || 'حدث خطأ أثناء جلب بيانات الإعداد'
      });
    }
  };

  const handleSysDelete = async (key) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف الإعداد "${key}"؟`);
    if (!confirmed) return;

    const prev = sysItems;
    setSysItems((items) => items.filter((i) => i.key !== key));

    try {
      await api.deleteSystemSetting(key);
      notifications.success('تم الحذف بنجاح', {
        message: `تم حذف الإعداد "${key}" بنجاح`
      });
    } catch (e) {
      notifications.error('تعذر الحذف', {
        message: e.message || 'حدث خطأ أثناء حذف الإعداد'
      });
      setSysItems(prev);
    }
  };

  const handleSysSubmit = async (e) => {
    e.preventDefault();

    const payload = { key: sysForm.key.trim(), value: sysForm.value, description: sysForm.description || '' };

    if (!payload.key) {
      notifications.warning('حقل مطلوب', { message: 'المفتاح (Key) مطلوب' });
      return;
    }

    try {
      if (editingKey && editingKey === payload.key) {
        await api.updateSystemSetting(payload.key, { value: payload.value, description: payload.description });
        notifications.success('تم التحديث بنجاح', { message: `تم تحديث الإعداد "${payload.key}" بنجاح` });
      } else if (editingKey && editingKey !== payload.key) {
        await api.createSystemSetting(payload);
        await api.deleteSystemSetting(editingKey);
        notifications.success('تم التحديث بنجاح', { message: `تم تحديث المفتاح من "${editingKey}" إلى "${payload.key}"` });
      } else {
        await api.createSystemSetting(payload);
        notifications.success('تم الإنشاء بنجاح', { message: `تم إنشاء الإعداد "${payload.key}" بنجاح` });
      }

      setEditingKey(null);
      setSysForm({ key: '', value: '', description: '' });

      // Reload system settings
      const list = await api.listSystemSettings();
      let items = [];
      if (list && list.success && list.data) {
        items = Array.isArray(list.data) ? list.data : [];
      } else if (Array.isArray(list)) {
        items = list;
      } else if (list && list.data && Array.isArray(list.data)) {
        items = list.data;
      }
      setSysItems(items);
    } catch (e) {
      notifications.error('خطأ', {
        message: e.message || 'حدث خطأ أثناء حفظ الإعداد'
      });
    }
  };

  // Render category content
  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'general':
        return (
          <div className="space-y-4">
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>معلومات الشركة</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الموقع الإلكتروني</label>
                  <input
                    type="text"
                    value={form.website}
                    onChange={(e) => handleFormChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رابط الشعار</label>
                  <input
                    type="text"
                    value={form.logoUrl}
                    onChange={(e) => handleFormChange('logoUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        );

      case 'currency':
        return (
          <div className="space-y-4">
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>إعدادات العملة</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رمز العملة</label>
                  <input
                    type="text"
                    value={form.currencyCode}
                    onChange={(e) => handleFormChange('currencyCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رمز العملة</label>
                  <input
                    type="text"
                    value={form.currencySymbol}
                    onChange={(e) => handleFormChange('currencySymbol', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم العملة</label>
                  <input
                    type="text"
                    value={form.currencyName}
                    onChange={(e) => handleFormChange('currencyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اللغة المحلية</label>
                  <input
                    type="text"
                    value={form.currencyLocale}
                    onChange={(e) => handleFormChange('currencyLocale', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">عدد الأرقام العشرية</label>
                  <input
                    type="number"
                    value={form.minimumFractionDigits}
                    onChange={(e) => handleFormChange('minimumFractionDigits', parseInt(e.target.value) || 2)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        );

      case 'printing':
        return (
          <div className="space-y-4">
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>إعدادات الطباعة</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نسخة الطباعة الافتراضية</label>
                  <select
                    value={form.defaultCopy}
                    onChange={(e) => handleFormChange('defaultCopy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="customer">العميل</option>
                    <option value="archive">الأرشيف</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.showWatermark}
                      onChange={(e) => handleFormChange('showWatermark', e.target.checked)}
                      className="mr-2"
                    />
                    إظهار العلامة المائية
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">حجم الورق</label>
                  <select
                    value={form.paperSize}
                    onChange={(e) => handleFormChange('paperSize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="A4">A4</option>
                    <option value="A5">A5</option>
                    <option value="Letter">Letter</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.showSerialBarcode}
                      onChange={(e) => handleFormChange('showSerialBarcode', e.target.checked)}
                      className="mr-2"
                    />
                    إظهار الباركود التسلسلي
                  </label>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        );

      case 'locale':
        return (
          <div className="space-y-4">
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>إعدادات اللغة والمحلية</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.rtl}
                      onChange={(e) => handleFormChange('rtl', e.target.checked)}
                      className="mr-2"
                    />
                    اتجاه النص من اليمين لليسار (RTL)
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تنسيق التاريخ</label>
                  <input
                    type="text"
                    value={form.dateFormat}
                    onChange={(e) => handleFormChange('dateFormat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="yyyy/MM/dd"
                  />
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        );

      case 'systemSettings':
        return (
          <div className="space-y-4">
            <SimpleCard>
              <SimpleCardHeader>
                <SimpleCardTitle>إعدادات النظام العامة</SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                {sysLoading ? (
                  <LoadingSpinner />
                ) : sysError ? (
                  <div className="text-red-600">{sysError}</div>
                ) : (
                  <div className="space-y-4">
                    <form onSubmit={handleSysSubmit} className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">المفتاح (Key)</label>
                        <input
                          type="text"
                          value={sysForm.key}
                          onChange={(e) => setSysForm(prev => ({ ...prev, key: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">القيمة (Value)</label>
                        <textarea
                          value={sysForm.value}
                          onChange={(e) => setSysForm(prev => ({ ...prev, value: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                        <input
                          type="text"
                          value={sysForm.description}
                          onChange={(e) => setSysForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="flex gap-2">
                        <SimpleButton type="submit" disabled={saving}>
                          {editingKey ? 'تحديث' : 'إنشاء'}
                        </SimpleButton>
                        {editingKey && (
                          <SimpleButton
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingKey(null);
                              setSysForm({ key: '', value: '', description: '' });
                            }}
                          >
                            إلغاء
                          </SimpleButton>
                        )}
                      </div>
                    </form>

                    <div className="space-y-2">
                      {sysItems.map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{item.key}</div>
                            <div className="text-sm text-gray-600">{item.value}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500">{item.description}</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <SimpleButton
                              size="sm"
                              variant="outline"
                              onClick={() => handleSysEdit(item.key)}
                            >
                              تعديل
                            </SimpleButton>
                            <SimpleButton
                              size="sm"
                              variant="outline"
                              onClick={() => handleSysDelete(item.key)}
                            >
                              حذف
                            </SimpleButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SimpleCardContent>
            </SimpleCard>
          </div>
        );

      case 'receiptPrint':
        return <ReceiptPrintSettingsPage />;

      case 'invoicePrint':
        return <InvoicePrintSettingsPage />;

      case 'messaging':
        return <MessagingSettingsPage />;

      case 'variables':
        return <SystemVariablesPage />;

      default:
        return null;
    }
  };

  // Main tabs
  const mainTabs = [
    { key: 'settings', label: 'الإعدادات', icon: '⚙️' },
    { key: 'history', label: 'التاريخ', icon: '📜' },
    { key: 'backup', label: 'النسخ الاحتياطي', icon: '💾' },
    { key: 'import-export', label: 'استيراد/تصدير', icon: '📥' },
    { key: 'help', label: 'المساعدة', icon: '❓' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إعدادات النظام</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة جميع إعدادات النظام</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'settings' && ['general', 'currency', 'printing', 'locale'].includes(activeCategory) && (
            <>
              <SimpleButton
                onClick={handleSave}
                disabled={saving || loading}
              >
                <Save className="h-4 w-4 mr-2" />
                حفظ
              </SimpleButton>
            </>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1" aria-label="Tabs">
          {mainTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.key
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <>
          {/* Category Tabs */}
          <SettingsCategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            categories={CATEGORIES}
          />

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {/* Category Content */}
          {!loading && renderCategoryContent()}
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <SettingsHistory />
      )}

      {/* Backup Tab (Unified) */}
      {activeTab === 'backup' && (
        <UnifiedBackup />
      )}

      {/* Import/Export Tab */}
      {activeTab === 'import-export' && (
        <SettingsImportExport />
      )}

      {/* Help Tab */}
      {activeTab === 'help' && (
        <SettingsHelp />
      )}
    </div>
  );
}
