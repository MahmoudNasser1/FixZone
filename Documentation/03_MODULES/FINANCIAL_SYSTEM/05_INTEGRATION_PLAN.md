# خطة التكامل - نظام المالية
## Financial System - Integration Plan

**تاريخ الإنشاء:** 2025-01-27  
**الحالة:** Production System - خطة تكامل شاملة  
**الإصدار:** 1.0.0

---

## 📋 جدول المحتويات

1. [نظرة عامة على التكامل](#1-نظرة-عامة-على-التكامل)
2. [التكامل مع Repairs Module](#2-التكامل-مع-repairs-module)
3. [التكامل مع Inventory Module](#3-التكامل-مع-inventory-module)
4. [التكامل مع Customers Module](#4-التكامل-مع-customers-module)
5. [التكامل مع Companies Module](#5-التكامل-مع-companies-module)
6. [التكامل مع Branches Module](#6-التكامل-مع-branches-module)
7. [التكامل مع Users Module](#7-التكامل-مع-users-module)
8. [التكامل مع Notifications Module](#8-التكامل-مع-notifications-module)
9. [التكامل مع Reports Module](#9-التكامل-مع-reports-module)

---

## 1. نظرة عامة على التكامل

### 1.1 الموديولات المتصلة

| الموديول | نوع التكامل | الحالة الحالية | الحالة المطلوبة |
|---------|------------|---------------|----------------|
| Repairs | مباشر | ⚠️ جزئي | ✅ كامل |
| Inventory | مباشر | ❌ غير موجود | ✅ كامل |
| Customers | مباشر | ⚠️ جزئي | ✅ كامل |
| Companies | مباشر | ❌ غير موجود | ✅ كامل |
| Branches | مباشر | ⚠️ جزئي | ✅ كامل |
| Users | مباشر | ✅ موجود | ✅ محسّن |
| Notifications | غير مباشر | ❌ غير موجود | ✅ كامل |
| Reports | غير مباشر | ⚠️ جزئي | ✅ كامل |

### 1.2 استراتيجية التكامل

1. **Database Level Integration**
   - Foreign Keys
   - Triggers
   - Stored Procedures

2. **Application Level Integration**
   - Service Layer
   - Event Emitters
   - WebSocket Events

3. **API Level Integration**
   - RESTful APIs
   - Webhooks
   - Real-time Sync

---

## 2. التكامل مع Repairs Module

### 2.1 الوضع الحالي

**الربط الموجود:**
- ✅ `Invoice.repairRequestId` - ربط الفواتير بطلبات الإصلاح
- ⚠️ لا يوجد منطق تلقائي لإنشاء الفواتير
- ⚠️ لا يوجد تحديث تلقائي لحالة طلب الإصلاح

### 2.2 التكامل المطلوب

#### 2.2.1 Database Schema

```sql
-- Invoice table already has repairRequestId
-- Add index for better performance
CREATE INDEX idx_invoice_repair ON Invoice(repairRequestId);

-- Add trigger to update repair status when invoice is paid
DELIMITER $$
CREATE TRIGGER update_repair_on_invoice_paid
AFTER UPDATE ON Invoice
FOR EACH ROW
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    UPDATE RepairRequest
    SET status = 'completed',
        invoiceId = NEW.id,
        completedAt = NOW()
    WHERE id = NEW.repairRequestId;
  END IF;
END$$
DELIMITER ;
```

#### 2.2.2 Service Integration

```javascript
// backend/services/financial/invoices.service.js

async createFromRepair(repairId, data, user) {
  // Get repair request
  const repair = await repairsService.getById(repairId, user);
  
  // Validate repair can be invoiced
  if (repair.status !== 'ready_for_invoice') {
    throw new Error('Repair is not ready for invoicing');
  }

  // Generate invoice items from repair
  const items = await this.generateItemsFromRepair(repair);

  // Create invoice
  const invoice = await this.create({
    ...data,
    repairRequestId: repairId,
    customerId: repair.customerId,
    items
  }, user);

  // Update repair status
  await repairsService.updateStatus(repairId, 'invoiced', user);

  // Emit event
  this.emitEvent('invoice_created_from_repair', {
    repairId,
    invoiceId: invoice.id
  });

  return invoice;
}

async generateItemsFromRepair(repair) {
  const items = [];

  // Add services
  if (repair.services && repair.services.length > 0) {
    for (const service of repair.services) {
      items.push({
        serviceId: service.id,
        description: service.name,
        quantity: 1,
        unitPrice: service.price
      });
    }
  }

  // Add accessories
  if (repair.accessories && repair.accessories.length > 0) {
    for (const accessory of repair.accessories) {
      items.push({
        inventoryItemId: accessory.inventoryItemId,
        description: accessory.name,
        quantity: accessory.quantity,
        unitPrice: accessory.unitPrice
      });
    }
  }

  // Add labor cost
  if (repair.laborCost > 0) {
    items.push({
      description: 'تكلفة العمالة',
      quantity: 1,
      unitPrice: repair.laborCost
    });
  }

  return items;
}
```

#### 2.2.3 WebSocket Events

```javascript
// When invoice is created from repair
socket.emit('repair:invoice_created', {
  repairId: 10,
  invoiceId: 5
});

// When invoice is paid
socket.emit('repair:invoice_paid', {
  repairId: 10,
  invoiceId: 5
});
```

### 2.3 API Endpoints

```javascript
// Create invoice from repair
POST /api/financial/invoices/create-from-repair/:repairId

// Get invoice by repair
GET /api/financial/invoices/by-repair/:repairId

// Get repair invoices
GET /api/repairs/:repairId/invoices
```

---

## 3. التكامل مع Inventory Module

### 3.1 الوضع الحالي

**الربط الموجود:**
- ✅ `InvoiceItem.inventoryItemId` - ربط عناصر الفاتورة بالمخزون
- ❌ لا يوجد خصم تلقائي من المخزون
- ❌ لا يوجد ربط بين النفقات والمخزون

### 3.2 التكامل المطلوب

#### 3.2.1 Database Schema

```sql
-- InvoiceItem already has inventoryItemId
-- Add index
CREATE INDEX idx_invoice_item_inventory ON InvoiceItem(inventoryItemId);

-- Add trigger to deduct stock when invoice is paid
DELIMITER $$
CREATE TRIGGER deduct_stock_on_invoice_paid
AFTER UPDATE ON Invoice
FOR EACH ROW
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    -- Deduct stock for all invoice items
    UPDATE InventoryItem ii
    INNER JOIN InvoiceItem inv_item ON ii.id = inv_item.inventoryItemId
    SET ii.stockLevel = ii.stockLevel - inv_item.quantity,
        ii.updatedAt = NOW()
    WHERE inv_item.invoiceId = NEW.id
      AND inv_item.inventoryItemId IS NOT NULL;
  END IF;
END$$
DELIMITER ;
```

#### 3.2.2 Service Integration

```javascript
// backend/services/financial/invoices.service.js

async markAsPaid(invoiceId, user) {
  const invoice = await this.getById(invoiceId, user);
  
  // Update invoice status
  await invoicesRepository.update(invoiceId, { status: 'paid' });

  // Deduct inventory stock
  const items = await invoiceItemsService.getByInvoice(invoiceId);
  for (const item of items) {
    if (item.inventoryItemId) {
      await inventoryService.deductStock(
        item.inventoryItemId,
        item.quantity,
        `Invoice ${invoice.invoiceNumber}`
      );
    }
  }

  // Emit event
  this.emitEvent('invoice_paid', {
    invoiceId,
    items: items.filter(i => i.inventoryItemId)
  });

  return invoice;
}
```

#### 3.2.3 Expense Integration with Inventory

```javascript
// backend/services/financial/expenses.service.js

async create(data, user) {
  // Create expense
  const expense = await expensesRepository.create({
    ...data,
    createdBy: user.id
  });

  // If linked to inventory item, update stock
  if (data.inventoryItemId && data.quantity) {
    await inventoryService.addStock(
      data.inventoryItemId,
      data.quantity,
      `Expense ${expense.id}`
    );
  }

  return expense;
}
```

---

## 4. التكامل مع Customers Module

### 4.1 الوضع الحالي

**الربط الموجود:**
- ⚠️ ربط غير مباشر عبر `RepairRequest.customerId`
- ❌ لا يوجد ربط مباشر `Invoice.customerId`
- ❌ لا يوجد حساب للرصيد المستحق

### 4.2 التكامل المطلوب

#### 4.2.1 Database Schema

```sql
-- Add customerId to Invoice
ALTER TABLE Invoice
  ADD COLUMN customerId INT(11) NULL AFTER id,
  ADD INDEX idx_invoice_customer (customerId),
  ADD FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE SET NULL;

-- Create view for customer balance
CREATE VIEW CustomerBalance AS
SELECT 
  c.id as customerId,
  c.name as customerName,
  COALESCE(SUM(i.totalAmount), 0) as totalInvoiced,
  COALESCE(SUM(p.amount), 0) as totalPaid,
  COALESCE(SUM(i.totalAmount), 0) - COALESCE(SUM(p.amount), 0) as balance
FROM Customer c
LEFT JOIN Invoice i ON c.id = i.customerId AND i.deletedAt IS NULL
LEFT JOIN Payment p ON i.id = p.invoiceId AND p.deletedAt IS NULL
GROUP BY c.id, c.name;
```

#### 4.2.2 Service Integration

```javascript
// backend/services/financial/customers.service.js

async getCustomerBalance(customerId) {
  const [result] = await db.query(`
    SELECT * FROM CustomerBalance WHERE customerId = ?
  `, [customerId]);

  return result[0] || {
    customerId,
    totalInvoiced: 0,
    totalPaid: 0,
    balance: 0
  };
}

async getCustomerInvoices(customerId, filters = {}) {
  return await invoicesRepository.findByCustomer(customerId, filters);
}

async getCustomerPayments(customerId, filters = {}) {
  return await paymentsRepository.findByCustomer(customerId, filters);
}
```

#### 4.2.3 API Endpoints

```javascript
// Get customer balance
GET /api/customers/:id/balance

// Get customer invoices
GET /api/customers/:id/invoices

// Get customer payments
GET /api/customers/:id/payments
```

---

## 5. التكامل مع Companies Module

### 5.1 الوضع الحالي

**الربط الموجود:**
- ❌ لا يوجد ربط مباشر
- ❌ لا يوجد فواتير مجمعة للشركات
- ❌ لا يوجد مدفوعات مجمعة

### 5.2 التكامل المطلوب

#### 5.2.1 Database Schema

```sql
-- Add companyId to Invoice
ALTER TABLE Invoice
  ADD COLUMN companyId INT(11) NULL AFTER customerId,
  ADD INDEX idx_invoice_company (companyId),
  ADD FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE SET NULL;

-- Create view for company balance
CREATE VIEW CompanyBalance AS
SELECT 
  co.id as companyId,
  co.name as companyName,
  COALESCE(SUM(i.totalAmount), 0) as totalInvoiced,
  COALESCE(SUM(p.amount), 0) as totalPaid,
  COALESCE(SUM(i.totalAmount), 0) - COALESCE(SUM(p.amount), 0) as balance
FROM Company co
LEFT JOIN Invoice i ON co.id = i.companyId AND i.deletedAt IS NULL
LEFT JOIN Payment p ON i.id = p.invoiceId AND p.deletedAt IS NULL
GROUP BY co.id, co.name;
```

#### 5.2.2 Service Integration

```javascript
// backend/services/financial/companies.service.js

async getCompanyBalance(companyId) {
  const [result] = await db.query(`
    SELECT * FROM CompanyBalance WHERE companyId = ?
  `, [companyId]);

  return result[0] || {
    companyId,
    totalInvoiced: 0,
    totalPaid: 0,
    balance: 0
  };
}

async getCompanyInvoices(companyId, filters = {}) {
  return await invoicesRepository.findByCompany(companyId, filters);
}
```

---

## 6. التكامل مع Branches Module

### 6.1 الوضع الحالي

**الربط الموجود:**
- ✅ `Expense.branchId` - ربط النفقات بالفروع
- ⚠️ لا يوجد ربط مباشر للفواتير والمدفوعات

### 6.2 التكامل المطلوب

#### 6.2.1 Database Schema

```sql
-- Add branchId to Invoice
ALTER TABLE Invoice
  ADD COLUMN branchId INT(11) NULL AFTER companyId,
  ADD INDEX idx_invoice_branch (branchId),
  ADD FOREIGN KEY (branchId) REFERENCES Branch(id) ON DELETE SET NULL;

-- Add branchId to Payment
ALTER TABLE Payment
  ADD COLUMN branchId INT(11) NULL AFTER invoiceId,
  ADD INDEX idx_payment_branch (branchId),
  ADD FOREIGN KEY (branchId) REFERENCES Branch(id) ON DELETE SET NULL;
```

#### 6.2.2 Service Integration

```javascript
// backend/services/financial/branches.service.js

async getBranchFinancialSummary(branchId, dateFrom, dateTo) {
  const [expenses] = await db.query(`
    SELECT SUM(amount) as totalExpenses
    FROM Expense
    WHERE branchId = ? AND date BETWEEN ? AND ? AND deletedAt IS NULL
  `, [branchId, dateFrom, dateTo]);

  const [invoices] = await db.query(`
    SELECT 
      SUM(totalAmount) as totalInvoiced,
      SUM(CASE WHEN status = 'paid' THEN totalAmount ELSE 0 END) as totalPaid
    FROM Invoice
    WHERE branchId = ? AND issueDate BETWEEN ? AND ? AND deletedAt IS NULL
  `, [branchId, dateFrom, dateTo]);

  return {
    expenses: expenses[0].totalExpenses || 0,
    invoiced: invoices[0].totalInvoiced || 0,
    paid: invoices[0].totalPaid || 0,
    profit: (invoices[0].totalPaid || 0) - (expenses[0].totalExpenses || 0)
  };
}
```

---

## 7. التكامل مع Users Module

### 7.1 الوضع الحالي

**الربط الموجود:**
- ✅ `createdBy` في جميع الجداول
- ⚠️ لا يوجد Audit Trail شامل

### 7.2 التكامل المطلوب

#### 7.2.1 Audit Logging

```javascript
// backend/services/financial/auditLog.service.js

async logFinancialAction(action, entityType, entityId, userId, changes) {
  await auditLogRepository.create({
    action,
    entityType,
    entityId,
    userId,
    module: 'financial',
    changes: JSON.stringify(changes),
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    createdAt: new Date()
  });
}
```

---

## 8. التكامل مع Notifications Module

### 8.1 التكامل المطلوب

#### 8.1.1 Notification Events

```javascript
// When invoice is created
notificationService.send({
  type: 'invoice_created',
  userId: invoice.customerId,
  title: 'فاتورة جديدة',
  message: `تم إنشاء فاتورة ${invoice.invoiceNumber}`,
  data: { invoiceId: invoice.id }
});

// When invoice is overdue
notificationService.send({
  type: 'invoice_overdue',
  userId: invoice.customerId,
  title: 'فاتورة متأخرة',
  message: `فاتورة ${invoice.invoiceNumber} متأخرة`,
  data: { invoiceId: invoice.id, daysOverdue: 5 }
});

// When payment is received
notificationService.send({
  type: 'payment_received',
  userId: invoice.customerId,
  title: 'تم استلام الدفعة',
  message: `تم استلام دفعة ${payment.amount} للفاتورة ${invoice.invoiceNumber}`,
  data: { paymentId: payment.id, invoiceId: invoice.id }
});
```

---

## 9. التكامل مع Reports Module

### 9.1 التكامل المطلوب

#### 9.1.1 Financial Reports

```javascript
// backend/services/financial/financialReports.service.js

async getProfitLossReport(dateFrom, dateTo, branchId = null) {
  // Get revenue (paid invoices)
  const revenue = await invoicesRepository.getRevenue(dateFrom, dateTo, branchId);
  
  // Get expenses
  const expenses = await expensesRepository.getTotal(dateFrom, dateTo, branchId);
  
  // Get COGS (Cost of Goods Sold)
  const cogs = await inventoryService.getCOGS(dateFrom, dateTo, branchId);
  
  return {
    revenue,
    expenses,
    cogs,
    grossProfit: revenue - cogs,
    netProfit: revenue - expenses - cogs
  };
}

async getCashFlowReport(dateFrom, dateTo, branchId = null) {
  // Get cash inflows (payments)
  const inflows = await paymentsRepository.getTotal(dateFrom, dateTo, branchId);
  
  // Get cash outflows (expenses)
  const outflows = await expensesRepository.getTotal(dateFrom, dateTo, branchId);
  
  return {
    inflows,
    outflows,
    netCashFlow: inflows - outflows
  };
}
```

---

## 📚 المراجع

- [الوضع الحالي](./01_OVERVIEW_AND_CURRENT_STATE.md)
- [خطة Backend](./02_BACKEND_DEVELOPMENT_PLAN.md)
- [خطة التنفيذ](./07_IMPLEMENTATION_PLAN.md)

---

**آخر تحديث:** 2025-01-27

