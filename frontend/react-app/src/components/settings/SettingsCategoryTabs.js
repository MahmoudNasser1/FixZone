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
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
        {categories.map((category) => (
          <button
            key={category.key}
            onClick={() => onCategoryChange(category.key)}
            className={`
              whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${
                activeCategory === category.key
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <span className="mr-2">{category.icon}</span>
            {category.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

