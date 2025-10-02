import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

const MultiSelectTable = ({ 
  data = [], 
  columns = [], 
  selectedItems = [], 
  onSelectionChange,
  onSelectAll,
  selectAll = false,
  loading = false,
  emptyMessage = 'لا توجد بيانات متاحة',
  className = ''
}) => {
  const [localSelectedItems, setLocalSelectedItems] = useState(selectedItems);

  // Update local state when prop changes
  useEffect(() => {
    setLocalSelectedItems(selectedItems);
  }, [selectedItems]);

  // Handle single item selection
  const handleItemSelect = (itemId) => {
    const newSelectedItems = localSelectedItems.includes(itemId)
      ? localSelectedItems.filter(id => id !== itemId)
      : [...localSelectedItems, itemId];
    
    setLocalSelectedItems(newSelectedItems);
    onSelectionChange?.(newSelectedItems);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setLocalSelectedItems([]);
      onSelectionChange?.([]);
      onSelectAll?.(false);
    } else {
      // Select all
      const allIds = data.map(item => item.id);
      setLocalSelectedItems(allIds);
      onSelectionChange?.(allIds);
      onSelectAll?.(true);
    }
  };

  // Check if all items are selected
  const allSelected = data.length > 0 && localSelectedItems.length === data.length;
  const someSelected = localSelectedItems.length > 0 && localSelectedItems.length < data.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Select All Column */}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
              </th>
              
              {/* Data Columns */}
              {columns.map((column, index) => (
                <th
                  key={column.key || index}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr
                key={item.id || rowIndex}
                className={`hover:bg-gray-50 transition-colors ${
                  localSelectedItems.includes(item.id) ? 'bg-blue-50' : ''
                }`}
              >
                {/* Select Column */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={localSelectedItems.includes(item.id)}
                      onChange={() => handleItemSelect(item.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                </td>
                
                {/* Data Columns */}
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key || colIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render ? column.render(item, rowIndex) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MultiSelectTable;

