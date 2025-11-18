# 📝 خطة اختبار وحدة Stock Movements
## Stock Movements Module Testing Plan

**التاريخ:** 2025-11-14  
**الحجم:** متوسط | **التعقيد:** متوسط | **الأولوية:** عالية

---

## 📋 نظرة عامة
**الوصف:** حركات المخزون - تتبع جميع حركات المخزون (IN, OUT, TRANSFER).

**المكونات:**
- **Backend:** 6 routes (GET /, GET /inventory/:itemId, GET /:id, POST /, PUT /:id, DELETE /:id)
- **Frontend:** 1 page (StockMovementPage)
- **Database:** 1 table (StockMovement)

---

## ✅ الجوانب الإيجابية
- ✅ CRUD كامل مع authMiddleware
- ✅ دعم filtering (type, item, warehouse, date range)
- ✅ دعم pagination
- ✅ ربط مع InventoryItem, Warehouse, User
- ✅ تحديث StockLevel تلقائياً

---

## ❌ النواقص والمشاكل
- ❌ لا يوجد input validation شامل
- ⚠️ استخدام `db.query` في بعض الأماكن

---

## 🧪 خطة الاختبار

| # | Test Case | Priority |
|---|-----------|----------|
| 1 | View all movements | High |
| 2 | Filter movements | Medium |
| 3 | Create IN movement | High |
| 4 | Create OUT movement | High |
| 5 | Create TRANSFER movement | High |
| 6 | Update movement | Medium |
| 7 | Delete movement | Medium |
| 8 | Verify stock level update | Critical |

---

**ملاحظة:** ملف مختصر - التفاصيل الكاملة في ملف Authentication كأمثلة.

