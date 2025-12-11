import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ListTodo, Calendar, User, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Bottom Navigation Bar للفنيين
 * 
 * المميزات:
 * - تنقل سريع للصفحات الرئيسية
 * - يظهر فقط على Mobile
 * - Active State واضح
 */
const TechnicianBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: 'الرئيسية',
      icon: Home,
      path: '/technician/dashboard',
      ariaLabel: 'لوحة التحكم الرئيسية'
    },
    {
      label: 'المهام',
      icon: ListTodo,
      path: '/technician/tasks',
      ariaLabel: 'إدارة المهام'
    },
    {
      label: 'قائمة المهام',
      icon: Calendar,
      path: '/technician/jobs',
      ariaLabel: 'قائمة المهام'
    },
    {
      label: 'الملف الشخصي',
      icon: User,
      path: '/technician/profile',
      ariaLabel: 'الملف الشخصي'
    },
    {
      label: 'الإعدادات',
      icon: Settings,
      path: '/technician/settings',
      ariaLabel: 'الإعدادات'
    }
  ];

  const isActive = (path) => {
    if (path === '/technician/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg md:hidden"
      aria-label="التنقل السفلي"
      role="navigation"
    >
      <div className="flex items-center justify-around h-16 px-2 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.ariaLabel}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                'active:scale-95',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg transition-colors',
                active ? 'bg-primary/10' : 'hover:bg-muted/50'
              )}>
                <Icon className={cn('w-5 h-5 transition-transform', active && 'scale-110')} />
              </div>
              <span className={cn('text-xs font-medium transition-all', active && 'font-semibold')}>
                {item.label}
              </span>
              {active && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TechnicianBottomNav;

