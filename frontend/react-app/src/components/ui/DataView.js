import React, { useState, useEffect, useMemo } from 'react';
import ViewModeToggle from './ViewModeToggle';
import ColumnVisibilityToggle from './ColumnVisibilityToggle';
import BulkActions from './BulkActions';
import { DataTable } from './DataTable';

const DataView = ({
  data = [],
  columns = [],
  viewModes = ['cards', 'table', 'list', 'grid'],
  defaultViewMode = 'cards',
  enableBulkActions = true,
  enableColumnToggle = true,
  bulkActions = [],
  storageKey = 'dataView',
  renderCard,
  renderListItem,
  renderGridItem,
  onItemClick,
  onEdit,
  onView,
  className = '',
  emptyState,
  loading = false
}) => {

  const [viewMode, setViewMode] = useState(defaultViewMode);

  // الأعمدة المرئية لكل وضع عرض على حدة (cards, table, list, grid)
  const [visibleColumnsByMode, setVisibleColumnsByMode] = useState(() => {
    const init = {};
    (viewModes || []).forEach((m) => {
      const saved = localStorage.getItem(`${storageKey}_columns_${m}`);
      if (saved) {
        try {
          init[m] = JSON.parse(saved);
          return;
        } catch {}
      }
      init[m] = columns.filter(col => col.defaultVisible !== false).map(col => col.key);
    });
    return init;
  });
  const [selectedItems, setSelectedItems] = useState([]);

  // تحديث الأعمدة المرئية عند تغيير الأعمدة: نُبقي فقط المفاتيح الموجودة حالياً
  useEffect(() => {
    if (columns.length > 0) {
      setVisibleColumnsByMode((prev) => {
        const next = { ...prev };
        (viewModes || []).forEach((m) => {
          const currentKeys = prev[m] || [];
          const filteredKeys = currentKeys.filter(k => columns.some(c => c.key === k));
          // إذا كانت النتيجة فارغة، ارجع للإفتراضي
          next[m] = filteredKeys.length > 0
            ? filteredKeys
            : columns.filter(col => col.defaultVisible !== false).map(col => col.key);
        });
        return next;
      });
    }
  }, [columns, viewModes]);

  // تحميل التفضيلات المحفوظة
  useEffect(() => {
    const savedViewMode = localStorage.getItem(`${storageKey}_viewMode`);
    if (savedViewMode && viewModes.includes(savedViewMode)) {
      setViewMode(savedViewMode);
    }
  }, [storageKey, viewModes]);

  // حفظ وضع العرض
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem(`${storageKey}_viewMode`, mode);
    // إلغاء التحديد عند تغيير الوضع
    setSelectedItems([]);
  };

  // إدارة التحديد المجمع
  const handleSelectAll = () => {
    setSelectedItems(data.map(item => item.id));
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  const handleItemSelect = (itemId, isSelected) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  // الأعمدة المرئية للوضع الحالي
  const currentVisibleColumns = useMemo(() => {
    const keys = (visibleColumnsByMode[viewMode] || []);
    return columns.filter(col => keys.includes(col.key));
  }, [columns, visibleColumnsByMode, viewMode]);

  // تغيير رؤية الأعمدة للوضع الحالي مع الحفظ
  const handleVisibilityChange = (newKeys) => {
    setVisibleColumnsByMode((prev) => ({
      ...prev,
      [viewMode]: newKeys,
    }));
    localStorage.setItem(`${storageKey}_columns_${viewMode}`, JSON.stringify(newKeys));
  };

  // عرض البطاقات
  const renderCardsView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.map((item, index) => (
          <div
            key={item.id || index}
            className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group cursor-pointer"
            onClick={() => onItemClick?.(item)}
          >
            {/* Checkbox للتحديد المتعدد */}
            {enableBulkActions && (
              <div className="absolute top-3 left-3 z-20">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleItemSelect(item.id, e.target.checked);
                  }}
                  className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                />
              </div>
            )}
            
            {/* أزرار التعديل المحسنة */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-2 z-20">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="flex items-center justify-center w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
                  title="تعديل"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(item);
                  }}
                  className="flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
                  title="عرض التفاصيل"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* محتوى البطاقة */}
            <div className="space-y-4 mt-2">
              {renderCard ? renderCard(item, { columns: currentVisibleColumns }) : (
                <>
                  {/* العنوان الرئيسي */}
                  {(currentVisibleColumns.length > 0 || Object.keys(item).length > 0) && (
                    <div className="border-b border-gray-100 dark:border-gray-700 pb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {(() => {
                          if (currentVisibleColumns.length > 0) {
                            const firstCol = currentVisibleColumns[0];
                            return firstCol?.cell ? 
                              firstCol.cell({ row: { original: item }, getValue: (key) => item[key] }) : 
                              item[firstCol?.accessorKey || firstCol?.key] || 'غير محدد';
                          } else {
                            // fallback: عرض أول خاصية في العنصر
                            const firstKey = Object.keys(item).find(key => key !== 'id' && item[key]);
                            return item[firstKey] || item.id || 'عنصر غير محدد';
                          }
                        })()}
                      </h3>
                    </div>
                  )}
                  
                  {/* باقي المعلومات */}
                  <div className="space-y-3">
                    {currentVisibleColumns.length > 0 ? (
                      currentVisibleColumns.slice(1, 4).map(col => {
                        const cellContent = col.cell ? 
                          col.cell({ row: { original: item }, getValue: (key) => item[key] }) : 
                          item[col.accessorKey || col.key];
                        
                        if (!cellContent) return null;
                        
                        return (
                          <div key={col.key} className="flex justify-between items-start">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {col.label || col.header}
                            </span>
                            <div className="text-sm text-gray-900 dark:text-gray-100 text-right max-w-[65%] font-medium">
                              {cellContent}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // fallback: عرض جميع الخصائص المتاحة
                      Object.entries(item)
                        .filter(([key, value]) => key !== 'id' && value !== null && value !== undefined && value !== '')
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between items-start">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                            <div className="text-sm text-gray-900 dark:text-gray-100 text-right max-w-[65%] font-medium">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                  
                  {/* مؤشر للمزيد من التفاصيل */}
                  <div className="flex items-center justify-center pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                      انقر للمزيد من التفاصيل
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // عرض القائمة
  const renderListView = () => {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={item.id || index}
            className="relative flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group cursor-pointer"
            onClick={() => onItemClick?.(item)}
          >
            {/* Checkbox للتحديد المتعدد */}
            {enableBulkActions && (
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleItemSelect(item.id, e.target.checked);
                }}
                className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              />
            )}
            
            {/* أزرار التعديل المحسنة */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-2 z-20">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="flex items-center justify-center w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200"
                  title="تعديل"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(item);
                  }}
                  className="flex items-center justify-center w-7 h-7 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200"
                  title="عرض التفاصيل"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* محتوى القائمة */}
            <div className="flex-1 pr-16">
              <div className="grid grid-cols-2 gap-3">
                {currentVisibleColumns.length > 0 ? (
                  currentVisibleColumns.slice(0, 4).map(col => {
                    const cellContent = col.cell ? 
                      col.cell({ row: { original: item }, getValue: (key) => item[key] }) : 
                      item[col.accessorKey || col.key];
                    
                    if (!cellContent) return null;
                    
                    return (
                      <div key={col.key} className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {col.label || col.header}
                        </span>
                        <div className="text-sm text-gray-900 dark:text-gray-100 mt-1 font-medium">
                          {cellContent}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // fallback: عرض جميع الخصائص المتاحة
                  Object.entries(item)
                    .filter(([key, value]) => key !== 'id' && value !== null && value !== undefined && value !== '')
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <div className="text-sm text-gray-900 dark:text-gray-100 mt-1 font-medium">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // عرض الشبكة
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {data.map((item, index) => (
          <div
            key={item.id || index}
            className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group cursor-pointer"
            onClick={() => onItemClick?.(item)}
          >
            {/* Checkbox للتحديد المتعدد */}
            {enableBulkActions && (
              <div className="absolute top-2 left-2 z-20">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleItemSelect(item.id, e.target.checked);
                  }}
                  className="w-3.5 h-3.5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            )}
            
            {/* أزرار التعديل المحسنة */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1 z-20">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="flex items-center justify-center w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200"
                  title="تعديل"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(item);
                  }}
                  className="flex items-center justify-center w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200"
                  title="عرض التفاصيل"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* محتوى الشبكة */}
            <div className="text-center mt-2">
              <div className="space-y-3">
                {/* العنوان الرئيسي */}
                {(currentVisibleColumns.length > 0 || Object.keys(item).length > 0) && (
                  <div className="border-b border-gray-100 dark:border-gray-700 pb-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {(() => {
                        if (currentVisibleColumns.length > 0) {
                          const firstCol = currentVisibleColumns[0];
                          return firstCol?.cell ? 
                            firstCol.cell({ row: { original: item }, getValue: (key) => item[key] }) : 
                            item[firstCol?.accessorKey || firstCol?.key] || 'غير محدد';
                        } else {
                          // fallback: عرض أول خاصية في العنصر
                          const firstKey = Object.keys(item).find(key => key !== 'id' && item[key]);
                          return item[firstKey] || item.id || 'عنصر غير محدد';
                        }
                      })()}
                    </h4>
                  </div>
                )}
                
                {/* معلومة إضافية */}
                {(currentVisibleColumns.length > 1 || Object.keys(item).length > 1) && (
                  <div className="space-y-2">
                    {currentVisibleColumns.length > 0 ? (
                      currentVisibleColumns.slice(1, 2).map(col => {
                        const cellContent = col.cell ? 
                          col.cell({ row: { original: item }, getValue: (key) => item[key] }) : 
                          item[col.accessorKey || col.key];
                        
                        if (!cellContent) return null;
                        
                        return (
                          <div key={col.key}>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                              {col.label || col.header}
                            </div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 truncate font-medium">
                              {cellContent}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // fallback: عرض معلومة إضافية واحدة
                      Object.entries(item)
                        .filter(([key, value]) => key !== 'id' && value !== null && value !== undefined && value !== '')
                        .slice(1, 2)
                        .map(([key, value]) => (
                          <div key={key}>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 truncate font-medium">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}
                
                {/* مؤشر للنقر */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-1">
                  <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                    انقر للتفاصيل
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // عرض الجدول
  const renderTableView = () => {
    return (
      <DataTable
        columns={currentVisibleColumns.map(col => ({
          id: col.id,
          header: col.header || col.label,
          accessorKey: col.accessorKey || col.key,
          cell: col.cell || (({ row }) => row.getValue(col.accessorKey || col.key)),
          enableSorting: col.enableSorting !== false
        }))}
        data={data}
        onRowClick={onItemClick}
        loading={loading}
      />
    );
  };

  // عرض المحتوى حسب الوضع
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (data.length === 0) {
      return emptyState || (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">لا توجد بيانات للعرض</div>
        </div>
      );
    }

    switch (viewMode) {
      case 'table':
        return renderTableView();
      case 'list':
        return renderListView();
      case 'grid':
        return renderGridView();
      case 'cards':
      default:
        return renderCardsView();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* شريط التحكم */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ViewModeToggle
            currentMode={viewMode}
            onModeChange={handleViewModeChange}
            availableModes={viewModes}
          />
          
          {enableColumnToggle && (
            <ColumnVisibilityToggle
              columns={columns}
              visibleColumns={visibleColumnsByMode[viewMode] || []}
              onVisibilityChange={handleVisibilityChange}
              storageKey={`${storageKey}_columns_${viewMode}`}
            />
          )}
        </div>

        {/* معلومات البيانات */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {data.length} عنصر
          {selectedItems.length > 0 && (
            <span className="mr-2 text-blue-600 dark:text-blue-400">
              ({selectedItems.length} محدد)
            </span>
          )}
        </div>
      </div>

      {/* المحتوى */}
      <div className="relative">
        {renderContent()}
      </div>

      {/* الإجراءات المجمعة */}
      {enableBulkActions && selectedItems.length > 0 && (
        <BulkActions
          selectedItems={selectedItems}
          totalItems={data.length}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          actions={bulkActions}
        />
      )}
    </div>
  );
};

export default DataView;
