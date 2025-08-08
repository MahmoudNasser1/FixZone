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
  className = '',
  emptyState,
  loading = false
}) => {
  const [viewMode, setViewMode] = useState(defaultViewMode);
  const [visibleColumns, setVisibleColumns] = useState(
    columns.filter(col => col.defaultVisible !== false).map(col => col.key)
  );
  const [selectedItems, setSelectedItems] = useState([]);

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

  // الأعمدة المرئية للجدول
  const visibleTableColumns = useMemo(() => {
    return columns.filter(col => visibleColumns.includes(col.key));
  }, [columns, visibleColumns]);

  // عرض البطاقات
  const renderCardsView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((item, index) => (
          <div
            key={item.id || index}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onItemClick?.(item)}
          >
            {enableBulkActions && (
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            )}
            {renderCard ? renderCard(item) : (
              <div className="space-y-2">
                {visibleTableColumns.slice(0, 3).map(col => {
                  const cellContent = col.cell ? 
                    col.cell({ row: { original: item }, getValue: (key) => item[key] }) : 
                    item[col.accessorKey || col.key];
                  
                  return (
                    <div key={col.key} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {col.label || col.header}
                      </span>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {cellContent}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // عرض القائمة
  const renderListView = () => {
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div
            key={item.id || index}
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            {enableBulkActions && (
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            )}
            <div className="flex-1" onClick={() => onItemClick?.(item)}>
              {visibleTableColumns.map(col => {
                const cellContent = col.cell ? 
                  col.cell({ row: { original: item }, getValue: (key) => item[key] }) : 
                  item[col.accessorKey || col.key];
                
                return (
                  <div key={col.key} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {col.label || col.header}
                    </span>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {cellContent}
                    </div>
                  </div>
                );
              })}
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
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onItemClick?.(item)}
          >
            {visibleTableColumns.map(col => {
              const cellContent = col.cell ? 
                col.cell({ row: { original: item }, getValue: (key) => item[key] }) : 
                item[col.accessorKey || col.key];
              
              return (
                <div key={col.key} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {col.label || col.header}
                  </span>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {cellContent}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // عرض الجدول
  const renderTableView = () => {
    return (
      <DataTable
        columns={visibleTableColumns.map(col => ({
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
          
          {enableColumnToggle && viewMode === 'table' && (
            <ColumnVisibilityToggle
              columns={columns}
              visibleColumns={visibleColumns}
              onVisibilityChange={setVisibleColumns}
              storageKey={`${storageKey}_columns`}
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
