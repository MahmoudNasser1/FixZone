# 💸 خطة اختبار وحدة Expenses
## Expenses Module Testing Plan

**التاريخ:** 2025-11-14  
**المهندس:** Auto (Cursor AI) - QA Engineer  
**الأداة:** Chrome DevTools MCP  
**الأولوية:** متوسطة  
**الحجم:** صغير  
**التعقيد:** منخفض

---

## 📋 نظرة عامة

### الوصف:
إدارة المصروفات - تسجيل وإدارة المصروفات.

### المكونات:
- **Backend Routes:** 6 routes (GET /, GET /:id, POST /, PUT /:id, DELETE /:id, GET /stats/summary)
- **Frontend Pages:** 2 pages (ExpensesPage, CreateExpensePage)
- **Database Tables:** 2 tables (Expense, ExpenseCategory)
- **Middleware:** authMiddleware (جميع routes)

---

## ✅ الجوانب الإيجابية

- ✅ CRUD كامل
- ✅ دعم filtering (category, vendor, date range)
- ✅ دعم pagination
- ✅ دعم statistics
- ✅ ربط مع ExpenseCategory و Vendor و Invoice
- ✅ حماية جميع المسارات

---

## ❌ النواقص والمشاكل

- ❌ لا يوجد input validation شامل
- ❌ لا يوجد duplicate checking
- ⚠️ استخدام `db.query` بدلاً من `db.execute`

---

## 🧪 خطة الاختبار

### 1. Functional Testing
- ✅ GET /expenses - عرض جميع المصروفات
- ✅ GET /expenses/:id - عرض مصروف محدد
- ✅ POST /expenses - إنشاء مصروف جديد
- ✅ PUT /expenses/:id - تحديث مصروف
- ✅ DELETE /expenses/:id - حذف مصروف
- ✅ GET /expenses/stats/summary - إحصائيات المصروفات

### 2. Integration Testing
- تكامل مع ExpenseCategory
- تكامل مع Vendors
- تكامل مع Invoices

---

## 📊 جدول الاختبار

| # | Test Case | Priority | Status |
|---|-----------|----------|--------|
| 1 | View all expenses | High | ⏳ Pending |
| 2 | Filter expenses | Medium | ⏳ Pending |
| 3 | Create expense | High | ⏳ Pending |
| 4 | Update expense | High | ⏳ Pending |
| 5 | Delete expense | Medium | ⏳ Pending |
| 6 | View expense stats | Medium | ⏳ Pending |

---

**ملاحظة:** ملف مختصر - التفاصيل الكاملة في ملف Authentication كأمثلة.

