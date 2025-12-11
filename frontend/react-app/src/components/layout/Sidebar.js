import React, { useState, useMemo, memo, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Wrench, Users, Warehouse, BarChart2, Settings, ChevronDown, ChevronRight,
  DollarSign, FileText, Package, UserCheck, Calendar, MessageSquare,
  TrendingUp, PieChart, Activity, Shield, Database, HelpCircle,
  Smartphone, Printer, Monitor, HardDrive,
  CreditCard, Receipt, Banknote, Calculator, Building2, MapPin, ShoppingCart,
  Search, X, Inbox, Send
} from 'lucide-react';
import useUIStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { useNavigation, useNavigationStats, useNavigationSearch, getBadgeCount } from '../../hooks/useNavigation';
import { mapNavItems } from '../../utils/iconMapper';
import { isAdmin as checkIsAdmin } from '../../utils/permissions';

const navItems = [
  {
    section: 'الرئيسية',
    items: [
      { href: '/', label: 'لوحة التحكم', icon: Home, badge: null },
      // NOTE: تم إزالة اختصارات "لوحة التحكم المتكاملة" و"الإجراءات السريعة" بناءً على الطلب الأخير.
    ]
  },
  {
    section: 'إدارة الإصلاحات',
    items: [
      { href: '/repairs', label: 'طلبات الإصلاح', icon: Wrench, badge: '12' },
      { href: '/repairs/new', label: 'طلب إصلاح جديد', icon: FileText },
      { href: '/repairs/tracking', label: 'تتبع الطلبات', icon: Activity },
      { href: '/services', label: 'كتالوج الخدمات', icon: Package },
      {
        label: 'أنواع الأجهزة',
        icon: Monitor,
        subItems: [
          { href: '/devices/smartphones', label: 'الهواتف الذكية', icon: Smartphone },
          { href: '/devices/computers', label: 'أجهزة الكمبيوتر', icon: Monitor },
          { href: '/devices/printers', label: 'الطابعات', icon: Printer },
          { href: '/devices/accessories', label: 'الإكسسوارات', icon: HardDrive },
        ]
      },
    ]
  },
  {
    section: 'إدارة العملاء',
    items: [
      { href: '/customers', label: 'العملاء', icon: Users, badge: '248' },
      { href: '/customers/new', label: 'عميل جديد', icon: UserCheck },
      { href: '/companies', label: 'الشركات', icon: Building2, badge: '15' },
      { href: '/appointments', label: 'المواعيد', icon: Calendar },
      { href: '/communications', label: 'التواصل', icon: MessageSquare, badge: '3' },
      { href: '/messaging', label: 'مركز الرسائل', icon: Inbox },
      { href: '/messaging/reports', label: 'تقارير المراسلة', icon: BarChart2 },
    ]
  },
  {
    section: 'المخزون والقطع',
    items: [
      { href: '/inventory', label: 'المخزون', icon: Warehouse },
      { href: '/inventory/warehouses', label: 'إدارة المخازن', icon: Building2 },
      { href: '/inventory/transfer', label: 'نقل المخزون', icon: Package },
      { href: '/inventory/stock-movements', label: 'حركة المخزون', icon: Activity },
      { href: '/inventory/stock-alerts', label: 'تنبيهات المخزون', icon: Activity, badge: '3' },
      { href: '/inventory/reports', label: 'تقارير المخزون', icon: BarChart2 },
      { href: '/inventory/parts', label: 'قطع الغيار', icon: Package, badge: 'نقص' },
      { href: '/vendors', label: 'الموردين', icon: Building2 },
    ]
  },
  {
    section: 'النظام المالي',
    items: [
      { href: '/financial', label: 'لوحة التحكم المالية', icon: DollarSign },
      // Financial Module v2 (New Architecture)
      { href: '/financial/invoices', label: 'الفواتير', icon: Receipt, badge: '8' },
      { href: '/financial/payments', label: 'المدفوعات', icon: CreditCard },
      { href: '/financial/expenses', label: 'المصروفات', icon: Banknote },
      { href: '/reports/financial', label: 'التقارير المالية', icon: Calculator },
      // Old routes (for backward compatibility - يمكن إزالتها لاحقاً)
      { href: '/invoices', label: 'الفواتير (قديم)', icon: Receipt },
      { href: '/quotations', label: 'العروض السعرية', icon: FileText },
      { href: '/purchase-orders', label: 'طلبات الشراء', icon: ShoppingCart },
      { href: '/payments', label: 'المدفوعات (قديم)', icon: CreditCard },
      { href: '/expenses', label: 'المصروفات (قديم)', icon: Banknote },
    ]
  },
  {
    section: 'التقارير والإحصائيات',
    items: [
      {
        label: 'التقارير',
        icon: BarChart2,
        subItems: [
          { href: '/reports/daily', label: 'التقرير اليومي', icon: Calendar },
          { href: '/reports/financial', label: 'التقارير المالية', icon: DollarSign },
          { href: '/reports/technician', label: 'تقارير أداء الفنيين', icon: UserCheck },
          { href: '/reports/repairs', label: 'تقارير الإصلاح', icon: Wrench },
          { href: '/reports/sales', label: 'تقارير المبيعات', icon: TrendingUp },
          { href: '/reports/inventory', label: 'تقارير المخزون', icon: Package },
          { href: '/reports/customers', label: 'تقارير العملاء', icon: Users },
        ]
      },
      { href: '/analytics', label: 'التحليلات', icon: PieChart },
      { href: '/performance', label: 'الأداء', icon: Activity },
    ]
  },
  {
    section: 'الإعدادات والإدارة',
    items: [
      { href: '/settings', label: 'إعدادات النظام', icon: Settings },
      { href: '/users', label: 'إدارة المستخدمين', icon: Shield },
      { href: '/admin/roles', label: 'الأدوار والصلاحيات', icon: Shield },
      { href: '/branches', label: 'الفروع', icon: MapPin },
      { href: '/system', label: 'إعدادات النظام', icon: Database },
      { href: '/help', label: 'المساعدة', icon: HelpCircle },
    ]
  },
];

const Sidebar = () => {
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const sidebarRef = useRef(null);
  
  // Navigation Hooks
  const { navItems: apiNavItems, loading: navLoading } = useNavigation();
  const { stats } = useNavigationStats();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Check for Admin using permission utility
  const isAdmin = checkIsAdmin(user);
  const [openMenus, setOpenMenus] = useState(new Set());
  const [openSections, setOpenSections] = useState(new Set());
  
  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if sidebar is open
      if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        // Check if click is not on the toggle button (if it exists in Topbar)
        const target = event.target;
        const isToggleButton = target.closest('[data-sidebar-toggle]');
        if (!isToggleButton) {
          toggleSidebar();
        }
      }
    };

    if (isSidebarOpen) {
      // Add a small delay to prevent immediate closing when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isSidebarOpen, toggleSidebar]);
  
  // Use API navigation items or fallback to static items
  const navigationItems = useMemo(() => {
    let items = [];
    if (apiNavItems && apiNavItems.length > 0) {
      items = mapNavItems(apiNavItems);
    } else {
      items = navItems; // Fallback to static items
    }
    
    // Ensure messaging center is always present in "إدارة العملاء" section
    const customersSection = items.find(section => section.section === 'إدارة العملاء');
    if (customersSection) {
      const hasMessaging = customersSection.items?.some(item => item.href === '/messaging');
      if (!hasMessaging) {
        // Add messaging link to customers section
        customersSection.items = customersSection.items || [];
        customersSection.items.push({ href: '/messaging', label: 'مركز الرسائل', icon: Inbox });
      }
    } else {
      // If customers section doesn't exist, add it
      items.push({
        section: 'إدارة العملاء',
        items: [
          { href: '/messaging', label: 'مركز الرسائل', icon: Inbox }
        ]
      });
    }
    
    return items;
  }, [apiNavItems]);
  
  // Filter navigation items based on search
  const filteredNavItems = useNavigationSearch(navigationItems, searchQuery);

  // Find the section that contains the current page
  const findSectionForCurrentPage = useCallback((items, pathname) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return null;
    }

    if (!pathname) {
      return null;
    }

    let foundSection = null;
    let foundMenuItem = null;

    try {
      for (const section of items) {
        if (!section || !section.items || !Array.isArray(section.items)) {
          continue;
        }

        for (const item of section.items) {
          if (!item) continue;

          // Check direct href match (exact match)
          if (item.href === pathname) {
            foundSection = section.section;
            break;
          }
          
          // Check if pathname starts with item.href (for nested routes like /repairs/123)
          // But avoid matching /customers with /customer (different routes)
          if (item.href && item.href !== '/' && pathname.startsWith(item.href + '/')) {
            foundSection = section.section;
            break;
          }
          
          // Also check exact match for /customers (without trailing slash)
          if (item.href === pathname) {
            foundSection = section.section;
            break;
          }
          
          // Check subItems
          if (item.subItems && Array.isArray(item.subItems)) {
            for (const subItem of item.subItems) {
              if (!subItem || !subItem.href) continue;
              
              if (subItem.href === pathname || (subItem.href !== '/' && pathname.startsWith(subItem.href + '/'))) {
                foundSection = section.section;
                foundMenuItem = item.label;
                break;
              }
            }
            if (foundMenuItem) break;
          }
        }
        if (foundSection) break;
      }

      // Open the menu item if it has subItems
      if (foundMenuItem) {
        setOpenMenus(prev => new Set([...prev, foundMenuItem]));
      }
    } catch (error) {
      console.error('Error in findSectionForCurrentPage:', error);
      return null;
    }

    return foundSection;
  }, []);

  // Track the last pathname to detect navigation changes
  const lastPathnameRef = React.useRef(location.pathname);
  const isInitialMount = React.useRef(true);

  // Update open sections based on current page location (only when pathname changes)
  useEffect(() => {
    // On initial mount or when pathname changes
    if (isInitialMount.current || lastPathnameRef.current !== location.pathname) {
      lastPathnameRef.current = location.pathname;
      isInitialMount.current = false;
      
      try {
        // Find the section containing the current page
        const currentSection = findSectionForCurrentPage(navigationItems, location.pathname);
        
        if (currentSection) {
          // Open only the section containing the current page, close all others
          setOpenSections(new Set([currentSection]));
        } else {
          // If no section found, close all sections
          setOpenSections(new Set());
        }
      } catch (error) {
        console.error('Error in findSectionForCurrentPage:', error);
        // Don't crash - just keep current state
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navigationItems]); // Include navigationItems to update when they load

  
  // Helper to get badge value from stats or static value
  const getItemBadge = (item) => {
    if (!item) return null;
    
    // If badgeKey exists, get from stats
    if (item.badgeKey && stats) {
      const count = getBadgeCount(stats, item.badgeKey);
      if (count) return count;
    }
    
    // Otherwise use static badge
    return item.badge || null;
  };

  const handleMenuToggle = (label) => {
    // If sidebar is closed, open it first
    if (!isSidebarOpen) {
      toggleSidebar();
      // Open the menu after a short delay to allow sidebar to open
      setTimeout(() => {
        setOpenMenus(new Set([label]));
      }, 100);
      return;
    }
    
    const newOpenMenus = new Set(openMenus);
    if (newOpenMenus.has(label)) {
      newOpenMenus.delete(label);
    } else {
      newOpenMenus.add(label);
    }
    setOpenMenus(newOpenMenus);
  };

  const handleSectionToggle = (section) => {
    if (!isSidebarOpen) return;
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(section)) {
      newOpenSections.delete(section);
    } else {
      newOpenSections.add(section);
    }
    setOpenSections(newOpenSections);
  };

  const renderMenuItem = (item, isSubItem = false) => {
    // إخفاء رابط الأدوار عن غير الأدمن
    if (item.href === '/admin/roles' && !isAdmin) {
      return null;
    }
    const isActive = location.pathname === item.href;
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isMenuOpen = openMenus.has(item.label);

    if (hasSubItems) {
      return (
        <div key={item.label}>
          <button
            onClick={() => handleMenuToggle(item.label)}
            className={cn(
              "w-full flex items-center justify-between py-2.5 my-1 rounded-lg transition-all duration-200 hover:bg-accent hover:text-accent-foreground group",
              isSidebarOpen ? "px-3" : "justify-center px-2",
              isSubItem && "text-sm py-2"
            )}
          >
            <div className="flex items-center min-w-0">
              <item.icon className={cn(
                "flex-shrink-0 transition-colors",
                isSidebarOpen ? "w-5 h-5 ml-3" : "w-6 h-6",
                "text-muted-foreground group-hover:text-primary"
              )} />
              {isSidebarOpen && (
                <span className="truncate font-medium">{item.label}</span>
              )}
            </div>
            {isSidebarOpen && (
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform flex-shrink-0",
                  isMenuOpen && "rotate-90"
                )}
              />
            )}
          </button>
          {isSidebarOpen && isMenuOpen && (
            <div className="mr-8 mb-2 space-y-1">
              {item.subItems.map((subItem) => (
                <Link
                  key={subItem.href}
                  to={subItem.href}
                  className={cn(
                    "flex items-center py-2 px-3 rounded-md text-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                    location.pathname === subItem.href
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  {subItem.icon && (
                    <subItem.icon className="w-4 h-4 ml-2 flex-shrink-0" />
                  )}
                  <span className="truncate">{subItem.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={() => {
          // If sidebar is closed, open it when clicking an icon
          if (!isSidebarOpen) {
            toggleSidebar();
          }
        }}
        className={cn(
          "flex items-center py-2.5 my-1 rounded-lg transition-all duration-200 hover:bg-accent hover:text-accent-foreground group relative",
          isSidebarOpen ? "px-3" : "justify-center px-2",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground",
          isSubItem && "text-sm py-2"
        )}
      >
        <item.icon className={cn(
          "flex-shrink-0 transition-colors",
          isSidebarOpen ? "w-5 h-5 ml-3" : "w-6 h-6",
          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
        )} />
        {isSidebarOpen && (
          <>
            <span className="truncate font-medium flex-1">{item.label}</span>
            {(() => {
              const badgeValue = getItemBadge(item);
              if (!badgeValue) return null;
              
              return (
                <Badge
                  variant={badgeValue === 'نقص' ? 'destructive' : badgeValue === 'جديد' ? 'success' : 'default'}
                  size="sm"
                  className="mr-2 flex-shrink-0"
                >
                  {badgeValue}
                </Badge>
              );
            })()}
          </>
        )}
        {!isSidebarOpen && getItemBadge(item) && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-card"></div>
        )}
      </Link>
    );
  };

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "flex-shrink-0 bg-card text-card-foreground flex flex-col transition-all duration-300 ease-in-out border-l border-border shadow-xl",
        isSidebarOpen ? "w-72" : "w-16"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-center border-b border-border bg-card/50 backdrop-blur-sm">
        {isSidebarOpen ? (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">FixZone</h1>
              <p className="text-xs text-muted-foreground">نظام إدارة الإصلاحات</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Search inside Sidebar */}
      {isSidebarOpen && (
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="بحث في القائمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {navLoading && isSidebarOpen && (
          <div className="px-3 py-2 text-sm text-muted-foreground">جاري التحميل...</div>
        )}
        {filteredNavItems.map((section) => (
          <div key={section.section} className="mb-6">
            {isSidebarOpen && (
              <button
                onClick={() => handleSectionToggle(section.section)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span>{section.section}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    openSections.has(section.section) ? "rotate-0" : "-rotate-90"
                  )}
                />
              </button>
            )}
            {(isSidebarOpen ? openSections.has(section.section) : true) && (
              <div className="space-y-1">
                {section.items.map((item) => renderMenuItem(item))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        {isSidebarOpen ? (
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">محمود ناصر</p>
              <p className="text-xs text-muted-foreground truncate">مدير النظام</p>
            </div>
            <Link to="/settings">
              <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
            </Link>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

// Memoize component for performance
export default memo(Sidebar);
