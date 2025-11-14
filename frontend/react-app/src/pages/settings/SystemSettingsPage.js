import React, { useEffect, useState, useMemo } from 'react';
import { useSettings } from '../../context/SettingsContext';
import api from '../../services/api';
import SystemVariablesPage from './SystemVariablesPage';
import { useNotifications } from '../../components/notifications/NotificationSystem';

const tabs = [
  { key: 'general', label: 'عام' },
  { key: 'currency', label: 'العملة' },
  { key: 'printing', label: 'الطباعة' },
  { key: 'receiptPrint', label: 'إيصال الاستلام' },
  { key: 'messaging', label: 'إعدادات المراسلة' },
  { key: 'locale', label: 'المحلية واللغة' },
  { key: 'systemSettings', label: 'إعدادات النظام العامة' },
  { key: 'variables', label: 'متغيرات النظام' },
];

export default function SystemSettingsPage() {
  const { settings, setSettings, formatMoney } = useSettings();
  const notifications = useNotifications();

  const [active, setActive] = useState('general');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => ({
    // Company / Branding
    name: settings.company.name || '',
    address: settings.company.address || '',
    phone: settings.company.phone || '',
    website: settings.company.website || '',
    logoUrl: settings.company.logoUrl || '/logo.png',
    // Currency
    currencyCode: settings.currency.code || 'EGP',
    currencySymbol: settings.currency.symbol || 'ج.م',
    currencyName: settings.currency.name || 'الجنيه المصري',
    currencyLocale: settings.currency.locale || 'ar-EG',
    minimumFractionDigits: settings.currency.minimumFractionDigits ?? 2,
    // Printing
    defaultCopy: settings.printing.defaultCopy || 'customer',
    showWatermark: !!settings.printing.showWatermark,
    paperSize: settings.printing.paperSize || 'A4',
    showSerialBarcode: !!settings.printing.showSerialBarcode,
    // Locale
    rtl: !!settings.locale.rtl,
    dateFormat: settings.locale.dateFormat || 'yyyy/MM/dd',
    // Receipt
    receiptTerms: settings.receipt.terms || '',
  }));

  // حالة إعدادات إيصال الاستلام (من backend/config/print-settings.json)
  const [print, setPrint] = useState({
    title: 'إيصال استلام',
    showLogo: true,
    logoUrl: '/assets/logo.png',
    showQr: true,
    qrSize: 180,
    showDevicePassword: false,
    showSerialBarcode: true,
    barcodeWidth: 1,
    barcodeHeight: 28,
    compactMode: false,
    branchName: '',
    branchAddress: '',
    branchPhone: '',
    margins: { top: 16, right: 16, bottom: 16, left: 16 },
    dateDisplay: 'both',
    terms: ''
  });

  useEffect(() => {
    let mounted = true;
    api.getPrintSettings().then((data) => {
      if (mounted && data) setPrint((p) => ({ ...p, ...data }));
    }).catch(console.error);
    return () => { mounted = false; };
  }, [api]);

  // System settings list state
  const [sysLoading, setSysLoading] = useState(false);
  const [sysError, setSysError] = useState('');
  const [sysItems, setSysItems] = useState([]); // [{key, value, description}]
  const [sysForm, setSysForm] = useState({ key: '', value: '', description: '' });
  const [editingKey, setEditingKey] = useState('');

  // Messaging settings state
  const [messagingSettings, setMessagingSettings] = useState({
    whatsapp: {
      enabled: true,
      apiEnabled: false,
      apiUrl: '',
      apiToken: '',
      webEnabled: true,
      defaultMessage: 'مرحباً {customerName}، فاتورتك رقم #{invoiceId} جاهزة بمبلغ {amount} {currency}. يمكنك تحميلها من: {invoiceLink}'
    },
    email: {
      enabled: false,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: 'Fix Zone ERP',
      defaultSubject: 'فاتورة #{invoiceId} - Fix Zone',
      defaultTemplate: `مرحباً {customerName},

نرسل لك فاتورة الإصلاح رقم #{invoiceId}

تفاصيل الفاتورة:
- المبلغ الإجمالي: {amount} {currency}
- تاريخ الإصدار: {issueDate}
- حالة الدفع: {status}

يمكنك تحميل الفاتورة من الرابط التالي:
{invoiceLink}

شكراً لتعاملكم معنا
فريق Fix Zone`
    }
  });
  const [savingMessaging, setSavingMessaging] = useState(false);

  // Load system settings when tab becomes active
  useEffect(() => {
    if (active !== 'systemSettings') return;
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
  }, [active, notifications]);

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
    
    // Validation
    if (!payload.key) {
      notifications.warning('حقل مطلوب', { message: 'المفتاح (Key) مطلوب' });
      return;
    }
    
    if (payload.key.length > 100) {
      notifications.warning('خطأ في المدخلات', { message: 'المفتاح يجب ألا يتجاوز 100 حرف' });
      return;
    }
    
    try {
      if (editingKey && editingKey === payload.key) {
        // تحديث نفس المفتاح
        await api.updateSystemSetting(payload.key, { value: payload.value, description: payload.description });
        notifications.success('تم التحديث بنجاح', { message: `تم تحديث الإعداد "${payload.key}" بنجاح` });
      } else if (editingKey && editingKey !== payload.key) {
        // تغيير المفتاح: أنشئ جديد ثم احذف القديم
        await api.createSystemSetting(payload);
        await api.deleteSystemSetting(editingKey);
        notifications.success('تم التحديث بنجاح', { message: `تم تحديث المفتاح من "${editingKey}" إلى "${payload.key}"` });
      } else {
        // إنشاء جديد
        await api.createSystemSetting(payload);
        notifications.success('تم الإنشاء بنجاح', { message: `تم إنشاء الإعداد "${payload.key}" بنجاح` });
      }
      
      // تحديث القائمة محلياً
      const next = sysItems.filter((i) => i.key !== (editingKey || payload.key));
      next.push({ key: payload.key, value: payload.value, description: payload.description, type: 'string' });
      next.sort((a, b) => a.key.localeCompare(b.key));
      setSysItems(next);
      setEditingKey('');
      setSysForm({ key: '', value: '', description: '' });
    } catch (e) {
      notifications.error('تعذر الحفظ', { 
        message: e.message || 'حدث خطأ أثناء حفظ الإعداد. تأكد من أن المفتاح غير موجود مسبقاً.'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const boolKeys = new Set(['showWatermark', 'showSerialBarcode', 'rtl']);
    const numKeys = new Set(['minimumFractionDigits']);
    setForm((p) => ({
      ...p,
      [name]: boolKeys.has(name) ? (type === 'checkbox' ? checked : value === 'true') : numKeys.has(name) ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      setSettings((prev) => ({
        ...prev,
        company: {
          ...prev.company,
          name: form.name,
          address: form.address,
          phone: form.phone,
          website: form.website,
          logoUrl: form.logoUrl,
        },
        currency: {
          ...prev.currency,
          code: form.currencyCode,
          symbol: form.currencySymbol,
          name: form.currencyName,
          locale: form.currencyLocale,
          minimumFractionDigits: form.minimumFractionDigits,
        },
        printing: {
          ...prev.printing,
          defaultCopy: form.defaultCopy,
          showWatermark: form.showWatermark,
          paperSize: form.paperSize,
          showSerialBarcode: form.showSerialBarcode,
        },
        locale: {
          ...prev.locale,
          rtl: form.rtl,
          dateFormat: form.dateFormat,
        },
        receipt: {
          ...prev.receipt,
          terms: form.receiptTerms,
        },
      }));
      notifications.success('تم الحفظ بنجاح', { 
        message: 'تم حفظ إعدادات النظام العامة بنجاح'
      });
    } catch (e) {
      notifications.error('تعذر الحفظ', { 
        message: e.message || 'حدث خطأ أثناء حفظ الإعدادات'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrintChange = (e) => {
    const { name, value, type, checked } = e.target;
    const bools = new Set(['showLogo','showQr','showDevicePassword','showSerialBarcode','compactMode']);
    const nums = new Set(['qrSize','barcodeWidth','barcodeHeight','margins.top','margins.right','margins.bottom','margins.left']);
    if (name.startsWith('margins.')) {
      const key = name.split('.')[1];
      setPrint((p) => ({ ...p, margins: { ...p.margins, [key]: Number(value) } }));
      return;
    }
    setPrint((p) => ({
      ...p,
      [name]: bools.has(name) ? (type === 'checkbox' ? checked : value === 'true') : nums.has(name) ? Number(value) : value,
    }));
  };

  const handleSavePrint = async () => {
    try {
      const payload = {
        title: print.title,
        showLogo: !!print.showLogo,
        logoUrl: print.logoUrl,
        showQr: !!print.showQr,
        qrSize: Number(print.qrSize) || 180,
        showDevicePassword: !!print.showDevicePassword,
        showSerialBarcode: !!print.showSerialBarcode,
        barcodeWidth: Number(print.barcodeWidth) || 1,
        barcodeHeight: Number(print.barcodeHeight) || 28,
        compactMode: !!print.compactMode,
        branchName: print.branchName,
        branchAddress: print.branchAddress,
        branchPhone: print.branchPhone,
        margins: {
          top: Number(print.margins.top) || 16,
          right: Number(print.margins.right) || 16,
          bottom: Number(print.margins.bottom) || 16,
          left: Number(print.margins.left) || 16,
        },
        dateDisplay: print.dateDisplay,
        terms: print.terms,
      };
      await api.updatePrintSettings(payload);
      notifications.success('تم الحفظ بنجاح', { 
        message: 'تم حفظ إعدادات إيصال الاستلام بنجاح'
      });
    } catch (e) {
      console.error(e);
      notifications.error('تعذر الحفظ', { 
        message: e.message || 'حدث خطأ أثناء حفظ إعدادات الإيصال'
      });
    }
  };

  const PreviewCurrency = useMemo(() => (
    <span className="inline-block text-sm text-gray-600">
      مثال: {formatMoney(12345.67)}
    </span>
  ), [formatMoney]);

  // Messaging settings handlers
  const handleMessagingChange = (section, field, value) => {
    setMessagingSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleMessagingSave = async () => {
    try {
      setSavingMessaging(true);
      // Save to system settings
      await api.createSystemSetting({
        key: 'messaging_settings',
        value: JSON.stringify(messagingSettings),
        description: 'إعدادات المراسلة والإشعارات'
      });
      notifications.success('تم الحفظ بنجاح', { 
        message: 'تم حفظ إعدادات المراسلة بنجاح'
      });
    } catch (error) {
      console.error('Error saving messaging settings:', error);
      notifications.error('تعذر الحفظ', { 
        message: error.message || 'حدث خطأ أثناء حفظ إعدادات المراسلة'
      });
    } finally {
      setSavingMessaging(false);
    }
  };

  const testWhatsAppWeb = (phone, message) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const testWhatsAppAPI = async (phone, message) => {
    try {
      const response = await fetch(messagingSettings.whatsapp.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${messagingSettings.whatsapp.apiToken}`
        },
        body: JSON.stringify({
          phone: phone,
          message: message
        })
      });
      
      if (response.ok) {
        notifications.success('تم الإرسال بنجاح', { 
          message: 'تم إرسال الرسالة بنجاح عبر API'
        });
      } else {
        throw new Error('فشل في إرسال الرسالة');
      }
    } catch (error) {
      console.error('WhatsApp API Error:', error);
      notifications.error('فشل الإرسال', { 
        message: error.message || 'فشل في إرسال الرسالة عبر API'
      });
    }
  };

  return (
    <div className="p-4">
        <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">إعدادات النظام</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-4 py-2 border rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-auto mb-6 border-b pb-3">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={[
              'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap',
              active === t.key ? 'bg-blue-600 text-white shadow-sm border border-blue-700' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'general' && (
        <section className="space-y-6 max-w-3xl bg-white rounded-lg border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">معلومات الشركة والهوية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة</label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              <input 
                name="phone" 
                value={form.phone} 
                onChange={handleChange} 
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
              <input 
                name="address" 
                value={form.address} 
                onChange={handleChange} 
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
              <input 
                name="website" 
                value={form.website} 
                onChange={handleChange} 
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="https://example.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">رابط الشعار (Logo URL)</label>
              <input 
                name="logoUrl" 
                value={form.logoUrl} 
                onChange={handleChange} 
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="/logo.png"
              />
              <div className="text-xs text-gray-500 mt-1">يمكنك رفع الشعار داخل مجلد public واستخدام المسار مثل /logo.png</div>
            </div>
          </div>
        </section>
      )}

      {active === 'receiptPrint' && (
        <section className="space-y-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">إعدادات إيصال الاستلام</h2>
            <button 
              onClick={handleSavePrint} 
              disabled={saving}
              className="px-4 py-2 border rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">عنوان الإيصال</label>
              <input name="title" value={print.title} onChange={handlePrintChange} className="w-full border rounded p-2" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="showLogo" checked={!!print.showLogo} onChange={handlePrintChange} />
              <span className="text-sm text-gray-700">إظهار الشعار</span>
            </label>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">رابط الشعار</label>
              <input name="logoUrl" value={print.logoUrl} onChange={handlePrintChange} className="w-full border rounded p-2" />
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="showQr" checked={!!print.showQr} onChange={handlePrintChange} />
              <span className="text-sm text-gray-700">إظهار QR للتتبّع</span>
            </label>
            <div>
              <label className="block text-sm text-gray-600 mb-1">حجم QR</label>
              <input type="number" min={100} max={320} name="qrSize" value={print.qrSize} onChange={handlePrintChange} className="w-full border rounded p-2" />
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="showDevicePassword" checked={!!print.showDevicePassword} onChange={handlePrintChange} />
              <span className="text-sm text-gray-700">عرض كلمة المرور على الإيصال</span>
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="showSerialBarcode" checked={!!print.showSerialBarcode} onChange={handlePrintChange} />
              <span className="text-sm text-gray-700">إظهار باركود الرقم التسلسلي</span>
            </label>
            <div>
              <label className="block text-sm text-gray-600 mb-1">عرض الباركود</label>
              <input type="number" min={0.6} max={2} step={0.1} name="barcodeWidth" value={print.barcodeWidth} onChange={handlePrintChange} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">ارتفاع الباركود</label>
              <input type="number" min={10} max={64} name="barcodeHeight" value={print.barcodeHeight} onChange={handlePrintChange} className="w-full border rounded p-2" />
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="compactMode" checked={!!print.compactMode} onChange={handlePrintChange} />
              <span className="text-sm text-gray-700">وضع مضغوط (هوامش وخط أصغر)</span>
            </label>

            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">هامش علوي</label>
                <input type="number" name="margins.top" value={print.margins.top} onChange={handlePrintChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">هامش يمين</label>
                <input type="number" name="margins.right" value={print.margins.right} onChange={handlePrintChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">هامش سفلي</label>
                <input type="number" name="margins.bottom" value={print.margins.bottom} onChange={handlePrintChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">هامش يسار</label>
                <input type="number" name="margins.left" value={print.margins.left} onChange={handlePrintChange} className="w-full border rounded p-2" />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">اسم الفرع</label>
                <input name="branchName" value={print.branchName} onChange={handlePrintChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">هاتف الفرع</label>
                <input name="branchPhone" value={print.branchPhone} onChange={handlePrintChange} className="w-full border rounded p-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">عنوان الفرع</label>
                <input name="branchAddress" value={print.branchAddress} onChange={handlePrintChange} className="w-full border rounded p-2" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">تنسيق التاريخ</label>
              <select name="dateDisplay" value={print.dateDisplay} onChange={handlePrintChange} className="w-full border rounded p-2">
                <option value="both">كلاهما</option>
                <option value="gregorian">ميلادي فقط</option>
                <option value="hijri">هجري فقط</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">الشروط والأحكام (يدعم قوالب {'{{branchName}} {{requestNumber}} {{customerName}}'})</label>
              <textarea name="terms" value={print.terms} onChange={handlePrintChange} className="w-full border rounded p-2 min-h-[140px]" />
            </div>
          </div>
        </section>
      )}

      {active === 'currency' && (
        <section className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">إعدادات العملة</h2>
            {PreviewCurrency}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">رمز العملة (Code)</label>
              <input name="currencyCode" value={form.currencyCode} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الرمز (Symbol)</label>
              <input name="currencySymbol" value={form.currencySymbol} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">اسم العملة</label>
              <input name="currencyName" value={form.currencyName} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">المنطقة (Intl Locale)</label>
              <input name="currencyLocale" value={form.currencyLocale} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الأجزاء العشرية</label>
              <input name="minimumFractionDigits" type="number" min={0} max={3} value={form.minimumFractionDigits} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
          </div>
        </section>
      )}

      {active === 'printing' && (
        <section className="space-y-4 max-w-3xl">
          <h2 className="font-semibold">إعدادات الطباعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">النسخة الافتراضية</label>
              <select name="defaultCopy" value={form.defaultCopy} onChange={handleChange} className="w-full border rounded p-2">
                <option value="customer">نسخة العميل</option>
                <option value="archive">نسخة الأرشيف</option>
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input name="showWatermark" type="checkbox" checked={form.showWatermark} onChange={handleChange} />
              <span className="text-sm text-gray-700">إظهار الوسم المائي</span>
            </label>
            <div>
              <label className="block text-sm text-gray-600 mb-1">حجم الورق</label>
              <select name="paperSize" value={form.paperSize} onChange={handleChange} className="w-full border rounded p-2">
                <option value="A4">A4</option>
                <option value="A5">A5</option>
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input name="showSerialBarcode" type="checkbox" checked={form.showSerialBarcode} onChange={handleChange} />
              <span className="text-sm text-gray-700">إظهار باركود الرقم التسلسلي</span>
            </label>
          </div>
        </section>
      )}

      {active === 'messaging' && (
        <section className="space-y-6 max-w-4xl">
          <h2 className="font-semibold text-xl">إعدادات المراسلة والإشعارات</h2>
          
          {/* WhatsApp Settings */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="text-green-600">📱</span>
              إعدادات الواتساب
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={messagingSettings.whatsapp.enabled}
                  onChange={(e) => handleMessagingChange('whatsapp', 'enabled', e.target.checked)}
                />
                <span className="text-sm">تفعيل إرسال الفواتير عبر الواتساب</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">الواتساب ويب (الأساسي)</h4>
                  <label className="flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      checked={messagingSettings.whatsapp.webEnabled}
                      onChange={(e) => handleMessagingChange('whatsapp', 'webEnabled', e.target.checked)}
                    />
                    <span className="text-sm">تفعيل الواتساب ويب</span>
                  </label>
                  <p className="text-xs text-gray-500">
                    سيتم فتح الواتساب ويب مع الرسالة معبأة مسبقاً
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">WhatsApp API (متقدم)</h4>
                  <label className="flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      checked={messagingSettings.whatsapp.apiEnabled}
                      onChange={(e) => handleMessagingChange('whatsapp', 'apiEnabled', e.target.checked)}
                    />
                    <span className="text-sm">تفعيل WhatsApp API</span>
                  </label>
                  
                  {messagingSettings.whatsapp.apiEnabled && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">API URL</label>
                        <input 
                          type="url"
                          value={messagingSettings.whatsapp.apiUrl}
                          onChange={(e) => handleMessagingChange('whatsapp', 'apiUrl', e.target.value)}
                          className="w-full border rounded p-2 text-sm"
                          placeholder="https://api.whatsapp.com/send"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">API Token</label>
                        <input 
                          type="password"
                          value={messagingSettings.whatsapp.apiToken}
                          onChange={(e) => handleMessagingChange('whatsapp', 'apiToken', e.target.value)}
                          className="w-full border rounded p-2 text-sm"
                          placeholder="أدخل API Token"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">نص الرسالة الافتراضي</label>
                <textarea
                  value={messagingSettings.whatsapp.defaultMessage}
                  onChange={(e) => handleMessagingChange('whatsapp', 'defaultMessage', e.target.value)}
                  className="w-full border rounded p-2 text-sm"
                  rows={4}
                  placeholder="الرسالة الافتراضية..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  يمكن استخدام المتغيرات: {'{customerName}'}, {'{invoiceId}'}, {'{amount}'}, {'{currency}'}, {'{invoiceLink}'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => testWhatsAppWeb('201234567890', messagingSettings.whatsapp.defaultMessage)}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                  disabled={!messagingSettings.whatsapp.webEnabled}
                >
                  اختبار الواتساب ويب
                </button>
                {messagingSettings.whatsapp.apiEnabled && (
                  <button
                    type="button"
                    onClick={() => testWhatsAppAPI('201234567890', messagingSettings.whatsapp.defaultMessage)}
                    className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                  >
                    اختبار WhatsApp API
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Email Settings */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="text-blue-600">📧</span>
              إعدادات البريد الإلكتروني
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={messagingSettings.email.enabled}
                  onChange={(e) => handleMessagingChange('email', 'enabled', e.target.checked)}
                />
                <span className="text-sm">تفعيل إرسال الفواتير عبر البريد الإلكتروني</span>
              </label>

              {messagingSettings.email.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">SMTP Host</label>
                      <input 
                        type="text"
                        value={messagingSettings.email.smtpHost}
                        onChange={(e) => handleMessagingChange('email', 'smtpHost', e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">SMTP Port</label>
                      <input 
                        type="number"
                        value={messagingSettings.email.smtpPort}
                        onChange={(e) => handleMessagingChange('email', 'smtpPort', parseInt(e.target.value))}
                        className="w-full border rounded p-2 text-sm"
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">اسم المستخدم</label>
                      <input 
                        type="email"
                        value={messagingSettings.email.smtpUser}
                        onChange={(e) => handleMessagingChange('email', 'smtpUser', e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">كلمة المرور</label>
                      <input 
                        type="password"
                        value={messagingSettings.email.smtpPassword}
                        onChange={(e) => handleMessagingChange('email', 'smtpPassword', e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        placeholder="كلمة المرور أو App Password"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">البريد المرسل</label>
                      <input 
                        type="email"
                        value={messagingSettings.email.fromEmail}
                        onChange={(e) => handleMessagingChange('email', 'fromEmail', e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        placeholder="noreply@fixzone.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">اسم المرسل</label>
                      <input 
                        type="text"
                        value={messagingSettings.email.fromName}
                        onChange={(e) => handleMessagingChange('email', 'fromName', e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        placeholder="Fix Zone ERP"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">موضوع البريد الافتراضي</label>
                    <input 
                      type="text"
                      value={messagingSettings.email.defaultSubject}
                      onChange={(e) => handleMessagingChange('email', 'defaultSubject', e.target.value)}
                      className="w-full border rounded p-2 text-sm"
                      placeholder="فاتورة #{invoiceId} - Fix Zone"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">قالب البريد الافتراضي</label>
                    <textarea
                      value={messagingSettings.email.defaultTemplate}
                      onChange={(e) => handleMessagingChange('email', 'defaultTemplate', e.target.value)}
                      className="w-full border rounded p-2 text-sm"
                      rows={8}
                      placeholder="قالب البريد الإلكتروني..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      يمكن استخدام المتغيرات: {'{customerName}'}, {'{invoiceId}'}, {'{amount}'}, {'{currency}'}, {'{issueDate}'}, {'{status}'}, {'{invoiceLink}'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleMessagingSave}
              disabled={savingMessaging}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {savingMessaging ? 'جاري الحفظ...' : 'حفظ إعدادات المراسلة'}
            </button>
          </div>
        </section>
      )}

      {active === 'locale' && (
        <section className="space-y-4 max-w-3xl">
          <h2 className="font-semibold">المحلية واللغة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center gap-2">
              <input name="rtl" type="checkbox" checked={form.rtl} onChange={handleChange} />
              <span className="text-sm text-gray-700">اتجاه RTL</span>
            </label>
            <div>
              <label className="block text-sm text-gray-600 mb-1">صيغة التاريخ</label>
              <input name="dateFormat" value={form.dateFormat} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
          </div>
        </section>
      )}

      {active === 'systemSettings' && (
        <section className="space-y-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">إعدادات النظام العامة</h2>
            {sysLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>جاري التحميل...</span>
              </div>
            )}
          </div>
          {sysError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
              {sysError}
            </div>
          )}

          <form onSubmit={handleSysSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border rounded-lg p-4 bg-white shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المفتاح (Key) *</label>
              <input 
                value={sysForm.key} 
                onChange={(e) => setSysForm({ ...sysForm, key: e.target.value })} 
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="مثال: defaultBranch"
                disabled={!!editingKey}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">القيمة (Value) *</label>
              <input 
                value={sysForm.value} 
                onChange={(e) => setSysForm({ ...sysForm, value: e.target.value })} 
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="قيمة نصية أو JSON"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
              <input 
                value={sysForm.description} 
                onChange={(e) => setSysForm({ ...sysForm, description: e.target.value })} 
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                placeholder="وصف مختصر"
              />
            </div>
            <div className="md:col-span-4 flex gap-2 justify-end mt-2">
              {editingKey && (
                <button 
                  type="button" 
                  onClick={() => { setEditingKey(''); setSysForm({ key: '', value: '', description: '' }); }} 
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
              )}
              <button 
                type="submit" 
                className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
              >
                {editingKey ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </form>

          {sysItems.length === 0 && !sysLoading ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-sm">لا توجد إعدادات مضافة حالياً</p>
              <p className="text-xs mt-1">استخدم النموذج أعلاه لإضافة إعداد جديد</p>
            </div>
          ) : (
            <div className="overflow-auto border rounded-lg bg-white shadow-sm">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-right border-b text-sm font-semibold text-gray-700">المفتاح</th>
                    <th className="p-3 text-right border-b text-sm font-semibold text-gray-700">القيمة</th>
                    <th className="p-3 text-right border-b text-sm font-semibold text-gray-700">الوصف</th>
                    <th className="p-3 text-right border-b text-sm font-semibold text-gray-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {sysItems.sort((a, b) => a.key.localeCompare(b.key)).map((it) => (
                    <tr key={it.key} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 border-b align-top font-mono text-sm text-gray-900">{it.key}</td>
                      <td className="p-3 border-b align-top max-w-md">
                        <pre className="text-xs whitespace-pre-wrap break-words text-gray-700 bg-gray-50 p-2 rounded">{String(it.value)}</pre>
                      </td>
                      <td className="p-3 border-b align-top text-sm text-gray-600">{it.description || '-'}</td>
                      <td className="p-3 border-b align-top">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSysEdit(it.key)} 
                            className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm transition-colors"
                          >
                            تعديل
                          </button>
                          <button 
                            onClick={() => handleSysDelete(it.key)} 
                            className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap-md bg-red-600 hover:bg-red-700 text-white text-sm transition-colors"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {active === 'variables' && (
        <section className="space-y-4">
          <SystemVariablesPage />
        </section>
      )}

      {active === 'receipt' && (
        <section className="space-y-4 max-w-3xl">
          <h2 className="font-semibold">شروط الإيصالات والفواتير</h2>
          <textarea name="receiptTerms" value={form.receiptTerms} onChange={handleChange} className="w-full border rounded p-2 min-h-[140px]" />
          <div className="text-xs text-gray-500">تظهر هذه الشروط أسفل إيصال الطباعة</div>
        </section>
      )}
    </div>
  );
}
