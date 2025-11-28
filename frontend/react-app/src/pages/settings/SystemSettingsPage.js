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
  { key: 'invoicePrint', label: 'إعدادات طباعة الفواتير' },
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
      if (mounted && data) {
        setPrint((p) => ({ ...p, ...data }));
        // تحميل إعدادات الفواتير إذا كانت موجودة
        if (data.invoice) {
          setInvoicePrint((ip) => ({ ...ip, ...data.invoice }));
        }
      }
    }).catch(console.error);
    return () => { mounted = false; };
  }, [api]);

  // حالة إعدادات طباعة الفواتير
  const [invoicePrint, setInvoicePrint] = useState({
    title: 'فاتورة',
    showLogo: true,
    logoUrl: '',
    logoHeight: 50,
    logoPosition: 'center',
    showHeader: true,
    headerText: 'فاتورة ضريبية',
    headerFontSize: 24,
    showInvoiceNumber: true,
    showInvoiceDate: true,
    showDueDate: true,
    showCustomerInfo: true,
    customerInfoLayout: 'vertical',
    showCompanyInfo: true,
    companyInfoLayout: 'vertical',
    showItemsTable: true,
    tableStyle: 'bordered',
    showItemDescription: true,
    showItemQuantity: true,
    showItemPrice: true,
    showItemDiscount: true,
    showItemTax: true,
    showItemTotal: true,
    showSubtotal: true,
    showDiscount: true,
    showTax: true,
    showShipping: true,
    showTotal: true,
    showPaymentMethod: true,
    showPaymentStatus: true,
    showNotes: true,
    notesLabel: 'ملاحظات',
    showTerms: true,
    termsLabel: 'الشروط والأحكام',
    termsText: 'شكراً لتعاملكم معنا',
    showSignature: true,
    signatureLabel: 'التوقيع',
    showFooter: true,
    footerText: '',
    paperSize: 'A4',
    orientation: 'portrait',
    fontSize: 12,
    titleFontSize: 20,
    sectionTitleFontSize: 14,
    tableFontSize: 11,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    lineHeight: 1.5,
    spacing: { section: 15, item: 8, paragraph: 10 },
    colors: {
      primary: '#000000',
      secondary: '#666666',
      border: '#cccccc',
      headerBg: '#f5f5f5',
      alternateRow: '#fafafa'
    },
    showBarcode: true,
    barcodePosition: 'bottom',
    barcodeWidth: 2,
    barcodeHeight: 40,
    showQrCode: false,
    qrCodePosition: 'top-right',
    qrCodeSize: 80,
    watermark: {
      enabled: false,
      text: 'مسودة',
      opacity: 0.1,
      position: 'center'
    },
    pageBreak: {
      avoidItems: true,
      avoidCustomerInfo: true
    },
    currency: {
      showSymbol: true,
      symbolPosition: 'before',
      showCode: false
    },
    dateFormat: 'yyyy/MM/dd',
    dateDisplay: 'both',
    numberFormat: {
      decimalPlaces: 2,
      thousandSeparator: ',',
      decimalSeparator: '.'
    }
  });

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
    const bools = new Set(['showLogo', 'showQr', 'showDevicePassword', 'showSerialBarcode', 'compactMode']);
    const nums = new Set(['qrSize', 'barcodeWidth', 'barcodeHeight', 'margins.top', 'margins.right', 'margins.bottom', 'margins.left']);
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

  // دوال إعدادات طباعة الفواتير
  // دالة رفع الشعار
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      notifications.error('خطأ', { message: 'الملف يجب أن يكون صورة' });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setInvoicePrint(prev => ({ ...prev, logoUrl: base64 }));
    };
    reader.onerror = () => {
      notifications.error('خطأ', { message: 'فشل قراءة الملف' });
    };
    reader.readAsDataURL(file);
  };

  const handleInvoicePrintChange = (e) => {
    const { name, value, type, checked } = e.target;
    const bools = new Set([
      'showLogo', 'showHeader', 'showInvoiceNumber', 'showInvoiceDate', 'showDueDate',
      'showCustomerInfo', 'showCompanyInfo', 'showItemsTable', 'showItemDescription',
      'showItemQuantity', 'showItemPrice', 'showItemDiscount', 'showItemTax',
      'showItemTotal', 'showSubtotal', 'showDiscount', 'showTax', 'showShipping',
      'showTotal', 'showPaymentMethod', 'showPaymentStatus', 'showNotes', 'showTerms',
      'showSignature', 'showFooter', 'showBarcode', 'showQrCode'
    ]);
    const nums = new Set([
      'logoHeight', 'headerFontSize', 'fontSize', 'titleFontSize', 'sectionTitleFontSize',
      'tableFontSize', 'lineHeight', 'barcodeWidth', 'barcodeHeight', 'qrCodeSize',
      'margins.top', 'margins.right', 'margins.bottom', 'margins.left',
      'spacing.section', 'spacing.item', 'spacing.paragraph',
      'watermark.opacity', 'numberFormat.decimalPlaces'
    ]);

    // معالجة الحقول المتداخلة
    if (name.startsWith('margins.')) {
      const key = name.split('.')[1];
      setInvoicePrint((ip) => ({ ...ip, margins: { ...ip.margins, [key]: Number(value) } }));
      return;
    }
    if (name.startsWith('spacing.')) {
      const key = name.split('.')[1];
      setInvoicePrint((ip) => ({ ...ip, spacing: { ...ip.spacing, [key]: Number(value) } }));
      return;
    }
    if (name.startsWith('watermark.')) {
      const key = name.split('.')[1];
      setInvoicePrint((ip) => ({
        ...ip,
        watermark: { ...ip.watermark, [key]: key === 'enabled' ? checked : (key === 'opacity' ? Number(value) : value) }
      }));
      return;
    }
    if (name.startsWith('pageBreak.')) {
      const key = name.split('.')[1];
      setInvoicePrint((ip) => ({
        ...ip,
        pageBreak: { ...ip.pageBreak, [key]: checked }
      }));
      return;
    }
    if (name.startsWith('currency.')) {
      const key = name.split('.')[1];
      setInvoicePrint((ip) => ({
        ...ip,
        currency: { ...ip.currency, [key]: key === 'showSymbol' || key === 'showCode' ? checked : value }
      }));
      return;
    }
    if (name.startsWith('numberFormat.')) {
      const key = name.split('.')[1];
      setInvoicePrint((ip) => ({
        ...ip,
        numberFormat: { ...ip.numberFormat, [key]: key === 'decimalPlaces' ? Number(value) : value }
      }));
      return;
    }
    if (name.startsWith('colors.')) {
      const key = name.split('.')[1];
      setInvoicePrint((ip) => ({
        ...ip,
        colors: { ...ip.colors, [key]: value }
      }));
      return;
    }

    setInvoicePrint((ip) => ({
      ...ip,
      [name]: bools.has(name) ? (type === 'checkbox' ? checked : value === 'true') : nums.has(name) ? Number(value) : value,
    }));
  };

  const handleSaveInvoicePrint = async () => {
    setSaving(true);
    try {
      const payload = {
        invoice: {
          ...invoicePrint,
          margins: {
            top: Number(invoicePrint.margins.top) || 20,
            right: Number(invoicePrint.margins.right) || 20,
            bottom: Number(invoicePrint.margins.bottom) || 20,
            left: Number(invoicePrint.margins.left) || 20,
          },
          spacing: {
            section: Number(invoicePrint.spacing.section) || 15,
            item: Number(invoicePrint.spacing.item) || 8,
            paragraph: Number(invoicePrint.spacing.paragraph) || 10,
          },
          watermark: {
            enabled: !!invoicePrint.watermark.enabled,
            text: invoicePrint.watermark.text || 'مسودة',
            opacity: Number(invoicePrint.watermark.opacity) || 0.1,
            position: invoicePrint.watermark.position || 'center',
          },
          pageBreak: {
            avoidItems: !!invoicePrint.pageBreak.avoidItems,
            avoidCustomerInfo: !!invoicePrint.pageBreak.avoidCustomerInfo,
          },
          currency: {
            showSymbol: !!invoicePrint.currency.showSymbol,
            symbolPosition: invoicePrint.currency.symbolPosition || 'before',
            showCode: !!invoicePrint.currency.showCode,
          },
          numberFormat: {
            decimalPlaces: Number(invoicePrint.numberFormat.decimalPlaces) || 2,
            thousandSeparator: invoicePrint.numberFormat.thousandSeparator || ',',
            decimalSeparator: invoicePrint.numberFormat.decimalSeparator || '.',
          },
          dateDisplay: invoicePrint.dateDisplay || 'both',
        }
      };
      await api.updatePrintSettings(payload);
      notifications.success('تم الحفظ بنجاح', {
        message: 'تم حفظ إعدادات طباعة الفواتير بنجاح'
      });
    } catch (e) {
      console.error(e);
      notifications.error('تعذر الحفظ', {
        message: e.message || 'حدث خطأ أثناء حفظ إعدادات طباعة الفواتير'
      });
    } finally {
      setSaving(false);
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

      {active === 'invoicePrint' && (
        <section className="space-y-6 max-w-6xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">إعدادات طباعة الفواتير</h2>
            <button
              onClick={handleSaveInvoicePrint}
              disabled={saving}
              className="px-6 py-2 border rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>

          {/* معاينة الفاتورة */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">معاينة الفاتورة</h3>
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 overflow-auto" style={{ maxHeight: '800px' }}>
              <div 
                className="bg-white shadow-lg mx-auto"
                dir="rtl"
                style={{
                  width: invoicePrint.paperSize === 'A4' ? '210mm' : invoicePrint.paperSize === 'A5' ? '148mm' : '216mm',
                  minHeight: invoicePrint.paperSize === 'A4' ? '297mm' : invoicePrint.paperSize === 'A5' ? '210mm' : '279mm',
                  padding: `${invoicePrint.margins.top}mm ${invoicePrint.margins.right}mm ${invoicePrint.margins.bottom}mm ${invoicePrint.margins.left}mm`,
                  fontSize: `${invoicePrint.fontSize}px`,
                  lineHeight: invoicePrint.lineHeight,
                  color: invoicePrint.colors.primary,
                  position: 'relative',
                  fontFamily: "'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }}
              >
                {/* الوسم المائي */}
                {invoicePrint.watermark.enabled && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(-45deg)',
                      fontSize: '48px',
                      color: invoicePrint.colors.primary,
                      opacity: invoicePrint.watermark.opacity,
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      zIndex: 1
                    }}
                  >
                    {invoicePrint.watermark.text}
                  </div>
                )}

                {/* Header - مطابق للفاتورة الفعلية */}
                <div 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: `${invoicePrint.spacing.section * 1.5}px`,
                    paddingBottom: `${invoicePrint.spacing.section}px`,
                    borderBottom: `3px solid ${invoicePrint.colors.primary}`
                  }}
                >
                  {/* Header Left - Company Info */}
                  <div style={{ flex: 1 }}>
                    {invoicePrint.showLogo && invoicePrint.logoUrl ? (
                      <div style={{
                        textAlign: invoicePrint.logoPosition === 'center' ? 'center' : invoicePrint.logoPosition === 'right' ? 'right' : 'left',
                        marginBottom: '10px'
                      }}>
                        <img 
                          src={invoicePrint.logoUrl} 
                          alt="Logo" 
                          style={{ 
                            height: `${invoicePrint.logoHeight}px`, 
                            maxWidth: '100%',
                            objectFit: 'contain'
                          }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    ) : (
                      <div style={{ 
                        fontSize: `${invoicePrint.titleFontSize}px`, 
                        fontWeight: 700, 
                        color: invoicePrint.colors.primary, 
                        marginBottom: '10px' 
                      }}>
                        {invoicePrint.showCompanyInfo ? 'FixZone' : invoicePrint.title}
                      </div>
                    )}
                    {invoicePrint.showCompanyInfo && (
                      <div style={{ 
                        fontSize: `${invoicePrint.fontSize - 1}px`, 
                        color: invoicePrint.colors.secondary,
                        lineHeight: 1.8
                      }}>
                        <div>مول البستان الدور الارضي</div>
                        <div>هاتف: 01270388043 | بريد إلكتروني: info@fixzone.com</div>
                      </div>
                    )}
                  </div>

                  {/* Header Right - Invoice Number Box + QR Code */}
                  <div style={{ 
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '15px'
                  }}>
                    {invoicePrint.showInvoiceNumber && (
                      <div style={{
                        background: `linear-gradient(135deg, ${invoicePrint.colors.primary} 0%, ${invoicePrint.colors.primary}dd 100%)`,
                        color: '#fff',
                        padding: '15px 25px',
                        borderRadius: '10px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '5px' }}>
                          رقم الفاتورة
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '1px' }}>
                          INV-REP-2024-001
                        </div>
                      </div>
                    )}
                    {invoicePrint.showQrCode && (
                      <div style={{ 
                        textAlign: 'center',
                        width: `${Math.min(invoicePrint.qrCodeSize, 100)}px`,
                        height: `${Math.min(invoicePrint.qrCodeSize, 100)}px`
                      }}>
                        <div className="bg-gray-200 border-2 border-gray-400 flex items-center justify-center" style={{ 
                          width: `${Math.min(invoicePrint.qrCodeSize, 100)}px`, 
                          height: `${Math.min(invoicePrint.qrCodeSize, 100)}px`,
                          borderRadius: '8px',
                          padding: '4px'
                        }}>
                          <span className="text-xs text-gray-500">QR</span>
                        </div>
                        <div style={{ fontSize: '9px', color: invoicePrint.colors.secondary, marginTop: '4px' }}>
                          تتبع
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Info Grid - تفاصيل الفاتورة + بيانات العميل */}
                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '25px',
                    marginBottom: `${invoicePrint.spacing.section}px`
                  }}
                >
                  {/* تفاصيل الفاتورة */}
                  <div style={{
                    background: '#f9fafb',
                    padding: '18px',
                    borderRadius: '8px',
                    border: `1px solid ${invoicePrint.colors.border}`
                  }}>
                    {invoicePrint.showHeader && (
                      <div style={{ 
                        fontSize: `${invoicePrint.sectionTitleFontSize}px`,
                        fontWeight: 700,
                        color: invoicePrint.colors.primary,
                        marginBottom: '12px',
                        paddingBottom: '8px',
                        borderBottom: `2px solid ${invoicePrint.colors.primary}`
                      }}>
                        تفاصيل الفاتورة
                      </div>
                    )}
                    {invoicePrint.showInvoiceNumber && (
                      <div style={{ 
                        marginBottom: '10px',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontWeight: 600, color: invoicePrint.colors.secondary, fontSize: '12px' }}>
                          رقم طلب الإصلاح:
                        </span>
                        <span style={{ fontWeight: 600, color: invoicePrint.colors.primary, fontSize: '13px' }}>
                          REP-2024-001
                        </span>
                      </div>
                    )}
                    {invoicePrint.showInvoiceDate && (
                      <div style={{ 
                        marginBottom: '10px',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontWeight: 600, color: invoicePrint.colors.secondary, fontSize: '12px' }}>
                          تاريخ الإصدار:
                        </span>
                        <span style={{ fontWeight: 600, color: invoicePrint.colors.primary, fontSize: '13px' }}>
                          {invoicePrint.dateDisplay === 'both' ? (
                            <>
                              {new Date().toLocaleDateString('ar-EG')}
                              <br />
                              <small style={{ color: invoicePrint.colors.secondary, fontSize: '10px' }}>
                                {new Date().toLocaleDateString('ar-SA-u-ca-islamic')}
                              </small>
                            </>
                          ) : invoicePrint.dateDisplay === 'hijri' ? (
                            new Date().toLocaleDateString('ar-SA-u-ca-islamic')
                          ) : (
                            new Date().toLocaleDateString('ar-EG')
                          )}
                        </span>
                      </div>
                    )}
                    <div style={{ 
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontWeight: 600, color: invoicePrint.colors.secondary, fontSize: '12px' }}>
                        حالة الطلب:
                      </span>
                      <span style={{ fontWeight: 600, color: invoicePrint.colors.primary, fontSize: '13px' }}>
                        جاهز للتسليم
                      </span>
                    </div>
                  </div>

                  {/* بيانات العميل */}
                  {invoicePrint.showCustomerInfo && (
                    <div style={{
                      background: '#f9fafb',
                      padding: '18px',
                      borderRadius: '8px',
                      border: `1px solid ${invoicePrint.colors.border}`
                    }}>
                      <div style={{ 
                        fontSize: `${invoicePrint.sectionTitleFontSize}px`,
                        fontWeight: 700,
                        color: invoicePrint.colors.primary,
                        marginBottom: '12px',
                        paddingBottom: '8px',
                        borderBottom: `2px solid ${invoicePrint.colors.primary}`
                      }}>
                        بيانات العميل
                      </div>
                      <div style={{ 
                        marginBottom: '10px',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontWeight: 600, color: invoicePrint.colors.secondary, fontSize: '12px' }}>
                          الاسم:
                        </span>
                        <span style={{ fontWeight: 600, color: invoicePrint.colors.primary, fontSize: '13px' }}>
                          أحمد محمد
                        </span>
                      </div>
                      <div style={{ 
                        marginBottom: '10px',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontWeight: 600, color: invoicePrint.colors.secondary, fontSize: '12px' }}>
                          الهاتف:
                        </span>
                        <span style={{ fontWeight: 600, color: invoicePrint.colors.primary, fontSize: '13px' }}>
                          01234567890
                        </span>
                      </div>
                      {invoicePrint.showCustomerInfo && (
                        <div style={{ 
                          marginBottom: '10px',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ fontWeight: 600, color: invoicePrint.colors.secondary, fontSize: '12px' }}>
                            البريد:
                          </span>
                          <span style={{ fontWeight: 600, color: invoicePrint.colors.primary, fontSize: '13px' }}>
                            ahmed@example.com
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* تفاصيل الجهاز */}
                <div style={{
                  background: '#f9fafb',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: `${invoicePrint.spacing.section}px`,
                  border: `1px solid ${invoicePrint.colors.border}`
                }}>
                  <div style={{ 
                    fontSize: `${invoicePrint.sectionTitleFontSize}px`,
                    fontWeight: 700,
                    color: invoicePrint.colors.primary,
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: `2px solid ${invoicePrint.colors.primary}`
                  }}>
                    تفاصيل الجهاز
                  </div>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px'
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, color: invoicePrint.colors.secondary, fontSize: '12px' }}>
                        نوع الجهاز:
                      </span>{' '}
                      <strong style={{ color: invoicePrint.colors.primary }}>لابتوب</strong>
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: invoicePrint.colors.secondary, fontSize: '12px' }}>
                        الماركة:
                      </span>{' '}
                      <strong style={{ color: invoicePrint.colors.primary }}>Dell</strong>
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: invoicePrint.colors.secondary, fontSize: '12px' }}>
                        الموديل:
                      </span>{' '}
                      <strong style={{ color: invoicePrint.colors.primary }}>Inspiron 15</strong>
                    </div>
                  </div>
                </div>

                {/* عنوان الفاتورة */}
                {invoicePrint.showHeader && invoicePrint.headerText && (
                  <div style={{
                    textAlign: 'center',
                    marginBottom: `${invoicePrint.spacing.section}px`,
                    fontSize: `${invoicePrint.headerFontSize}px`,
                    fontWeight: 700,
                    color: invoicePrint.colors.primary
                  }}>
                    {invoicePrint.headerText}
                  </div>
                )}

                {/* جدول العناصر - مطابق للفاتورة الفعلية */}
                {invoicePrint.showItemsTable && (
                  <div style={{ marginBottom: `${invoicePrint.spacing.section}px` }}>
                    <div style={{ 
                      fontSize: `${invoicePrint.sectionTitleFontSize}px`,
                      fontWeight: 700,
                      color: invoicePrint.colors.primary,
                      marginBottom: `${invoicePrint.spacing.item}px`
                    }}>
                      التكاليف والخدمات
                    </div>
                    <table 
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        margin: `${invoicePrint.spacing.section}px 0`,
                        background: '#fff',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        fontSize: `${invoicePrint.tableFontSize}px`
                      }}
                    >
                      <thead>
                        <tr style={{ 
                          background: invoicePrint.tableStyle === 'bordered' 
                            ? `linear-gradient(135deg, ${invoicePrint.colors.primary} 0%, ${invoicePrint.colors.primary}dd 100%)`
                            : invoicePrint.colors.headerBg,
                          color: invoicePrint.tableStyle === 'bordered' ? '#fff' : invoicePrint.colors.primary
                        }}>
                          {invoicePrint.showItemDescription && (
                            <th style={{ 
                              padding: '14px 12px', 
                              textAlign: 'right', 
                              fontWeight: 600,
                              fontSize: '13px'
                            }}>
                              الوصف
                            </th>
                          )}
                          {invoicePrint.showItemQuantity && (
                            <th style={{ 
                              padding: '14px 12px', 
                              textAlign: 'center', 
                              fontWeight: 600,
                              fontSize: '13px',
                              fontFamily: 'monospace'
                            }}>
                              الكمية
                            </th>
                          )}
                          {invoicePrint.showItemPrice && (
                            <th style={{ 
                              padding: '14px 12px', 
                              textAlign: 'center', 
                              fontWeight: 600,
                              fontSize: '13px',
                              fontFamily: 'monospace'
                            }}>
                              سعر الوحدة
                            </th>
                          )}
                          {invoicePrint.showItemDiscount && (
                            <th style={{ 
                              padding: '14px 12px', 
                              textAlign: 'center', 
                              fontWeight: 600,
                              fontSize: '13px',
                              fontFamily: 'monospace'
                            }}>
                              الخصم
                            </th>
                          )}
                          {invoicePrint.showItemTax && (
                            <th style={{ 
                              padding: '14px 12px', 
                              textAlign: 'center', 
                              fontWeight: 600,
                              fontSize: '13px',
                              fontFamily: 'monospace'
                            }}>
                              الضريبة
                            </th>
                          )}
                          {invoicePrint.showItemTotal && (
                            <th style={{ 
                              padding: '14px 12px', 
                              textAlign: 'center', 
                              fontWeight: 600,
                              fontSize: '13px',
                              fontFamily: 'monospace'
                            }}>
                              الإجمالي
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map((item, idx) => (
                          <tr 
                            key={idx}
                            style={{
                              backgroundColor: invoicePrint.tableStyle === 'striped' && idx % 2 === 1 
                                ? invoicePrint.colors.alternateRow 
                                : 'transparent'
                            }}
                          >
                            {invoicePrint.showItemDescription && (
                              <td style={{ 
                                padding: '14px 12px', 
                                textAlign: 'right', 
                                borderBottom: invoicePrint.tableStyle === 'bordered' 
                                  ? `1px solid ${invoicePrint.colors.border}` 
                                  : 'none'
                              }}>
                                {idx === 0 ? 'خدمة إصلاح الشاشة' : idx === 1 ? 'بطارية لابتوب' : 'لوحة مفاتيح'}
                              </td>
                            )}
                            {invoicePrint.showItemQuantity && (
                              <td style={{ 
                                padding: '14px 12px', 
                                textAlign: 'center', 
                                borderBottom: invoicePrint.tableStyle === 'bordered' 
                                  ? `1px solid ${invoicePrint.colors.border}` 
                                  : 'none',
                                fontFamily: 'monospace',
                                fontWeight: 600
                              }}>
                                {idx + 1}
                              </td>
                            )}
                            {invoicePrint.showItemPrice && (
                              <td style={{ 
                                padding: '14px 12px', 
                                textAlign: 'center', 
                                borderBottom: invoicePrint.tableStyle === 'bordered' 
                                  ? `1px solid ${invoicePrint.colors.border}` 
                                  : 'none',
                                fontFamily: 'monospace',
                                fontWeight: 600
                              }}>
                                {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'before' && 'ج.م '}
                                {(500 * (idx + 1)).toFixed(invoicePrint.numberFormat.decimalPlaces)}
                                {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'after' && ' ج.م'}
                              </td>
                            )}
                            {invoicePrint.showItemDiscount && (
                              <td style={{ 
                                padding: '14px 12px', 
                                textAlign: 'center', 
                                borderBottom: invoicePrint.tableStyle === 'bordered' 
                                  ? `1px solid ${invoicePrint.colors.border}` 
                                  : 'none',
                                fontFamily: 'monospace',
                                fontWeight: 600
                              }}>
                                {idx === 1 ? '10%' : '-'}
                              </td>
                            )}
                            {invoicePrint.showItemTax && (
                              <td style={{ 
                                padding: '14px 12px', 
                                textAlign: 'center', 
                                borderBottom: invoicePrint.tableStyle === 'bordered' 
                                  ? `1px solid ${invoicePrint.colors.border}` 
                                  : 'none',
                                fontFamily: 'monospace',
                                fontWeight: 600
                              }}>
                                {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'before' && 'ج.م '}
                                {(75 * (idx + 1)).toFixed(invoicePrint.numberFormat.decimalPlaces)}
                                {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'after' && ' ج.م'}
                              </td>
                            )}
                            {invoicePrint.showItemTotal && (
                              <td style={{ 
                                padding: '14px 12px', 
                                textAlign: 'center', 
                                borderBottom: invoicePrint.tableStyle === 'bordered' 
                                  ? `1px solid ${invoicePrint.colors.border}` 
                                  : 'none',
                                fontFamily: 'monospace',
                                fontWeight: 600
                              }}>
                                {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'before' && 'ج.م '}
                                {((500 * (idx + 1)) * (idx + 1)).toFixed(invoicePrint.numberFormat.decimalPlaces)}
                                {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'after' && ' ج.م'}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* الملخص المالي - مطابق للفاتورة الفعلية */}
                <div style={{ 
                  marginTop: `${invoicePrint.spacing.section}px`,
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <table style={{
                    width: '350px',
                    borderCollapse: 'collapse'
                  }}>
                    {invoicePrint.showSubtotal && (
                      <tr>
                        <td style={{
                          padding: '12px 18px',
                          textAlign: 'right',
                          color: invoicePrint.colors.secondary,
                          fontWeight: 600,
                          borderBottom: `1px solid ${invoicePrint.colors.border}`
                        }}>
                          المجموع الفرعي:
                        </td>
                        <td style={{
                          padding: '12px 18px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: invoicePrint.colors.primary,
                          borderBottom: `1px solid ${invoicePrint.colors.border}`,
                          fontFamily: 'monospace'
                        }}>
                          {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'before' && 'ج.م '}
                          {(1500).toFixed(invoicePrint.numberFormat.decimalPlaces)}
                          {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'after' && ' ج.م'}
                        </td>
                      </tr>
                    )}
                    {invoicePrint.showDiscount && (
                      <tr>
                        <td style={{
                          padding: '12px 18px',
                          textAlign: 'right',
                          color: invoicePrint.colors.secondary,
                          fontWeight: 600,
                          borderBottom: `1px solid ${invoicePrint.colors.border}`
                        }}>
                          الخصم:
                        </td>
                        <td style={{
                          padding: '12px 18px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: invoicePrint.colors.primary,
                          borderBottom: `1px solid ${invoicePrint.colors.border}`,
                          fontFamily: 'monospace'
                        }}>
                          {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'before' && 'ج.م '}
                          -{(50).toFixed(invoicePrint.numberFormat.decimalPlaces)}
                          {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'after' && ' ج.م'}
                        </td>
                      </tr>
                    )}
                    {invoicePrint.showTax && (
                      <tr>
                        <td style={{
                          padding: '12px 18px',
                          textAlign: 'right',
                          color: invoicePrint.colors.secondary,
                          fontWeight: 600,
                          borderBottom: `1px solid ${invoicePrint.colors.border}`
                        }}>
                          الضريبة (15%):
                        </td>
                        <td style={{
                          padding: '12px 18px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: invoicePrint.colors.primary,
                          borderBottom: `1px solid ${invoicePrint.colors.border}`,
                          fontFamily: 'monospace'
                        }}>
                          {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'before' && 'ج.م '}
                          {(225).toFixed(invoicePrint.numberFormat.decimalPlaces)}
                          {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'after' && ' ج.م'}
                        </td>
                      </tr>
                    )}
                    {invoicePrint.showShipping && (
                      <tr>
                        <td style={{
                          padding: '12px 18px',
                          textAlign: 'right',
                          color: invoicePrint.colors.secondary,
                          fontWeight: 600,
                          borderBottom: `1px solid ${invoicePrint.colors.border}`
                        }}>
                          الشحن:
                        </td>
                        <td style={{
                          padding: '12px 18px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: invoicePrint.colors.primary,
                          borderBottom: `1px solid ${invoicePrint.colors.border}`,
                          fontFamily: 'monospace'
                        }}>
                          {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'before' && 'ج.م '}
                          {(0).toFixed(invoicePrint.numberFormat.decimalPlaces)}
                          {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'after' && ' ج.م'}
                        </td>
                      </tr>
                    )}
                    {invoicePrint.showTotal && (
                      <tr style={{
                        fontWeight: 700,
                        fontSize: '18px',
                        borderTop: `3px solid ${invoicePrint.colors.primary}`,
                        background: '#f9fafb'
                      }}>
                        <td style={{
                          padding: '12px 18px',
                          textAlign: 'right',
                          color: invoicePrint.colors.primary,
                          fontSize: '18px'
                        }}>
                          الإجمالي:
                        </td>
                        <td style={{
                          padding: '12px 18px',
                          textAlign: 'left',
                          color: invoicePrint.colors.primary,
                          fontSize: '18px',
                          fontFamily: 'monospace'
                        }}>
                          {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'before' && 'ج.م '}
                          {(1675).toFixed(invoicePrint.numberFormat.decimalPlaces)}
                          {invoicePrint.currency.showSymbol && invoicePrint.currency.symbolPosition === 'after' && ' ج.م'}
                        </td>
                      </tr>
                    )}
                  </table>
                </div>

                {/* معلومات الدفع */}
                {(invoicePrint.showPaymentMethod || invoicePrint.showPaymentStatus) && (
                  <div style={{
                    marginTop: `${invoicePrint.spacing.section}px`,
                    marginBottom: `${invoicePrint.spacing.section}px`,
                    padding: '15px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: `1px solid ${invoicePrint.colors.border}`
                  }}>
                    {invoicePrint.showPaymentMethod && (
                      <div style={{ 
                        marginBottom: `${invoicePrint.spacing.item}px`,
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontWeight: 600, color: invoicePrint.colors.secondary }}>
                          طريقة الدفع:
                        </span>
                        <span style={{ fontWeight: 600, color: invoicePrint.colors.primary }}>
                          نقد
                        </span>
                      </div>
                    )}
                    {invoicePrint.showPaymentStatus && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontWeight: 600, color: invoicePrint.colors.secondary }}>
                          حالة الدفع:
                        </span>
                        <span style={{ fontWeight: 600, color: invoicePrint.colors.primary }}>
                          مدفوع
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* الملاحظات */}
                {invoicePrint.showNotes && (
                  <div style={{
                    marginTop: `${invoicePrint.spacing.section}px`,
                    marginBottom: `${invoicePrint.spacing.section}px`
                  }}>
                    <div style={{ 
                      fontSize: `${invoicePrint.sectionTitleFontSize}px`,
                      fontWeight: 700,
                      color: invoicePrint.colors.primary,
                      marginBottom: `${invoicePrint.spacing.item}px`
                    }}>
                      {invoicePrint.notesLabel}
                    </div>
                    <div style={{
                      background: '#f9fafb',
                      padding: '12px',
                      borderRadius: '6px',
                      color: invoicePrint.colors.secondary
                    }}>
                      شكراً لتعاملكم معنا. يرجى مراجعة الفاتورة والتأكد من صحة جميع البيانات.
                    </div>
                  </div>
                )}

                {/* الشروط والأحكام */}
                {invoicePrint.showTerms && (
                  <div style={{
                    marginTop: `${invoicePrint.spacing.section}px`,
                    marginBottom: `${invoicePrint.spacing.section}px`
                  }}>
                    <div style={{ 
                      fontSize: `${invoicePrint.sectionTitleFontSize}px`,
                      fontWeight: 700,
                      color: invoicePrint.colors.primary,
                      marginBottom: `${invoicePrint.spacing.item}px`
                    }}>
                      {invoicePrint.termsLabel}
                    </div>
                    <div style={{
                      background: '#f9fafb',
                      padding: '12px',
                      borderRadius: '6px',
                      color: invoicePrint.colors.secondary,
                      fontSize: `${invoicePrint.fontSize - 1}px`,
                      lineHeight: 1.6
                    }}>
                      {invoicePrint.termsText}
                    </div>
                  </div>
                )}

                {/* Footer - مطابق للفاتورة الفعلية */}
                {invoicePrint.showFooter && (
                  <div style={{
                    textAlign: 'center',
                    marginTop: '40px',
                    paddingTop: '20px',
                    borderTop: `1px solid ${invoicePrint.colors.border}`,
                    fontSize: '12px',
                    color: invoicePrint.colors.secondary,
                    lineHeight: 1.8
                  }}>
                    <strong style={{ color: invoicePrint.colors.primary }}>
                      شكراً لثقتكم بنا | {invoicePrint.showCompanyInfo ? 'FixZone' : invoicePrint.title}
                    </strong>
                    {invoicePrint.footerText && (
                      <>
                        <br />
                        {invoicePrint.footerText}
                      </>
                    )}
                    {invoicePrint.showQrCode && (
                      <>
                        <br />
                        يمكنك تتبع حالة الجهاز من خلال رمز QR أعلاه
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500 text-center">
              هذه معاينة للفاتورة باستخدام الإعدادات الحالية. التغييرات تظهر مباشرة عند تعديل الإعدادات.
            </div>
          </div>

          {/* معلومات أساسية */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">المعلومات الأساسية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الفاتورة</label>
                <input name="title" value={invoicePrint.title} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نص العنوان</label>
                <input name="headerText" value={invoicePrint.headerText} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="showHeader" checked={!!invoicePrint.showHeader} onChange={handleInvoicePrintChange} />
                  <span className="text-sm text-gray-700">إظهار العنوان</span>
                </label>
              </div>
            </div>
          </div>

          {/* الشعار */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">الشعار</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">رفع الشعار</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                  className="w-full border rounded-md p-2 text-sm"
                />
                <div className="text-xs text-gray-500 mt-1">يمكنك رفع صورة الشعار من جهازك</div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">أو رابط الشعار</label>
                <input name="logoUrl" value={invoicePrint.logoUrl} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" placeholder="/logo.png أو رابط URL" />
              </div>
              {invoicePrint.logoUrl && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">معاينة الشعار</label>
                  <div className="border rounded-md p-4 bg-gray-50 flex items-center justify-center">
                    <img 
                      src={invoicePrint.logoUrl} 
                      alt="Logo Preview" 
                      style={{ 
                        maxHeight: `${invoicePrint.logoHeight}px`,
                        maxWidth: '100%',
                        objectFit: 'contain'
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ارتفاع الشعار (px)</label>
                <input type="number" name="logoHeight" value={invoicePrint.logoHeight} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" min="20" max="200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">موضع الشعار</label>
                <select name="logoPosition" value={invoicePrint.logoPosition} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm">
                  <option value="left">يسار</option>
                  <option value="center">وسط</option>
                  <option value="right">يمين</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="showLogo" checked={!!invoicePrint.showLogo} onChange={handleInvoicePrintChange} />
                  <span className="text-sm text-gray-700">إظهار الشعار</span>
                </label>
              </div>
            </div>
          </div>

          {/* معلومات الفاتورة */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">معلومات الفاتورة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showInvoiceNumber" checked={!!invoicePrint.showInvoiceNumber} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">رقم الفاتورة</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showInvoiceDate" checked={!!invoicePrint.showInvoiceDate} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">تاريخ الفاتورة</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showDueDate" checked={!!invoicePrint.showDueDate} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">تاريخ الاستحقاق</span>
              </label>
            </div>
          </div>

          {/* معلومات العميل والشركة */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">معلومات العميل والشركة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" name="showCustomerInfo" checked={!!invoicePrint.showCustomerInfo} onChange={handleInvoicePrintChange} />
                  <span className="text-sm font-medium text-gray-700">إظهار معلومات العميل</span>
                </label>
                <select name="customerInfoLayout" value={invoicePrint.customerInfoLayout} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" disabled={!invoicePrint.showCustomerInfo}>
                  <option value="vertical">عمودي</option>
                  <option value="horizontal">أفقي</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" name="showCompanyInfo" checked={!!invoicePrint.showCompanyInfo} onChange={handleInvoicePrintChange} />
                  <span className="text-sm font-medium text-gray-700">إظهار معلومات الشركة</span>
                </label>
                <select name="companyInfoLayout" value={invoicePrint.companyInfoLayout} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" disabled={!invoicePrint.showCompanyInfo}>
                  <option value="vertical">عمودي</option>
                  <option value="horizontal">أفقي</option>
                </select>
              </div>
            </div>
          </div>

          {/* جدول العناصر */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">جدول العناصر</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showItemsTable" checked={!!invoicePrint.showItemsTable} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">إظهار جدول العناصر</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نمط الجدول</label>
                <select name="tableStyle" value={invoicePrint.tableStyle} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" disabled={!invoicePrint.showItemsTable}>
                  <option value="bordered">بحدود</option>
                  <option value="striped">مخطط</option>
                  <option value="minimal">بسيط</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showItemDescription" checked={!!invoicePrint.showItemDescription} onChange={handleInvoicePrintChange} disabled={!invoicePrint.showItemsTable} />
                <span className="text-sm text-gray-700">الوصف</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showItemQuantity" checked={!!invoicePrint.showItemQuantity} onChange={handleInvoicePrintChange} disabled={!invoicePrint.showItemsTable} />
                <span className="text-sm text-gray-700">الكمية</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showItemPrice" checked={!!invoicePrint.showItemPrice} onChange={handleInvoicePrintChange} disabled={!invoicePrint.showItemsTable} />
                <span className="text-sm text-gray-700">السعر</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showItemDiscount" checked={!!invoicePrint.showItemDiscount} onChange={handleInvoicePrintChange} disabled={!invoicePrint.showItemsTable} />
                <span className="text-sm text-gray-700">الخصم</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showItemTax" checked={!!invoicePrint.showItemTax} onChange={handleInvoicePrintChange} disabled={!invoicePrint.showItemsTable} />
                <span className="text-sm text-gray-700">الضريبة</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showItemTotal" checked={!!invoicePrint.showItemTotal} onChange={handleInvoicePrintChange} disabled={!invoicePrint.showItemsTable} />
                <span className="text-sm text-gray-700">الإجمالي</span>
              </label>
            </div>
          </div>

          {/* الملخص المالي */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">الملخص المالي</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showSubtotal" checked={!!invoicePrint.showSubtotal} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">المجموع الفرعي</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showDiscount" checked={!!invoicePrint.showDiscount} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">الخصم</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showTax" checked={!!invoicePrint.showTax} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">الضريبة</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showShipping" checked={!!invoicePrint.showShipping} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">الشحن</span>
              </label>
              <label className="flex items-center gap-2 md:col-span-2">
                <input type="checkbox" name="showTotal" checked={!!invoicePrint.showTotal} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700 font-medium">الإجمالي النهائي</span>
              </label>
            </div>
          </div>

          {/* معلومات الدفع */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">معلومات الدفع</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showPaymentMethod" checked={!!invoicePrint.showPaymentMethod} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">طريقة الدفع</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showPaymentStatus" checked={!!invoicePrint.showPaymentStatus} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">حالة الدفع</span>
              </label>
            </div>
          </div>

          {/* الملاحظات والشروط */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">الملاحظات والشروط</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showNotes" checked={!!invoicePrint.showNotes} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">إظهار الملاحظات</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نص تسمية الملاحظات</label>
                <input name="notesLabel" value={invoicePrint.notesLabel} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" disabled={!invoicePrint.showNotes} />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showTerms" checked={!!invoicePrint.showTerms} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">إظهار الشروط والأحكام</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نص تسمية الشروط</label>
                <input name="termsLabel" value={invoicePrint.termsLabel} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" disabled={!invoicePrint.showTerms} />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">نص الشروط والأحكام</label>
              <textarea name="termsText" value={invoicePrint.termsText} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm min-h-[100px]" disabled={!invoicePrint.showTerms} />
            </div>
          </div>

          {/* التوقيع والتذييل */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">التوقيع والتذييل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showSignature" checked={!!invoicePrint.showSignature} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">إظهار التوقيع</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نص تسمية التوقيع</label>
                <input name="signatureLabel" value={invoicePrint.signatureLabel} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" disabled={!invoicePrint.showSignature} />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showFooter" checked={!!invoicePrint.showFooter} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">إظهار التذييل</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نص التذييل</label>
                <input name="footerText" value={invoicePrint.footerText} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" disabled={!invoicePrint.showFooter} />
              </div>
            </div>
          </div>

          {/* إعدادات الصفحة */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">إعدادات الصفحة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حجم الورق</label>
                <select name="paperSize" value={invoicePrint.paperSize} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm">
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاتجاه</label>
                <select name="orientation" value={invoicePrint.orientation} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm">
                  <option value="portrait">عمودي</option>
                  <option value="landscape">أفقي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عرض التاريخ</label>
                <select name="dateDisplay" value={invoicePrint.dateDisplay} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm">
                  <option value="both">ميلادي وهجري</option>
                  <option value="gregorian">ميلادي فقط</option>
                  <option value="hijri">هجري فقط</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تنسيق التاريخ</label>
                <input name="dateFormat" value={invoicePrint.dateFormat} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" placeholder="yyyy/MM/dd" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">هامش علوي (mm)</label>
                <input type="number" name="margins.top" value={invoicePrint.margins.top} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">هامش يمين (mm)</label>
                <input type="number" name="margins.right" value={invoicePrint.margins.right} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">هامش سفلي (mm)</label>
                <input type="number" name="margins.bottom" value={invoicePrint.margins.bottom} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">هامش يسار (mm)</label>
                <input type="number" name="margins.left" value={invoicePrint.margins.left} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" />
              </div>
            </div>
          </div>

          {/* الخطوط والألوان */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">الخطوط والألوان</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حجم الخط الأساسي</label>
                <input type="number" name="fontSize" value={invoicePrint.fontSize} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" min="8" max="20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حجم عنوان الفاتورة</label>
                <input type="number" name="titleFontSize" value={invoicePrint.titleFontSize} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" min="12" max="32" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حجم عنوان القسم</label>
                <input type="number" name="sectionTitleFontSize" value={invoicePrint.sectionTitleFontSize} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" min="10" max="24" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حجم خط الجدول</label>
                <input type="number" name="tableFontSize" value={invoicePrint.tableFontSize} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" min="8" max="16" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ارتفاع السطر</label>
                <input type="number" name="lineHeight" value={invoicePrint.lineHeight} onChange={handleInvoicePrintChange} step="0.1" className="w-full border rounded-md p-2 text-sm" min="1" max="3" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اللون الأساسي</label>
                <input type="color" name="colors.primary" value={invoicePrint.colors.primary} onChange={handleInvoicePrintChange} className="w-full h-10 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اللون الثانوي</label>
                <input type="color" name="colors.secondary" value={invoicePrint.colors.secondary} onChange={handleInvoicePrintChange} className="w-full h-10 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">لون الحدود</label>
                <input type="color" name="colors.border" value={invoicePrint.colors.border} onChange={handleInvoicePrintChange} className="w-full h-10 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">خلفية العنوان</label>
                <input type="color" name="colors.headerBg" value={invoicePrint.colors.headerBg} onChange={handleInvoicePrintChange} className="w-full h-10 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">صف بديل</label>
                <input type="color" name="colors.alternateRow" value={invoicePrint.colors.alternateRow} onChange={handleInvoicePrintChange} className="w-full h-10 border rounded-md" />
              </div>
            </div>
          </div>

          {/* الباركود وQR */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">الباركود وQR Code</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" name="showBarcode" checked={!!invoicePrint.showBarcode} onChange={handleInvoicePrintChange} />
                  <span className="text-sm font-medium text-gray-700">إظهار الباركود</span>
                </label>
                <select name="barcodePosition" value={invoicePrint.barcodePosition} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" disabled={!invoicePrint.showBarcode}>
                  <option value="top">أعلى</option>
                  <option value="bottom">أسفل</option>
                  <option value="top-right">أعلى يمين</option>
                  <option value="bottom-right">أسفل يمين</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">عرض الباركود</label>
                  <input type="number" name="barcodeWidth" value={invoicePrint.barcodeWidth} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" min="1" max="5" step="0.1" disabled={!invoicePrint.showBarcode} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ارتفاع الباركود</label>
                  <input type="number" name="barcodeHeight" value={invoicePrint.barcodeHeight} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" min="20" max="100" disabled={!invoicePrint.showBarcode} />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" name="showQrCode" checked={!!invoicePrint.showQrCode} onChange={handleInvoicePrintChange} />
                  <span className="text-sm font-medium text-gray-700">إظهار QR Code</span>
                </label>
                <div className="text-xs text-gray-500 mb-2">الموضع: بجانب رقم الفاتورة في Header</div>
                <div className="text-xs text-gray-500">الحجم الافتراضي: 80px (صغير ومريح)</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حجم QR Code (px)</label>
                <input type="number" name="qrCodeSize" value={invoicePrint.qrCodeSize} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" min="50" max="120" disabled={!invoicePrint.showQrCode} />
                <div className="text-xs text-gray-500 mt-1">مُوصى به: 60-80px (لا يضخم الصفحة)</div>
              </div>
            </div>
          </div>

          {/* الوسم المائي */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">الوسم المائي</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="watermark.enabled" checked={!!invoicePrint.watermark.enabled} onChange={handleInvoicePrintChange} />
                <span className="text-sm font-medium text-gray-700">تفعيل الوسم المائي</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نص الوسم المائي</label>
                <input name="watermark.text" value={invoicePrint.watermark.text} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" disabled={!invoicePrint.watermark.enabled} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الشفافية (0-1)</label>
                <input type="number" name="watermark.opacity" value={invoicePrint.watermark.opacity} onChange={handleInvoicePrintChange} step="0.1" className="w-full border rounded-md p-2 text-sm" min="0" max="1" disabled={!invoicePrint.watermark.enabled} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموضع</label>
                <select name="watermark.position" value={invoicePrint.watermark.position} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" disabled={!invoicePrint.watermark.enabled}>
                  <option value="center">وسط</option>
                  <option value="top-left">أعلى يسار</option>
                  <option value="top-right">أعلى يمين</option>
                  <option value="bottom-left">أسفل يسار</option>
                  <option value="bottom-right">أسفل يمين</option>
                </select>
              </div>
            </div>
          </div>

          {/* العملة والأرقام */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">تنسيق العملة والأرقام</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" name="currency.showSymbol" checked={!!invoicePrint.currency.showSymbol} onChange={handleInvoicePrintChange} />
                  <span className="text-sm font-medium text-gray-700">إظهار رمز العملة</span>
                </label>
                <select name="currency.symbolPosition" value={invoicePrint.currency.symbolPosition} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" disabled={!invoicePrint.currency.showSymbol}>
                  <option value="before">قبل الرقم</option>
                  <option value="after">بعد الرقم</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" name="currency.showCode" checked={!!invoicePrint.currency.showCode} onChange={handleInvoicePrintChange} />
                  <span className="text-sm font-medium text-gray-700">إظهار رمز العملة (Code)</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عدد الأرقام العشرية</label>
                <input type="number" name="numberFormat.decimalPlaces" value={invoicePrint.numberFormat.decimalPlaces} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" min="0" max="4" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">فاصل الآلاف</label>
                <input name="numberFormat.thousandSeparator" value={invoicePrint.numberFormat.thousandSeparator} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" maxLength="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">فاصل العشرية</label>
                <input name="numberFormat.decimalSeparator" value={invoicePrint.numberFormat.decimalSeparator} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" maxLength="1" />
              </div>
            </div>
          </div>

          {/* المسافات */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">المسافات</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مسافة بين الأقسام (px)</label>
                <input type="number" name="spacing.section" value={invoicePrint.spacing.section} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" min="0" max="50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مسافة بين العناصر (px)</label>
                <input type="number" name="spacing.item" value={invoicePrint.spacing.item} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" min="0" max="30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مسافة بين الفقرات (px)</label>
                <input type="number" name="spacing.paragraph" value={invoicePrint.spacing.paragraph} onChange={handleInvoicePrintChange} className="w-full border rounded-md p-2 text-sm" min="0" max="30" />
              </div>
            </div>
          </div>

          {/* فاصل الصفحات */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">فاصل الصفحات</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="pageBreak.avoidItems" checked={!!invoicePrint.pageBreak.avoidItems} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">تجنب تقسيم العناصر بين الصفحات</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="pageBreak.avoidCustomerInfo" checked={!!invoicePrint.pageBreak.avoidCustomerInfo} onChange={handleInvoicePrintChange} />
                <span className="text-sm text-gray-700">تجنب تقسيم معلومات العميل</span>
              </label>
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
                          lang="en"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
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
