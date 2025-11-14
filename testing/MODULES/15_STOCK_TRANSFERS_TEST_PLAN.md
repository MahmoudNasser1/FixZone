# 🔄 خطة اختبار وحدة Stock Transfers
## Stock Transfers Module Testing Plan

**التاريخ:** 2025-11-14  
**الحجم:** متوسط | **التعقيد:** متوسط | **الأولوية:** عالية

---

## 📋 نظرة عامة
**الوصف:** نقل المخزون - إدارة نقل المخزون بين المخازن.

**المكونات:**
- **Backend:** ~8 routes (GET /, GET /:id, POST /, PUT /:id, PATCH /:id/approve, PATCH /:id/ship, PATCH /:id/receive, DELETE /:id)
- **Frontend:** 1 page (StockTransferPage)
- **Database:** 2 tables (StockTransfer, StockTransferItem)

---

## ✅ الجوانب الإيجابية
- ✅ CRUD كامل مع authMiddleware
- ✅ دعم workflow (approve, ship, receive)
- ✅ تحديث StockLevel تلقائياً
- ✅ إنشاء StockMovement تلقائياً
- ✅ دعم transactions للضمانات

---

## ❌ النواقص والمشاكل
- ❌ لا يوجد input validation شامل
- ❌ لا يوجد validation للكمية المتاحة

---

## 🧪 خطة الاختبار

| # | Test Case | Priority |
|---|-----------|----------|
| 1 | View all transfers | High |
| 2 | Create transfer | High |
| 3 | Approve transfer | High |
| 4 | Ship transfer | High |
| 5 | Receive transfer | Critical |
| 6 | Verify stock level update | Critical |
| 7 | Verify stock movement creation | High |

---

**ملاحظة:** ملف مختصر - التفاصيل الكاملة في ملف Authentication كأمثلة.

