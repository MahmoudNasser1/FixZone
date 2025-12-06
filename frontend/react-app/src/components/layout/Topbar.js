import React, { useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useUIStore from '../../stores/uiStore';
import { useQuickStats, formatCurrency } from '../../hooks/useQuickStats';
import {
  LogOut, User, Settings, Menu, Sun, Moon, Bell, Search, Plus,
  Wrench, Users, Package, FileText, MessageSquare,
  Clock, TrendingUp, AlertCircle, CheckCircle, Zap
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { useTheme } from '../ThemeProvider';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import NotificationCenter from '../notifications/NotificationCenter';

// اختصارات سريعة للمهام اليومية
const quickActions = [
  {
    label: 'طلب إصلاح جديد',
    href: '/repairs/new',
    icon: Plus,
    color: 'bg-green-500 hover:bg-green-600',
    shortcut: 'Ctrl+N'
  },
  {
    label: 'بحث في الطلبات',
    href: '/repairs/search',
    icon: Search,
    color: 'bg-blue-500 hover:bg-blue-600',
    shortcut: 'Ctrl+F'
  },
  {
    label: 'عميل جديد',
    href: '/customers/new',
    icon: Users,
    color: 'bg-purple-500 hover:bg-purple-600',
    shortcut: 'Ctrl+U'
  },
  {
    label: 'إضافة قطعة',
    href: '/inventory/parts/new',
    icon: Package,
    color: 'bg-orange-500 hover:bg-orange-600',
    shortcut: 'Ctrl+P'
  },
  {
    label: 'فاتورة جديدة',
    href: '/invoices/new',
    icon: FileText,
    color: 'bg-indigo-500 hover:bg-indigo-600',
    shortcut: 'Ctrl+I'
  },
];

const Topbar = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (_) {
      navigate('/login', { replace: true });
    }
  };

  // Get quick stats from hook
  const { stats: quickStats } = useQuickStats();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} data-sidebar-toggle>
          <Menu className="w-5 h-5" />
        </Button>

        {/* Quick Stats */}
        <div className="hidden lg:flex items-center space-x-6 space-x-reverse">
          <div className="flex items-center space-x-2 space-x-reverse text-sm">
            <div className="flex items-center space-x-1 space-x-reverse text-brand-orange">
              <Wrench className="w-4 h-4" />
              <span className="font-medium">{quickStats.pendingRepairs}</span>
            </div>
            <span className="text-muted-foreground">طلبات معلقة</span>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse text-sm">
            <div className="flex items-center space-x-1 space-x-reverse text-brand-green">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">{formatCurrency(quickStats.todayRevenue || 0)} جنية</span>
            </div>
            <span className="text-muted-foreground">اليوم</span>
          </div>
          
          {quickStats.lowStock > 0 && (
            <div className="flex items-center space-x-2 space-x-reverse text-sm">
              <div className="flex items-center space-x-1 space-x-reverse text-red-600">
                <Package className="w-4 h-4" />
                <span className="font-medium">{quickStats.lowStock}</span>
              </div>
              <span className="text-muted-foreground">نقص مخزون</span>
            </div>
          )}
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="بحث في الطلبات، العملاء، القطع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-muted/50 border-input focus:bg-background transition-colors"
          />
        </form>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2 space-x-reverse">
        {/* Notification Center */}
        <NotificationCenter />

        {/* Quick Actions */}
        <DropdownMenu open={showQuickActions} onOpenChange={setShowQuickActions}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Zap className="w-5 h-5" />
              <span className="sr-only">الإجراءات السريعة</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-right">الإجراءات السريعة</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickActions.map((action) => (
              <DropdownMenuItem key={action.href} asChild>
                <Link
                  to={action.href}
                  className="flex items-center justify-between w-full px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className={cn("p-1.5 rounded-md text-white", action.color)}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span>{action.label}</span>
                  </div>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded text-muted-foreground">
                    {action.shortcut}
                  </kbd>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">تبديل المظهر</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {((quickStats.newMessages && quickStats.newMessages > 0) || (quickStats.lowStock && quickStats.lowStock > 0)) && (
                <Badge
                  variant="destructive"
                  size="sm"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {(quickStats.newMessages || 0) + (quickStats.lowStock || 0)}
                </Badge>
              )}
              <span className="sr-only">الإشعارات</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="text-right">الإشعارات</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* إشعارات هامة */}
            {quickStats.newMessages && quickStats.newMessages > 0 && (
              <DropdownMenuItem className="flex items-center space-x-3 space-x-reverse p-3 hover:bg-accent cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-brand-blue" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">رسائل جديدة</p>
                  <p className="text-sm text-muted-foreground">{quickStats.newMessages} رسائل غير مقروءة</p>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant="default" size="sm">{quickStats.newMessages}</Badge>
                </div>
              </DropdownMenuItem>
            )}

            {quickStats.lowStock && quickStats.lowStock > 0 && (
              <DropdownMenuItem className="flex items-center space-x-3 space-x-reverse p-3 hover:bg-accent cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-brand-orange" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">نقص في المخزون</p>
                  <p className="text-sm text-muted-foreground">{quickStats.lowStock} قطع تحتاج إعادة طلب</p>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant="destructive" size="sm">{quickStats.lowStock}</Badge>
                </div>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem className="flex items-center space-x-3 space-x-reverse p-3 hover:bg-accent cursor-pointer">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-brand-green" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">تم إنجاز طلب إصلاح</p>
                <p className="text-sm text-muted-foreground">طلب #1234 - هاتف iPhone 12</p>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs text-muted-foreground">منذ 5 دقائق</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/notifications" className="w-full text-center py-2 text-sm text-primary hover:text-primary/80 cursor-pointer">
                عرض جميع الإشعارات
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-auto px-3 space-x-2 space-x-reverse">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {user ? user.name?.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">{user ? user.name : 'مستخدم'}</span>
                <span className="text-xs text-muted-foreground">{user ? user.role : 'موظف'}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center space-x-3 space-x-reverse p-2">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user ? user.name?.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user ? user.name : 'مستخدم'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user ? user.email : 'user@example.com'}
                  </p>
                  <div className="flex items-center space-x-1 space-x-reverse mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">متصل</span>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center space-x-2 space-x-reverse">
                <User className="w-4 h-4" />
                <span>الملف الشخصي</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center space-x-2 space-x-reverse">
                <Settings className="w-4 h-4" />
                <span>الإعدادات</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/help" className="flex items-center space-x-2 space-x-reverse">
                <MessageSquare className="w-4 h-4" />
                <span>المساعدة والدعم</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* إحصائيات سريعة */}
            <div className="px-2 py-2">
              <div className="text-xs text-gray-500 mb-2">إحصائيات اليوم</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1 space-x-reverse">
                  <Wrench className="w-3 h-3 text-blue-500" />
                  <span>8 طلبات</span>
                </div>
                <div className="flex items-center space-x-1 space-x-reverse">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <span>4 معلقة</span>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <div className="flex items-center space-x-2 space-x-reverse w-full">
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

// Memoize component for performance
export default memo(Topbar);
