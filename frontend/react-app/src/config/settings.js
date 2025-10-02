// Global settings (frontend) with localStorage persistence
// Default: Egypt company info and EGP currency
const STORAGE_KEY = 'fixzone_settings_v1';

export const defaultSettings = {
  company: {
    name: 'FixZone',
    address: 'مول البستان التجاري - الدور الأرضي',
    city: 'القاهرة',
    country: 'مصر',
    phone: '01270388043',
    website: '',
    logoUrl: '/logo.png',
  },
  currency: {
    code: 'EGP',
    symbol: 'ج.م',
    name: 'الجنيه المصري',
    locale: 'ar-EG',
    minimumFractionDigits: 2,
    position: 'after', // before | after (رمز العملة بعد الرقم)
  },
  printing: {
    defaultCopy: 'customer', // customer | archive
    showWatermark: true,
    paperSize: 'A4',
    showSerialBarcode: true,
  },
  locale: {
    rtl: true,
    dateFormat: 'yyyy/MM/dd',
  },
  receipt: {
    terms: `
1. الشركة غير مسؤولة عن ضياع البيانات؛ يُنصح بأخذ نسخة احتياطية.
2. في حال عدم استلام الجهاز خلال 30 يومًا تُحتسب أرضية تخزين.
3. قد يتم استخدام قطع بديلة أصلية/متوافقة حسب التوفر.
4. الموافقة على الفحص قد تستلزم رسومًا في حال عدم إتمام الإصلاح.
    `.trim(),
  },
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed,
      company: { ...defaultSettings.company, ...(parsed.company||{}) },
      currency: { ...defaultSettings.currency, ...(parsed.currency||{}) },
      printing: { ...defaultSettings.printing, ...(parsed.printing||{}) },
      locale: { ...defaultSettings.locale, ...(parsed.locale||{}) },
      receipt: { ...defaultSettings.receipt, ...(parsed.receipt||{}) },
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function formatMoney(amount, settings) {
  const cfg = (settings && settings.currency) || defaultSettings.currency;
  try {
    return new Intl.NumberFormat(cfg.locale || 'ar-EG', {
      style: 'currency', currency: cfg.code || 'EGP', minimumFractionDigits: cfg.minimumFractionDigits ?? 2,
    }).format(Number(amount || 0));
  } catch {
    return `${amount} ${cfg.code || 'EGP'}`;
  }
}
