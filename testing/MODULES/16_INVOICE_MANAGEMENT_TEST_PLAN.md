# 💰 خطة اختبار وحدة Invoice Management
## Invoice Management Module Testing Plan

**التاريخ:** 2025-11-14  
**الحجم:** كبير | **التعقيد:** عالي | **الأولوية:** حرجة

---

## 📋 نظرة عامة
**الوصف:** إدارة الفواتير - إنشاء وإدارة فواتير البيع والشراء.

**المكونات:**
- **Backend:** ~10 routes (GET /, GET /:id, POST /, PUT /:id, DELETE /:id, GET /:id/items, POST /:id/items, etc.)
- **Frontend:** 5 pages (InvoicesPage, InvoiceDetailsPage, CreateInvoicePage, EditInvoicePage, InvoiceTemplatesPage)
- **Database:** 2 tables (Invoice, InvoiceItem)

---

## ✅ الجوانب الإيجابية
- ✅ CRUD كامل
- ✅ دعم فواتير البيع والشراء (sale/purchase)
- ✅ ربط مع Customer, Vendor, RepairRequest
- ✅ ربط مع InventoryItem
- ✅ دعم InvoiceItems
- ✅ دعم طباعة الفواتير

---

## ❌ النواقص والمشاكل
- ❌ لا يوجد authentication middleware في بعض routes
- ❌ لا يوجد input validation شامل
- ❌ لا يوجد validation للمبالغ

---

## 🧪 خطة الاختبار

| # | Test Case | Priority |
|---|-----------|----------|
| 1 | View all invoices | High |
| 2 | Filter invoices (sale/purchase) | High |
| 3 | Create sale invoice | Critical |
| 4 | Create purchase invoice | Critical |
| 5 | Create invoice with customer | High |
| 6 | Create invoice with repair request | High |
| 7 | Add invoice item (service) | High |
| 8 | Add invoice item (inventory) | High |
| 9 | Update invoice | High |
| 10 | Delete invoice | Medium |
| 11 | Print invoice | Medium |

---

**ملاحظة:** ملف مختصر - التفاصيل الكاملة في ملف Authentication كأمثلة.

