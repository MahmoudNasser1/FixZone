// frontend/react-app/src/components/settings/SettingsCategoryTabs.js
import React from 'react';

const CATEGORIES = [
  { key: 'general', label: 'عام', icon: '⚙️' },
  { key: 'currency', label: 'العملة', icon: '💰' },
  { key: 'printing', label: 'الطباعة', icon: '🖨️' },
  { key: 'messaging', label: 'المراسلة', icon: '💬' },
  { key: 'locale', label: 'المحلية', icon: '🌐' },
  { key: 'system', label: 'النظام', icon: '🖥️' },
  { key: 'variables', label: 'المتغيرات', icon: '📋' },
  { key: 'advanced', label: 'متقدم', icon: '🔧' },
];

/**
 * Settings Category Tabs Component
 */
export const SettingsCategoryTabs = ({
  activeCategory,
  onCategoryChange,
  categories = CATEGORIES,
  className = ''
}) => {
  return (
    <div className={`border-b border-border overflow-x-auto ${className}`}>
      <nav className="flex space-x-2 min-w-max p-1" aria-label="Tabs">
        {categories.map((category) => (
          <button
            key={category.key}
            onClick={() => onCategoryChange(category.key)}
            className={`
              flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-all
              ${activeCategory === category.key
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }
            `}
          >
            {category.icon}
            {category.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

