# 🛒 خطة اختبار وحدة Purchase Orders
## Purchase Orders Module Testing Plan

**التاريخ:** 2025-11-14  
**الحجم:** متوسط | **التعقيد:** متوسط | **الأولوية:** عالية

---

## 📋 نظرة عامة
**الوصف:** أوامر الشراء - إدارة طلبات الشراء من الموردين.

**المكونات:**
- **Backend:** 8 routes (GET /stats, GET /, GET /:id, POST /, PUT /:id, PATCH /:id/approve, PATCH /:id/reject, DELETE /:id)
- **Frontend:** 2 pages (PurchaseOrdersPage, PurchaseOrderForm)
- **Database:** 2 tables (PurchaseOrder, PurchaseOrderItem)

---

## ✅ الجوانب الإيجابية
- ✅ CRUD كامل
- ✅ دعم workflow (approve, reject)
- ✅ دعم statistics
- ✅ دعم filtering و pagination
- ✅ ربط مع Vendor و InventoryItem

---

## ❌ النواقص والمشاكل
- ❌ لا يوجد authentication middleware
- ❌ لا يوجد input validation شامل
- ❌ لا يوجد integration مع Inventory عند receipt

---

## 🧪 خطة الاختبار

| # | Test Case | Priority |
|---|-----------|----------|
| 1 | View all purchase orders | High |
| 2 | Create purchase order | High |
| 3 | Update purchase order | High |
| 4 | Approve purchase order | High |
| 5 | Reject purchase order | High |
| 6 | Delete purchase order | Medium |
| 7 | View purchase order stats | Medium |

---

**ملاحظة:** ملف مختصر - التفاصيل الكاملة في ملف Authentication كأمثلة.

