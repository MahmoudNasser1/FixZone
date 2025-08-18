import React, { useEffect, useState, useMemo } from 'react';
import { useSettings } from '../../context/SettingsContext';
import api from '../../services/api';

const tabs = [
  { key: 'general', label: 'عام' },
  { key: 'currency', label: 'العملة' },
  { key: 'printing', label: 'الطباعة' },
  { key: 'receiptPrint', label: 'إيصال الاستلام' },
  { key: 'locale', label: 'المحلية واللغة' },
  { key: 'systemSettings', label: 'إعدادات النظام العامة' },
];

export default function SystemSettingsPage() {
  const { settings, setSettings, formatMoney } = useSettings();

  const [active, setActive] = useState('general');

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

  // Load system settings when tab becomes active
  useEffect(() => {
    if (active !== 'systemSettings') return;
    let mounted = true;
    const loadSys = async () => {
      try {
        setSysLoading(true);
        const list = await api.listSystemSettings();
        if (!mounted) return;
        setSysItems(Array.isArray(list) ? list : (list.items || []));
        setSysError('');
      } catch (e) {
        if (!mounted) return;
        setSysError('تعذر تحميل إعدادات النظام');
      } finally {
        if (mounted) setSysLoading(false);
      }
    };
    loadSys();
    return () => { mounted = false; };
  }, [active]);

  const handleSysEdit = async (key) => {
    try {
      const item = await api.getSystemSetting(key);
      setEditingKey(key);
      setSysForm({ key, value: item?.value ?? '', description: item?.description ?? '' });
    } catch (e) {
      alert('تعذر جلب الإعداد');
    }
  };

  const handleSysDelete = async (key) => {
    if (!confirm('حذف هذا الإعداد؟')) return;
    const prev = sysItems;
    setSysItems((items) => items.filter((i) => i.key !== key));
    try {
      await api.deleteSystemSetting(key);
    } catch (e) {
      alert('تعذر الحذف');
      setSysItems(prev);
    }
  };

  const handleSysSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { key: sysForm.key.trim(), value: sysForm.value, description: sysForm.description };
      if (!payload.key) {
        alert('المفتاح مطلوب');
        return;
      }
      if (editingKey && editingKey === payload.key) {
        await api.updateSystemSetting(payload.key, payload);
      } else if (editingKey && editingKey !== payload.key) {
        // تغيير المفتاح: أنشئ جديد ثم احذف القديم
        await api.createSystemSetting(payload);
        await api.deleteSystemSetting(editingKey);
      } else {
        await api.createSystemSetting(payload);
      }
      // تحديث القائمة محلياً
      const next = sysItems.filter((i) => i.key !== (editingKey || payload.key));
      next.push(payload);
      next.sort((a, b) => a.key.localeCompare(b.key));
      setSysItems(next);
      setEditingKey('');
      setSysForm({ key: '', value: '', description: '' });
      alert('تم الحفظ');
    } catch (e) {
      alert('تعذر الحفظ');
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

  const handleSave = () => {
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
    alert('تم حفظ الإعدادات بنجاح');
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
      alert('تم حفظ إعدادات إيصال الاستلام بنجاح');
    } catch (e) {
      console.error(e);
      alert('تعذر حفظ إعدادات الإيصال');
    }
  };

  const PreviewCurrency = useMemo(() => (
    <span className="inline-block text-sm text-gray-600">
      مثال: {formatMoney(12345.67)}
    </span>
  ), [formatMoney]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">إعدادات النظام</h1>
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 border rounded bg-blue-600 text-white">حفظ</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-auto mb-4 border-b pb-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={[
              'px-3 py-1 rounded',
              active === t.key ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'general' && (
        <section className="space-y-4 max-w-3xl">
          <h2 className="font-semibold">معلومات الشركة والهوية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">اسم الشركة</label>
              <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">رقم الهاتف</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">العنوان</label>
              <input name="address" value={form.address} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">الموقع</label>
              <input name="website" value={form.website} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">رابط الشعار (Logo URL)</label>
              <input name="logoUrl" value={form.logoUrl} onChange={handleChange} className="w-full border rounded p-2" />
              <div className="text-xs text-gray-500 mt-1">يمكنك رفع الشعار داخل مجلد public واستخدام المسار مثل /logo.png</div>
            </div>
          </div>
        </section>
      )}

      {active === 'receiptPrint' && (
        <section className="space-y-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">إعدادات إيصال الاستلام</h2>
            <button onClick={handleSavePrint} className="px-4 py-2 border rounded bg-blue-600 text-white">حفظ</button>
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
            {sysLoading && <div className="text-sm text-gray-500">جاري التحميل...</div>}
          </div>
          {sysError && <div className="text-red-600 text-sm">{sysError}</div>}

          <form onSubmit={handleSysSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border rounded p-3 bg-white">
            <div>
              <label className="block text-sm text-gray-600 mb-1">المفتاح (Key)</label>
              <input value={sysForm.key} onChange={(e) => setSysForm({ ...sysForm, key: e.target.value })} className="w-full border rounded p-2" placeholder="مثال: defaultBranch" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">القيمة (Value)</label>
              <input value={sysForm.value} onChange={(e) => setSysForm({ ...sysForm, value: e.target.value })} className="w-full border rounded p-2" placeholder="قيمة نصية أو JSON" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الوصف</label>
              <input value={sysForm.description} onChange={(e) => setSysForm({ ...sysForm, description: e.target.value })} className="w-full border rounded p-2" placeholder="وصف مختصر" />
            </div>
            <div className="md:col-span-4 flex gap-2 justify-end">
              {editingKey && (
                <button type="button" onClick={() => { setEditingKey(''); setSysForm({ key: '', value: '', description: '' }); }} className="px-3 py-2 border rounded">إلغاء</button>
              )}
              <button type="submit" className="px-4 py-2 rounded text-white bg-blue-600">{editingKey ? 'تحديث' : 'إضافة'}</button>
            </div>
          </form>

          <div className="overflow-auto border rounded bg-white">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-right border-b">المفتاح</th>
                  <th className="p-2 text-right border-b">القيمة</th>
                  <th className="p-2 text-right border-b">الوصف</th>
                  <th className="p-2 text-right border-b">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {sysItems.sort((a, b) => a.key.localeCompare(b.key)).map((it) => (
                  <tr key={it.key}>
                    <td className="p-2 border-b align-top font-mono text-sm">{it.key}</td>
                    <td className="p-2 border-b align-top">
                      <pre className="text-xs whitespace-pre-wrap break-words">{String(it.value)}</pre>
                    </td>
                    <td className="p-2 border-b align-top text-sm text-gray-600">{it.description}</td>
                    <td className="p-2 border-b align-top">
                      <div className="flex gap-2">
                        <button onClick={() => handleSysEdit(it.key)} className="px-3 py-1 rounded bg-gray-200">تعديل</button>
                        <button onClick={() => handleSysDelete(it.key)} className="px-3 py-1 rounded bg-red-600 text-white">حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
