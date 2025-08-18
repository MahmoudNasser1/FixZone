import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useUIStore from '../../stores/uiStore';
import { 
  LogOut, User, Settings, Menu, Sun, Moon, Bell, Search, Plus, 
  Wrench, Users, Package, FileText, Calculator, MessageSquare,
  Clock, TrendingUp, AlertCircle, CheckCircle, Zap, Command
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // إحصائيات سريعة للعرض في TopBar
  const quickStats = {
    pendingRepairs: 12,
    newMessages: 3,
    lowStock: 5,
    todayRevenue: '2,450'
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="w-5 h-5" />
        </Button>
        
        {/* Quick Stats */}
        <div className="hidden lg:flex items-center space-x-6 space-x-reverse">
          <div className="flex items-center space-x-2 space-x-reverse text-sm">
            <div className="flex items-center space-x-1 space-x-reverse text-orange-600">
              <Wrench className="w-4 h-4" />
              <span className="font-medium">{quickStats.pendingRepairs}</span>
            </div>
            <span className="text-gray-500">طلبات معلقة</span>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse text-sm">
            <div className="flex items-center space-x-1 space-x-reverse text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">{quickStats.todayRevenue} ر.س</span>
            </div>
            <span className="text-gray-500">اليوم</span>
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="بحث في الطلبات، العملاء، القطع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
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
                  className="flex items-center justify-between w-full px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className={cn("p-1.5 rounded-md text-white", action.color)}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span>{action.label}</span>
                  </div>
                  <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 rounded">
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
              {(quickStats.newMessages > 0 || quickStats.lowStock > 0) && (
                <Badge 
                  variant="destructive" 
                  size="sm" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {quickStats.newMessages + quickStats.lowStock}
                </Badge>
              )}
              <span className="sr-only">الإشعارات</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="text-right">الإشعارات</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* إشعارات هامة */}
            {quickStats.newMessages > 0 && (
              <DropdownMenuItem className="flex items-center space-x-3 space-x-reverse p-3 hover:bg-blue-50">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">رسائل جديدة</p>
                  <p className="text-sm text-gray-500">{quickStats.newMessages} رسائل غير مقروءة</p>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant="default" size="sm">{quickStats.newMessages}</Badge>
                </div>
              </DropdownMenuItem>
            )}
            
            {quickStats.lowStock > 0 && (
              <DropdownMenuItem className="flex items-center space-x-3 space-x-reverse p-3 hover:bg-orange-50">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">نقص في المخزون</p>
                  <p className="text-sm text-gray-500">{quickStats.lowStock} قطع تحتاج إعادة طلب</p>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant="destructive" size="sm">{quickStats.lowStock}</Badge>
                </div>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem className="flex items-center space-x-3 space-x-reverse p-3 hover:bg-green-50">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">تم إنجاز طلب إصلاح</p>
                <p className="text-sm text-gray-500">طلب #1234 - هاتف iPhone 12</p>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs text-gray-400">منذ 5 دقائق</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/notifications" className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800">
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
                <span className="text-sm font-medium">{user ? user.name : 'مستخدم'}</span>
                <span className="text-xs text-gray-500">{user ? user.role : 'موظف'}</span>
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

export default Topbar;
