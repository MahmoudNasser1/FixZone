# 🎨 خطة تطوير Frontend - نظام التنقل والبارات

> **الجزء الأول:** تطوير واجهة المستخدم (UI/UX)

---

## ✅ Phase 4: Admin Portal Enhancement - تم الإنجاز

**ما تم إنجازه في Phase 4:**

1. **Sidebar.js** ✅
   - استبدال الخلفية المتدرجة بـ `bg-card`
   - تحديث ألوان النصوص والروابط لتدعم `text-foreground` و `text-muted-foreground`
   - تحسين hover states باستخدام `bg-accent`
   - دعم كامل للـ Dark Mode

2. **Topbar.js** ✅
   - دعم كامل للـ Dark Mode في الخلفية والحدود
   - تحديث أيقونات الإشعارات والبحث
   - تحسين القوائم المنسدلة (Dropdowns)
   - استخدام `bg-background`, `border-border`, `text-foreground`

3. **Dashboard.js** ✅
   - تعريب النصوص بالكامل
   - استبدال الألوان الثابتة بـ Tailwind classes
   - دعم RTL في التخطيط

4. **UsersPage.js** ✅
   - إعادة تصميم الجدول بالكامل
   - تحسين حقول الإدخال والفلاتر
   - دعم كامل للـ Dark Mode

---

## 📋 نظرة عامة

هذا الملف يغطي جميع جوانب تطوير Frontend لنظام التنقل والبارات، مع التركيز على:
- ✅ **Sidebar** - شريط جانبي محسّن (تم تحديث UI في Phase 4)
- ✅ **Topbar** - شريط علوي محسّن (تم تحديث UI في Phase 4)
- ⚠️ **Headers** - رؤوس صفحات محسّنة (قيد التطوير)
- ⚠️ **UI/UX** - تحسينات إضافية (الأداء، البحث، الصلاحيات)
- ✅ **Responsive** - تصميم متجاوب (موجود)

---

## 1️⃣ تطوير Sidebar

### **الوضع الحالي:**
```javascript
// frontend/react-app/src/components/layout/Sidebar.js
- ✅ موجود ويعمل
- ✅ تم تحديث UI لدعم Dark Mode (bg-card, text-foreground, text-muted-foreground)
- ✅ تم استخدام bg-accent للـ hover states
- ✅ تم تحديث الحدود لاستخدام border-border
- ⚠️ يحتاج تحسينات في الأداء (React.memo, useMemo)
- ⚠️ يحتاج تحسينات في الصلاحيات الديناميكية
- ⚠️ يحتاج إضافة بحث داخلي
```

### **التحسينات المطلوبة:**

#### **1.1 تحسين الأداء:**
```javascript
// استخدام React.memo و useMemo
import React, { useState, useMemo, memo } from 'react';

const Sidebar = memo(() => {
  // Memoize navigation items based on user permissions
  const navItems = useMemo(() => {
    return filterNavItemsByPermissions(allNavItems, userPermissions);
  }, [userPermissions]);

  // Memoize active route check
  const isActive = useMemo(() => {
    return location.pathname === item.href;
  }, [location.pathname, item.href]);

  return (
    // Sidebar content
  );
});
```

#### **1.2 تحسين UI/UX:**
```javascript
// ✅ تم تحديث التصميم - يستخدم الآن:
// - bg-card بدلاً من bg-gradient
// - text-foreground و text-muted-foreground
// - bg-accent للـ hover states
// - border-border للحدود

// التحسينات الإضافية المطلوبة:
const Sidebar = () => {
  return (
    <aside className={cn(
      "flex-shrink-0 bg-card text-card-foreground",
      "flex flex-col transition-all duration-300",
      "ease-in-out border-l border-border shadow-xl",
      isSidebarOpen ? "w-72" : "w-16"
    )}>
      {/* Header with logo */}
      <div className="h-16 flex items-center justify-center 
                      border-b border-border 
                      bg-card/50 backdrop-blur-sm">
        {/* Logo and brand - يستخدم text-foreground */}
      </div>

      {/* Navigation with smooth scrolling */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 
                      scrollbar-thin scrollbar-thumb-gray-600 
                      scrollbar-track-transparent
                      hover:scrollbar-thumb-gray-500">
        {/* Navigation items - يستخدم hover:bg-accent */}
      </nav>

      {/* Footer with user info */}
      <div className="p-4 border-t border-border 
                      bg-muted/30">
        {/* User profile */}
      </div>
    </aside>
  );
};
```

#### **1.3 نظام الصلاحيات الديناميكي:**
```javascript
// utils/navigationPermissions.js
export const filterNavItemsByPermissions = (navItems, userPermissions) => {
  return navItems.map(section => ({
    ...section,
    items: section.items
      .map(item => {
        // Check if item requires permission
        if (item.permission && !hasPermission(userPermissions, item.permission)) {
          return null;
        }
        
        // Filter sub-items
        if (item.subItems) {
          item.subItems = item.subItems.filter(subItem => {
            if (subItem.permission) {
              return hasPermission(userPermissions, subItem.permission);
            }
            return true;
          });
        }
        
        return item;
      })
      .filter(Boolean)
  })).filter(section => section.items.length > 0);
};

// Helper function
const hasPermission = (userPermissions, requiredPermission) => {
  if (!requiredPermission) return true;
  if (userPermissions.includes('*')) return true; // Admin
  return userPermissions.includes(requiredPermission);
};
```

#### **1.4 Badge System محسّن:**
```javascript
// استخدام API للإحصائيات الفورية
const useNavigationStats = () => {
  const [stats, setStats] = useState({});
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/navigation/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch navigation stats:', error);
      }
    };
    
    fetchStats();
    // Poll every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return stats;
};

// استخدام في Sidebar
const Sidebar = () => {
  const stats = useNavigationStats();
  
  return (
    // Use stats for badges
    {item.badge && (
      <Badge 
        variant={getBadgeVariant(item.badge)}
        size="sm"
        className="mr-2 flex-shrink-0 animate-pulse"
      >
        {stats[item.badgeKey] || item.badge}
      </Badge>
    )}
  );
};
```

#### **1.5 Search داخل Sidebar:**
```javascript
// إضافة بحث سريع داخل Sidebar
const Sidebar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredNavItems = useMemo(() => {
    if (!searchQuery) return navItems;
    
    return navItems.map(section => ({
      ...section,
      items: section.items.filter(item => {
        const matchesLabel = item.label.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubItems = item.subItems?.some(subItem => 
          subItem.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return matchesLabel || matchesSubItems;
      })
    })).filter(section => section.items.length > 0);
  }, [searchQuery, navItems]);
  
  return (
    <aside>
      {/* Search input */}
      {isSidebarOpen && (
        <div className="px-3 py-2 border-b border-gray-700/50">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 
                              text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="بحث في القائمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-gray-800/50 border-gray-700 text-white 
                         placeholder-gray-400"
            />
          </div>
        </div>
      )}
      
      {/* Filtered navigation */}
      <nav>
        {filteredNavItems.map(section => (
          // Render sections
        ))}
      </nav>
    </aside>
  );
};
```

---

## 2️⃣ تطوير Topbar

### **الوضع الحالي:**
```javascript
// frontend/react-app/src/components/layout/Topbar.js
- ✅ موجود ويعمل
- ✅ تم تحديث UI لدعم Dark Mode (bg-background, border-border)
- ✅ تم استخدام text-foreground و text-muted-foreground
- ✅ تم استخدام bg-accent للـ hover states
- ✅ تم تحديث الإشعارات لدعم Dark Mode
- ⚠️ يحتاج تحسينات في البحث (بحث متقدم بدلاً من بسيط)
- ⚠️ يحتاج تحسينات في الإحصائيات (APIs ديناميكية)
```

### **التحسينات المطلوبة:**

#### **2.1 بحث متقدم:**
```javascript
// components/search/GlobalSearch.js
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp } from 'lucide-react';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  
  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }
      
      try {
        const response = await api.get('/api/search/global', {
          params: { q: searchQuery, limit: 10 }
        });
        setResults(response.data);
      } catch (error) {
        console.error('Search failed:', error);
      }
    }, 300),
    []
  );
  
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);
  
  const handleSelect = (result) => {
    // Save to recent searches
    const newRecent = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    
    // Navigate
    navigate(result.href);
    setIsOpen(false);
    setQuery('');
  };
  
  return (
    <div className="relative flex-1 max-w-2xl mx-4">
      <form onSubmit={(e) => { e.preventDefault(); handleSelect(results[0]); }}>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 
                            text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="بحث في الطلبات، العملاء، القطع..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="pr-10 pl-10 bg-gray-50 dark:bg-gray-700 
                       border-gray-200 dark:border-gray-600
                       focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); }}
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </form>
      
      {/* Search Results Dropdown */}
      {isOpen && (query || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 
                        rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 
                        max-h-96 overflow-y-auto z-50">
          {query && results.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                النتائج
              </div>
              {results.map(result => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-center space-x-3 space-x-reverse 
                             px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 
                             transition-colors text-right"
                >
                  <result.icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {result.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {result.subtitle}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {result.type}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {!query && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase 
                              flex items-center">
                <Clock className="w-3 h-3 ml-2" />
                البحث الأخير
              </div>
              {recentSearches.map(search => (
                <button
                  key={search.id}
                  onClick={() => handleSelect(search)}
                  className="w-full flex items-center space-x-3 space-x-reverse 
                             px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 
                             transition-colors text-right"
                >
                  {/* Render recent search */}
                </button>
              ))}
            </div>
          )}
          
          {query && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              لا توجد نتائج
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

#### **2.2 إشعارات محسّنة:**
```javascript
// components/notifications/NotificationCenter.js
import { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationCenter = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
                   transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white 
                           text-xs font-bold rounded-full flex items-center justify-center 
                           border-2 border-white dark:border-gray-800">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-96 bg-white dark:bg-gray-800 
                          rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 
                          z-20 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 
                            flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">
                الإشعارات
              </h3>
              <div className="flex items-center space-x-2 space-x-reverse">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  لا توجد إشعارات
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-gray-100 dark:border-gray-700",
                      "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                      "cursor-pointer",
                      !notification.read && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.href) {
                        navigate(notification.href);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <div className={cn(
                        "p-2 rounded-lg flex-shrink-0",
                        getNotificationIconBg(notification.type)
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 
                           font-medium"
              >
                عرض جميع الإشعارات
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
```

#### **2.3 إحصائيات فورية:**
```javascript
// hooks/useQuickStats.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useQuickStats = () => {
  const [stats, setStats] = useState({
    pendingRepairs: 0,
    newMessages: 0,
    lowStock: 0,
    todayRevenue: 0,
    loading: true
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/dashboard/quick-stats');
        setStats({
          ...response.data,
          loading: false
        });
      } catch (error) {
        console.error('Failed to fetch quick stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchStats();
    // Poll every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return stats;
};

// استخدام في Topbar
const Topbar = () => {
  const stats = useQuickStats();
  
  return (
    <header>
      {/* Quick Stats */}
      <div className="hidden lg:flex items-center space-x-6 space-x-reverse">
        <StatCard
          icon={Wrench}
          value={stats.pendingRepairs}
          label="طلبات معلقة"
          color="orange"
          href="/repairs?status=pending"
        />
        <StatCard
          icon={TrendingUp}
          value={`${formatCurrency(stats.todayRevenue)} جنية`}
          label="اليوم"
          color="green"
          href="/reports/daily"
        />
        <StatCard
          icon={Package}
          value={stats.lowStock}
          label="نقص مخزون"
          color="red"
          href="/inventory/stock-alerts"
        />
      </div>
    </header>
  );
};
```

---

## 3️⃣ تطوير Headers (Customer & Technician)

### **3.1 Customer Header محسّن:**
```javascript
// components/customer/CustomerHeader.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { useNotifications } from '../../hooks/useNotifications';

const CustomerHeader = ({ user }) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { notifications, unreadCount } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  return (
    <header
      className="shadow-lg relative z-10 sticky top-0"
      style={{
        background: 'linear-gradient(135deg, #053887 0%, #0a4da3 100%)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Welcome */}
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="FixZone"
              className="h-10 w-auto object-contain"
            />
            <div className="text-white">
              <h1 className="text-xl font-bold">مرحباً، {user?.name || 'عميل'}</h1>
              <p className="text-sm opacity-90">لوحة تحكم العميل</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NotificationButton
              notifications={notifications}
              unreadCount={unreadCount}
              isOpen={isNotificationsOpen}
              onToggle={() => setIsNotificationsOpen(!isNotificationsOpen)}
            />
            
            {/* User Menu */}
            <UserMenu
              user={user}
              isOpen={isMenuOpen}
              onToggle={() => setIsMenuOpen(!isMenuOpen)}
              onLogout={logout}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
```

### **3.2 Technician Header محسّن:**
```javascript
// components/technician/TechnicianHeader.js
import { useState, useEffect } from 'react';
import { Bell, User, Settings, LogOut, CheckCircle, Wrench, Circle } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { useNotifications } from '../../hooks/useNotifications';
import { useTechnicianStatus } from '../../hooks/useTechnicianStatus';

const TechnicianHeader = ({ user }) => {
  const { status, updateStatus } = useTechnicianStatus();
  const { notifications, unreadCount } = useNotifications();
  
  const statusConfig = {
    available: { label: 'متاح', color: '#10B981', icon: CheckCircle },
    busy: { label: 'مشغول', color: '#EF4444', icon: Wrench },
    offline: { label: 'غير متصل', color: '#6B7280', icon: Circle }
  };
  
  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FixZone Logo" className="h-10 w-auto" />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-gray-900">FixZone</h1>
              <p className="text-xs text-gray-500 font-medium">بوابة الفنيين</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Status Toggle */}
            <StatusToggle
              status={status}
              statusConfig={statusConfig}
              onStatusChange={updateStatus}
            />
            
            {/* Notifications */}
            <NotificationButton
              notifications={notifications}
              unreadCount={unreadCount}
            />
            
            {/* User Menu */}
            <UserMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
};
```

---

## 4️⃣ تحسينات UI/UX عامة

### **4.1 Animations سلسة:**
```javascript
// utils/animations.js
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const slideIn = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
  transition: { duration: 0.3 }
};

// استخدام framer-motion
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.aside
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideIn}
        >
          {/* Content */}
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
```

### **4.2 Loading States:**
```javascript
// components/ui/LoadingSpinner.js
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  return (
    <div className="flex items-center justify-center">
      <div className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
        sizeClasses[size]
      )} />
    </div>
  );
};
```

### **4.3 Error States:**
```javascript
// components/ui/ErrorBoundary.js
class NavigationErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Navigation Error:', error, errorInfo);
    // Log to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">حدث خطأ في التنقل</p>
          <button onClick={() => window.location.reload()}>
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

---

## 5️⃣ Responsive Design

### **5.1 Mobile Optimization:**
```javascript
// استخدام Tailwind responsive classes
const Sidebar = () => {
  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50",
      "transform transition-transform duration-300 ease-in-out",
      "lg:relative lg:translate-x-0",
      isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      {/* Content */}
    </aside>
  );
};

// Mobile overlay
{isSidebarOpen && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
    onClick={toggleSidebar}
  />
)}
```

### **5.2 Touch Gestures:**
```javascript
// استخدام react-swipeable
import { useSwipeable } from 'react-swipeable';

const MobileSidebar = () => {
  const handlers = useSwipeable({
    onSwipedRight: () => toggleSidebar(true),
    onSwipedLeft: () => toggleSidebar(false),
    trackMouse: true
  });
  
  return (
    <div {...handlers}>
      {/* Sidebar */}
    </div>
  );
};
```

---

## 6️⃣ Accessibility (A11y)

### **6.1 Keyboard Navigation:**
```javascript
// دعم التنقل بالكيبورد
const Sidebar = () => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <aside role="navigation" aria-label="Main navigation">
      {/* Content */}
    </aside>
  );
};
```

### **6.2 ARIA Labels:**
```javascript
// إضافة ARIA labels
<button
  aria-label="Toggle sidebar"
  aria-expanded={isSidebarOpen}
  onClick={toggleSidebar}
>
  <Menu />
</button>

<nav aria-label="Main navigation">
  {/* Navigation items */}
</nav>
```

---

## 7️⃣ Performance Optimization

### **7.1 Code Splitting:**
```javascript
// Lazy load components
const Sidebar = lazy(() => import('./components/layout/Sidebar'));
const Topbar = lazy(() => import('./components/layout/Topbar'));

// في App.js
<Suspense fallback={<LoadingSpinner />}>
  <Sidebar />
  <Topbar />
</Suspense>
```

### **7.2 Virtual Scrolling:**
```javascript
// استخدام react-window للقوائم الطويلة
import { FixedSizeList } from 'react-window';

const LongNavList = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <NavItem item={items[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

---

## 📝 Checklist التنفيذ

### **Sidebar:**
- [ ] تحسين الأداء (React.memo, useMemo)
- [ ] تحسين UI/UX
- [ ] نظام الصلاحيات الديناميكي
- [ ] Badge System محسّن
- [ ] Search داخل Sidebar
- [ ] Responsive Design
- [ ] Accessibility

### **Topbar:**
- [ ] بحث متقدم
- [ ] إشعارات محسّنة
- [ ] إحصائيات فورية
- [ ] Quick Actions
- [ ] User Menu محسّن
- [ ] Responsive Design

### **Headers:**
- [ ] Customer Header محسّن
- [ ] Technician Header محسّن
- [ ] Status Management
- [ ] Notifications Integration

### **عام:**
- [ ] Animations سلسة
- [ ] Loading States
- [ ] Error Handling
- [ ] Performance Optimization
- [ ] Accessibility (A11y)
- [ ] Testing

---

**التالي:** [Backend API Plan](./02_BACKEND_PLAN.md)

