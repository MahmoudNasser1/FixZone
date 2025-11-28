// frontend/react-app/src/components/settings/SettingsSearch.js
import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Search, X } from 'lucide-react';
import SimpleButton from '../ui/SimpleButton';

/**
 * Settings Search Component
 */
export const SettingsSearch = ({
  onSearch,
  placeholder = 'ابحث في الإعدادات...',
  className = ''
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pr-10 pl-4"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
};

