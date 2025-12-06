import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Accordion Component - مكون قابل للطي والفتح
 */
const Accordion = ({ 
  items = [], 
  defaultOpen = [],
  allowMultiple = false,
  className 
}) => {
  const [openItems, setOpenItems] = useState(new Set(defaultOpen));
  const prevItemsValuesRef = useRef(new Set(items.map(item => item.value)));

  // الحفاظ على الحالة المفتوحة عند تغيير items (فقط إذا تغيرت القيم، وليس المحتوى)
  useEffect(() => {
    const prevValues = prevItemsValuesRef.current;
    const currentValues = new Set(items.map(item => item.value));
    
    // إذا تغيرت القيم (تمت إضافة أو حذف items)، نحافظ على الحالة المفتوحة للقيم الموجودة
    const valuesChanged = prevValues.size !== currentValues.size || 
      !Array.from(prevValues).every(value => currentValues.has(value));
    
    if (valuesChanged) {
      // نحافظ على الحالة المفتوحة للقيم الموجودة فقط
      setOpenItems(prev => {
        const newSet = new Set();
        prev.forEach(value => {
          if (currentValues.has(value)) {
            newSet.add(value);
          }
        });
        return newSet;
      });
    }
    
    prevItemsValuesRef.current = currentValues;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map(item => item.value).join(',')]); // فقط القيم، وليس المحتوى

  const toggleItem = (value) => {
    setOpenItems(prev => {
      const newOpenItems = new Set(prev);
      if (newOpenItems.has(value)) {
        newOpenItems.delete(value);
      } else {
        if (!allowMultiple) {
          newOpenItems.clear();
        }
        newOpenItems.add(value);
      }
      return newOpenItems;
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => {
        const isOpen = openItems.has(item.value);
        return (
          <div
            key={item.value}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            <button
              onClick={() => toggleItem(item.value)}
              className={cn(
                "w-full flex items-center justify-between p-4 text-right",
                "hover:bg-gray-50 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              )}
            >
              <div className="flex items-center gap-3 flex-1" dir="rtl">
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
                )}
                {item.icon && <span className="text-gray-600">{item.icon}</span>}
                <span className="font-medium text-gray-900">{item.label}</span>
                {item.badge && (
                  <span className="mr-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              {item.action && (
                <div onClick={(e) => e.stopPropagation()}>
                  {item.action}
                </div>
              )}
            </button>
            {isOpen && (
              <div 
                key={`content-${item.value}`} // key ثابت للحفاظ على التركيز
                className="border-t border-gray-200 p-4 bg-gray-50"
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Accordion Item - عنصر واحد في Accordion
 */
const AccordionItem = ({ 
  value,
  label,
  icon,
  badge,
  action,
  children,
  isOpen,
  onToggle,
  className 
}) => {
  return (
    <div className={cn("border border-gray-200 rounded-lg overflow-hidden bg-white", className)}>
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between p-4 text-right",
          "hover:bg-gray-50 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        )}
      >
        <div className="flex items-center gap-3 flex-1" dir="rtl">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
          )}
          {icon && <span className="text-gray-600">{icon}</span>}
          <span className="font-medium text-gray-900">{label}</span>
          {badge && (
            <span className="mr-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {action && (
          <div onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
      </button>
      {isOpen && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );
};

export { Accordion, AccordionItem };

