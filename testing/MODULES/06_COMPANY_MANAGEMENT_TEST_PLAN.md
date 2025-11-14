# 🏢 خطة اختبار وحدة Company Management
## Company Management Module Testing Plan

**التاريخ:** 2025-11-14  
**المهندس:** Auto (Cursor AI) - QA Engineer  
**الأداة:** Chrome DevTools MCP  
**الأولوية:** متوسطة  
**الحجم:** صغير  
**التعقيد:** منخفض

---

## 📋 نظرة عامة

### الوصف:
إدارة الشركات - عرض وإدارة الشركات العملاء.

### المكونات:
- **Backend Routes:** 6 routes (GET /, GET /:id, POST /, PUT /:id, DELETE /:id, GET /:id/customers)
- **Frontend Pages:** 4 pages (CompaniesPage, NewCompanyPage, CompanyDetailsPage, EditCompanyPage)
- **Database Tables:** 1 table (Company)
- **Middleware:** لا يوجد (يجب إضافته)

---

## ✅ الجوانب الإيجابية

- ✅ CRUD كامل
- ✅ دعم pagination
- ✅ دعم search
- ✅ عرض عملاء الشركة
- ✅ دعم customFields (JSON)

---

## ❌ النواقص والمشاكل

### 1. ⚠️ نقص في الميزات
- ❌ لا يوجد authentication middleware
- ❌ لا يوجد validation للـ email و phone
- ❌ لا يوجد duplicate checking
- ❌ لا يوجد soft delete في بعض العمليات

### 2. ⚠️ مشاكل في الـ Backend
- ⚠️ استخدام `db.query` بدلاً من `db.execute`
- ⚠️ لا يوجد input validation

---

## 💡 اقتراحات التحسين

- إضافة authentication middleware
- إضافة input validation
- إضافة duplicate checking
- إضافة soft delete في جميع العمليات

---

## 🧪 خطة الاختبار

### 1. Functional Testing
- ✅ GET /companies - عرض جميع الشركات
- ✅ GET /companies/:id - عرض شركة محددة
- ✅ POST /companies - إنشاء شركة جديدة
- ✅ PUT /companies/:id - تحديث شركة
- ✅ DELETE /companies/:id - حذف شركة
- ✅ GET /companies/:id/customers - عرض عملاء الشركة

### 2. Security Testing
- ❌ الوصول بدون authentication (يجب أن يكون محمي)
- ❌ SQL Injection
- ❌ XSS

---

## 📊 جدول الاختبار

| # | Test Case | Priority | Status |
|---|-----------|----------|--------|
| 1 | View all companies | High | ⏳ Pending |
| 2 | Create company | High | ⏳ Pending |
| 3 | Update company | High | ⏳ Pending |
| 4 | Delete company | Medium | ⏳ Pending |
| 5 | View company customers | Medium | ⏳ Pending |
| 6 | Search companies | Medium | ⏳ Pending |

---

**ملاحظة:** ملف مختصر - التفاصيل الكاملة في ملف Authentication كأمثلة.

