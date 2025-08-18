import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Wrench, Users, Warehouse, BarChart2, Settings, ChevronDown, ChevronRight,
  DollarSign, FileText, Package, UserCheck, Calendar, MessageSquare, 
  TrendingUp, PieChart, Activity, Shield, Database, HelpCircle,
  Smartphone, Printer, Monitor, Cpu, HardDrive, Battery, Wifi,
  CreditCard, Receipt, Banknote, Calculator, Building2, MapPin
} from 'lucide-react';
import useUIStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

const navItems = [
  {
    section: 'الرئيسية',
    items: [
      { href: '/', label: 'لوحة التحكم', icon: Home, badge: null },
      { href: '/quick-actions', label: 'الإجراءات السريعة', icon: Activity, badge: 'جديد' },
    ]
  },
  {
    section: 'إدارة الإصلاحات',
    items: [
      { href: '/repairs', label: 'طلبات الإصلاح', icon: Wrench, badge: '12' },
      { href: '/repairs/new', label: 'طلب إصلاح جديد', icon: FileText },
      { href: '/repairs/tracking', label: 'تتبع الطلبات', icon: Activity },
      { href: '/services', label: 'الخدمات', icon: Wrench },
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
    ]
  },
  {
    section: 'المخزون والقطع',
    items: [
      { href: '/inventory', label: 'المخزون', icon: Warehouse },
      { href: '/inventory/parts', label: 'قطع الغيار', icon: Package, badge: 'نقص' },
      { href: '/inventory/suppliers', label: 'الموردين', icon: Building2 },
      { href: '/inventory/orders', label: 'طلبات الشراء', icon: FileText },
    ]
  },
  {
    section: 'النظام المالي',
    items: [
      { href: '/finance', label: 'النظام المالي', icon: DollarSign },
      { href: '/invoices', label: 'الفواتير', icon: Receipt, badge: '8' },
      { href: '/payments', label: 'المدفوعات', icon: CreditCard },
      { href: '/expenses', label: 'المصروفات', icon: Banknote },
      { href: '/financial-reports', label: 'التقارير المالية', icon: Calculator },
    ]
  },
  {
    section: 'التقارير والإحصائيات',
    items: [
      {
        label: 'التقارير',
        icon: BarChart2,
        subItems: [
          { href: '/reports/repairs', label: 'تقارير الإصلاح', icon: Wrench },
          { href: '/reports/sales', label: 'تقارير المبيعات', icon: TrendingUp },
          { href: '/reports/inventory', label: 'تقارير المخزون', icon: Package },
          { href: '/reports/customers', label: 'تقارير العملاء', icon: Users },
          { href: '/reports/financial', label: 'التقارير المالية', icon: DollarSign },
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
  const { isSidebarOpen } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = !!(user && (user.roleId === 1 || user.role === 'admin'));
  const [openMenus, setOpenMenus] = useState(new Set());
  const [openSections, setOpenSections] = useState(new Set(['الرئيسية', 'إدارة الإصلاحات']));

  const handleMenuToggle = (label) => {
    if (!isSidebarOpen) return;
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
              "w-full flex items-center justify-between py-2.5 my-1 rounded-lg transition-all duration-200 hover:bg-gray-700/50 group",
              isSidebarOpen ? "px-3" : "justify-center px-2",
              isSubItem && "text-sm py-2"
            )}
          >
            <div className="flex items-center min-w-0">
              <item.icon className={cn(
                "flex-shrink-0 transition-colors",
                isSidebarOpen ? "w-5 h-5 ml-3" : "w-6 h-6",
                "group-hover:text-blue-400"
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
                    "flex items-center py-2 px-3 rounded-md text-sm transition-all duration-200 hover:bg-gray-700/30",
                    location.pathname === subItem.href 
                      ? "bg-blue-600 text-white shadow-lg" 
                      : "text-gray-300 hover:text-white"
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
        className={cn(
          "flex items-center py-2.5 my-1 rounded-lg transition-all duration-200 hover:bg-gray-700/50 group relative",
          isSidebarOpen ? "px-3" : "justify-center px-2",
          isActive 
            ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700" 
            : "text-gray-300 hover:text-white",
          isSubItem && "text-sm py-2"
        )}
      >
        <item.icon className={cn(
          "flex-shrink-0 transition-colors",
          isSidebarOpen ? "w-5 h-5 ml-3" : "w-6 h-6",
          isActive ? "text-white" : "group-hover:text-blue-400"
        )} />
        {isSidebarOpen && (
          <>
            <span className="truncate font-medium flex-1">{item.label}</span>
            {item.badge && (
              <Badge 
                variant={item.badge === 'نقص' ? 'destructive' : item.badge === 'جديد' ? 'success' : 'default'}
                size="sm"
                className="mr-2 flex-shrink-0"
              >
                {item.badge}
              </Badge>
            )}
          </>
        )}
        {!isSidebarOpen && item.badge && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-800"></div>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "flex-shrink-0 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col transition-all duration-300 ease-in-out border-l border-gray-700 shadow-2xl",
        isSidebarOpen ? "w-72" : "w-16"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-center border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        {isSidebarOpen ? (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">FixZone</h1>
              <p className="text-xs text-gray-400">نظام إدارة الإصلاحات</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {navItems.map((section) => (
          <div key={section.section} className="mb-6">
            {isSidebarOpen && (
              <button
                onClick={() => handleSectionToggle(section.section)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
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
      <div className="p-4 border-t border-gray-700/50 bg-gray-900/30">
        {isSidebarOpen ? (
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">محمود ناصر</p>
              <p className="text-xs text-gray-400 truncate">مدير النظام</p>
            </div>
            <Link to="/settings">
              <Settings className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            </Link>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
