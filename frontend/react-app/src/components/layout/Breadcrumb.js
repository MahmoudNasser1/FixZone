import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Home, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

// خريطة المسارات والعناوين باللغة العربية
const routeMap = {
  '/': 'الرئيسية',
  '/dashboard': 'لوحة التحكم',
  '/repairs': 'طلبات الإصلاح',
  '/repairs/new': 'طلب إصلاح جديد',
  '/repairs/pending': 'الطلبات المعلقة',
  '/repairs/completed': 'الطلبات المكتملة',
  '/customers': 'العملاء',
  '/customers/new': 'عميل جديد',
  '/customers/companies': 'الشركات',
  '/inventory': 'المخزون',
  '/inventory/parts': 'قطع الغيار',
  '/inventory/parts/new': 'قطعة جديدة',
  '/inventory/categories': 'فئات القطع',
  '/finance': 'المالية',
  '/finance/invoices': 'الفواتير',
  '/finance/invoices/new': 'فاتورة جديدة',
  '/finance/payments': 'المدفوعات',
  '/reports': 'التقارير',
  '/reports/repairs': 'تقارير الإصلاح',
  '/reports/financial': 'التقارير المالية',
  '/settings': 'الإعدادات',
  '/settings/users': 'المستخدمين',
  '/settings/branches': 'الفروع',
  '/profile': 'الملف الشخصي',
  '/notifications': 'الإشعارات',
  '/help': 'المساعدة'
};

const Breadcrumb = ({ 
  items = null, 
  showHome = true, 
  separator = 'chevron',
  className = '',
  maxItems = 4
}) => {
  const location = useLocation();
  
  // إنشاء عناصر التنقل تلقائياً من المسار الحالي
  const generateBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    const breadcrumbItems = [];
    
    if (showHome) {
      breadcrumbItems.push({
        label: 'الرئيسية',
        href: '/dashboard',
        icon: Home
      });
    }
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = routeMap[currentPath] || segment;
      const isLast = index === pathSegments.length - 1;
      
      breadcrumbItems.push({
        label,
        href: isLast ? null : currentPath,
        isActive: isLast
      });
    });
    
    return breadcrumbItems;
  };
  
  const breadcrumbItems = items || generateBreadcrumbItems();
  
  // تقليل العناصر إذا كانت كثيرة
  const displayItems = breadcrumbItems.length > maxItems 
    ? [
        breadcrumbItems[0],
        { label: '...', isEllipsis: true },
        ...breadcrumbItems.slice(-2)
      ]
    : breadcrumbItems;
  
  const SeparatorIcon = separator === 'chevron' ? ChevronRight : null;
  
  return (
    <nav 
      aria-label="مسار التنقل" 
      className={cn("flex items-center space-x-1 space-x-reverse text-sm", className)}
    >
      <ol className="flex items-center space-x-1 space-x-reverse">
        {displayItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {/* العنصر */}
            <div className="flex items-center space-x-1 space-x-reverse">
              {item.isEllipsis ? (
                <span className="text-gray-300 px-2 font-medium">...</span>
              ) : item.href ? (
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-1 space-x-reverse px-2 py-1 rounded-md transition-colors",
                    "text-white hover:text-blue-100 hover:bg-white/20 font-medium",
                    "dark:text-white dark:hover:text-blue-100 dark:hover:bg-white/20"
                  )}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span 
                  className={cn(
                    "flex items-center space-x-1 space-x-reverse px-2 py-1 rounded-md",
                    item.isActive 
                      ? "text-white bg-white/20 font-bold dark:text-white dark:bg-white/20" 
                      : "text-blue-100 dark:text-blue-100"
                  )}
                  aria-current={item.isActive ? "page" : undefined}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </span>
              )}
            </div>
            
            {/* الفاصل */}
            {index < displayItems.length - 1 && !item.isEllipsis && (
              <div className="mx-2">
                {SeparatorIcon ? (
                  <SeparatorIcon className="w-4 h-4 text-blue-200" />
                ) : (
                  <span className="text-blue-200 font-medium">/</span>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// مكون مبسط للاستخدام السريع
export const SimpleBreadcrumb = ({ title, parentTitle, parentHref }) => {
  const items = [
    { label: 'الرئيسية', href: '/dashboard', icon: Home }
  ];
  
  if (parentTitle && parentHref) {
    items.push({ label: parentTitle, href: parentHref });
  }
  
  if (title) {
    items.push({ label: title, isActive: true });
  }
  
  return <Breadcrumb items={items} />;
};

// مكون للصفحات مع إجراءات
export const BreadcrumbWithActions = ({ 
  title, 
  parentTitle, 
  parentHref, 
  actions,
  className = ''
}) => {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <SimpleBreadcrumb 
        title={title}
        parentTitle={parentTitle}
        parentHref={parentHref}
      />
      {actions && (
        <div className="flex items-center space-x-2 space-x-reverse">
          {actions}
        </div>
      )}
    </div>
  );
};

export default Breadcrumb;
