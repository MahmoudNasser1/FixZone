# 👥 خطة اختبار وحدة Customer Management
## Customer Management Module Testing Plan

**التاريخ:** 2025-11-14  
**المهندس:** Auto (Cursor AI) - QA Engineer  
**الأداة:** Chrome DevTools MCP  
**الأولوية:** عالية  
**الحجم:** متوسط  
**التعقيد:** متوسط

---

## 📋 نظرة عامة

### الوصف:
إدارة العملاء - عرض وإدارة عملاء المركز.

### المكونات:
- **Backend Routes:** 8 routes (GET /, GET /search, GET /:id, POST /, PUT /:id, DELETE /:id, GET /:id/stats, GET /:id/repairs)
- **Frontend Pages:** 4 pages (CustomersPage, NewCustomerPage, CustomerDetailsPage, EditCustomerPage)
- **Database Tables:** 1 table (Customer)
- **Middleware:** authMiddleware (في بعض routes فقط)

---

## ✅ الجوانب الإيجابية

- ✅ CRUD كامل
- ✅ دعم search
- ✅ دعم pagination
- ✅ دعم statistics
- ✅ دعم عرض طلبات الإصلاح
- ✅ دعم customFields (JSON)
- ✅ ربط مع Company

---

## ❌ النواقص والمشاكل

- ❌ لا يوجد authentication middleware في جميع routes
- ❌ لا يوجد input validation
- ❌ لا يوجد duplicate checking
- ⚠️ استخدام `db.query` بدلاً من `db.execute`

---

## 🧪 خطة الاختبار

### 1. Functional Testing
- ✅ GET /customers - عرض جميع العملاء
- ✅ GET /customers/search - بحث عن عملاء
- ✅ GET /customers/:id - عرض عميل محدد
- ✅ POST /customers - إنشاء عميل جديد
- ✅ PUT /customers/:id - تحديث عميل
- ✅ DELETE /customers/:id - حذف عميل
- ✅ GET /customers/:id/stats - إحصائيات العميل
- ✅ GET /customers/:id/repairs - طلبات إصلاح العميل

### 2. Integration Testing
- تكامل مع Companies
- تكامل مع Repairs
- تكامل مع Invoices

---

## 📊 جدول الاختبار

| # | Test Case | Priority | Status |
|---|-----------|----------|--------|
| 1 | View all customers | High | ⏳ Pending |
| 2 | Search customers | High | ⏳ Pending |
| 3 | Create customer | High | ⏳ Pending |
| 4 | Update customer | High | ⏳ Pending |
| 5 | Delete customer | Medium | ⏳ Pending |
| 6 | View customer stats | Medium | ⏳ Pending |
| 7 | View customer repairs | Medium | ⏳ Pending |

---

**ملاحظة:** ملف مختصر - التفاصيل الكاملة في ملف Authentication كأمثلة.

