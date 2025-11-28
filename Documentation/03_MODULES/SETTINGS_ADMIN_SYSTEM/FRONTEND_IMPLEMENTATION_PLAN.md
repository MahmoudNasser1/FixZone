# خطة تطوير Frontend - نظام الإعدادات
## Frontend Implementation Plan - Settings System

**تاريخ:** 2025-01-28  
**الحالة:** 🟡 قيد التطوير

---

## ✅ ما تم إنجازه

### 1. API Service
- [x] إضافة APIs جديدة في `api.js`
- [x] دعم جميع الـ endpoints الجديدة
- [x] Backup/Restore APIs
- [x] Import/Export APIs

---

## 📋 الخطوات التالية

### Phase 1: تقسيم SystemSettingsPage.js

**المشكلة الحالية:**
- SystemSettingsPage.js = 2637 سطر (كبير جداً)
- كل شيء في ملف واحد
- صعب الصيانة والتطوير

**الحل:**
تقسيم الصفحة إلى صفحات أصغر:

1. **SettingsDashboard.js** - Dashboard رئيسي
2. **GeneralSettingsPage.js** - إعدادات عامة
3. **CurrencySettingsPage.js** - إعدادات العملة
4. **PrintingSettingsPage.js** - إعدادات الطباعة
5. **MessagingSettingsPage.js** - إعدادات المراسلة
6. **LocaleSettingsPage.js** - إعدادات المحلية
7. **SystemSettingsPage.js** (محدث) - إعدادات النظام
8. **VariablesSettingsPage.js** - متغيرات النظام
9. **AdvancedSettingsPage.js** - إعدادات متقدمة

### Phase 2: إنشاء Components

**Components المطلوبة:**
1. **SettingsCard.js** - Card للإعدادات
2. **SettingsForm.js** - Form للإعدادات
3. **SettingsInput.js** - Input للإعدادات
4. **SettingsSelect.js** - Select للإعدادات
5. **SettingsToggle.js** - Toggle للإعدادات
6. **SettingsCategoryTabs.js** - Tabs للفئات
7. **SettingsSearch.js** - بحث في الإعدادات
8. **SettingsHistory.js** - تاريخ الإعدادات
9. **SettingsBackup.js** - النسخ الاحتياطية
10. **SettingsImportExport.js** - الاستيراد/التصدير

### Phase 3: إنشاء Hooks

**Hooks المطلوبة:**
1. **useSettings.js** - Hook للإعدادات
2. **useSettingsHistory.js** - Hook للتاريخ
3. **useSettingsBackup.js** - Hook للنسخ الاحتياطية
4. **useSettingsImportExport.js** - Hook للاستيراد/التصدير

### Phase 4: تحديث Context API

**SettingsContext.js (Enhanced):**
- دعم Caching
- دعم Real-time updates
- دعم Error handling
- دعم Loading states

---

## 🎯 الأولويات

### Priority 1: Core Functionality
1. ✅ API Service - مكتمل
2. ⏭️ تقسيم SystemSettingsPage.js
3. ⏭️ إنشاء Components الأساسية
4. ⏭️ تحديث Context API

### Priority 2: Advanced Features
1. ⏭️ History UI
2. ⏭️ Backup/Restore UI
3. ⏭️ Import/Export UI
4. ⏭️ Search & Filter UI

### Priority 3: Polish
1. ⏭️ Error Boundaries
2. ⏭️ Loading States
3. ⏭️ Help/Documentation
4. ⏭️ Responsive Design

---

## 📝 ملاحظات

- Backend جاهز 100%
- APIs جاهزة للاستخدام
- يمكن البدء بتطوير Frontend مباشرة
- يجب الحفاظ على التوافق مع الكود القديم

---

**الحالة:** 🟡 جاهز للبدء

