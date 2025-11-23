# 🧪 خطة الاختبارات الشاملة - نظام المخزون
## Testing Strategy - Inventory Module

**التاريخ:** 2 أكتوبر 2025  
**الهدف:** ضمان جودة عالية وموثوقية 100%

---

## 📊 نظرة عامة على الاختبارات

### أنواع الاختبارات:

```
┌─────────────────────────────────────────────────────────┐
│ Testing Pyramid                                         │
│                                                          │
│                      ▲                                   │
│                     ╱ ╲                                  │
│                    ╱E2E╲          20 Tests (20%)        │
│                   ╱─────╲                                │
│                  ╱Integ.╲         50 Tests (30%)        │
│                 ╱─────────╲                              │
│                ╱   Unit    ╲      100 Tests (50%)       │
│               ╱─────────────╲                            │
│              ╱───────────────╲                           │
│                                                          │
│ إجمالي: 170 Test                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Unit Tests (100 اختبار)
**الهدف:** اختبار كل دالة/وحدة بشكل منفصل

### Backend Unit Tests (60 اختبار)

#### 1.1 Inventory Controller Tests

**ملف:** `backend/tests/unit/controllers/inventory.test.js`

```javascript
const { expect } = require('chai');
const sinon = require('sinon');
const inventoryController = require('../../controllers/inventory');

describe('Inventory Controller', () => {
  
  describe('getAllItems()', () => {
    
    it('should return all items with pagination', async () => {
      // Arrange
      const req = {
        query: { page: 1, limit: 20 }
      };
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
      
      // Mock database
      const mockItems = [
        { id: 1, name: 'LCD Screen', totalQuantity: 45 },
        { id: 2, name: 'Battery', totalQuantity: 90 }
      ];
      
      sinon.stub(db, 'query').resolves([mockItems]);
      
      // Act
      await inventoryController.getAllItems(req, res);
      
      // Assert
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', true);
      expect(res.json.firstCall.args[0].data.items).to.have.lengthOf(2);
      
      // Cleanup
      db.query.restore();
    });
    
    it('should filter items by category', async () => {
      // ...
    });
    
    it('should filter items by low stock', async () => {
      // ...
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const req = { query: {} };
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
      
      sinon.stub(db, 'query').rejects(new Error('DB Error'));
      
      // Act
      await inventoryController.getAllItems(req, res);
      
      // Assert
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', false);
      
      db.query.restore();
    });
  });
  
  describe('createItem()', () => {
    
    it('should create new item successfully', async () => {
      // ...
    });
    
    it('should validate required fields', async () => {
      // ...
    });
    
    it('should prevent duplicate SKU', async () => {
      // ...
    });
    
    it('should prevent duplicate barcode', async () => {
      // ...
    });
  });
  
  describe('updateItem()', () => {
    
    it('should update item successfully', async () => {
      // ...
    });
    
    it('should return 404 for non-existent item', async () => {
      // ...
    });
  });
  
  describe('deleteItem()', () => {
    
    it('should soft delete item', async () => {
      // ...
    });
    
    it('should prevent deletion if stock exists', async () => {
      // ...
    });
  });
});
```

**اختبارات Inventory Controller (15 اختبار):**
- ✅ getAllItems - success
- ✅ getAllItems - with filters
- ✅ getAllItems - with pagination
- ✅ getAllItems - with sorting
- ✅ getAllItems - error handling
- ✅ getItemById - success
- ✅ getItemById - not found
- ✅ createItem - success
- ✅ createItem - validation errors
- ✅ createItem - duplicate SKU
- ✅ createItem - duplicate barcode
- ✅ updateItem - success
- ✅ updateItem - not found
- ✅ deleteItem - success
- ✅ deleteItem - has stock (should fail)

---

#### 1.2 Stock Movement Controller Tests

**ملف:** `backend/tests/unit/controllers/stockMovement.test.js`

```javascript
describe('Stock Movement Controller', () => {
  
  describe('createMovement()', () => {
    
    it('should create IN movement and update stock level', async () => {
      // Arrange
      const req = {
        body: {
          movementType: 'in',
          inventoryItemId: 10,
          warehouseId: 1,
          quantity: 50,
          unitCost: 150.00
        },
        user: { id: 1 }
      };
      
      // Mock transactions
      const mockConnection = {
        beginTransaction: sinon.stub().resolves(),
        commit: sinon.stub().resolves(),
        rollback: sinon.stub().resolves(),
        query: sinon.stub()
      };
      
      mockConnection.query
        .onFirstCall().resolves([{ insertId: 100 }])  // StockMovement insert
        .onSecondCall().resolves([{ affectedRows: 1 }]); // StockLevel update
      
      sinon.stub(db, 'getConnection').resolves(mockConnection);
      
      // Act
      await stockMovementController.createMovement(req, res);
      
      // Assert
      expect(mockConnection.beginTransaction.calledOnce).to.be.true;
      expect(mockConnection.commit.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      
      // Cleanup
      db.getConnection.restore();
    });
    
    it('should rollback transaction on error', async () => {
      // ...
    });
    
    it('should validate movement type', async () => {
      // ...
    });
    
    it('should prevent negative stock on OUT movement', async () => {
      // Arrange
      const req = {
        body: {
          movementType: 'out',
          inventoryItemId: 10,
          warehouseId: 1,
          quantity: 100  // أكثر من المتوفر
        }
      };
      
      // Mock: current stock = 30
      sinon.stub(db, 'query').resolves([[{ currentQuantity: 30 }]]);
      
      // Act
      await stockMovementController.createMovement(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.firstCall.args[0].message).to.include('مخزون غير كافٍ');
      
      db.query.restore();
    });
  });
  
  describe('getMovements()', () => {
    
    it('should return movements with filters', async () => {
      // ...
    });
    
    it('should calculate summary correctly', async () => {
      // ...
    });
  });
});
```

**اختبارات Stock Movement (10 اختبارات)**

---

#### 1.3 Purchase Order Controller Tests

**اختبارات (10 اختبارات):**
- ✅ createPO - success
- ✅ createPO - validate vendor exists
- ✅ calculateTotals - correct math
- ✅ updateStatus - valid transitions
- ✅ receivePO - update stock automatically
- ✅ receivePO - partial receive
- ✅ receivePO - create expense record
- ✅ receivePO - rollback on error
- ✅ getPO - with items
- ✅ deletePO - soft delete

---

#### 1.4 Vendor Controller Tests

**اختبارات (10 اختبارات):**
- ✅ CRUD operations
- ✅ Search and filter
- ✅ Calculate statistics
- ✅ Update rating
- ✅ Prevent deletion with open POs

---

#### 1.5 Stock Transfer Controller Tests

**اختبارات (10 اختبارات):**
- ✅ Create transfer request
- ✅ Approve/reject transfer
- ✅ Ship transfer
- ✅ Receive transfer - update both warehouses
- ✅ Validate sufficient stock
- ✅ Track status transitions
- ✅ Handle damaged items

---

#### 1.6 Stock Count Controller Tests

**اختبارات (5 اختبارات):**
- ✅ Create count session
- ✅ Add count items
- ✅ Calculate discrepancies
- ✅ Adjust stock - create movements
- ✅ Create expense for losses

---

### Frontend Unit Tests (40 اختبار)

#### 2.1 React Components Tests

**ملف:** `frontend/react-app/src/tests/components/InventoryPage.test.js`

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InventoryPage from '../pages/inventory/InventoryPage';
import inventoryService from '../services/inventoryService';

jest.mock('../services/inventoryService');

describe('InventoryPage', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render inventory page successfully', () => {
    // Arrange & Act
    render(<InventoryPage />);
    
    // Assert
    expect(screen.getByText('إدارة المخزون')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ابحث عن صنف...')).toBeInTheDocument();
  });
  
  it('should fetch and display items on load', async () => {
    // Arrange
    const mockItems = [
      { id: 1, name: 'LCD Screen', totalQuantity: 45 },
      { id: 2, name: 'Battery', totalQuantity: 90 }
    ];
    
    inventoryService.getItems.mockResolvedValue({
      data: { items: mockItems, pagination: {} }
    });
    
    // Act
    render(<InventoryPage />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('LCD Screen')).toBeInTheDocument();
      expect(screen.getByText('Battery')).toBeInTheDocument();
    });
  });
  
  it('should filter items by category', async () => {
    // Arrange
    render(<InventoryPage />);
    const categorySelect = screen.getByLabelText('الفئة');
    
    // Act
    fireEvent.change(categorySelect, { target: { value: '1' } });
    
    // Assert
    await waitFor(() => {
      expect(inventoryService.getItems).toHaveBeenCalledWith(
        expect.objectContaining({ category: '1' })
      );
    });
  });
  
  it('should open add dialog on click', () => {
    // Arrange
    render(<InventoryPage />);
    const addButton = screen.getByRole('button', { name: /إضافة صنف/i });
    
    // Act
    fireEvent.click(addButton);
    
    // Assert
    expect(screen.getByText('إضافة صنف جديد')).toBeInTheDocument();
  });
  
  it('should handle API errors gracefully', async () => {
    // Arrange
    inventoryService.getItems.mockRejectedValue(new Error('Network Error'));
    
    // Act
    render(<InventoryPage />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/حدث خطأ/i)).toBeInTheDocument();
    });
  });
  
  it('should display loading state', () => {
    // Arrange
    inventoryService.getItems.mockImplementation(
      () => new Promise(() => {}) // never resolves
    );
    
    // Act
    render(<InventoryPage />);
    
    // Assert
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

**اختبارات Components (40 اختبار):**
- InventoryPage (10)
- StockMovementPage (8)
- StockTransferPage (8)
- StockCountPage (8)
- AddItemDialog (6)

---

## 2️⃣ Integration Tests (50 اختبار)
**الهدف:** اختبار التكامل بين الوحدات المختلفة

### Backend Integration Tests (35 اختبار)

#### 2.1 Stock Movement Integration

**ملف:** `backend/tests/integration/stockMovement.test.js`

```javascript
const request = require('supertest');
const app = require('../../app');
const db = require('../../db');

describe('Stock Movement Integration', () => {
  
  let authToken;
  let testItemId;
  let testWarehouseId;
  
  before(async () => {
    // Setup: Create test data
    authToken = await getAuthToken();
    testItemId = await createTestItem();
    testWarehouseId = await createTestWarehouse();
  });
  
  after(async () => {
    // Cleanup
    await cleanupTestData();
  });
  
  describe('POST /api/stock-movements (IN)', () => {
    
    it('should create IN movement and update stock level', async () => {
      // Arrange
      const movementData = {
        movementType: 'in',
        inventoryItemId: testItemId,
        warehouseId: testWarehouseId,
        quantity: 50,
        unitCost: 150.00,
        totalCost: 7500.00,
        referenceType: 'purchase_order',
        referenceId: 123
      };
      
      // Get initial stock
      const initialStock = await db.query(
        'SELECT currentQuantity FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [testItemId, testWarehouseId]
      );
      const initialQty = initialStock[0]?.[0]?.currentQuantity || 0;
      
      // Act
      const res = await request(app)
        .post('/api/stock-movements')
        .set('Authorization', `Bearer ${authToken}`)
        .send(movementData)
        .expect(201);
      
      // Assert
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('movementId');
      
      // Verify stock level updated
      const updatedStock = await db.query(
        'SELECT currentQuantity FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [testItemId, testWarehouseId]
      );
      const newQty = updatedStock[0][0].currentQuantity;
      
      expect(newQty).to.equal(initialQty + 50);
      
      // Verify movement recorded
      const movement = await db.query(
        'SELECT * FROM StockMovement WHERE id = ?',
        [res.body.data.movementId]
      );
      
      expect(movement[0]).to.have.lengthOf(1);
      expect(movement[0][0].quantity).to.equal(50);
    });
  });
  
  describe('POST /api/stock-movements (OUT)', () => {
    
    it('should prevent OUT movement if insufficient stock', async () => {
      // Arrange
      const movementData = {
        movementType: 'out',
        inventoryItemId: testItemId,
        warehouseId: testWarehouseId,
        quantity: 1000  // أكثر من المتوفر
      };
      
      // Act
      const res = await request(app)
        .post('/api/stock-movements')
        .set('Authorization', `Bearer ${authToken}`)
        .send(movementData)
        .expect(400);
      
      // Assert
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include('مخزون غير كافٍ');
    });
  });
  
  describe('Repair Request Integration', () => {
    
    it('should auto-create stock movement when part added to repair', async () => {
      // Arrange
      const repairId = await createTestRepair();
      
      // Act
      const res = await request(app)
        .post(`/api/repairs/${repairId}/parts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          inventoryItemId: testItemId,
          warehouseId: testWarehouseId,
          quantity: 1
        })
        .expect(201);
      
      // Assert - verify PartsUsed created
      const partsUsed = await db.query(
        'SELECT * FROM PartsUsed WHERE repairRequestId = ? AND inventoryItemId = ?',
        [repairId, testItemId]
      );
      expect(partsUsed[0]).to.have.lengthOf(1);
      
      // Assert - verify StockMovement created
      const movement = await db.query(
        'SELECT * FROM StockMovement WHERE referenceType = "repair_request" AND referenceId = ?',
        [repairId]
      );
      expect(movement[0]).to.have.lengthOf(1);
      expect(movement[0][0].movementType).to.equal('out');
      expect(movement[0][0].quantity).to.equal(1);
      
      // Assert - verify stock decreased
      const stock = await db.query(
        'SELECT currentQuantity FROM StockLevel WHERE inventoryItemId = ? AND warehouseId = ?',
        [testItemId, testWarehouseId]
      );
      // Should be decreased by 1
    });
  });
  
  describe('Purchase Order Integration', () => {
    
    it('should auto-update stock when PO received', async () => {
      // Similar test...
    });
  });
});
```

**Integration Tests القائمة (35 اختبار):**
- Stock Movement + Stock Level (5)
- Stock Movement + Repairs (5)
- Purchase Order + Stock (5)
- Stock Transfer (5)
- Stock Count + Adjustment (5)
- Vendor + Purchase Order (5)
- Alerts + Stock Levels (5)

---

### Frontend Integration Tests (15 اختبار)

**ملف:** `frontend/react-app/src/tests/integration/inventoryFlow.test.js`

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import * as api from '../services/api';

jest.mock('../services/api');

describe('Inventory Flow Integration', () => {
  
  it('should complete full item creation flow', async () => {
    // 1. Navigate to inventory page
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('المخزون'));
    
    // 2. Click add item button
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /إضافة صنف/i }));
    });
    
    // 3. Fill form
    fireEvent.change(screen.getByLabelText('اسم الصنف'), {
      target: { value: 'Test Item' }
    });
    fireEvent.change(screen.getByLabelText('سعر الشراء'), {
      target: { value: '100' }
    });
    fireEvent.change(screen.getByLabelText('سعر البيع'), {
      target: { value: '150' }
    });
    
    // Mock API response
    api.post.mockResolvedValue({
      success: true,
      data: { id: 999 }
    });
    
    // 4. Submit
    fireEvent.click(screen.getByRole('button', { name: /حفظ/i }));
    
    // 5. Verify success message
    await waitFor(() => {
      expect(screen.getByText(/تم الإضافة بنجاح/i)).toBeInTheDocument();
    });
    
    // 6. Verify item appears in list
    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });
  
  // More integration tests...
});
```

---

## 3️⃣ E2E Tests (20 اختبار)
**الهدف:** اختبار السيناريوهات الكاملة من البداية للنهاية

### E2E Tests باستخدام Playwright

**ملف:** `tests/e2e/inventory.spec.js`

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Inventory Module E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });
  
  test('E2E-01: Complete item lifecycle', async ({ page }) => {
    // 1. Navigate to inventory
    await page.click('text=المخزون');
    await expect(page).toHaveURL(/.*inventory/);
    
    // 2. Create new item
    await page.click('button:has-text("إضافة صنف")');
    await page.fill('input[name="name"]', 'E2E Test LCD');
    await page.fill('input[name="sku"]', 'E2E-001');
    await page.fill('input[name="purchasePrice"]', '200');
    await page.fill('input[name="sellingPrice"]', '350');
    await page.selectOption('select[name="categoryId"]', '1');
    await page.click('button:has-text("حفظ")');
    
    // 3. Verify success message
    await expect(page.locator('.MuiAlert-success')).toContainText('تم الإضافة بنجاح');
    
    // 4. Verify item in list
    await expect(page.locator('text=E2E Test LCD')).toBeVisible();
    
    // 5. Edit item
    await page.click(`tr:has-text("E2E Test LCD") >> button[title="تعديل"]`);
    await page.fill('input[name="purchasePrice"]', '180');
    await page.click('button:has-text("حفظ")');
    
    // 6. Verify update
    await expect(page.locator('.MuiAlert-success')).toContainText('تم التحديث');
    
    // 7. Delete item
    await page.click(`tr:has-text("E2E Test LCD") >> button[title="حذف"]`);
    await page.click('button:has-text("تأكيد")');
    
    // 8. Verify deletion
    await expect(page.locator('text=E2E Test LCD')).not.toBeVisible();
  });
  
  test('E2E-02: Purchase order to stock update flow', async ({ page }) => {
    // 1. Create purchase order
    await page.click('text=المشتريات');
    await page.click('button:has-text("إنشاء طلب شراء")');
    
    // Fill PO details
    await page.selectOption('select[name="vendorId"]', '1');
    await page.fill('input[name="orderDate"]', '2025-10-02');
    
    // Add items
    await page.click('button:has-text("إضافة صنف")');
    await page.selectOption('select[name="items[0].inventoryItemId"]', '10');
    await page.fill('input[name="items[0].quantity"]', '50');
    await page.fill('input[name="items[0].unitPrice"]', '150');
    
    await page.click('button:has-text("حفظ")');
    
    // 2. Send PO
    await page.click('button:has-text("إرسال للمورد")');
    await expect(page.locator('text=تم إرسال الطلب')).toBeVisible();
    
    // 3. Receive PO
    await page.click('button:has-text("استلام")');
    await page.fill('input[name="items[0].receivedQuantity"]', '50');
    await page.click('button:has-text("تأكيد الاستلام")');
    
    // 4. Verify stock updated
    await page.click('text=المخزون');
    await page.fill('input[placeholder="ابحث..."]', 'LCD');
    
    const stockCell = page.locator('tr:has-text("LCD") >> td:nth-child(5)');
    await expect(stockCell).toContainText('50'); // أو الكمية الجديدة
    
    // 5. Verify movement recorded
    await page.click('text=الحركات');
    await expect(page.locator('text=استلام أمر شراء')).toBeVisible();
  });
  
  test('E2E-03: Part usage in repair request', async ({ page }) => {
    // 1. Open repair request
    await page.click('text=طلبات الصيانة');
    await page.click('tr:first-child >> button[title="عرض"]');
    
    // 2. Add part
    await page.click('button:has-text("إضافة قطعة")');
    await page.selectOption('select[name="inventoryItemId"]', '10');
    await page.fill('input[name="quantity"]', '1');
    await page.click('input[name="addToInvoice"]'); // Check
    await page.click('button:has-text("إضافة")');
    
    // 3. Verify part added to repair
    await expect(page.locator('text=شاشة LCD')).toBeVisible();
    
    // 4. Verify stock decreased
    // Get initial stock value
    const initialStock = await page.locator('text=المخزون الحالي').textContent();
    // Should be decreased by 1
    
    // 5. Verify movement created
    await page.click('text=سجل الحركات');
    await expect(page.locator('text=صرف لطلب صيانة')).toBeVisible();
    
    // 6. Verify added to invoice
    await page.click('text=الفاتورة');
    await expect(page.locator('text=شاشة LCD')).toBeVisible();
  });
  
  test('E2E-04: Stock transfer between warehouses', async ({ page }) => {
    // Complete transfer flow...
  });
  
  test('E2E-05: Stock count adjustment', async ({ page }) => {
    // Complete count flow...
  });
  
  test('E2E-06: Low stock alert generation', async ({ page }) => {
    // Test alert creation...
  });
  
  test('E2E-07: Barcode scanning', async ({ page }) => {
    // Test barcode scanner...
  });
  
  // More E2E tests (total: 20)
});
```

**E2E Scenarios (20 اختبار):**
1. ✅ Complete item lifecycle (create → edit → delete)
2. ✅ Purchase order → stock update
3. ✅ Part usage in repair
4. ✅ Stock transfer between warehouses
5. ✅ Stock count adjustment
6. ✅ Low stock alert generation
7. ✅ Barcode scanning
8. ✅ Multi-user stock access (concurrency)
9. ✅ Vendor payment flow
10. ✅ Filter and search functionality
11. ✅ Export to Excel
12. ✅ Print reports
13. ✅ Mobile responsive test
14. ✅ Permission-based access
15. ✅ Bulk operations
16. ✅ Error recovery
17. ✅ Session timeout handling
18. ✅ API rate limiting
19. ✅ Data consistency check
20. ✅ Full system integration

---

## 4️⃣ Performance Tests

### Load Testing باستخدام K6

**ملف:** `tests/performance/inventory-load.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  const BASE_URL = 'http://localhost:4000/api';
  const token = 'Bearer test_token';
  
  // Test: Get inventory items
  const getItemsRes = http.get(`${BASE_URL}/inventory?page=1&limit=20`, {
    headers: { Authorization: token },
  });
  
  check(getItemsRes, {
    'get items status 200': (r) => r.status === 200,
    'get items duration < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
  
  // Test: Get stock movements
  const getMovementsRes = http.get(`${BASE_URL}/stock-movements`, {
    headers: { Authorization: token },
  });
  
  check(getMovementsRes, {
    'get movements status 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

**Performance Targets:**
- ✅ API Response Time: < 500ms (95th percentile)
- ✅ Concurrent Users: 100+
- ✅ Error Rate: < 1%
- ✅ Database Query Time: < 100ms
- ✅ Page Load Time: < 2s

---

## 5️⃣ Security Tests

### Security Checklist:

```javascript
describe('Security Tests', () => {
  
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE InventoryItem; --";
    
    const res = await request(app)
      .get('/api/inventory')
      .query({ search: maliciousInput })
      .expect(200);
    
    // Database should still exist
    const result = await db.query('SELECT COUNT(*) FROM InventoryItem');
    expect(result).to.exist;
  });
  
  it('should prevent XSS attacks', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    
    const res = await request(app)
      .post('/api/inventory')
      .send({ name: xssPayload })
      .expect(400); // Should reject
  });
  
  it('should require authentication', async () => {
    const res = await request(app)
      .get('/api/inventory')
      .expect(401);
  });
  
  it('should enforce permissions', async () => {
    const userToken = await getToken('user'); // Not admin
    
    const res = await request(app)
      .delete('/api/inventory/1')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403); // Forbidden
  });
  
  it('should prevent CSRF attacks', async () => {
    // Test CSRF token validation
  });
  
  it('should rate limit requests', async () => {
    // Send 100 requests rapidly
    for (let i = 0; i < 100; i++) {
      await request(app).get('/api/inventory');
    }
    
    // 101st request should be rate limited
    const res = await request(app)
      .get('/api/inventory')
      .expect(429); // Too Many Requests
  });
});
```

---

## 6️⃣ Regression Tests

**الهدف:** التأكد من عدم كسر الميزات الموجودة

### Automated Regression Suite:

```javascript
describe('Regression Tests', () => {
  
  it('REG-001: Existing items still accessible after update', async () => {
    // Test backward compatibility
  });
  
  it('REG-002: Old API endpoints still work', async () => {
    // Test API versioning
  });
  
  it('REG-003: Reports still generate correctly', async () => {
    // Test reports
  });
  
  // More regression tests...
});
```

---

## 7️⃣ Testing Tools & Setup

### Tools المستخدمة:

**Backend:**
- ✅ **Mocha** - Test Framework
- ✅ **Chai** - Assertions
- ✅ **Sinon** - Mocking
- ✅ **Supertest** - HTTP Testing
- ✅ **Istanbul/nyc** - Code Coverage

**Frontend:**
- ✅ **Jest** - Test Framework
- ✅ **React Testing Library** - Component Testing
- ✅ **MSW** - API Mocking

**E2E:**
- ✅ **Playwright** - Browser Automation

**Performance:**
- ✅ **K6** - Load Testing

---

### Setup Commands:

```bash
# Install dependencies
npm install --save-dev mocha chai sinon supertest nyc

# Backend tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:coverage    # With coverage

# Frontend tests
cd frontend/react-app
npm run test            # Jest tests
npm run test:coverage   # With coverage

# E2E tests
npx playwright install
npm run test:e2e

# Performance tests
k6 run tests/performance/inventory-load.js
```

---

## 8️⃣ CI/CD Integration

### GitHub Actions Workflow:

```yaml
name: Inventory Module Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: fixzone_test
        ports:
          - 3306:3306
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm ci
          cd frontend/react-app && npm ci
      
      - name: Run backend unit tests
        run: npm run test:unit
      
      - name: Run backend integration tests
        run: npm run test:integration
        env:
          DB_HOST: 127.0.0.1
          DB_USER: root
          DB_PASSWORD: root
          DB_NAME: fixzone_test
      
      - name: Run frontend tests
        run: cd frontend/react-app && npm run test
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
      
      - name: Run E2E tests
        run: |
          npm run start:test &
          npx playwright test
```

---

## ✅ Test Coverage Targets

### Coverage Goals:

```
┌────────────────────────────────────────────────────┐
│ Code Coverage Targets                              │
├────────────────────────────────────────────────────┤
│ Lines:        90%+ ████████████████████░░          │
│ Statements:   90%+ ████████████████████░░          │
│ Functions:    85%+ █████████████████░░░░           │
│ Branches:     80%+ ████████████████░░░░░           │
└────────────────────────────────────────────────────┘
```

**Critical Paths: 100% Coverage**
- Stock movement logic
- Purchase order receiving
- Stock level calculations
- Financial integration

---

## 📋 Test Execution Schedule

### Daily:
- ✅ Unit tests (automated)
- ✅ Integration tests (automated)

### Before Each PR:
- ✅ Full test suite
- ✅ Code coverage check
- ✅ Security scan

### Before Release:
- ✅ Full regression suite
- ✅ E2E tests
- ✅ Performance tests
- ✅ Security audit
- ✅ Manual exploratory testing

---

## ✅ الخلاصة

**إجمالي الاختبارات:** 170 اختبار
- Unit Tests: 100
- Integration Tests: 50
- E2E Tests: 20

**التغطية المستهدفة:** 90%+

**الأدوات:** Mocha, Chai, Jest, Playwright, K6

**الوقت المقدر للتطوير:** أسبوعان

---

**للعودة:**
- [← تصميم UI/UX](./06_UI_UX_DESIGN.md)
- [→ الملخص التنفيذي](./00_EXECUTIVE_SUMMARY.md)

---

**🎉 تمت الخطة الشاملة بنجاح!**

