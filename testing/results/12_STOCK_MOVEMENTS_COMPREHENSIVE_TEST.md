# 📦 تقرير الفحص الشامل المعمق - مديول Stock Movements
## Stock Movements Module - Comprehensive Deep Test Report

**التاريخ:** 2025-11-19  
**المهندس:** Auto (Cursor AI) - QA Engineer  
**الحالة:** 🔄 **جارٍ التنفيذ**

---

## 📋 ملخص تنفيذي

### **الهدف:**
فحص شامل ومعمق لمديول Stock Movements (حركات المخزون) بجميع مميزاته:
- ✅ Backend APIs (جميع الـ endpoints)
- ✅ Frontend Pages (جميع الصفحات والميزات)
- ✅ Integration (التكامل بين Frontend و Backend)
- ✅ Security (الأمان والصلاحيات)
- ✅ Features (جميع الميزات)

---

## 🔧 Backend APIs Testing

### **1. GET /api/stock-movements**

#### **Test Case 1.1: قائمة الحركات (List)**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements?page=1&limit=10"
```

**Expected:**
- ✅ Status: 200
- ✅ Response: `{success: true, data: [...], pagination: {...}}`
- ✅ Pagination: `total`, `page`, `limit`, `totalPages`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 1.2: Filter by Type (IN)**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements?type=IN"
```

**Expected:**
- ✅ Status: 200
- ✅ All movements filtered by type=IN

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 1.3: Filter by Type (OUT)**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements?type=OUT"
```

**Expected:**
- ✅ Status: 200
- ✅ All movements filtered by type=OUT

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 1.4: Filter by Type (TRANSFER)**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements?type=TRANSFER"
```

**Expected:**
- ✅ Status: 200
- ✅ All movements filtered by type=TRANSFER

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 1.5: Filter by Inventory Item**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements?inventoryItemId=1"
```

**Expected:**
- ✅ Status: 200
- ✅ All movements filtered by inventoryItemId=1

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 1.6: Filter by Warehouse**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements?warehouseId=1"
```

**Expected:**
- ✅ Status: 200
- ✅ All movements filtered by warehouseId (fromWarehouseId or toWarehouseId)

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 1.7: Filter by Date Range**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements?startDate=2025-01-01&endDate=2025-12-31"
```

**Expected:**
- ✅ Status: 200
- ✅ All movements filtered by date range

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 1.8: Search Query**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements?q=صنف"
```

**Expected:**
- ✅ Status: 200
- ✅ Movements matching search query in itemName, sku, userName, warehouseName

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 1.9: Sorting**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements?sort=createdAt&sortDir=DESC"
```

**Expected:**
- ✅ Status: 200
- ✅ Movements sorted by createdAt DESC

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 1.10: Combined Filters**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements?type=IN&warehouseId=1&startDate=2025-01-01&q=صيانة&page=1&limit=20&sort=createdAt&sortDir=DESC"
```

**Expected:**
- ✅ Status: 200
- ✅ Movements matching all filters

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 1.11: Without Authentication**
```bash
curl -s "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 401
- ✅ Response: `{success: false, error: "No token, authorization denied"}`

**Actual:** ⏳ جارٍ الاختبار

---

### **2. GET /api/stock-movements/:id**

#### **Test Case 2.1: تفاصيل حركة (Valid ID)**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements/1"
```

**Expected:**
- ✅ Status: 200
- ✅ Response: `{success: true, data: {...}}`
- ✅ All movement details with joins (item, warehouses, user)

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 2.2: تفاصيل حركة (Invalid ID)**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements/99999"
```

**Expected:**
- ✅ Status: 404
- ✅ Response: `{success: false, error: "Movement not found"}`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 2.3: Without Authentication**
```bash
curl -s "http://localhost:4000/api/stock-movements/1"
```

**Expected:**
- ✅ Status: 401
- ✅ Response: `{success: false, error: "No token, authorization denied"}`

**Actual:** ⏳ جارٍ الاختبار

---

### **3. GET /api/stock-movements/inventory/:itemId**

#### **Test Case 3.1: حركات صنف محدد (Valid Item ID)**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements/inventory/1"
```

**Expected:**
- ✅ Status: 200
- ✅ Response: `{success: true, data: [...]}`
- ✅ All movements for inventoryItemId=1

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 3.2: حركات صنف محدد (Invalid Item ID)**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements/inventory/99999"
```

**Expected:**
- ✅ Status: 200
- ✅ Response: `{success: true, data: []}` (empty array)

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 3.3: Without Authentication**
```bash
curl -s "http://localhost:4000/api/stock-movements/inventory/1"
```

**Expected:**
- ✅ Status: 401
- ✅ Response: `{success: false, error: "No token, authorization denied"}`

**Actual:** ⏳ جارٍ الاختبار

---

### **4. POST /api/stock-movements**

#### **Test Case 4.1: Create IN Movement**
```bash
curl -s -X POST -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"IN","inventoryItemId":1,"quantity":10,"toWarehouseId":1,"notes":"Test IN movement"}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 201
- ✅ Response: `{success: true, data: {...}, message: "تم تسجيل الحركة بنجاح"}`
- ✅ StockLevel updated for toWarehouseId

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 4.2: Create OUT Movement**
```bash
curl -s -X POST -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"OUT","inventoryItemId":1,"quantity":5,"fromWarehouseId":1,"notes":"Test OUT movement"}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 201
- ✅ Response: `{success: true, data: {...}, message: "تم تسجيل الحركة بنجاح"}`
- ✅ StockLevel updated for fromWarehouseId (subtracted)
- ✅ Stock validation: sufficient quantity available

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 4.3: Create TRANSFER Movement**
```bash
curl -s -X POST -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"TRANSFER","inventoryItemId":1,"quantity":5,"fromWarehouseId":1,"toWarehouseId":2,"notes":"Test TRANSFER movement"}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 201
- ✅ Response: `{success: true, data: {...}, message: "تم تسجيل الحركة بنجاح"}`
- ✅ StockLevel updated for both warehouses (subtract from from, add to to)
- ✅ Validation: fromWarehouseId != toWarehouseId
- ✅ Stock validation: sufficient quantity available

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 4.4: Validation - Missing Type**
```bash
curl -s -X POST -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"inventoryItemId":1,"quantity":10,"toWarehouseId":1}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 400
- ✅ Response: `{success: false, error: "نوع الحركة مطلوب"}`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 4.5: Validation - Invalid Type**
```bash
curl -s -X POST -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"INVALID","inventoryItemId":1,"quantity":10,"toWarehouseId":1}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 400
- ✅ Response: `{success: false, error: "نوع الحركة يجب أن يكون IN أو OUT أو TRANSFER"}`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 4.6: Validation - Missing Inventory Item**
```bash
curl -s -X POST -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"IN","quantity":10,"toWarehouseId":1}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 400
- ✅ Response: `{success: false, error: "معرف الصنف مطلوب"}`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 4.7: Validation - Invalid Quantity**
```bash
curl -s -X POST -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"IN","inventoryItemId":1,"quantity":0,"toWarehouseId":1}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 400
- ✅ Response: `{success: false, error: "الكمية يجب أن تكون على الأقل 1"}`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 4.8: Validation - IN without toWarehouseId**
```bash
curl -s -X POST -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"IN","inventoryItemId":1,"quantity":10}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 400
- ✅ Response: `{success: false, error: "المخزن المستقبل مطلوب لحركات IN"}`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 4.9: Validation - OUT without fromWarehouseId**
```bash
curl -s -X POST -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"OUT","inventoryItemId":1,"quantity":5}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 400
- ✅ Response: `{success: false, error: "المخزن المصدر مطلوب لحركات OUT"}`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 4.10: Validation - TRANSFER without both warehouses**
```bash
curl -s -X POST -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"TRANSFER","inventoryItemId":1,"quantity":5,"fromWarehouseId":1}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 400
- ✅ Response: `{success: false, error: "المخزن المستقبل مطلوب لحركات TRANSFER"}`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 4.11: Validation - TRANSFER same warehouse**
```bash
curl -s -X POST -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"TRANSFER","inventoryItemId":1,"quantity":5,"fromWarehouseId":1,"toWarehouseId":1}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 400
- ✅ Response: `{success: false, error: "المخزن المصدر والمستقبل لا يمكن أن يكونا نفس المخزن"}`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 4.12: Stock Validation - Insufficient Stock for OUT**
```bash
curl -s -X POST -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"OUT","inventoryItemId":1,"quantity":99999,"fromWarehouseId":1}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 400
- ✅ Response: `{success: false, error: "الكمية المتاحة (X) أقل من المطلوب (99999)"}`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 4.13: Stock Validation - Insufficient Stock for TRANSFER**
```bash
curl -s -X POST -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"TRANSFER","inventoryItemId":1,"quantity":99999,"fromWarehouseId":1,"toWarehouseId":2}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 400
- ✅ Response: `{success: false, error: "الكمية المتاحة (X) أقل من المطلوب (99999)"}`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 4.14: Without Authentication**
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"type":"IN","inventoryItemId":1,"quantity":10,"toWarehouseId":1}' \
  "http://localhost:4000/api/stock-movements"
```

**Expected:**
- ✅ Status: 401
- ✅ Response: `{success: false, error: "No token, authorization denied"}`

**Actual:** ⏳ جارٍ الاختبار

---

### **5. PUT /api/stock-movements/:id**

#### **Test Case 5.1: Update Movement**
```bash
curl -s -X PUT -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"IN","inventoryItemId":1,"quantity":15,"toWarehouseId":1,"notes":"Updated movement"}' \
  "http://localhost:4000/api/stock-movements/1"
```

**Expected:**
- ✅ Status: 200
- ✅ Response: `{success: true, message: "تم تحديث الحركة بنجاح"}`
- ✅ Old movement reversed (StockLevel restored)
- ✅ New movement applied (StockLevel updated)

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 5.2: Update Movement - Partial Update**
```bash
curl -s -X PUT -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"quantity":20}' \
  "http://localhost:4000/api/stock-movements/1"
```

**Expected:**
- ✅ Status: 200
- ✅ Only quantity updated
- ✅ StockLevel updated accordingly

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 5.3: Update Movement - Invalid ID**
```bash
curl -s -X PUT -b cookie_stockmovements.txt -H "Content-Type: application/json" \
  -d '{"type":"IN","inventoryItemId":1,"quantity":10,"toWarehouseId":1}' \
  "http://localhost:4000/api/stock-movements/99999"
```

**Expected:**
- ✅ Status: 404
- ✅ Response: `{success: false, error: "الحركة غير موجودة"}`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 5.4: Without Authentication**
```bash
curl -s -X PUT -H "Content-Type: application/json" \
  -d '{"type":"IN","inventoryItemId":1,"quantity":10,"toWarehouseId":1}' \
  "http://localhost:4000/api/stock-movements/1"
```

**Expected:**
- ✅ Status: 401
- ✅ Response: `{success: false, error: "No token, authorization denied"}`

**Actual:** ⏳ جارٍ الاختبار

---

### **6. DELETE /api/stock-movements/:id**

#### **Test Case 6.1: Delete Movement (Soft Delete)**
```bash
curl -s -X DELETE -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements/1"
```

**Expected:**
- ✅ Status: 200
- ✅ Response: `{success: true, message: "تم حذف الحركة بنجاح"}`
- ✅ Movement soft deleted (deletedAt set)
- ✅ Movement reversed (StockLevel restored)

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 6.2: Delete Movement - Invalid ID**
```bash
curl -s -X DELETE -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements/99999"
```

**Expected:**
- ✅ Status: 404
- ✅ Response: `{success: false, error: "الحركة غير موجودة"}`

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 6.3: Without Authentication**
```bash
curl -s -X DELETE "http://localhost:4000/api/stock-movements/1"
```

**Expected:**
- ✅ Status: 401
- ✅ Response: `{success: false, error: "No token, authorization denied"}`

**Actual:** ⏳ جارٍ الاختبار

---

### **7. GET /api/stock-movements/stats/summary**

#### **Test Case 7.1: Statistics Summary**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements/stats/summary"
```

**Expected:**
- ✅ Status: 200
- ✅ Response: `{success: true, data: {summary: {...}, byType: [...], topItems: [...], topWarehouses: [...]}}`
- ✅ Summary includes: totalMovements, counts, totalQuantity, today, week, month

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 7.2: Statistics with Filters**
```bash
curl -s -b cookie_stockmovements.txt "http://localhost:4000/api/stock-movements/stats/summary?type=IN&warehouseId=1&dateFrom=2025-01-01&dateTo=2025-12-31"
```

**Expected:**
- ✅ Status: 200
- ✅ Statistics filtered by parameters

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case 7.3: Without Authentication**
```bash
curl -s "http://localhost:4000/api/stock-movements/stats/summary"
```

**Expected:**
- ✅ Status: 401
- ✅ Response: `{success: false, error: "No token, authorization denied"}`

**Actual:** ⏳ جارٍ الاختبار

---

## 🌐 Frontend Testing

### **Phase 1: Page Loading & Display**

#### **Test Case F1.1: Page Loads Successfully**
- Navigate to `/inventory/stock-movements`
- ✅ Page loads without errors
- ✅ Header displays correctly
- ✅ Stats cards display

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F1.2: Movements List Display**
- ✅ Movements displayed in cards/table view
- ✅ All movement details visible (type, item, quantity, warehouse, user, date)
- ✅ Pagination controls visible

**Actual:** ⏳ جارٍ الاختبار

---

### **Phase 2: Filters & Search**

#### **Test Case F2.1: Type Filter**
- Select type filter (IN/OUT/TRANSFER)
- ✅ Movements filtered correctly
- ✅ URL updates with filter parameter

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F2.2: Warehouse Filter**
- Select warehouse filter
- ✅ Movements filtered by warehouse
- ✅ Filter applies to both fromWarehouseId and toWarehouseId

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F2.3: Item Filter**
- Enter item ID
- ✅ Movements filtered by inventoryItemId

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F2.4: Date Range Filter**
- Select date from and date to
- ✅ Movements filtered by date range

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F2.5: Search**
- Enter search term
- ✅ Search works (debounced)
- ✅ Searches in itemName, sku, userName, warehouseName

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F2.6: Clear Filters**
- Click clear filters button
- ✅ All filters reset
- ✅ Movements list refreshed

**Actual:** ⏳ جارٍ الاختبار

---

### **Phase 3: Sorting**

#### **Test Case F3.1: Sort by Created Date**
- Click on "التاريخ" header
- ✅ Movements sorted by createdAt
- ✅ Sort direction toggles (ASC/DESC)

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F3.2: Sort by Quantity**
- Click on "الكمية" header
- ✅ Movements sorted by quantity
- ✅ Sort direction toggles

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F3.3: Sort by Type**
- Click on "نوع الحركة" header
- ✅ Movements sorted by type
- ✅ Sort direction toggles

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F3.4: Sort by Item Name**
- Click on "الصنف" header
- ✅ Movements sorted by itemName
- ✅ Sort direction toggles

**Actual:** ⏳ جارٍ الاختبار

---

### **Phase 4: Create Movement**

#### **Test Case F4.1: Open Create Form**
- Click "إضافة حركة جديدة" button
- ✅ Modal opens
- ✅ Form displays correctly
- ✅ All fields visible

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F4.2: Create IN Movement**
- Select type: IN
- Select inventory item
- Enter quantity: 10
- Select toWarehouse
- Add notes (optional)
- Click "حفظ"
- ✅ Movement created successfully
- ✅ Success notification shown
- ✅ Modal closes
- ✅ Movements list refreshed
- ✅ StockLevel updated

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F4.3: Create OUT Movement**
- Select type: OUT
- Select inventory item
- Enter quantity: 5
- Select fromWarehouse
- Click "حفظ"
- ✅ Movement created successfully
- ✅ StockLevel updated (quantity subtracted)

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F4.4: Create TRANSFER Movement**
- Select type: TRANSFER
- Select inventory item
- Enter quantity: 5
- Select fromWarehouse
- Select toWarehouse (different from fromWarehouse)
- Click "حفظ"
- ✅ Movement created successfully
- ✅ StockLevel updated for both warehouses

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F4.5: Form Validation - Missing Fields**
- Try to submit form without required fields
- ✅ Validation errors displayed
- ✅ Form does not submit

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F4.6: Form Validation - Invalid Quantity**
- Enter quantity: 0 or negative
- ✅ Validation error: "الكمية يجب أن تكون على الأقل 1"

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F4.7: Form Validation - TRANSFER Same Warehouse**
- Select type: TRANSFER
- Select same warehouse for from and to
- ✅ Validation error: "المخزن المصدر والمستقبل لا يمكن أن يكونا نفس المخزن"

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F4.8: Dynamic Warehouse Fields**
- Select type: IN
- ✅ Only toWarehouse field visible
- Select type: OUT
- ✅ Only fromWarehouse field visible
- Select type: TRANSFER
- ✅ Both fromWarehouse and toWarehouse fields visible

**Actual:** ⏳ جارٍ الاختبار

---

### **Phase 5: Edit Movement**

#### **Test Case F5.1: Open Edit Form**
- Click edit button on a movement
- ✅ Modal opens
- ✅ Form pre-filled with movement data
- ✅ All fields editable (except inventoryItemId when editing)

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F5.2: Update Movement**
- Modify movement fields
- Click "تحديث"
- ✅ Movement updated successfully
- ✅ Success notification shown
- ✅ StockLevel updated correctly (old reversed, new applied)

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F5.3: Update Movement - Change Type**
- Change movement type (e.g., IN to OUT)
- ✅ Warehouse fields update dynamically
- ✅ Movement updated successfully
- ✅ StockLevel updated correctly

**Actual:** ⏳ جارٍ الاختبار

---

### **Phase 6: Delete Movement**

#### **Test Case F6.1: Delete Movement**
- Click delete button on a movement
- Confirm deletion
- ✅ Movement deleted successfully
- ✅ Success notification shown
- ✅ Movements list refreshed
- ✅ StockLevel reversed

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F6.2: Delete Movement - Cancel**
- Click delete button
- Cancel confirmation
- ✅ Movement not deleted
- ✅ No changes made

**Actual:** ⏳ جارٍ الاختبار

---

### **Phase 7: Statistics**

#### **Test Case F7.1: Stats Cards Display**
- ✅ Total movements card displays
- ✅ IN/OUT/TRANSFER cards display with counts and quantities
- ✅ Stats update when filters change

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F7.2: Stats Update on Filter**
- Apply filters (type, warehouse, date range)
- ✅ Stats cards update to reflect filtered data

**Actual:** ⏳ جارٍ الاختبار

---

### **Phase 8: Pagination**

#### **Test Case F8.1: Pagination Controls**
- ✅ Previous/Next buttons visible
- ✅ Page info displays correctly
- ✅ Items per page selector works

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F8.2: Navigate Pages**
- Click Next button
- ✅ Page changes
- ✅ Movements list updates
- Click Previous button
- ✅ Page changes back

**Actual:** ⏳ جارٍ الاختبار

---

### **Phase 9: View Modes**

#### **Test Case F9.1: Card View**
- ✅ Movements displayed as cards
- ✅ All movement details visible in cards
- ✅ Card styling matches system design

**Actual:** ⏳ جارٍ الاختبار

---

#### **Test Case F9.2: Table View**
- Switch to table view
- ✅ Movements displayed in table
- ✅ All columns visible
- ✅ Sorting works on table headers

**Actual:** ⏳ جارٍ الاختبار

---

## 🔒 Security Testing

### **Test Case S1: Authentication**
- ✅ All API endpoints require authentication
- ✅ Unauthenticated requests return 401
- ✅ Frontend redirects to login if not authenticated

**Actual:** ⏳ جارٍ الاختبار

---

### **Test Case S2: Authorization**
- ✅ Users can only access their allowed features
- ✅ Admin-only features protected

**Actual:** ⏳ جارٍ الاختبار

---

### **Test Case S3: Input Validation**
- ✅ SQL injection protection (prepared statements)
- ✅ XSS protection (input sanitization)
- ✅ CSRF protection (same-site cookies)

**Actual:** ⏳ جارٍ الاختبار

---

## 🔗 Integration Testing

### **Test Case I1: End-to-End Workflow**
1. Create IN movement → Verify StockLevel increased
2. Create OUT movement → Verify StockLevel decreased
3. Create TRANSFER movement → Verify both warehouses updated
4. Update movement → Verify StockLevel updated correctly
5. Delete movement → Verify StockLevel reversed

**Actual:** ⏳ جارٍ الاختبار

---

### **Test Case I2: Stock Level Accuracy**
- ✅ StockLevel matches sum of all movements
- ✅ StockLevel updates correctly for all operations
- ✅ StockLevel updates are atomic (no race conditions)

**Actual:** ⏳ جارٍ الاختبار

---

## 📊 Test Summary

| Category | Total Tests | Passed | Failed | Pending |
|----------|-------------|--------|--------|---------|
| Backend APIs | 40 | 0 | 0 | 40 |
| Frontend | 35 | 0 | 0 | 35 |
| Security | 3 | 0 | 0 | 3 |
| Integration | 2 | 0 | 0 | 2 |
| **Total** | **80** | **0** | **0** | **80** |

---

## 📝 Notes

- All tests will be executed using cURL for Backend and Chrome DevTools MCP for Frontend
- Results will be updated in real-time as tests are executed
- Any failures will be documented with details for fixing

---

**التاريخ:** 2025-11-19  
**المهندس:** Auto (Cursor AI)

