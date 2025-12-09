# 🎨 FixZone Brand Colors
## Brand Color Palette - استخراج من اللوجو

**التاريخ**: 2025-11-23  
**المصدر**: `IN/logo.png`

---

## 🎯 اللون الأساسي - Primary Brand Color

### Dark Blue (الأزرق الغامق)
```css
--fixzone-primary: #053887;
--fixzone-primary-rgb: 5, 56, 135;
```

**الاستخدام**:
- Logo background
- Primary buttons
- Headers
- Important CTAs
- Brand elements

---

## 🌈 الألوان المشتقة - Derived Colors

### Primary Shades (تدرجات الأساسي)

```css
/* Lighter variants */
--fixzone-primary-light: #0a4da3;    /* أفتح 20% */
--fixzone-primary-lighter: #1562bf;  /* أفتح 40% */
--fixzone-primary-lightest: #e8f0f9; /* للخلفيات */

/* Darker variants */
--fixzone-primary-dark: #042d6b;     /* أغمق 20% */
--fixzone-primary-darker: #03224f;   /* أغمق 40% */
```

### Complementary Colors (ألوان مكملة)

```css
/* Orange - للـ CTAs و Highlights */
--fixzone-accent: #FF8C42;
--fixzone-accent-light: #FFB380;
--fixzone-accent-dark: #E67325;

/* Success Green */
--fixzone-success: #10B981;
--fixzone-success-light: #34D399;
--fixzone-success-dark: #059669;

/* Warning Orange */
--fixzone-warning: #F59E0B;
--fixzone-warning-light: #FCD34D;
--fixzone-warning-dark: #D97706;

/* Error Red */
--fixzone-error: #EF4444;
--fixzone-error-light: #F87171;
--fixzone-error-dark: #DC2626;

/* Info Blue */
--fixzone-info: #3B82F6;
--fixzone-info-light: #60A5FA;
--fixzone-info-dark: #2563EB;
```

### Neutral Colors (ألوان محايدة)

```css
/* Grays */
--fixzone-gray-50: #F9FAFB;
--fixzone-gray-100: #F3F4F6;
--fixzone-gray-200: #E5E7EB;
--fixzone-gray-300: #D1D5DB;
--fixzone-gray-400: #9CA3AF;
--fixzone-gray-500: #6B7280;
--fixzone-gray-600: #4B5563;
--fixzone-gray-700: #374151;
--fixzone-gray-800: #1F2937;
--fixzone-gray-900: #111827;
```

---

## 🎨 Gradients (التدرجات)

### Primary Gradients

```css
/* Main Brand Gradient */
--gradient-brand: linear-gradient(135deg, #053887 0%, #0a4da3 100%);

/* Hero Gradient */
--gradient-hero: linear-gradient(135deg, #053887 0%, #1562bf 50%, #3b82f6 100%);

/* Subtle Background */
--gradient-bg: linear-gradient(135deg, #e8f0f9 0%, #f9fafb 100%);

/* Button Hover */
--gradient-button: linear-gradient(135deg, #042d6b 0%, #053887 50%, #0a4da3 100%);
```

### Accent Gradients

```css
/* Success */
--gradient-success: linear-gradient(135deg, #059669 0%, #10B981 100%);

/* Warning */
--gradient-warning: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);

/* Error */
--gradient-error: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
```

---

## 📐 استخدامات الألوان حسب العنصر

### Buttons

```css
/* Primary Button */
background: var(--gradient-brand);
color: white;
hover: var(--gradient-button);

/* Secondary Button */
background: var(--fixzone-gray-100);
color: var(--fixzone-primary);
border: 1px solid var(--fixzone-primary);

/* Success Button */
background: var(--gradient-success);
color: white;

/* Danger Button */
background: var(--gradient-error);
color: white;
```

### Cards & Containers

```css
/* Main Card */
background: white;
border: 1px solid var(--fixzone-gray-200);
shadow: 0 4px 6px rgba(5, 56, 135, 0.1);

/* Highlighted Card */
background: var(--fixzone-primary-lightest);
border-left: 4px solid var(--fixzone-primary);

/* Success Card */
background: rgba(16, 185, 129, 0.05);
border-left: 4px solid var(--fixzone-success);
```

### Text Colors

```css
/* Primary Text */
color: var(--fixzone-gray-900);

/* Secondary Text */
color: var(--fixzone-gray-600);

/* Muted Text */
color: var(--fixzone-gray-400);

/* Link */
color: var(--fixzone-primary);
hover: var(--fixzone-primary-dark);

/* Brand Text */
color: var(--fixzone-primary);
font-weight: 700;
```

### Backgrounds

```css
/* Main Background */
background: var(--fixzone-gray-50);

/* Section Background */
background: white;

/* Hero Background */
background: var(--gradient-hero);

/* Alert Backgrounds */
success: rgba(16, 185, 129, 0.1);
warning: rgba(245, 158, 11, 0.1);
error: rgba(239, 68, 68, 0.1);
info: rgba(59, 130, 246, 0.1);
```

---

## 🎯 أمثلة الاستخدام

### Login Page
```css
Logo: var(--fixzone-primary)
Background: var(--gradient-bg)
Card: white with shadow
Button: var(--gradient-brand)
Links: var(--fixzone-primary)
```

### Customer Dashboard
```css
Header: var(--gradient-brand)
Stats Cards: white with var(--fixzone-primary) accents
Quick Actions: var(--fixzone-accent) for CTAs
Success States: var(--gradient-success)
```

### Technician Dashboard
```css
Header: var(--gradient-brand)
Job Cards: white with var(--fixzone-primary) borders
Active Jobs: var(--gradient-warning)
Completed Jobs: var(--gradient-success)
```

---

## ✅ Brand Guidelines

### Do's ✅
- استخدم `--fixzone-primary` (#053887) في كل مكان مهم
- استخدم الـ gradients للـ premium feel
- حافظ على contrast جيد للـ accessibility
- استخدم الألوان المكملة بحذر (accent colors)

### Don'ts ❌
- لا تستخدم ألوان مختلفة عن الـ palette
- لا تستخدم الـ primary color للـ text على خلفية داكنة
- لا تكثر من الـ gradients في كل مكان
- لا تستخدم ألوان فاتحة جداً تضيع على الخلفية البيضاء

---

**آخر تحديث**: 2025-11-23  
**الحالة**: ✅ جاهز للاستخدام
