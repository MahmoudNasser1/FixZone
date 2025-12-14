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
    logoUrl: '/Fav.png',
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

// Helper function to remove trailing zeros from number string
function removeTrailingZeros(numStr) {
  if (!numStr || typeof numStr !== 'string') return numStr;
  // Remove trailing zeros and decimal point if all zeros
  return numStr.replace(/\.0+$/, '').replace(/(\d+\.\d*?)0+$/, '$1');
}

export function formatMoney(amount, settings) {
  const cfg = (settings && settings.currency) || defaultSettings.currency;
  try {
    const numAmount = Number(amount || 0);
    
    // Format with currency, but we'll remove trailing zeros
    const formatted = new Intl.NumberFormat(cfg.locale || 'ar-EG', {
      style: 'currency',
      currency: cfg.code || 'EGP',
      minimumFractionDigits: 0, // Start with 0, we'll add decimals only if needed
      maximumFractionDigits: 2, // Max 2 decimals
    }).format(numAmount);
    
    // Remove trailing zeros from the formatted string
    const cleaned = removeTrailingZeros(formatted);
    
    // Apply position if specified (before/after)
    if (cfg.position === 'before' && cfg.symbol) {
      const numStr = parseFloat(numAmount.toString()).toString();
      return `${cfg.symbol} ${numStr}`;
    }
    
    return cleaned;
  } catch {
    const numStr = parseFloat(Number(amount || 0).toString()).toString();
    return `${numStr} ${cfg.code || 'EGP'}`;
  }
}

/**
 * Format date according to locale settings
 */
export function formatDate(date, settings) {
  const cfg = (settings && settings.locale) || defaultSettings.locale;
  const dateFormat = cfg.dateFormat || 'yyyy/MM/dd';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return date || '';
    }
    
    // Simple date formatting (can be enhanced with date-fns or moment.js)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return dateFormat
      .replace('yyyy', year)
      .replace('MM', month)
      .replace('dd', day)
      .replace('yy', String(year).slice(-2));
  } catch {
    return date || '';
  }
}
