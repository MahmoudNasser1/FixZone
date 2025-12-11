import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ViewModeToggle from './ViewModeToggle';
import ColumnVisibilityToggle from './ColumnVisibilityToggle';
import BulkActions from './BulkActions';
import { DataTable } from './DataTable';
import { SlidersHorizontal } from 'lucide-react';

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
  renderClassicItem,
  onItemClick,
  onEdit,
  onView,
  className = '',
  emptyState,
  loading = false,
  controlsInDropdown = false,
}) => {

  const [viewMode, setViewMode] = useState(defaultViewMode);
  const [showControls, setShowControls] = useState(false);
  const controlsRef = useRef(null);
  const controlsMenuRef = useRef(null);
  const [showColumns, setShowColumns] = useState(true);
  const location = useLocation();

  // ترتيب أنماط العرض ليكون ثابتًا وسهل الاستخدام
  const orderedViewModes = useMemo(() => {
    const preferred = ['classic', 'table', 'cards', 'list', 'grid'];
    const present = new Set(viewModes);
    return preferred.filter(m => present.has(m));
  }, [viewModes]);

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

  // إغلاق القائمة عند النقر خارجها أو الضغط على Escape
  useEffect(() => {
    if (!controlsInDropdown) return;
    const onDocClick = (e) => {
      if (controlsRef.current && !controlsRef.current.contains(e.target)) {
        setShowControls(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setShowControls(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [controlsInDropdown]);

  // إغلاق القائمة عند تغيير الروت
  useEffect(() => {
    setShowControls(false);
  }, [location.pathname, location.search]);

  // التركيز على القائمة عند الفتح لدعم لوحة المفاتيح
  useEffect(() => {
    if (showControls) {
      const id = requestAnimationFrame(() => controlsMenuRef.current?.focus?.());
      return () => cancelAnimationFrame(id);
    }
  }, [showControls]);

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
            className="relative bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary transition-all duration-200 group cursor-pointer"
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
                  className="w-4 h-4 text-primary bg-background border-2 border-input rounded focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
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
                    <div className="border-b border-border pb-3">
                      <h3 className="text-lg font-semibold text-foreground truncate">
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
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {col.label || col.header}
                            </span>
                            <div className="text-sm text-foreground text-right max-w-[65%] font-medium">
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
            className="relative flex items-center gap-4 p-4 bg-card rounded-lg border border-border hover:shadow-md hover:border-primary transition-all duration-200 group cursor-pointer"
            onClick={() => onItemClick?.(item)}
          >
            {/* Checkbox للتحديد المتعدد */}
            {enableBulkActions && item?.id && (
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleItemSelect(item.id, e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-primary bg-background border-2 border-input rounded focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all cursor-pointer hover:border-primary/80"
                title={selectedItems.includes(item.id) ? 'إلغاء التحديد' : 'تحديد'}
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
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {col.label || col.header}
                        </span>
                        <div className="text-sm text-foreground mt-1 font-medium">
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
            {enableBulkActions && item?.id && (
              <div className="absolute top-2 left-2 z-20" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleItemSelect(item.id, e.target.checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-3.5 h-3.5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer hover:border-blue-400"
                  title={selectedItems.includes(item.id) ? 'إلغاء التحديد' : 'تحديد'}
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
    // إضافة عمود checkbox إذا كانت Bulk Actions مفعلة
    const tableColumns = enableBulkActions ? [
      {
        id: 'select',
        header: () => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={selectedItems.length > 0 && selectedItems.length === data.length}
              ref={(input) => {
                if (input) {
                  input.indeterminate = selectedItems.length > 0 && selectedItems.length < data.length;
                }
              }}
              onChange={(e) => {
                if (e.target.checked) {
                  handleSelectAll();
                } else {
                  handleClearSelection();
                }
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={selectedItems.includes(row.original.id)}
              onChange={(e) => {
                e.stopPropagation();
                handleItemSelect(row.original.id, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
            />
          </div>
        ),
        enableSorting: false,
        size: 50
      },
      ...currentVisibleColumns.map(col => ({
        id: col.id,
        header: col.header || col.label,
        accessorKey: col.accessorKey || col.key,
        cell: col.cell || (({ row }) => row.getValue(col.accessorKey || col.key)),
        enableSorting: col.enableSorting !== false
      }))
    ] : currentVisibleColumns.map(col => ({
      id: col.id,
      header: col.header || col.label,
      accessorKey: col.accessorKey || col.key,
      cell: col.cell || (({ row }) => row.getValue(col.accessorKey || col.key)),
      enableSorting: col.enableSorting !== false
    }));

    return (
      <div className="relative">
        <div className={`overflow-x-auto ${enableBulkActions && selectedItems.length > 0 ? 'ring-2 ring-blue-500 rounded-md' : ''}`}>
          <DataTable
            columns={tableColumns}
            data={data}
            onRowClick={onItemClick}
            loading={loading}
          />
        </div>
      </div>
    );
  };

  // عرض كلاسيكي مخصص إن توفّر
  const renderClassicView = () => {
    if (typeof renderClassicItem === 'function') {
      const visibleKeys = (visibleColumnsByMode[viewMode] || []);
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {data.map((item, index) => (
            <div 
              key={item.id || index} 
              onClick={() => onItemClick && onItemClick(item)}
              className="cursor-pointer"
            >
              {renderClassicItem(item, visibleKeys, selectedItems, handleItemSelect)}
            </div>
          ))}
        </div>
      );
    }
    // إن لم يوجد رندر مخصص، نعود للبطاقات الافتراضية
    return renderCardsView();
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
      // Handle emptyState as object with title, description, action
      if (emptyState && typeof emptyState === 'object' && !React.isValidElement(emptyState)) {
        return (
          <div className="text-center py-12">
            {emptyState.title && (
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {emptyState.title}
              </div>
            )}
            {emptyState.description && (
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                {emptyState.description}
              </div>
            )}
            {emptyState.action && (
              <div className="mt-4">
                {emptyState.action}
              </div>
            )}
          </div>
        );
      }
      // Handle emptyState as React element
      if (emptyState && React.isValidElement(emptyState)) {
        return emptyState;
      }
      // Default empty state
      return (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">لا توجد بيانات للعرض</div>
        </div>
      );
    }

    switch (viewMode) {
      case 'classic':
        return renderClassicView();
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
    <div className={`space-y-2 ${className}`}>
      {/* شريط التحكم */}
      <div className="flex items-center justify-between gap-3 flex-wrap relative">
        {/* معلومات البيانات */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {data.length} عنصر
          {selectedItems.length > 0 && (
            <span className="mr-2 text-blue-600 dark:text-blue-400">
              ({selectedItems.length} محدد)
            </span>
          )}
        </div>

        {/* عناصر التحكم */}
        {!controlsInDropdown ? (
          <div className="flex items-center gap-2">
            <ViewModeToggle
              currentMode={viewMode}
              onModeChange={handleViewModeChange}
              availableModes={orderedViewModes}
              dense
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
        ) : (
          <div className="relative" ref={controlsRef}>
            <button
              type="button"
              onClick={() => setShowControls((v) => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-haspopup="menu"
              aria-expanded={showControls}
              aria-controls="dataview-controls-menu"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>خيارات العرض</span>
              {selectedItems.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-blue-600 text-white text-xs">
                  {selectedItems.length}
                </span>
              )}
            </button>
            {showControls && (
              <div
                id="dataview-controls-menu"
                role="menu"
                className="absolute left-0 mt-2 w-72 z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3 origin-top-left animate-in fade-in zoom-in-95 focus:outline-none"
                ref={controlsMenuRef}
                tabIndex={-1}
              >
                {/* أوضاع العرض */}
                <div className="mb-2 text-xs text-gray-500">وضع العرض</div>
                <ViewModeToggle
                  currentMode={viewMode}
                  onModeChange={(m) => { setShowControls(false); handleViewModeChange(m); }}
                  availableModes={orderedViewModes}
                  dense
                  segmented
                  columns={0}
                  className="grid grid-cols-2 sm:grid-cols-3"
                />

                {/* الأعمدة المرئية */}
                {enableColumnToggle && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-500">الأعمدة المرئية</div>
                      <button
                        type="button"
                        className="text-xs px-2 py-0.5 rounded-md border bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                        onClick={() => setShowColumns(v => !v)}
                        aria-expanded={showColumns}
                        aria-controls="dataview-columns-section"
                        title="إظهار/إخفاء الأعمدة"
                      >
                        {(visibleColumnsByMode[viewMode]?.length || 0)}/{columns.length} الأعمدة
                      </button>
                    </div>
                    <div id="dataview-columns-section" className={`${showColumns ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} transition-all duration-200 overflow-visible relative z-50`}>
                      {showColumns && (
                        <div className="relative z-50">
                          <ColumnVisibilityToggle
                            columns={columns}
                            visibleColumns={visibleColumnsByMode[viewMode] || []}
                            onVisibilityChange={handleVisibilityChange}
                            storageKey={`${storageKey}_columns_${viewMode}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* المحتوى */}
      <div className="relative">
        {renderContent()}
      </div>

      {/* الإجراءات المجمعة */}
      {enableBulkActions && selectedItems.length > 0 && bulkActions && bulkActions.length > 0 && (
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
