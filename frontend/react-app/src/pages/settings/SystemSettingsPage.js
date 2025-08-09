import React, { useMemo, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';

const tabs = [
  { key: 'general', label: 'عام' },
  { key: 'currency', label: 'العملة' },
  { key: 'printing', label: 'الطباعة' },
  { key: 'locale', label: 'المحلية واللغة' },
  { key: 'receipt', label: 'الإيصالات' },
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
