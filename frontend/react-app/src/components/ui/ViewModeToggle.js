import React from 'react';
import { LayoutGrid, Rows, Table, List, Grid, PanelsTopLeft } from 'lucide-react';

const ViewModeToggle = ({ 
  currentMode = 'cards', 
  onModeChange, 
  availableModes = ['cards', 'table', 'list', 'grid'],
  className = '',
  dense = false,
  segmented = false,
  wrap = false,
  columns = 0
}) => {
  const modes = {
    classic: {
      icon: LayoutGrid,
      label: 'كلاسيكي',
      description: 'عرض تفصيلي كلاسيكي'
    },
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

  let containerClasses;
  if (segmented) {
    let colsClass = '';
    if (columns && columns > 0) {
      if (columns === 2) colsClass = 'grid-cols-2';
      else if (columns === 3) colsClass = 'grid-cols-3';
      else if (columns >= 4) colsClass = 'grid-cols-4';
    }
    containerClasses = `grid ${colsClass} gap-2`;
  } else {
    containerClasses = `flex ${dense ? 'gap-1' : 'gap-2'} items-center ${wrap ? 'flex-wrap' : ''}`;
  }

  return (
    <div className={`${containerClasses} bg-gray-100 dark:bg-gray-800 rounded-lg ${dense ? 'p-0.5' : 'p-1'} ${className}`}>
      {availableModes.map((mode) => {
        const active = currentMode === mode;
        const Icon = modes[mode].icon || PanelsTopLeft;
        const baseBtn = segmented
          ? 'flex flex-col items-center justify-center px-2.5 py-2 text-xs rounded-md border text-center'
          : `flex items-center ${dense ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} rounded-md border`;
        const state = active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50';
        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`${baseBtn} transition ${state}`}
            title={modes[mode].description}
          >
            <Icon className={`${segmented ? 'w-5 h-5 mb-1' : dense ? 'w-3.5 h-3.5 ml-2' : 'w-4 h-4 ml-2'}`} />
            <span className={`${segmented ? 'leading-4' : ''}`}>{modes[mode].label}</span>
          </button>
        );
      })}
    </div>
  );
}
;

export default ViewModeToggle;
