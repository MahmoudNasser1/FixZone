const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

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
 * GET /api/navigation/stats
 * الحصول على إحصائيات لعرض Badges في Navigation
 */
router.get('/stats', authMiddleware, async (req, res) => {
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
    
    const stats = {};
    
    // Badges حسب الصلاحيات
    if (hasPermission(permissions, 'repairs.view')) {
      // استخدام حالات متنوعة لضمان الشمولية
      const [pending] = await db.execute(
        `SELECT COUNT(*) as count 
         FROM RepairRequest 
         WHERE status IN ('pending', 'in_progress', 'RECEIVED', 'INSPECTION', 'AWAITING_APPROVAL', 'UNDER_REPAIR', 'WAITING_PARTS', 'ON_HOLD')
         AND deletedAt IS NULL`
      );
      stats.pendingRepairs = pending[0]?.count || 0;
    }
    
    if (hasPermission(permissions, 'customers.view')) {
      const [customers] = await db.execute(
        `SELECT COUNT(*) as count 
         FROM Customer 
         WHERE deletedAt IS NULL`
      );
      stats.customers = customers[0]?.count || 0;
    }
    
    if (hasPermission(permissions, 'inventory.view')) {
      // استخدام StockLevel للتحقق من lowStock
      try {
        const [lowStock] = await db.execute(
          `SELECT COUNT(DISTINCT sl.inventoryItemId) as count 
           FROM StockLevel sl
           JOIN InventoryItem ii ON sl.inventoryItemId = ii.id
           WHERE sl.quantity <= sl.minLevel 
           AND ii.deletedAt IS NULL
           AND (sl.deletedAt IS NULL OR sl.deletedAt IS NULL)`
        );
        stats.lowStock = lowStock[0]?.count || 0;
      } catch (error) {
        console.error('Error fetching low stock:', error);
        stats.lowStock = 0;
      }
    }
    
    // إضافة pendingInvoices
    if (hasPermission(permissions, 'invoices.view')) {
      try {
        const [pendingInvoices] = await db.execute(
          `SELECT COUNT(*) as count 
           FROM Invoice 
           WHERE status IN ('pending', 'unpaid') 
           AND deletedAt IS NULL`
        );
        stats.pendingInvoices = pendingInvoices[0]?.count || 0;
      } catch (error) {
        console.error('Error fetching pending invoices:', error);
        stats.pendingInvoices = 0;
      }
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
        { 
          href: '/repairs/tracking', 
          label: 'تتبع الطلبات', 
          icon: 'Activity',
          permission: 'repairs.view'
        },
        { 
          href: '/services', 
          label: 'كتالوج الخدمات', 
          icon: 'Package',
          permission: 'services.view'
        },
        {
          label: 'أنواع الأجهزة',
          icon: 'Monitor',
          permission: 'devices.view',
          subItems: [
            { 
              href: '/devices/smartphones', 
              label: 'الهواتف الذكية', 
              icon: 'Smartphone',
              permission: 'devices.view'
            },
            { 
              href: '/devices/computers', 
              label: 'أجهزة الكمبيوتر', 
              icon: 'Monitor',
              permission: 'devices.view'
            },
            { 
              href: '/devices/printers', 
              label: 'الطابعات', 
              icon: 'Printer',
              permission: 'devices.view'
            },
            { 
              href: '/devices/accessories', 
              label: 'الإكسسوارات', 
              icon: 'HardDrive',
              permission: 'devices.view'
            }
          ]
        }
      ]
    },
    {
      section: 'إدارة العملاء',
      items: [
        { 
          href: '/customers', 
          label: 'العملاء', 
          icon: 'Users',
          permission: 'customers.view',
          badgeKey: 'customers'
        },
        { 
          href: '/customers/new', 
          label: 'عميل جديد', 
          icon: 'UserCheck',
          permission: 'customers.create'
        },
        { 
          href: '/companies', 
          label: 'الشركات', 
          icon: 'Building2',
          permission: 'companies.view',
          badgeKey: 'companies'
        },
        { 
          href: '/appointments', 
          label: 'المواعيد', 
          icon: 'Calendar',
          permission: 'appointments.view'
        },
        { 
          href: '/communications', 
          label: 'التواصل', 
          icon: 'MessageSquare',
          permission: 'communications.view',
          badgeKey: 'newMessages'
        }
      ]
    },
    {
      section: 'المخزون والقطع',
      items: [
        { 
          href: '/inventory', 
          label: 'المخزون', 
          icon: 'Warehouse',
          permission: 'inventory.view'
        },
        { 
          href: '/inventory/warehouses', 
          label: 'إدارة المخازن', 
          icon: 'Building2',
          permission: 'warehouses.view'
        },
        { 
          href: '/inventory/transfer', 
          label: 'نقل المخزون', 
          icon: 'Package',
          permission: 'inventory.transfer'
        },
        { 
          href: '/inventory/stock-movements', 
          label: 'حركة المخزون', 
          icon: 'Activity',
          permission: 'inventory.view'
        },
        { 
          href: '/inventory/stock-alerts', 
          label: 'تنبيهات المخزون', 
          icon: 'Activity',
          permission: 'inventory.view',
          badgeKey: 'lowStock'
        },
        { 
          href: '/inventory/reports', 
          label: 'تقارير المخزون', 
          icon: 'BarChart2',
          permission: 'inventory.reports'
        },
        { 
          href: '/inventory/parts', 
          label: 'قطع الغيار', 
          icon: 'Package',
          permission: 'inventory.view'
        },
        { 
          href: '/vendors', 
          label: 'الموردين', 
          icon: 'Building2',
          permission: 'vendors.view'
        }
      ]
    },
    {
      section: 'النظام المالي',
      items: [
        { 
          href: '/finance', 
          label: 'النظام المالي', 
          icon: 'DollarSign',
          permission: 'finance.view'
        },
        { 
          href: '/invoices', 
          label: 'الفواتير', 
          icon: 'Receipt',
          permission: 'invoices.view',
          badgeKey: 'pendingInvoices'
        },
        { 
          href: '/quotations', 
          label: 'العروض السعرية', 
          icon: 'FileText',
          permission: 'quotations.view'
        },
        { 
          href: '/purchase-orders', 
          label: 'طلبات الشراء', 
          icon: 'ShoppingCart',
          permission: 'purchase_orders.view'
        },
        { 
          href: '/payments', 
          label: 'المدفوعات', 
          icon: 'CreditCard',
          permission: 'payments.view'
        },
        { 
          href: '/expenses', 
          label: 'المصروفات', 
          icon: 'Banknote',
          permission: 'expenses.view'
        },
        { 
          href: '/financial-reports', 
          label: 'التقارير المالية', 
          icon: 'Calculator',
          permission: 'finance.reports'
        }
      ]
    },
    {
      section: 'التقارير والإحصائيات',
      items: [
        {
          label: 'التقارير',
          icon: 'BarChart2',
          permission: 'reports.view',
          subItems: [
            { 
              href: '/reports/daily', 
              label: 'التقرير اليومي', 
              icon: 'Calendar',
              permission: 'reports.view'
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
        },
        { 
          href: '/analytics', 
          label: 'التحليلات', 
          icon: 'PieChart',
          permission: 'analytics.view'
        },
        { 
          href: '/performance', 
          label: 'الأداء', 
          icon: 'Activity',
          permission: 'analytics.view'
        }
      ]
    },
    {
      section: 'الإعدادات والإدارة',
      items: [
        { 
          href: '/settings', 
          label: 'إعدادات النظام', 
          icon: 'Settings',
          permission: 'settings.view'
        },
        { 
          href: '/users', 
          label: 'إدارة المستخدمين', 
          icon: 'Shield',
          permission: 'users.manage'
        },
        { 
          href: '/admin/roles', 
          label: 'الأدوار والصلاحيات', 
          icon: 'Shield',
          permission: 'roles.manage'
        },
        { 
          href: '/branches', 
          label: 'الفروع', 
          icon: 'MapPin',
          permission: 'branches.view'
        },
        { 
          href: '/help', 
          label: 'المساعدة', 
          icon: 'HelpCircle',
          permission: 'settings.view'
        }
      ]
    }
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
        if (item.subItems && item.subItems.length > 0) {
          const filteredSubItems = item.subItems.filter(subItem => {
            if (!subItem.permission) return true;
            return hasPermission(permissions, subItem.permission);
          });
          // إذا كانت هناك subItems بعد التصفية، نعيد العنصر مع SubItems المفلترة
          if (filteredSubItems.length > 0) {
            return { ...item, subItems: filteredSubItems };
          }
          // إذا لم تبق أي subItems، نعيد null ليتم فلترتها
          return null;
        }
        return item;
      })
      .filter(item => item !== null) // إزالة العناصر null
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

