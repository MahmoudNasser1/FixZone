import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import './DashboardGrid.css';
import { GripVertical, X } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * Dashboard Grid Component
 * Grid responsive مع Drag & Drop للـ widgets
 */
export default function DashboardGrid({ 
  children, 
  layouts = null, 
  onLayoutChange = null,
  storageKey = 'technician-dashboard-layout',
  cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  rowHeight = 60,
  compactType = 'vertical',
  allowOverlap = false,
  visibleWidgets = null
}) {
  const [currentLayouts, setCurrentLayouts] = useState(layouts || getDefaultLayouts());
  const [isDragging, setIsDragging] = useState(false);
  
  // Filter layouts based on visible widgets
  const filteredLayouts = useMemo(() => {
    if (!visibleWidgets) return currentLayouts;
    
    const filtered = {};
    Object.keys(currentLayouts).forEach(breakpoint => {
      filtered[breakpoint] = currentLayouts[breakpoint].filter(item => 
        visibleWidgets.has(item.i)
      );
    });
    return filtered;
  }, [currentLayouts, visibleWidgets]);

  // Load saved layout from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) {
          // Ensure all breakpoints have layouts
          const defaultLayouts = getDefaultLayouts();
          const merged = {};
          Object.keys(defaultLayouts).forEach(breakpoint => {
            merged[breakpoint] = parsed[breakpoint] && parsed[breakpoint].length > 0 
              ? parsed[breakpoint] 
              : defaultLayouts[breakpoint];
          });
          setCurrentLayouts(merged);
        } else {
          setCurrentLayouts(getDefaultLayouts());
        }
      } else {
        setCurrentLayouts(getDefaultLayouts());
      }
    } catch (error) {
      console.error('Error loading saved layout:', error);
      setCurrentLayouts(getDefaultLayouts());
    }
  }, [storageKey]);

  // Save layout to localStorage
  const saveLayout = useCallback((newLayouts) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newLayouts));
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  }, [storageKey]);

  // Handle layout change
  const handleLayoutChange = useCallback((layout, allLayouts) => {
    setCurrentLayouts(allLayouts);
    saveLayout(allLayouts);
    if (onLayoutChange) {
      onLayoutChange(allLayouts);
    }
  }, [onLayoutChange, saveLayout]);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    const defaultLayouts = getDefaultLayouts();
    setCurrentLayouts(defaultLayouts);
    saveLayout(defaultLayouts);
    if (onLayoutChange) {
      onLayoutChange(defaultLayouts);
    }
  }, [onLayoutChange, saveLayout]);

  // Clone children to ensure data-grid is properly set
  const clonedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.props.id) {
      return React.cloneElement(child, {
        'data-grid': { i: child.props.id }
      });
    }
    return child;
  });

  return (
    <div className="dashboard-grid">
      <ResponsiveGridLayout
        className="layout"
        layouts={filteredLayouts}
        onLayoutChange={handleLayoutChange}
        cols={cols}
        rowHeight={rowHeight}
        compactType={compactType}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".drag-handle"
        onDragStart={() => setIsDragging(true)}
        onDragStop={() => setIsDragging(false)}
        onResizeStart={() => setIsDragging(true)}
        onResizeStop={() => setIsDragging(false)}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        preventCollision={false}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      >
        {clonedChildren}
      </ResponsiveGridLayout>
    </div>
  );
}

// Default layout configuration
function getDefaultLayouts() {
  return {
    lg: [
      { i: 'quick-stats', x: 0, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
      { i: 'upcoming-tasks', x: 3, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
      { i: 'notifications', x: 6, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
      { i: 'performance', x: 9, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
    ],
    md: [
      { i: 'quick-stats', x: 0, y: 0, w: 5, h: 5, minW: 2, minH: 4 },
      { i: 'upcoming-tasks', x: 5, y: 0, w: 5, h: 5, minW: 2, minH: 4 },
      { i: 'notifications', x: 0, y: 5, w: 5, h: 5, minW: 2, minH: 4 },
      { i: 'performance', x: 5, y: 5, w: 5, h: 5, minW: 2, minH: 4 },
    ],
    sm: [
      { i: 'quick-stats', x: 0, y: 0, w: 6, h: 5, minW: 2, minH: 4 },
      { i: 'upcoming-tasks', x: 0, y: 5, w: 6, h: 5, minW: 2, minH: 4 },
      { i: 'notifications', x: 0, y: 10, w: 6, h: 5, minW: 2, minH: 4 },
      { i: 'performance', x: 0, y: 15, w: 6, h: 5, minW: 2, minH: 4 },
    ],
    xs: [
      { i: 'quick-stats', x: 0, y: 0, w: 4, h: 5, minW: 2, minH: 4 },
      { i: 'upcoming-tasks', x: 0, y: 5, w: 4, h: 5, minW: 2, minH: 4 },
      { i: 'notifications', x: 0, y: 10, w: 4, h: 5, minW: 2, minH: 4 },
      { i: 'performance', x: 0, y: 15, w: 4, h: 5, minW: 2, minH: 4 },
    ],
    xxs: [
      { i: 'quick-stats', x: 0, y: 0, w: 2, h: 5, minW: 2, minH: 4 },
      { i: 'upcoming-tasks', x: 0, y: 5, w: 2, h: 5, minW: 2, minH: 4 },
      { i: 'notifications', x: 0, y: 10, w: 2, h: 5, minW: 2, minH: 4 },
      { i: 'performance', x: 0, y: 15, w: 2, h: 5, minW: 2, minH: 4 },
    ],
  };
}

/**
 * Dashboard Widget Wrapper
 * Wrapper component للـ widgets مع drag handle
 */
export function DashboardWidget({ id, title, children, onRemove, showRemove = false }) {
  return (
    <div
      key={id}
      data-grid={{ i: id }}
      className="dashboard-widget bg-transparent"
    >
      <div className="relative h-full w-full">
        {/* Drag Handle */}
        <div className="absolute top-2 left-2 z-10 drag-handle cursor-move p-1 rounded hover:bg-background/50 transition-colors">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Remove Button */}
        {showRemove && onRemove && (
          <button
            onClick={() => onRemove(id)}
            className="absolute top-2 right-2 z-10 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title="إزالة الـ widget"
          >
            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        )}

        {/* Widget Content */}
        <div className="h-full w-full">
          {children}
        </div>
      </div>
    </div>
  );
}

