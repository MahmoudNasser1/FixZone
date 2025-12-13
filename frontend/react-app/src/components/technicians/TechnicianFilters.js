import React, { useState } from 'react';
import { Filter, X, Search, Save } from 'lucide-react';
import SimpleButton from '../ui/SimpleButton';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';

/**
 * Component للبحث والفلترة المتقدمة للفنيين
 */
const TechnicianFilters = ({ onFilterChange, onSearch }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    skills: [],
    minPerformance: '',
    maxPerformance: '',
    status: 'all',
    minWages: '',
    maxWages: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (onSearch) {
      onSearch(term);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      skills: [],
      minPerformance: '',
      maxPerformance: '',
      status: 'all',
      minWages: '',
      maxWages: ''
    };
    setFilters(clearedFilters);
    setSearchTerm('');
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Basic Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="بحث في الفنيين..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <SimpleButton
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="w-4 h-4 ml-1" />
          فلاتر متقدمة
        </SimpleButton>
        {(filters.status !== 'all' || filters.minPerformance || filters.maxPerformance || searchTerm) && (
          <SimpleButton
            variant="ghost"
            onClick={clearFilters}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 ml-1" />
            مسح
          </SimpleButton>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <SimpleCard>
          <SimpleCardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium mb-1">الحالة</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="active">نشط</option>
                  <option value="inactive">معطل</option>
                </select>
              </div>

              {/* Performance Range */}
              <div>
                <label className="block text-sm font-medium mb-1">معدل الإنجاز (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="من"
                    value={filters.minPerformance}
                    onChange={(e) => handleFilterChange('minPerformance', e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                  />
                  <input
                    type="number"
                    placeholder="إلى"
                    value={filters.maxPerformance}
                    onChange={(e) => handleFilterChange('maxPerformance', e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
              </div>

              {/* Wages Range */}
              <div>
                <label className="block text-sm font-medium mb-1">نطاق الأجور (ج.م)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="من"
                    value={filters.minWages}
                    onChange={(e) => handleFilterChange('minWages', e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                  />
                  <input
                    type="number"
                    placeholder="إلى"
                    value={filters.maxWages}
                    onChange={(e) => handleFilterChange('maxWages', e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
              </div>
            </div>
          </SimpleCardContent>
        </SimpleCard>
      )}

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <SimpleButton
          variant="outline"
          size="sm"
          onClick={() => handleFilterChange('status', 'active')}
          className={filters.status === 'active' ? 'bg-primary text-white' : ''}
        >
          نشط فقط
        </SimpleButton>
        <SimpleButton
          variant="outline"
          size="sm"
          onClick={() => handleFilterChange('status', 'inactive')}
          className={filters.status === 'inactive' ? 'bg-primary text-white' : ''}
        >
          معطل فقط
        </SimpleButton>
      </div>
    </div>
  );
};

export default TechnicianFilters;


