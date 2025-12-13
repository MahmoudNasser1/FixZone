import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Briefcase, User, MoreHorizontal, Settings, Clock, FileText, HelpCircle, X, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Bottom Navigation Bar للفنيين - محسّن
 * 
 * المميزات:
 * - تنقل مبسط (4 عناصر فقط)
 * - صفحة مهام موحدة
 * - قائمة "المزيد" للخيارات الإضافية
 * - Animations ناعمة
 */
const TechnicianBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const navItems = [
    {
      label: 'الرئيسية',
      icon: Home,
      path: '/technician/dashboard',
      ariaLabel: 'لوحة التحكم الرئيسية',
      gradient: 'from-teal-500 to-emerald-500'
    },
    {
      label: 'المهام',
      icon: Briefcase,
      path: '/technician/jobs',
      ariaLabel: 'إدارة المهام والإصلاحات',
      gradient: 'from-blue-500 to-indigo-500',
      // يشمل jobs و tasks معاً
      matchPaths: ['/technician/jobs', '/technician/tasks']
    },
    {
      label: 'الملف',
      icon: User,
      path: '/technician/profile',
      ariaLabel: 'الملف الشخصي',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      label: 'المزيد',
      icon: MoreHorizontal,
      path: null, // سيفتح قائمة منبثقة
      ariaLabel: 'خيارات إضافية',
      gradient: 'from-gray-500 to-slate-500',
      isMore: true
    }
  ];

  const moreMenuItems = [
    {
      label: 'الإعدادات',
      icon: Settings,
      path: '/technician/settings',
      description: 'إدارة إعدادات الحساب'
    },
    {
      label: 'تقارير الوقت',
      icon: Clock,
      path: '/technician/time-reports',
      description: 'عرض تقارير ساعات العمل'
    },
    {
      label: 'التقارير',
      icon: FileText,
      path: '/technician/reports',
      description: 'التقارير والإحصائيات'
    },
    {
      label: 'المساعدة',
      icon: HelpCircle,
      path: '/help',
      description: 'الدعم والمساعدة'
    }
  ];

  const isActive = (item) => {
    if (item.matchPaths) {
      return item.matchPaths.some(p => location.pathname.startsWith(p));
    }
    if (item.path === '/technician/dashboard') {
      return location.pathname === item.path;
    }
    return item.path && location.pathname.startsWith(item.path);
  };

  const handleNavClick = (item) => {
    if (item.isMore) {
      setShowMoreMenu(true);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-lg border-t border-border/50 shadow-2xl md:hidden"
        aria-label="التنقل السفلي"
        role="navigation"
      >
        <div className="flex items-center justify-around h-18 px-2 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                aria-label={item.ariaLabel}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 flex-1 h-16 rounded-xl transition-all duration-300',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  'active:scale-90',
                  active
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'relative p-2.5 rounded-xl transition-all duration-300 transform',
                  active 
                    ? `bg-gradient-to-br ${item.gradient} shadow-lg scale-110` 
                    : 'hover:bg-muted/60 hover:scale-105'
                )}>
                  <Icon className={cn(
                    'w-5 h-5 transition-all duration-300',
                    active && 'drop-shadow-sm'
                  )} />
                  {active && (
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-medium transition-all duration-300 mt-0.5',
                  active ? 'text-foreground font-semibold' : 'text-muted-foreground'
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* More Menu Bottom Sheet */}
      {showMoreMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden animate-in fade-in duration-200"
            onClick={() => setShowMoreMenu(false)}
          />
          
          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[70] md:hidden animate-in slide-in-from-bottom duration-300">
            <div className="bg-card rounded-t-3xl shadow-2xl border-t border-border/50 overflow-hidden">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 border-b border-border/50">
                <h3 className="text-lg font-bold text-foreground">المزيد</h3>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                  aria-label="إغلاق القائمة"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              {/* Menu Items */}
              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto pb-safe">
                {moreMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isItemActive = location.pathname.startsWith(item.path);
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setShowMoreMenu(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200',
                        'hover:bg-muted/80 active:scale-[0.98]',
                        isItemActive && 'bg-primary/10 border border-primary/20'
                      )}
                    >
                      <div className={cn(
                        'p-3 rounded-xl transition-colors',
                        isItemActive 
                          ? 'bg-primary text-white' 
                          : 'bg-muted text-muted-foreground'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className={cn(
                          'font-medium',
                          isItemActive ? 'text-primary' : 'text-foreground'
                        )}>
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TechnicianBottomNav;

