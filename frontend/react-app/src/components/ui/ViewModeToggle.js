import React from 'react';
import { Grid, List, Table, LayoutGrid } from 'lucide-react';

const ViewModeToggle = ({ 
  currentMode = 'cards', 
  onModeChange, 
  availableModes = ['cards', 'table', 'list', 'grid'],
  className = '' 
}) => {
  const modes = {
    cards: {
      icon: LayoutGrid,
      label: 'بطاقات',
      description: 'عرض البيانات في بطاقات تفصيلية'
    },
    table: {
      icon: Table,
      label: 'جدول',
      description: 'عرض البيانات في جدول مضغوط'
    },
    list: {
      icon: List,
      label: 'قائمة',
      description: 'عرض البيانات في قائمة بسيطة'
    },
    grid: {
      icon: Grid,
      label: 'شبكة',
      description: 'عرض البيانات في شبكة مرنة'
    }
  };

  return (
    <div className={`flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ${className}`}>
      {availableModes.map((mode) => {
        const ModeIcon = modes[mode].icon;
        const isActive = currentMode === mode;
        
        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
            title={modes[mode].description}
          >
            <ModeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{modes[mode].label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewModeToggle;
