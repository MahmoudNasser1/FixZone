# 🔧 خطة تطوير Backend - نظام المخزون
## Backend Development Plan - Inventory System

**التاريخ:** 2025-01-27  
**الحالة:** Production Enhancement Plan

---

## 📋 نظرة عامة

هذه الخطة تغطي تطوير وتحسين Backend لنظام المخزون، مع التركيز على:
- ✅ Service Layer Architecture
- ✅ Repository Pattern
- ✅ Performance Optimization
- ✅ Error Handling
- ✅ Background Jobs

---

## 🏗️ Architecture الجديدة

### Current vs. New Architecture:

```
الوضع الحالي:
Routes → Database (مباشر)

الوضع الجديد:
Routes → Controllers → Services → Repositories → Database
                      ↓
                  Background Jobs
                      ↓
                  Cache Layer
```

---

## 1️⃣ Service Layer

### 1.1 Service Structure

```
backend/services/inventory/
├── InventoryItemService.js
├── StockLevelService.js
├── StockMovementService.js
├── WarehouseService.js
├── StockTransferService.js
├── StockCountService.js
└── StockAlertService.js
```

### 1.2 Example Service:

```javascript
// services/inventory/InventoryItemService.js
class InventoryItemService {
  constructor(repository, cache, eventBus) {
    this.repository = repository;
    this.cache = cache;
    this.eventBus = eventBus;
  }
  
  async getItem(id) {
    // Check cache first
    const cached = await this.cache.get(`item:${id}`);
    if (cached) return cached;
    
    // Get from database
    const item = await this.repository.findById(id);
    
    // Cache result
    await this.cache.set(`item:${id}`, item, 300); // 5 min
    
    return item;
  }
  
  async createItem(data) {
    // Validate
    await this.validateItem(data);
    
    // Create
    const item = await this.repository.create(data);
    
    // Emit event
    await this.eventBus.emit('inventory.item.created', item);
    
    // Clear cache
    await this.cache.delete('items:list');
    
    return item;
  }
}
```

---

## 2️⃣ Repository Pattern

### 2.1 Repository Structure

```
backend/repositories/inventory/
├── InventoryItemRepository.js
├── StockLevelRepository.js
└── StockMovementRepository.js
```

### 2.2 Example Repository:

```javascript
// repositories/inventory/InventoryItemRepository.js
class InventoryItemRepository {
  async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM InventoryItem WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    return rows[0];
  }
  
  async findAll(filters, pagination) {
    // Build query with filters
    // Execute with pagination
    // Return results
  }
  
  async create(data) {
    const [result] = await db.execute(
      'INSERT INTO InventoryItem (...) VALUES (...)',
      [...]
    );
    return this.findById(result.insertId);
  }
}
```

---

## 3️⃣ Caching Strategy

### 3.1 Cache Layers:

```javascript
// L1: Memory Cache (fast, limited)
const memoryCache = new Map();

// L2: Redis Cache (fast, distributed)
const redisCache = redis.createClient();

// Usage:
async getItem(id) {
  // Check L1
  if (memoryCache.has(id)) {
    return memoryCache.get(id);
  }
  
  // Check L2
  const cached = await redisCache.get(`item:${id}`);
  if (cached) {
    memoryCache.set(id, cached);
    return cached;
  }
  
  // Get from DB
  const item = await repository.findById(id);
  
  // Store in both caches
  memoryCache.set(id, item);
  await redisCache.set(`item:${id}`, item, 'EX', 300);
  
  return item;
}
```

---

## 4️⃣ Background Jobs

### 4.1 Job Queue:

```javascript
// jobs/inventory/stockAlertJob.js
const Queue = require('bull');

const stockAlertQueue = new Queue('stock-alerts', {
  redis: { host: 'localhost', port: 6379 }
});

stockAlertQueue.process(async (job) => {
  const { itemId, warehouseId } = job.data;
  
  // Check stock level
  const stock = await stockLevelService.getStockLevel(itemId, warehouseId);
  
  // Create alert if low
  if (stock.quantity <= stock.minLevel) {
    await stockAlertService.createAlert({
      itemId,
      warehouseId,
      type: 'low_stock',
      quantity: stock.quantity
    });
  }
});
```

---

## 5️⃣ Error Handling

### 5.1 Custom Errors:

```javascript
// errors/InventoryError.js
class InventoryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'InventoryError';
  }
}

// Usage:
throw new InventoryError(
  'INSUFFICIENT_STOCK',
  'Insufficient stock available',
  { itemId, requested: 10, available: 5 }
);
```

---

## 6️⃣ API Routes Refactoring

### 6.1 New Route Structure:

```javascript
// routes/v1/inventory/items.js
router.get('/',
  authMiddleware,
  authorize('inventory.view'),
  inventoryItemController.getAll
);

router.post('/',
  authMiddleware,
  authorize('inventory.create'),
  validate(createItemSchema),
  inventoryItemController.create
);
```

---

## ✅ Implementation Checklist

### Phase 1: Foundation
- [ ] Create Service Layer structure
- [ ] Create Repository Layer structure
- [ ] Setup Caching (Redis)
- [ ] Setup Job Queue (Bull)

### Phase 2: Core Services
- [ ] InventoryItemService
- [ ] StockLevelService
- [ ] StockMovementService

### Phase 3: Advanced Features
- [ ] Background Jobs
- [ ] Event System
- [ ] Audit Trail

---

**الخطوة التالية:** راجع [07_IMPLEMENTATION_ROADMAP.md](./07_IMPLEMENTATION_ROADMAP.md)

---

**آخر تحديث:** 2025-01-27


