# خطة تطوير Backend - نظام المالية
## Financial System - Backend Development Plan

**تاريخ الإنشاء:** 2025-01-27  
**الحالة:** Production System - خطة تطوير شاملة  
**الإصدار:** 1.0.0

---

## 📋 جدول المحتويات

1. [الهيكل المقترح](#1-الهيكل-المقترح)
2. [Routes و Controllers](#2-routes-و-controllers)
3. [Services Layer](#3-services-layer)
4. [Repositories Layer](#4-repositories-layer)
5. [Models و Database Schema](#5-models-و-database-schema)
6. [Middleware و Validation](#6-middleware-و-validation)
7. [Background Jobs](#7-background-jobs)
8. [Caching Strategy](#8-caching-strategy)
9. [Error Handling](#9-error-handling)
10. [Security Enhancements](#10-security-enhancements)

---

## 1. الهيكل المقترح

### 1.1 الهيكل الحالي

```
backend/
├── routes/
│   ├── expenses.js (918 سطر)
│   ├── payments.js (848 سطر)
│   ├── invoices.js (297 سطر) ⚠️ غير مستخدم
│   ├── invoicesSimple.js (2391 سطر)
│   ├── invoiceItems.js (3021 سطر)
│   ├── expenseCategories.js (4730 سطر)
│   └── invoiceTemplates.js (1303 سطر)
└── middleware/
    └── validation.js
```

### 1.2 الهيكل المقترح

```
backend/
├── routes/
│   └── financial/
│       ├── expenses.routes.js
│       ├── payments.routes.js
│       ├── invoices.routes.js
│       ├── invoiceItems.routes.js
│       ├── expenseCategories.routes.js
│       ├── invoiceTemplates.routes.js
│       └── financialReports.routes.js
├── controllers/
│   └── financial/
│       ├── expenses.controller.js
│       ├── payments.controller.js
│       ├── invoices.controller.js
│       ├── invoiceItems.controller.js
│       ├── expenseCategories.controller.js
│       ├── invoiceTemplates.controller.js
│       └── financialReports.controller.js
├── services/
│   └── financial/
│       ├── expenses.service.js
│       ├── payments.service.js
│       ├── invoices.service.js
│       ├── invoiceItems.service.js
│       ├── expenseCategories.service.js
│       ├── invoiceTemplates.service.js
│       ├── financialReports.service.js
│       └── financialIntegration.service.js
├── repositories/
│   └── financial/
│       ├── expenses.repository.js
│       ├── payments.repository.js
│       ├── invoices.repository.js
│       ├── invoiceItems.repository.js
│       ├── expenseCategories.repository.js
│       └── invoiceTemplates.repository.js
├── models/
│   └── financial/
│       ├── Expense.js
│       ├── Payment.js
│       ├── Invoice.js
│       ├── InvoiceItem.js
│       ├── ExpenseCategory.js
│       └── InvoiceTemplate.js
├── middleware/
│   └── financial/
│       ├── financialAuth.middleware.js
│       ├── financialValidation.middleware.js
│       └── financialRateLimit.middleware.js
└── jobs/
    └── financial/
        ├── invoiceReminder.job.js
        ├── paymentReminder.job.js
        └── financialReports.job.js
```

---

## 2. Routes و Controllers

### 2.1 Expenses Routes

#### 2.1.1 Routes Structure

```javascript
// backend/routes/financial/expenses.routes.js
const express = require('express');
const router = express.Router();
const expensesController = require('../../controllers/financial/expenses.controller');
const { validate } = require('../../middleware/validation');
const { financialAuth } = require('../../middleware/financial/financialAuth.middleware');
const { financialRateLimit } = require('../../middleware/financial/financialRateLimit.middleware');

// Apply middleware
router.use(financialAuth);
router.use(financialRateLimit);

// Routes
router.get('/', 
  validate(expenseSchemas.getExpenses, 'query'),
  expensesController.getAll
);

router.get('/stats',
  validate(expenseSchemas.getExpenseStats, 'query'),
  expensesController.getStats
);

router.get('/:id',
  validate(commonSchemas.idParam, 'params'),
  expensesController.getById
);

router.post('/',
  validate(expenseSchemas.createExpense, 'body'),
  expensesController.create
);

router.put('/:id',
  validate(commonSchemas.idParam, 'params'),
  validate(expenseSchemas.updateExpense, 'body'),
  expensesController.update
);

router.delete('/:id',
  validate(commonSchemas.idParam, 'params'),
  expensesController.delete
);

router.post('/bulk',
  validate(expenseSchemas.bulkExpenses, 'body'),
  expensesController.bulkOperation
);

router.get('/export/excel',
  validate(expenseSchemas.exportExpenses, 'query'),
  expensesController.exportToExcel
);

module.exports = router;
```

#### 2.1.2 Controller Structure

```javascript
// backend/controllers/financial/expenses.controller.js
const expensesService = require('../../services/financial/expenses.service');
const { handleAsync } = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/response');

class ExpensesController {
  async getAll(req, res) {
    return handleAsync(async () => {
      const result = await expensesService.getAll(req.query, req.user);
      return successResponse(res, result, 'Expenses retrieved successfully');
    }, res);
  }

  async getById(req, res) {
    return handleAsync(async () => {
      const result = await expensesService.getById(req.params.id, req.user);
      return successResponse(res, result, 'Expense retrieved successfully');
    }, res);
  }

  async create(req, res) {
    return handleAsync(async () => {
      const result = await expensesService.create(req.body, req.user);
      return successResponse(res, result, 'Expense created successfully', 201);
    }, res);
  }

  async update(req, res) {
    return handleAsync(async () => {
      const result = await expensesService.update(req.params.id, req.body, req.user);
      return successResponse(res, result, 'Expense updated successfully');
    }, res);
  }

  async delete(req, res) {
    return handleAsync(async () => {
      await expensesService.delete(req.params.id, req.user);
      return successResponse(res, null, 'Expense deleted successfully');
    }, res);
  }

  async getStats(req, res) {
    return handleAsync(async () => {
      const result = await expensesService.getStats(req.query, req.user);
      return successResponse(res, result, 'Expense stats retrieved successfully');
    }, res);
  }

  async bulkOperation(req, res) {
    return handleAsync(async () => {
      const result = await expensesService.bulkOperation(req.body, req.user);
      return successResponse(res, result, 'Bulk operation completed successfully');
    }, res);
  }

  async exportToExcel(req, res) {
    return handleAsync(async () => {
      const result = await expensesService.exportToExcel(req.query, req.user);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=expenses_${Date.now()}.xlsx`);
      return res.send(result);
    }, res);
  }
}

module.exports = new ExpensesController();
```

### 2.2 Payments Routes

#### 2.2.1 Routes Structure

```javascript
// backend/routes/financial/payments.routes.js
const express = require('express');
const router = express.Router();
const paymentsController = require('../../controllers/financial/payments.controller');
const { validate } = require('../../middleware/validation');
const { financialAuth } = require('../../middleware/financial/financialAuth.middleware');
const { financialRateLimit } = require('../../middleware/financial/financialRateLimit.middleware');

router.use(financialAuth);
router.use(financialRateLimit);

router.get('/', 
  validate(paymentSchemas.getPayments, 'query'),
  paymentsController.getAll
);

router.get('/stats/summary',
  validate(paymentSchemas.getPaymentStats, 'query'),
  paymentsController.getStatsSummary
);

router.get('/overdue',
  validate(paymentSchemas.getOverduePayments, 'query'),
  paymentsController.getOverdue
);

router.get('/invoice/:invoiceId',
  validate(commonSchemas.idParam, 'params'),
  paymentsController.getByInvoice
);

router.get('/:id',
  validate(commonSchemas.idParam, 'params'),
  paymentsController.getById
);

router.post('/',
  validate(paymentSchemas.createPayment, 'body'),
  paymentsController.create
);

router.put('/:id',
  validate(commonSchemas.idParam, 'params'),
  validate(paymentSchemas.updatePayment, 'body'),
  paymentsController.update
);

router.delete('/:id',
  validate(commonSchemas.idParam, 'params'),
  paymentsController.delete
);

router.post('/bulk',
  validate(paymentSchemas.bulkPayments, 'body'),
  paymentsController.bulkOperation
);

module.exports = router;
```

### 2.3 Invoices Routes

#### 2.3.1 Routes Structure

```javascript
// backend/routes/financial/invoices.routes.js
const express = require('express');
const router = express.Router();
const invoicesController = require('../../controllers/financial/invoices.controller');
const { validate } = require('../../middleware/validation');
const { financialAuth } = require('../../middleware/financial/financialAuth.middleware');
const { financialRateLimit } = require('../../middleware/financial/financialRateLimit.middleware');

router.use(financialAuth);
router.use(financialRateLimit);

router.get('/', 
  validate(invoiceSchemas.getInvoices, 'query'),
  invoicesController.getAll
);

router.get('/stats',
  validate(invoiceSchemas.getInvoiceStats, 'query'),
  invoicesController.getStats
);

router.get('/by-repair/:repairId',
  validate(commonSchemas.idParam, 'params'),
  invoicesController.getByRepair
);

router.get('/:id',
  validate(commonSchemas.idParam, 'params'),
  invoicesController.getById
);

router.get('/:id/pdf',
  validate(commonSchemas.idParam, 'params'),
  invoicesController.generatePDF
);

router.post('/',
  validate(invoiceSchemas.createInvoice, 'body'),
  invoicesController.create
);

router.post('/create-from-repair/:repairId',
  validate(commonSchemas.idParam, 'params'),
  validate(invoiceSchemas.createFromRepair, 'body'),
  invoicesController.createFromRepair
);

router.put('/:id',
  validate(commonSchemas.idParam, 'params'),
  validate(invoiceSchemas.updateInvoice, 'body'),
  invoicesController.update
);

router.delete('/:id',
  validate(commonSchemas.idParam, 'params'),
  invoicesController.delete
);

router.post('/bulk-action',
  validate(invoiceSchemas.bulkAction, 'body'),
  invoicesController.bulkAction
);

router.post('/:id/send',
  validate(commonSchemas.idParam, 'params'),
  invoicesController.sendInvoice
);

router.post('/:id/mark-paid',
  validate(commonSchemas.idParam, 'params'),
  invoicesController.markAsPaid
);

module.exports = router;
```

---

## 3. Services Layer

### 3.1 Expenses Service

```javascript
// backend/services/financial/expenses.service.js
const expensesRepository = require('../../repositories/financial/expenses.repository');
const auditLogService = require('../auditLog.service');
const cacheService = require('../cache.service');
const inventoryService = require('../inventory/inventory.service');

class ExpensesService {
  async getAll(query, user) {
    // Check cache first
    const cacheKey = `expenses:${JSON.stringify(query)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Get from repository
    const result = await expensesRepository.findAll(query);

    // Cache result
    await cacheService.set(cacheKey, result, 300); // 5 minutes

    return result;
  }

  async getById(id, user) {
    // Check cache
    const cacheKey = `expense:${id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Get from repository
    const expense = await expensesRepository.findById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }

    // Check permissions
    await this.checkPermissions(expense, user, 'read');

    // Cache result
    await cacheService.set(cacheKey, expense, 300);

    return expense;
  }

  async create(data, user) {
    // Validate data
    await this.validateExpenseData(data);

    // Create expense
    const expense = await expensesRepository.create({
      ...data,
      createdBy: user.id
    });

    // Update inventory if linked
    if (data.inventoryItemId) {
      await inventoryService.updateStock(data.inventoryItemId, -data.quantity || 1);
    }

    // Log audit
    await auditLogService.log({
      action: 'expense_created',
      entityType: 'Expense',
      entityId: expense.id,
      userId: user.id,
      changes: expense
    });

    // Invalidate cache
    await cacheService.invalidate('expenses:*');

    // Emit WebSocket event
    this.emitEvent('expense_created', expense);

    return expense;
  }

  async update(id, data, user) {
    // Get existing expense
    const existing = await expensesRepository.findById(id);
    if (!existing) {
      throw new Error('Expense not found');
    }

    // Check permissions
    await this.checkPermissions(existing, user, 'update');

    // Validate data
    await this.validateExpenseData(data, id);

    // Update expense
    const updated = await expensesRepository.update(id, data);

    // Log audit
    await auditLogService.log({
      action: 'expense_updated',
      entityType: 'Expense',
      entityId: id,
      userId: user.id,
      changes: { before: existing, after: updated }
    });

    // Invalidate cache
    await cacheService.invalidate(`expense:${id}`);
    await cacheService.invalidate('expenses:*');

    // Emit WebSocket event
    this.emitEvent('expense_updated', updated);

    return updated;
  }

  async delete(id, user) {
    // Get existing expense
    const existing = await expensesRepository.findById(id);
    if (!existing) {
      throw new Error('Expense not found');
    }

    // Check permissions
    await this.checkPermissions(existing, user, 'delete');

    // Soft delete
    await expensesRepository.softDelete(id);

    // Log audit
    await auditLogService.log({
      action: 'expense_deleted',
      entityType: 'Expense',
      entityId: id,
      userId: user.id,
      changes: existing
    });

    // Invalidate cache
    await cacheService.invalidate(`expense:${id}`);
    await cacheService.invalidate('expenses:*');

    // Emit WebSocket event
    this.emitEvent('expense_deleted', { id });

    return true;
  }

  async getStats(query, user) {
    // Check cache
    const cacheKey = `expense_stats:${JSON.stringify(query)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Get stats from repository
    const stats = await expensesRepository.getStats(query);

    // Cache result
    await cacheService.set(cacheKey, stats, 600); // 10 minutes

    return stats;
  }

  async bulkOperation(operations, user) {
    const results = [];

    for (const operation of operations) {
      try {
        let result;
        switch (operation.action) {
          case 'delete':
            result = await this.delete(operation.id, user);
            break;
          case 'update':
            result = await this.update(operation.id, operation.data, user);
            break;
          default:
            throw new Error(`Unknown action: ${operation.action}`);
        }
        results.push({ id: operation.id, success: true, result });
      } catch (error) {
        results.push({ id: operation.id, success: false, error: error.message });
      }
    }

    return results;
  }

  async exportToExcel(query, user) {
    const expenses = await expensesRepository.findAll(query);
    return this.generateExcel(expenses);
  }

  // Private methods
  async validateExpenseData(data, id = null) {
    // Validation logic
  }

  async checkPermissions(expense, user, action) {
    // Permission checks
    if (user.role === 'admin') return true;
    if (expense.createdBy === user.id) return true;
    if (action === 'read' && user.role === 'accountant') return true;
    throw new Error('Permission denied');
  }

  emitEvent(event, data) {
    // WebSocket emit
    if (global.io) {
      global.io.emit(`financial:${event}`, data);
    }
  }
}

module.exports = new ExpensesService();
```

### 3.2 Payments Service

```javascript
// backend/services/financial/payments.service.js
const paymentsRepository = require('../../repositories/financial/payments.repository');
const invoicesService = require('./invoices.service');
const auditLogService = require('../auditLog.service');
const cacheService = require('../cache.service');

class PaymentsService {
  async create(data, user) {
    // Validate invoice exists
    const invoice = await invoicesService.getById(data.invoiceId, user);
    
    // Validate amount
    const totalPaid = await this.getTotalPaid(data.invoiceId);
    if (totalPaid + data.amount > invoice.totalAmount) {
      throw new Error('Payment amount exceeds invoice total');
    }

    // Create payment
    const payment = await paymentsRepository.create({
      ...data,
      createdBy: user.id,
      paymentDate: data.paymentDate || new Date()
    });

    // Update invoice status
    const newTotalPaid = totalPaid + data.amount;
    if (newTotalPaid >= invoice.totalAmount) {
      await invoicesService.markAsPaid(invoice.id, user);
    } else {
      await invoicesService.updateStatus(invoice.id, 'partially_paid', user);
    }

    // Log audit
    await auditLogService.log({
      action: 'payment_created',
      entityType: 'Payment',
      entityId: payment.id,
      userId: user.id,
      changes: payment
    });

    // Invalidate cache
    await cacheService.invalidate(`payment:${payment.id}`);
    await cacheService.invalidate(`invoice:${invoice.id}`);
    await cacheService.invalidate('payments:*');

    // Emit WebSocket event
    this.emitEvent('payment_created', payment);

    return payment;
  }

  async getTotalPaid(invoiceId) {
    const payments = await paymentsRepository.findByInvoice(invoiceId);
    return payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  }

  // ... other methods similar to ExpensesService
}

module.exports = new PaymentsService();
```

### 3.3 Invoices Service

```javascript
// backend/services/financial/invoices.service.js
const invoicesRepository = require('../../repositories/financial/invoices.repository');
const invoiceItemsService = require('./invoiceItems.service');
const repairsService = require('../repairs/repairs.service');
const auditLogService = require('../auditLog.service');
const cacheService = require('../cache.service');
const pdfService = require('../pdf.service');

class InvoicesService {
  async create(data, user) {
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate totals
    const totals = await this.calculateTotals(data.items);

    // Create invoice
    const invoice = await invoicesRepository.create({
      ...data,
      invoiceNumber,
      ...totals,
      createdBy: user.id,
      status: 'draft'
    });

    // Create invoice items
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await invoiceItemsService.create({
          ...item,
          invoiceId: invoice.id
        }, user);
      }
    }

    // Link to repair if provided
    if (data.repairRequestId) {
      await repairsService.linkInvoice(data.repairRequestId, invoice.id, user);
    }

    // Log audit
    await auditLogService.log({
      action: 'invoice_created',
      entityType: 'Invoice',
      entityId: invoice.id,
      userId: user.id,
      changes: invoice
    });

    // Invalidate cache
    await cacheService.invalidate('invoices:*');

    // Emit WebSocket event
    this.emitEvent('invoice_created', invoice);

    return invoice;
  }

  async createFromRepair(repairId, data, user) {
    // Get repair request
    const repair = await repairsService.getById(repairId, user);

    // Create invoice from repair
    const invoice = await this.create({
      ...data,
      repairRequestId: repairId,
      customerId: repair.customerId,
      items: await this.generateItemsFromRepair(repair)
    }, user);

    return invoice;
  }

  async generatePDF(id, user) {
    const invoice = await this.getById(id, user);
    const items = await invoiceItemsService.getByInvoice(id);
    
    return await pdfService.generateInvoicePDF(invoice, items);
  }

  async calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice));
    }, 0);

    const taxAmount = subtotal * 0.14; // 14% VAT
    const totalAmount = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      totalAmount
    };
  }

  async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const count = await invoicesRepository.countByYear(year);
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  // ... other methods
}

module.exports = new InvoicesService();
```

---

## 4. Repositories Layer

### 4.1 Expenses Repository

```javascript
// backend/repositories/financial/expenses.repository.js
const db = require('../../db');
const BaseRepository = require('../base.repository');

class ExpensesRepository extends BaseRepository {
  constructor() {
    super('Expense');
  }

  async findAll(query) {
    const {
      categoryId,
      vendorId,
      branchId,
      dateFrom,
      dateTo,
      q,
      page = 1,
      limit = 50
    } = query;

    let whereConditions = ['deletedAt IS NULL'];
    let queryParams = [];
    const offset = (page - 1) * limit;

    if (categoryId) {
      whereConditions.push('categoryId = ?');
      queryParams.push(categoryId);
    }

    if (vendorId) {
      whereConditions.push('vendorId = ?');
      queryParams.push(vendorId);
    }

    if (branchId) {
      whereConditions.push('branchId = ?');
      queryParams.push(branchId);
    }

    if (dateFrom) {
      whereConditions.push('DATE(date) >= ?');
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('DATE(date) <= ?');
      queryParams.push(dateTo);
    }

    if (q) {
      whereConditions.push('(description LIKE ? OR amount LIKE ?)');
      queryParams.push(`%${q}%`, `%${q}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM Expense ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Get data
    const [rows] = await db.query(
      `SELECT e.*, 
              ec.name as categoryName,
              b.name as branchName
       FROM Expense e
       LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
       LEFT JOIN Branch b ON e.branchId = b.id
       ${whereClause}
       ORDER BY e.date DESC, e.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getStats(query) {
    const { dateFrom, dateTo, branchId } = query;
    
    let whereConditions = ['deletedAt IS NULL'];
    let queryParams = [];

    if (dateFrom) {
      whereConditions.push('DATE(date) >= ?');
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('DATE(date) <= ?');
      queryParams.push(dateTo);
    }

    if (branchId) {
      whereConditions.push('branchId = ?');
      queryParams.push(branchId);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as totalCount,
        SUM(amount) as totalAmount,
        AVG(amount) as averageAmount,
        MIN(amount) as minAmount,
        MAX(amount) as maxAmount,
        COUNT(DISTINCT categoryId) as categoryCount
       FROM Expense
       ${whereClause}`,
      queryParams
    );

    return rows[0];
  }
}

module.exports = new ExpensesRepository();
```

---

## 5. Models و Database Schema

### 5.1 Database Migrations

#### 5.1.1 Invoice Table Enhancements

```sql
-- Migration: Add missing columns to Invoice table
ALTER TABLE Invoice 
  ADD COLUMN discountAmount DECIMAL(12,2) DEFAULT 0.00 AFTER taxAmount,
  ADD COLUMN dueDate DATE NULL AFTER currency,
  ADD COLUMN notes TEXT NULL AFTER status,
  ADD COLUMN customerId INT(11) NULL AFTER id,
  ADD INDEX idx_customerId (customerId),
  ADD INDEX idx_dueDate (dueDate),
  ADD INDEX idx_status (status),
  ADD FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE SET NULL;
```

#### 5.1.2 Payment Table Enhancements

```sql
-- Migration: Add paymentDate column to Payment table
ALTER TABLE Payment
  ADD COLUMN paymentDate DATE NULL AFTER amount,
  ADD INDEX idx_paymentDate (paymentDate),
  ADD INDEX idx_invoiceId (invoiceId);
```

#### 5.1.3 InvoiceItem Table Enhancements

```sql
-- Migration: Add soft delete to InvoiceItem
ALTER TABLE InvoiceItem
  ADD COLUMN deletedAt DATETIME NULL AFTER updatedAt,
  ADD INDEX idx_deletedAt (deletedAt),
  ADD INDEX idx_invoiceId (invoiceId);
```

#### 5.1.4 Indexes Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_expense_date ON Expense(date);
CREATE INDEX idx_expense_category ON Expense(categoryId);
CREATE INDEX idx_expense_branch ON Expense(branchId);
CREATE INDEX idx_expense_deleted ON Expense(deletedAt);

CREATE INDEX idx_payment_invoice ON Payment(invoiceId);
CREATE INDEX idx_payment_method ON Payment(paymentMethod);
CREATE INDEX idx_payment_deleted ON Payment(deletedAt);

CREATE INDEX idx_invoice_repair ON Invoice(repairRequestId);
CREATE INDEX idx_invoice_customer ON Invoice(customerId);
CREATE INDEX idx_invoice_status ON Invoice(status);
CREATE INDEX idx_invoice_deleted ON Invoice(deletedAt);
```

---

## 6. Middleware و Validation

### 6.1 Financial Auth Middleware

```javascript
// backend/middleware/financial/financialAuth.middleware.js
const { checkPermission } = require('../permissions.middleware');

const financialAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check financial permissions
    const hasPermission = await checkPermission(req.user, 'financial', req.method, req.path);
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions for financial operations'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message
    });
  }
};

module.exports = { financialAuth };
```

### 6.2 Financial Rate Limit Middleware

```javascript
// backend/middleware/financial/financialRateLimit.middleware.js
const rateLimit = require('express-rate-limit');

const financialRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many financial requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admins
    return req.user && req.user.role === 'admin';
  }
});

module.exports = { financialRateLimit };
```

### 6.3 Validation Schemas

```javascript
// backend/middleware/validation.js - Add financial schemas

const financialSchemas = {
  expense: {
    createExpense: {
      categoryId: Joi.number().integer().required(),
      amount: Joi.number().positive().required(),
      description: Joi.string().required(),
      date: Joi.date().required(),
      vendorId: Joi.number().integer().optional(),
      invoiceId: Joi.number().integer().optional(),
      repairId: Joi.number().integer().optional(),
      branchId: Joi.number().integer().optional()
    },
    updateExpense: {
      categoryId: Joi.number().integer().optional(),
      amount: Joi.number().positive().optional(),
      description: Joi.string().optional(),
      date: Joi.date().optional(),
      vendorId: Joi.number().integer().optional(),
      invoiceId: Joi.number().integer().optional(),
      repairId: Joi.number().integer().optional(),
      branchId: Joi.number().integer().optional()
    },
    getExpenses: {
      categoryId: Joi.number().integer().optional(),
      vendorId: Joi.number().integer().optional(),
      branchId: Joi.number().integer().optional(),
      dateFrom: Joi.date().optional(),
      dateTo: Joi.date().optional(),
      q: Joi.string().optional(),
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional()
    }
  },
  payment: {
    createPayment: {
      invoiceId: Joi.number().integer().required(),
      amount: Joi.number().positive().required(),
      paymentMethod: Joi.string().valid('cash', 'card', 'bank_transfer', 'check', 'other').required(),
      paymentDate: Joi.date().optional(),
      referenceNumber: Joi.string().optional(),
      notes: Joi.string().optional()
    },
    // ... other payment schemas
  },
  invoice: {
    createInvoice: {
      repairRequestId: Joi.number().integer().optional(),
      customerId: Joi.number().integer().optional(),
      items: Joi.array().items(
        Joi.object({
          inventoryItemId: Joi.number().integer().optional(),
          serviceId: Joi.number().integer().optional(),
          description: Joi.string().required(),
          quantity: Joi.number().positive().required(),
          unitPrice: Joi.number().positive().required()
        })
      ).min(1).required(),
      discountAmount: Joi.number().min(0).optional(),
      dueDate: Joi.date().optional(),
      notes: Joi.string().optional()
    },
    // ... other invoice schemas
  }
};
```

---

## 7. Background Jobs

### 7.1 Invoice Reminder Job

```javascript
// backend/jobs/financial/invoiceReminder.job.js
const cron = require('node-cron');
const invoicesService = require('../../services/financial/invoices.service');
const notificationService = require('../../services/notification.service');

class InvoiceReminderJob {
  start() {
    // Run daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      try {
        await this.sendOverdueReminders();
        await this.sendDueSoonReminders();
      } catch (error) {
        console.error('Invoice reminder job error:', error);
      }
    });
  }

  async sendOverdueReminders() {
    const overdueInvoices = await invoicesService.getOverdue();
    
    for (const invoice of overdueInvoices) {
      await notificationService.send({
        type: 'invoice_overdue',
        userId: invoice.customerId,
        data: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.totalAmount,
          daysOverdue: this.calculateDaysOverdue(invoice.dueDate)
        }
      });
    }
  }

  async sendDueSoonReminders() {
    const dueSoonInvoices = await invoicesService.getDueSoon(3); // 3 days
    
    for (const invoice of dueSoonInvoices) {
      await notificationService.send({
        type: 'invoice_due_soon',
        userId: invoice.customerId,
        data: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.totalAmount,
          dueDate: invoice.dueDate
        }
      });
    }
  }

  calculateDaysOverdue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

module.exports = new InvoiceReminderJob();
```

---

## 8. Caching Strategy

### 8.1 Cache Service

```javascript
// backend/services/cache.service.js
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

class CacheService {
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidate(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}

module.exports = new CacheService();
```

---

## 9. Error Handling

### 9.1 Async Handler

```javascript
// backend/utils/asyncHandler.js
const handleAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { handleAsync };
```

### 9.2 Error Response

```javascript
// backend/utils/response.js
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, message = 'Error', statusCode = 500, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error ? error.message : null,
    ...(process.env.NODE_ENV === 'development' && { stack: error?.stack })
  });
};

module.exports = { successResponse, errorResponse };
```

---

## 10. Security Enhancements

### 10.1 SQL Injection Prevention

- استخدام Prepared Statements دائماً
- Parameterized Queries
- Input Sanitization

### 10.2 XSS Protection

- Input Sanitization
- Output Encoding
- Content Security Policy

### 10.3 CSRF Protection

- CSRF Tokens
- SameSite Cookies
- Origin Validation

### 10.4 Data Encryption

- تشفير البيانات الحساسة
- HTTPS فقط
- Secure Storage

---

## 📚 المراجع

- [الوضع الحالي](./01_OVERVIEW_AND_CURRENT_STATE.md)
- [خطة Frontend](./03_FRONTEND_DEVELOPMENT_PLAN.md)
- [خطة التنفيذ](./07_IMPLEMENTATION_PLAN.md)

---

**آخر تحديث:** 2025-01-27

