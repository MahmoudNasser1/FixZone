import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Eye, EyeOff, RotateCcw } from 'lucide-react';

const ColumnVisibilityToggle = ({ 
  columns = [], 
  visibleColumns = [], 
  onVisibilityChange,
  storageKey = 'columnVisibility',
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localVisibleColumns, setLocalVisibleColumns] = useState(visibleColumns);

  // تحميل التفضيلات المحفوظة عند التحميل
  useEffect(() => {
    const savedVisibility = localStorage.getItem(storageKey);
    if (savedVisibility) {
      try {
        const parsed = JSON.parse(savedVisibility);
        setLocalVisibleColumns(parsed);
        onVisibilityChange(parsed);
      } catch (error) {
        console.error('Error parsing saved column visibility:', error);
      }
    }
  }, [storageKey]); // إزالة onVisibilityChange من dependencies

  // حفظ التفضيلات عند التغيير
  const handleVisibilityChange = useCallback((columnKey, isVisible) => {
    let newVisibleColumns;
    
    if (isVisible) {
      newVisibleColumns = [...localVisibleColumns, columnKey];
    } else {
      newVisibleColumns = localVisibleColumns.filter(col => col !== columnKey);
    }
    
    setLocalVisibleColumns(newVisibleColumns);
    onVisibilityChange(newVisibleColumns);
    
    // حفظ في localStorage
    localStorage.setItem(storageKey, JSON.stringify(newVisibleColumns));
  }, [localVisibleColumns, onVisibilityChange, storageKey]);

  // إعادة تعيين إلى الافتراضي
  const resetToDefault = useCallback(() => {
    const defaultColumns = columns
      .filter(col => col.defaultVisible !== false)
      .map(col => col.key);
    
    setLocalVisibleColumns(defaultColumns);
    onVisibilityChange(defaultColumns);
    localStorage.removeItem(storageKey);
  }, [columns, onVisibilityChange, storageKey]);

  // تحديد/إلغاء تحديد الكل
  const toggleAll = useCallback(() => {
    const allColumnKeys = columns.map(col => col.key);
    const newVisibleColumns = localVisibleColumns.length === allColumnKeys.length 
      ? [] 
      : allColumnKeys;
    
    setLocalVisibleColumns(newVisibleColumns);
    onVisibilityChange(newVisibleColumns);
    localStorage.setItem(storageKey, JSON.stringify(newVisibleColumns));
  }, [columns, localVisibleColumns, onVisibilityChange, storageKey]);

  const visibleCount = localVisibleColumns.length;
  const totalCount = columns.length;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="إعدادات الأعمدة"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">الأعمدة</span>
        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          {visibleCount}/{totalCount}
        </span>
      </button>

      {isOpen && (
        <>
          {/* خلفية شفافة للإغلاق */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* القائمة المنسدلة */}
          <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  إعدادات الأعمدة
                </h3>
                <button
                  onClick={resetToDefault}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  title="إعادة تعيين افتراضي"
                >
                  <RotateCcw className="w-3 h-3" />
                  افتراضي
                </button>
              </div>
              
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {visibleCount === totalCount ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    إخفاء الكل
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    إظهار الكل
                  </>
                )}
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {columns.map((column) => {
                const isVisible = localVisibleColumns.includes(column.key);
                
                return (
                  <label
                    key={column.key}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => handleVisibilityChange(column.key, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {column.label}
                      </div>
                      {column.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {column.description}
                        </div>
                      )}
                    </div>
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-green-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ColumnVisibilityToggle;
