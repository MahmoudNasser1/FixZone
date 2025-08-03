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
                <span className="text-gray-400 px-2">...</span>
              ) : item.href ? (
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-1 space-x-reverse px-2 py-1 rounded-md transition-colors",
                    "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                    "dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700"
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
                      ? "text-blue-600 bg-blue-50 font-medium dark:text-blue-400 dark:bg-blue-900/20" 
                      : "text-gray-900 dark:text-gray-100"
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
                  <SeparatorIcon className="w-4 h-4 text-gray-400" />
                ) : (
                  <span className="text-gray-400">/</span>
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
