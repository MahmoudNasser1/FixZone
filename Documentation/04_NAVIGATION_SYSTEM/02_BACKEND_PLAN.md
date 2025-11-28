# 🔧 خطة تطوير Backend API - نظام التنقل والبارات

> **الجزء الثاني:** تطوير APIs والخدمات الخلفية

---

## 📋 نظرة عامة

هذا الملف يغطي جميع جوانب تطوير Backend لنظام التنقل والبارات، مع التركيز على:
- ✅ **Navigation APIs** - APIs للتنقل
- ✅ **Permissions APIs** - APIs للصلاحيات
- ✅ **Stats APIs** - APIs للإحصائيات
- ✅ **Notifications APIs** - APIs للإشعارات
- ✅ **Performance** - تحسينات الأداء

---

## 1️⃣ Navigation APIs

### **1.1 API للحصول على Navigation Items:**
```javascript
// backend/routes/navigation.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');
const db = require('../db');

/**
 * GET /api/navigation/items
 * الحصول على عناصر التنقل حسب صلاحيات المستخدم
 */
router.get('/items', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const roleId = req.user.roleId || req.user.role;
    
    // الحصول على صلاحيات المستخدم
    const [roles] = await db.execute(
      `SELECT permissions FROM Role WHERE id = ? AND deletedAt IS NULL`,
      [roleId]
    );
    
    if (!roles.length) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    const permissions = roles[0].permissions 
      ? JSON.parse(roles[0].permissions) 
      : {};
    
    // الحصول على عناصر التنقل الأساسية
    const navItems = getNavigationItems();
    
    // تصفية العناصر حسب الصلاحيات
    const filteredItems = filterNavItemsByPermissions(navItems, permissions, roleId);
    
    res.json({
      success: true,
      data: filteredItems
    });
  } catch (error) {
    console.error('Error fetching navigation items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch navigation items',
      error: error.message
    });
  }
});

/**
 * Helper: الحصول على عناصر التنقل الأساسية
 */
function getNavigationItems() {
  return [
    {
      section: 'الرئيسية',
      items: [
        { 
          href: '/', 
          label: 'لوحة التحكم', 
          icon: 'Home',
          permission: 'dashboard.view'
        }
      ]
    },
    {
      section: 'إدارة الإصلاحات',
      items: [
        { 
          href: '/repairs', 
          label: 'طلبات الإصلاح', 
          icon: 'Wrench',
          permission: 'repairs.view',
          badgeKey: 'pendingRepairs'
        },
        { 
          href: '/repairs/new', 
          label: 'طلب إصلاح جديد', 
          icon: 'FileText',
          permission: 'repairs.create'
        },
        // ... المزيد
      ]
    }
    // ... المزيد من الأقسام
  ];
}

/**
 * Helper: تصفية العناصر حسب الصلاحيات
 */
function filterNavItemsByPermissions(navItems, permissions, roleId) {
  // Admin لديه كل الصلاحيات
  if (roleId === 1 || permissions['*']) {
    return navItems;
  }
  
  return navItems.map(section => ({
    ...section,
    items: section.items
      .filter(item => {
        if (!item.permission) return true;
        return hasPermission(permissions, item.permission);
      })
      .map(item => {
        // تصفية subItems
        if (item.subItems) {
          item.subItems = item.subItems.filter(subItem => {
            if (!subItem.permission) return true;
            return hasPermission(permissions, subItem.permission);
          });
        }
        return item;
      })
  })).filter(section => section.items.length > 0);
}

/**
 * Helper: التحقق من الصلاحية
 */
function hasPermission(permissions, requiredPermission) {
  if (!requiredPermission) return true;
  if (permissions['*']) return true; // Admin
  
  // Check exact permission
  if (permissions[requiredPermission]) return true;
  
  // Check wildcard permissions (e.g., 'repairs.*' matches 'repairs.view')
  const permissionParts = requiredPermission.split('.');
  for (let i = permissionParts.length; i > 0; i--) {
    const wildcard = permissionParts.slice(0, i).join('.') + '.*';
    if (permissions[wildcard]) return true;
  }
  
  return false;
}

module.exports = router;
```

### **1.2 API للبحث العام:**
```javascript
/**
 * GET /api/search/global
 * بحث شامل في جميع الموديولات
 */
router.get('/global', authMiddleware, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const searchTerm = `%${q.trim()}%`;
    const results = [];
    
    // البحث في طلبات الإصلاح
    const [repairs] = await db.execute(
      `SELECT id, CONCAT('طلب #', id) as title, 
              CONCAT('جهاز: ', deviceType, ' - ', deviceBrand) as subtitle,
              CONCAT('/repairs/', id) as href,
              'repair' as type,
              'Wrench' as icon
       FROM RepairRequest
       WHERE (id LIKE ? OR deviceType LIKE ? OR deviceBrand LIKE ? 
              OR deviceModel LIKE ? OR issueDescription LIKE ?)
       AND deletedAt IS NULL
       LIMIT ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit]
    );
    
    results.push(...repairs.map(r => ({
      ...r,
      icon: 'Wrench'
    })));
    
    // البحث في العملاء
    const [customers] = await db.execute(
      `SELECT id, name as title, 
              CONCAT('عميل - ', COALESCE(phone, email, '')) as subtitle,
              CONCAT('/customers/', id) as href,
              'customer' as type,
              'Users' as icon
       FROM Customer
       WHERE (name LIKE ? OR phone LIKE ? OR email LIKE ?)
       AND deletedAt IS NULL
       LIMIT ?`,
      [searchTerm, searchTerm, searchTerm, limit]
    );
    
    results.push(...customers.map(c => ({
      ...c,
      icon: 'Users'
    })));
    
    // البحث في قطع الغيار
    const [parts] = await db.execute(
      `SELECT id, name as title,
              CONCAT('قطعة - ', COALESCE(brand, '')) as subtitle,
              CONCAT('/inventory/parts/', id) as href,
              'part' as type,
              'Package' as icon
       FROM InventoryItem
       WHERE (name LIKE ? OR sku LIKE ? OR brand LIKE ?)
       AND deletedAt IS NULL
       LIMIT ?`,
      [searchTerm, searchTerm, searchTerm, limit]
    );
    
    results.push(...parts.map(p => ({
      ...p,
      icon: 'Package'
    })));
    
    // ترتيب النتائج حسب الأهمية
    results.sort((a, b) => {
      // إعطاء أولوية للطلبات
      if (a.type === 'repair' && b.type !== 'repair') return -1;
      if (a.type !== 'repair' && b.type === 'repair') return 1;
      return 0;
    });
    
    res.json({
      success: true,
      data: results.slice(0, limit)
    });
  } catch (error) {
    console.error('Error in global search:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});
```

---

## 2️⃣ Permissions APIs

### **2.1 API للتحقق من الصلاحيات:**
```javascript
/**
 * GET /api/permissions/check
 * التحقق من صلاحيات المستخدم
 */
router.get('/check', authMiddleware, async (req, res) => {
  try {
    const { permissions } = req.query;
    
    if (!permissions) {
      return res.status(400).json({
        success: false,
        message: 'Permissions parameter is required'
      });
    }
    
    const permissionList = Array.isArray(permissions) 
      ? permissions 
      : permissions.split(',');
    
    const userId = req.user.id;
    const roleId = req.user.roleId || req.user.role;
    
    // الحصول على صلاحيات المستخدم
    const [roles] = await db.execute(
      `SELECT permissions FROM Role WHERE id = ? AND deletedAt IS NULL`,
      [roleId]
    );
    
    if (!roles.length) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    const userPermissions = roles[0].permissions 
      ? JSON.parse(roles[0].permissions) 
      : {};
    
    // التحقق من كل صلاحية
    const results = {};
    permissionList.forEach(permission => {
      results[permission] = hasPermission(userPermissions, permission);
    });
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check permissions',
      error: error.message
    });
  }
});

/**
 * GET /api/permissions/user
 * الحصول على جميع صلاحيات المستخدم
 */
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const roleId = req.user.roleId || req.user.role;
    
    // الحصول على صلاحيات المستخدم
    const [roles] = await db.execute(
      `SELECT id, name, permissions, isActive 
       FROM Role 
       WHERE id = ? AND deletedAt IS NULL`,
      [roleId]
    );
    
    if (!roles.length) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    const role = roles[0];
    const permissions = role.permissions 
      ? JSON.parse(role.permissions) 
      : {};
    
    res.json({
      success: true,
      data: {
        roleId: role.id,
        roleName: role.name,
        isActive: Boolean(role.isActive),
        permissions: permissions
      }
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions',
      error: error.message
    });
  }
});
```

---

## 3️⃣ Stats APIs

### **3.1 API للإحصائيات السريعة:**
```javascript
/**
 * GET /api/dashboard/quick-stats
 * الحصول على إحصائيات سريعة للعرض في Topbar
 */
router.get('/quick-stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const roleId = req.user.roleId || req.user.role;
    
    // Cache key
    const cacheKey = `quick-stats-${userId}-${roleId}`;
    
    // محاولة الحصول من Cache
    const cached = await getFromCache(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }
    
    const stats = {};
    
    // طلبات معلقة
    if (hasPermission(roleId, 'repairs.view')) {
      const [pendingRepairs] = await db.execute(
        `SELECT COUNT(*) as count 
         FROM RepairRequest 
         WHERE status IN ('pending', 'in_progress', 'waiting_parts')
         AND deletedAt IS NULL`
      );
      stats.pendingRepairs = pendingRepairs[0].count;
    }
    
    // رسائل جديدة
    if (hasPermission(roleId, 'notifications.view')) {
      const [newMessages] = await db.execute(
        `SELECT COUNT(*) as count 
         FROM Notification 
         WHERE userId = ? AND isRead = 0 AND deletedAt IS NULL`,
        [userId]
      );
      stats.newMessages = newMessages[0].count;
    }
    
    // نقص في المخزون
    if (hasPermission(roleId, 'inventory.view')) {
      const [lowStock] = await db.execute(
        `SELECT COUNT(*) as count 
         FROM InventoryItem 
         WHERE quantity <= reorderLevel 
         AND deletedAt IS NULL`
      );
      stats.lowStock = lowStock[0].count;
    }
    
    // إيرادات اليوم
    if (hasPermission(roleId, 'finance.view')) {
      const [todayRevenue] = await db.execute(
        `SELECT COALESCE(SUM(totalAmount), 0) as revenue 
         FROM Invoice 
         WHERE DATE(createdAt) = CURDATE() 
         AND status = 'paid'
         AND deletedAt IS NULL`
      );
      stats.todayRevenue = parseFloat(todayRevenue[0].revenue || 0);
    }
    
    // حفظ في Cache لمدة 30 ثانية
    await saveToCache(cacheKey, stats, 30);
    
    res.json({
      success: true,
      data: stats,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick stats',
      error: error.message
    });
  }
});

/**
 * Helper: Cache functions
 */
const cache = new Map();

async function getFromCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
}

async function saveToCache(key, data, ttlSeconds) {
  cache.set(key, {
    data,
    expires: Date.now() + (ttlSeconds * 1000)
  });
}
```

### **3.2 API لإحصائيات Navigation:**
```javascript
/**
 * GET /api/navigation/stats
 * الحصول على إحصائيات لعرض Badges في Navigation
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const roleId = req.user.roleId || req.user.role;
    
    const stats = {};
    
    // Badges حسب الصلاحيات
    if (hasPermission(roleId, 'repairs.view')) {
      const [pending] = await db.execute(
        `SELECT COUNT(*) as count 
         FROM RepairRequest 
         WHERE status = 'pending' AND deletedAt IS NULL`
      );
      stats.pendingRepairs = pending[0].count;
    }
    
    if (hasPermission(roleId, 'customers.view')) {
      const [customers] = await db.execute(
        `SELECT COUNT(*) as count 
         FROM Customer 
         WHERE deletedAt IS NULL`
      );
      stats.customers = customers[0].count;
    }
    
    if (hasPermission(roleId, 'inventory.view')) {
      const [lowStock] = await db.execute(
        `SELECT COUNT(*) as count 
         FROM InventoryItem 
         WHERE quantity <= reorderLevel AND deletedAt IS NULL`
      );
      stats.lowStock = lowStock[0].count;
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching navigation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch navigation stats',
      error: error.message
    });
  }
});
```

---

## 4️⃣ Notifications APIs

### **4.1 API للإشعارات:**
```javascript
/**
 * GET /api/notifications
 * الحصول على إشعارات المستخدم
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;
    
    let sql = `
      SELECT id, title, message, type, href, isRead, createdAt
      FROM Notification
      WHERE userId = ? AND deletedAt IS NULL
    `;
    
    const params = [userId];
    
    if (unreadOnly === 'true') {
      sql += ' AND isRead = 0';
    }
    
    sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [notifications] = await db.execute(sql, params);
    
    // عدد الإشعارات غير المقروءة
    const [unreadCount] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM Notification 
       WHERE userId = ? AND isRead = 0 AND deletedAt IS NULL`,
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        notifications: notifications,
        unreadCount: unreadCount[0].count,
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * تحديد إشعار كمقروء
 */
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    // التحقق من أن الإشعار يخص المستخدم
    const [notifications] = await db.execute(
      `SELECT id FROM Notification 
       WHERE id = ? AND userId = ? AND deletedAt IS NULL`,
      [notificationId, userId]
    );
    
    if (!notifications.length) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // تحديث حالة القراءة
    await db.execute(
      `UPDATE Notification 
       SET isRead = 1, readAt = NOW() 
       WHERE id = ?`,
      [notificationId]
    );
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * تحديد جميع الإشعارات كمقروءة
 */
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await db.execute(
      `UPDATE Notification 
       SET isRead = 1, readAt = NOW() 
       WHERE userId = ? AND isRead = 0 AND deletedAt IS NULL`,
      [userId]
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});
```

---

## 5️⃣ Performance Optimization

### **5.1 Database Indexing:**
```sql
-- Indexes للبحث السريع
CREATE INDEX idx_repair_search ON RepairRequest(deviceType, deviceBrand, deviceModel, status);
CREATE INDEX idx_customer_search ON Customer(name, phone, email);
CREATE INDEX idx_inventory_search ON InventoryItem(name, sku, brand);
CREATE INDEX idx_notification_user ON Notification(userId, isRead, createdAt);
CREATE INDEX idx_notification_unread ON Notification(userId, isRead) WHERE isRead = 0;
```

### **5.2 Caching Strategy:**
```javascript
// utils/cache.js
const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 60, // 60 seconds default
  checkperiod: 120,
  useClones: false
});

module.exports = {
  get: (key) => cache.get(key),
  set: (key, value, ttl) => cache.set(key, value, ttl || 60),
  del: (key) => cache.del(key),
  flush: () => cache.flushAll()
};
```

### **5.3 API Rate Limiting:**
```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const navigationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP, please try again later.'
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 searches per minute
  message: 'Too many search requests, please try again later.'
});

module.exports = {
  navigationLimiter,
  searchLimiter
};
```

---

## 6️⃣ Error Handling

### **6.1 Centralized Error Handling:**
```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Navigation API Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.id
  });
  
  // MySQL Errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry'
    });
  }
  
  // Default Error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;
```

---

## 7️⃣ API Documentation

### **7.1 Swagger/OpenAPI:**
```javascript
// swagger/navigation.js
/**
 * @swagger
 * /api/navigation/items:
 *   get:
 *     summary: Get navigation items
 *     tags: [Navigation]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Navigation items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
```

---

## 📝 Checklist التنفيذ

### **Navigation APIs:**
- [ ] GET /api/navigation/items
- [ ] GET /api/search/global
- [ ] POST /api/navigation/favorites

### **Permissions APIs:**
- [ ] GET /api/permissions/check
- [ ] GET /api/permissions/user
- [ ] GET /api/permissions/role/:id

### **Stats APIs:**
- [ ] GET /api/dashboard/quick-stats
- [ ] GET /api/navigation/stats
- [ ] GET /api/dashboard/kpis

### **Notifications APIs:**
- [ ] GET /api/notifications
- [ ] PUT /api/notifications/:id/read
- [ ] PUT /api/notifications/read-all
- [ ] POST /api/notifications

### **Performance:**
- [ ] Database Indexing
- [ ] Caching Strategy
- [ ] Rate Limiting
- [ ] Query Optimization

### **Documentation:**
- [ ] API Documentation
- [ ] Error Handling
- [ ] Testing

---

**التالي:** [Security & Permissions Plan](./03_SECURITY_PLAN.md)

