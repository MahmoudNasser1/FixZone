# 🔗 خطة التكامل - نظام التنقل والبارات

> **الجزء الرابع:** التكامل مع جميع الموديولات

---

## 📋 نظرة عامة

هذا الملف يغطي جميع جوانب التكامل بين نظام التنقل والبارات مع الموديولات الأخرى، مع التركيز على:
- ✅ **Repairs Module** - التكامل مع موديول الإصلاحات
- ✅ **CRM Module** - التكامل مع موديول العملاء
- ✅ **Inventory Module** - التكامل مع موديول المخزون
- ✅ **Finance Module** - التكامل مع الموديولات المالية
- ✅ **Reports Module** - التكامل مع نظام التقارير

---

## 1️⃣ التكامل مع موديول الإصلاحات

### **1.1 Navigation Items:**
```javascript
// backend/routes/navigation.js
const getRepairsNavItems = (userPermissions) => {
  const items = [];
  
  // طلبات الإصلاح
  if (hasPermission(userPermissions, 'repairs.view')) {
    items.push({
      href: '/repairs',
      label: 'طلبات الإصلاح',
      icon: 'Wrench',
      permission: 'repairs.view',
      badgeKey: 'pendingRepairs',
      // Integration: الحصول على عدد الطلبات المعلقة
      getBadgeCount: async () => {
        const [result] = await db.execute(
          `SELECT COUNT(*) as count 
           FROM RepairRequest 
           WHERE status IN ('pending', 'in_progress') 
           AND deletedAt IS NULL`
        );
        return result[0].count;
      }
    });
  }
  
  // طلب إصلاح جديد
  if (hasPermission(userPermissions, 'repairs.create')) {
    items.push({
      href: '/repairs/new',
      label: 'طلب إصلاح جديد',
      icon: 'FileText',
      permission: 'repairs.create'
    });
  }
  
  // تتبع الطلبات
  if (hasPermission(userPermissions, 'repairs.view')) {
    items.push({
      href: '/repairs/tracking',
      label: 'تتبع الطلبات',
      icon: 'Activity',
      permission: 'repairs.view'
    });
  }
  
  // كتالوج الخدمات
  if (hasPermission(userPermissions, 'services.view')) {
    items.push({
      href: '/services',
      label: 'كتالوج الخدمات',
      icon: 'Package',
      permission: 'services.view'
    });
  }
  
  return items;
};
```

### **1.2 Search Integration:**
```javascript
// backend/routes/search.js
const searchRepairs = async (query, limit) => {
  const searchTerm = `%${query}%`;
  
  const [repairs] = await db.execute(
    `SELECT 
      r.id,
      CONCAT('طلب إصلاح #', r.id) as title,
      CONCAT('جهاز: ', r.deviceType, ' - ', r.deviceBrand, ' ', r.deviceModel) as subtitle,
      CONCAT('/repairs/', r.id) as href,
      'repair' as type,
      'Wrench' as icon,
      r.status,
      r.createdAt,
      c.name as customerName
     FROM RepairRequest r
     LEFT JOIN Customer c ON r.customerId = c.id
     WHERE (
       r.id LIKE ? OR
       r.deviceType LIKE ? OR
       r.deviceBrand LIKE ? OR
       r.deviceModel LIKE ? OR
       r.issueDescription LIKE ? OR
       c.name LIKE ?
     )
     AND r.deletedAt IS NULL
     ORDER BY r.createdAt DESC
     LIMIT ?`,
    [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit]
  );
  
  return repairs.map(repair => ({
    ...repair,
    metadata: {
      status: repair.status,
      customerName: repair.customerName
    }
  }));
};
```

### **1.3 Stats Integration:**
```javascript
// backend/routes/dashboard.js
const getRepairsStats = async (userId, roleId, userPermissions) => {
  const stats = {};
  
  if (hasPermission(userPermissions, 'repairs.view')) {
    // طلبات معلقة
    const [pending] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM RepairRequest 
       WHERE status IN ('pending', 'in_progress', 'waiting_parts')
       AND deletedAt IS NULL`
    );
    stats.pendingRepairs = pending[0].count;
    
    // طلبات اليوم
    const [today] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM RepairRequest 
       WHERE DATE(createdAt) = CURDATE()
       AND deletedAt IS NULL`
    );
    stats.todayRepairs = today[0].count;
    
    // طلبات الأسبوع
    const [week] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM RepairRequest 
       WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       AND deletedAt IS NULL`
    );
    stats.weekRepairs = week[0].count;
    
    // طلبات مخصصة للفني
    if (roleId === 3) { // Technician
      const [assigned] = await db.execute(
        `SELECT COUNT(*) as count 
         FROM RepairRequest 
         WHERE assignedTechnicianId = ?
         AND status IN ('pending', 'in_progress')
         AND deletedAt IS NULL`,
        [userId]
      );
      stats.assignedRepairs = assigned[0].count;
    }
  }
  
  return stats;
};
```

---

## 2️⃣ التكامل مع موديول العملاء (CRM)

### **2.1 Navigation Items:**
```javascript
const getCustomersNavItems = (userPermissions) => {
  const items = [];
  
  // العملاء
  if (hasPermission(userPermissions, 'customers.view')) {
    items.push({
      href: '/customers',
      label: 'العملاء',
      icon: 'Users',
      permission: 'customers.view',
      badgeKey: 'customers',
      getBadgeCount: async () => {
        const [result] = await db.execute(
          `SELECT COUNT(*) as count 
           FROM Customer 
           WHERE deletedAt IS NULL`
        );
        return result[0].count;
      }
    });
  }
  
  // عميل جديد
  if (hasPermission(userPermissions, 'customers.create')) {
    items.push({
      href: '/customers/new',
      label: 'عميل جديد',
      icon: 'UserCheck',
      permission: 'customers.create'
    });
  }
  
  // الشركات
  if (hasPermission(userPermissions, 'companies.view')) {
    items.push({
      href: '/companies',
      label: 'الشركات',
      icon: 'Building2',
      permission: 'companies.view',
      badgeKey: 'companies'
    });
  }
  
  // المواعيد
  if (hasPermission(userPermissions, 'appointments.view')) {
    items.push({
      href: '/appointments',
      label: 'المواعيد',
      icon: 'Calendar',
      permission: 'appointments.view'
    });
  }
  
  // التواصل
  if (hasPermission(userPermissions, 'communications.view')) {
    items.push({
      href: '/communications',
      label: 'التواصل',
      icon: 'MessageSquare',
      permission: 'communications.view',
      badgeKey: 'newMessages'
    });
  }
  
  return items;
};
```

### **2.2 Search Integration:**
```javascript
const searchCustomers = async (query, limit) => {
  const searchTerm = `%${query}%`;
  
  const [customers] = await db.execute(
    `SELECT 
      c.id,
      c.name as title,
      CONCAT('عميل - ', COALESCE(c.phone, c.email, '')) as subtitle,
      CONCAT('/customers/', c.id) as href,
      'customer' as type,
      'Users' as icon,
      c.phone,
      c.email,
      c.createdAt
     FROM Customer c
     WHERE (
       c.name LIKE ? OR
       c.phone LIKE ? OR
       c.email LIKE ?
     )
     AND c.deletedAt IS NULL
     ORDER BY c.createdAt DESC
     LIMIT ?`,
    [searchTerm, searchTerm, searchTerm, limit]
  );
  
  return customers.map(customer => ({
    ...customer,
    metadata: {
      phone: customer.phone,
      email: customer.email
    }
  }));
};
```

---

## 3️⃣ التكامل مع موديول المخزون

### **3.1 Navigation Items:**
```javascript
const getInventoryNavItems = (userPermissions) => {
  const items = [];
  
  // المخزون
  if (hasPermission(userPermissions, 'inventory.view')) {
    items.push({
      href: '/inventory',
      label: 'المخزون',
      icon: 'Warehouse',
      permission: 'inventory.view'
    });
  }
  
  // إدارة المخازن
  if (hasPermission(userPermissions, 'warehouses.view')) {
    items.push({
      href: '/inventory/warehouses',
      label: 'إدارة المخازن',
      icon: 'Building2',
      permission: 'warehouses.view'
    });
  }
  
  // نقل المخزون
  if (hasPermission(userPermissions, 'inventory.transfer')) {
    items.push({
      href: '/inventory/transfer',
      label: 'نقل المخزون',
      icon: 'Package',
      permission: 'inventory.transfer'
    });
  }
  
  // حركة المخزون
  if (hasPermission(userPermissions, 'inventory.view')) {
    items.push({
      href: '/inventory/stock-movements',
      label: 'حركة المخزون',
      icon: 'Activity',
      permission: 'inventory.view'
    });
  }
  
  // تنبيهات المخزون
  if (hasPermission(userPermissions, 'inventory.view')) {
    items.push({
      href: '/inventory/stock-alerts',
      label: 'تنبيهات المخزون',
      icon: 'Activity',
      permission: 'inventory.view',
      badgeKey: 'lowStock',
      getBadgeCount: async () => {
        const [result] = await db.execute(
          `SELECT COUNT(*) as count 
           FROM InventoryItem 
           WHERE quantity <= reorderLevel 
           AND deletedAt IS NULL`
        );
        return result[0].count;
      }
    });
  }
  
  // تقارير المخزون
  if (hasPermission(userPermissions, 'inventory.reports')) {
    items.push({
      href: '/inventory/reports',
      label: 'تقارير المخزون',
      icon: 'BarChart2',
      permission: 'inventory.reports'
    });
  }
  
  // قطع الغيار
  if (hasPermission(userPermissions, 'inventory.view')) {
    items.push({
      href: '/inventory/parts',
      label: 'قطع الغيار',
      icon: 'Package',
      permission: 'inventory.view',
      badgeKey: 'lowStock'
    });
  }
  
  // الموردين
  if (hasPermission(userPermissions, 'vendors.view')) {
    items.push({
      href: '/vendors',
      label: 'الموردين',
      icon: 'Building2',
      permission: 'vendors.view'
    });
  }
  
  return items;
};
```

### **3.2 Search Integration:**
```javascript
const searchInventory = async (query, limit) => {
  const searchTerm = `%${query}%`;
  
  const [items] = await db.execute(
    `SELECT 
      i.id,
      i.name as title,
      CONCAT('قطعة - ', COALESCE(i.brand, ''), ' - SKU: ', COALESCE(i.sku, '')) as subtitle,
      CONCAT('/inventory/parts/', i.id) as href,
      'part' as type,
      'Package' as icon,
      i.sku,
      i.brand,
      i.quantity,
      i.reorderLevel
     FROM InventoryItem i
     WHERE (
       i.name LIKE ? OR
       i.sku LIKE ? OR
       i.brand LIKE ?
     )
     AND i.deletedAt IS NULL
     ORDER BY i.name ASC
     LIMIT ?`,
    [searchTerm, searchTerm, searchTerm, limit]
  );
  
  return items.map(item => ({
    ...item,
    metadata: {
      sku: item.sku,
      brand: item.brand,
      quantity: item.quantity,
      lowStock: item.quantity <= item.reorderLevel
    }
  }));
};
```

### **3.3 Stats Integration:**
```javascript
const getInventoryStats = async (userPermissions) => {
  const stats = {};
  
  if (hasPermission(userPermissions, 'inventory.view')) {
    // نقص في المخزون
    const [lowStock] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM InventoryItem 
       WHERE quantity <= reorderLevel 
       AND deletedAt IS NULL`
    );
    stats.lowStock = lowStock[0].count;
    
    // إجمالي القيمة
    const [totalValue] = await db.execute(
      `SELECT COALESCE(SUM(quantity * costPrice), 0) as value 
       FROM InventoryItem 
       WHERE deletedAt IS NULL`
    );
    stats.totalValue = parseFloat(totalValue[0].value || 0);
    
    // عدد العناصر
    const [totalItems] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM InventoryItem 
       WHERE deletedAt IS NULL`
    );
    stats.totalItems = totalItems[0].count;
  }
  
  return stats;
};
```

---

## 4️⃣ التكامل مع الموديولات المالية

### **4.1 Navigation Items:**
```javascript
const getFinanceNavItems = (userPermissions) => {
  const items = [];
  
  // النظام المالي
  if (hasPermission(userPermissions, 'finance.view')) {
    items.push({
      href: '/finance',
      label: 'النظام المالي',
      icon: 'DollarSign',
      permission: 'finance.view'
    });
  }
  
  // الفواتير
  if (hasPermission(userPermissions, 'invoices.view')) {
    items.push({
      href: '/invoices',
      label: 'الفواتير',
      icon: 'Receipt',
      permission: 'invoices.view',
      badgeKey: 'pendingInvoices',
      getBadgeCount: async () => {
        const [result] = await db.execute(
          `SELECT COUNT(*) as count 
           FROM Invoice 
           WHERE status = 'pending' 
           AND deletedAt IS NULL`
        );
        return result[0].count;
      }
    });
  }
  
  // العروض السعرية
  if (hasPermission(userPermissions, 'quotations.view')) {
    items.push({
      href: '/quotations',
      label: 'العروض السعرية',
      icon: 'FileText',
      permission: 'quotations.view'
    });
  }
  
  // طلبات الشراء
  if (hasPermission(userPermissions, 'purchase_orders.view')) {
    items.push({
      href: '/purchase-orders',
      label: 'طلبات الشراء',
      icon: 'ShoppingCart',
      permission: 'purchase_orders.view'
    });
  }
  
  // المدفوعات
  if (hasPermission(userPermissions, 'payments.view')) {
    items.push({
      href: '/payments',
      label: 'المدفوعات',
      icon: 'CreditCard',
      permission: 'payments.view'
    });
  }
  
  // المصروفات
  if (hasPermission(userPermissions, 'expenses.view')) {
    items.push({
      href: '/expenses',
      label: 'المصروفات',
      icon: 'Banknote',
      permission: 'expenses.view'
    });
  }
  
  // التقارير المالية
  if (hasPermission(userPermissions, 'finance.reports')) {
    items.push({
      href: '/financial-reports',
      label: 'التقارير المالية',
      icon: 'Calculator',
      permission: 'finance.reports'
    });
  }
  
  return items;
};
```

### **4.2 Stats Integration:**
```javascript
const getFinanceStats = async (userPermissions) => {
  const stats = {};
  
  if (hasPermission(userPermissions, 'finance.view')) {
    // إيرادات اليوم
    const [todayRevenue] = await db.execute(
      `SELECT COALESCE(SUM(totalAmount), 0) as revenue 
       FROM Invoice 
       WHERE DATE(createdAt) = CURDATE() 
       AND status = 'paid'
       AND deletedAt IS NULL`
    );
    stats.todayRevenue = parseFloat(todayRevenue[0].revenue || 0);
    
    // إيرادات الشهر
    const [monthRevenue] = await db.execute(
      `SELECT COALESCE(SUM(totalAmount), 0) as revenue 
       FROM Invoice 
       WHERE MONTH(createdAt) = MONTH(CURDATE())
       AND YEAR(createdAt) = YEAR(CURDATE())
       AND status = 'paid'
       AND deletedAt IS NULL`
    );
    stats.monthRevenue = parseFloat(monthRevenue[0].revenue || 0);
    
    // فواتير معلقة
    const [pendingInvoices] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM Invoice 
       WHERE status = 'pending' 
       AND deletedAt IS NULL`
    );
    stats.pendingInvoices = pendingInvoices[0].count;
    
    // مدفوعات اليوم
    const [todayPayments] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) as amount 
       FROM Payment 
       WHERE DATE(createdAt) = CURDATE() 
       AND deletedAt IS NULL`
    );
    stats.todayPayments = parseFloat(todayPayments[0].amount || 0);
  }
  
  return stats;
};
```

---

## 5️⃣ التكامل مع نظام التقارير

### **5.1 Navigation Items:**
```javascript
const getReportsNavItems = (userPermissions) => {
  const items = [];
  
  if (hasPermission(userPermissions, 'reports.view')) {
    items.push({
      label: 'التقارير',
      icon: 'BarChart2',
      permission: 'reports.view',
      subItems: [
        {
          href: '/reports/daily',
          label: 'التقرير اليومي',
          icon: 'Calendar',
          permission: 'reports.daily'
        },
        {
          href: '/reports/financial',
          label: 'التقارير المالية',
          icon: 'DollarSign',
          permission: 'reports.financial'
        },
        {
          href: '/reports/technician',
          label: 'تقارير أداء الفنيين',
          icon: 'UserCheck',
          permission: 'reports.technician'
        },
        {
          href: '/reports/repairs',
          label: 'تقارير الإصلاح',
          icon: 'Wrench',
          permission: 'reports.repairs'
        },
        {
          href: '/reports/sales',
          label: 'تقارير المبيعات',
          icon: 'TrendingUp',
          permission: 'reports.sales'
        },
        {
          href: '/reports/inventory',
          label: 'تقارير المخزون',
          icon: 'Package',
          permission: 'reports.inventory'
        },
        {
          href: '/reports/customers',
          label: 'تقارير العملاء',
          icon: 'Users',
          permission: 'reports.customers'
        }
      ]
    });
  }
  
  // التحليلات
  if (hasPermission(userPermissions, 'analytics.view')) {
    items.push({
      href: '/analytics',
      label: 'التحليلات',
      icon: 'PieChart',
      permission: 'analytics.view'
    });
  }
  
  // الأداء
  if (hasPermission(userPermissions, 'performance.view')) {
    items.push({
      href: '/performance',
      label: 'الأداء',
      icon: 'Activity',
      permission: 'performance.view'
    });
  }
  
  return items;
};
```

---

## 6️⃣ Unified Integration Layer

### **6.1 Navigation Service:**
```javascript
// backend/services/navigationService.js
const db = require('../db');
const { hasPermission } = require('../utils/permissions');

class NavigationService {
  /**
   * الحصول على جميع عناصر التنقل
   */
  async getNavigationItems(userId, roleId, userPermissions) {
    const navItems = [];
    
    // إضافة عناصر من كل موديول
    navItems.push(...this.getRepairsNavItems(userPermissions));
    navItems.push(...this.getCustomersNavItems(userPermissions));
    navItems.push(...this.getInventoryNavItems(userPermissions));
    navItems.push(...this.getFinanceNavItems(userPermissions));
    navItems.push(...this.getReportsNavItems(userPermissions));
    navItems.push(...this.getSettingsNavItems(userPermissions));
    
    // تحديث Badges
    const itemsWithBadges = await Promise.all(
      navItems.map(async (item) => {
        if (item.getBadgeCount) {
          try {
            const count = await item.getBadgeCount();
            item.badge = count > 0 ? count.toString() : null;
          } catch (error) {
            console.error(`Error getting badge count for ${item.href}:`, error);
            item.badge = null;
          }
        }
        return item;
      })
    );
    
    return itemsWithBadges;
  }
  
  /**
   * البحث الشامل
   */
  async globalSearch(query, userId, roleId, userPermissions, limit = 10) {
    const results = [];
    
    // البحث في كل موديول
    if (hasPermission(userPermissions, 'repairs.view')) {
      const repairs = await searchRepairs(query, limit);
      results.push(...repairs);
    }
    
    if (hasPermission(userPermissions, 'customers.view')) {
      const customers = await searchCustomers(query, limit);
      results.push(...customers);
    }
    
    if (hasPermission(userPermissions, 'inventory.view')) {
      const inventory = await searchInventory(query, limit);
      results.push(...inventory);
    }
    
    // ترتيب النتائج
    results.sort((a, b) => {
      // إعطاء أولوية للطلبات
      if (a.type === 'repair' && b.type !== 'repair') return -1;
      if (a.type !== 'repair' && b.type === 'repair') return 1;
      return 0;
    });
    
    return results.slice(0, limit);
  }
  
  /**
   * الحصول على جميع الإحصائيات
   */
  async getAllStats(userId, roleId, userPermissions) {
    const stats = {};
    
    // إحصائيات من كل موديول
    Object.assign(stats, await getRepairsStats(userId, roleId, userPermissions));
    Object.assign(stats, await getInventoryStats(userPermissions));
    Object.assign(stats, await getFinanceStats(userPermissions));
    
    return stats;
  }
}

module.exports = new NavigationService();
```

---

## 7️⃣ Error Handling في التكامل

### **7.1 Error Handling Strategy:**
```javascript
// backend/utils/integrationErrorHandler.js
class IntegrationErrorHandler {
  static handleModuleError(moduleName, error, req, res) {
    console.error(`Error in ${moduleName} integration:`, error);
    
    // تسجيل الخطأ
    AuditLogger.log('integration_error', moduleName, null, {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, req);
    
    // إرجاع خطأ آمن
    return {
      success: false,
      message: `Error in ${moduleName} module`,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    };
  }
  
  static async safeExecute(moduleName, fn, req, res) {
    try {
      return await fn();
    } catch (error) {
      return this.handleModuleError(moduleName, error, req, res);
    }
  }
}

module.exports = IntegrationErrorHandler;
```

---

## 📝 Checklist التنفيذ

### **Repairs Integration:**
- [ ] Navigation Items
- [ ] Search Integration
- [ ] Stats Integration
- [ ] Badge Counts

### **CRM Integration:**
- [ ] Navigation Items
- [ ] Search Integration
- [ ] Stats Integration

### **Inventory Integration:**
- [ ] Navigation Items
- [ ] Search Integration
- [ ] Stats Integration
- [ ] Low Stock Alerts

### **Finance Integration:**
- [ ] Navigation Items
- [ ] Stats Integration
- [ ] Revenue Tracking

### **Reports Integration:**
- [ ] Navigation Items
- [ ] Report Links

### **Unified Layer:**
- [ ] Navigation Service
- [ ] Global Search
- [ ] Stats Aggregation
- [ ] Error Handling

---

**التالي:** [Implementation Plan](./05_IMPLEMENTATION_PLAN.md)

