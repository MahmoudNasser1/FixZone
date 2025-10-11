import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  SortAsc, 
  SortDesc,
  Grid,
  List,
  Download,
  Upload
} from 'lucide-react';

/**
 * SearchAndFilter Component
 * Advanced search and filtering for inventory items
 */
const SearchAndFilter = ({ 
  onSearch, 
  onFilter, 
  onSort,
  onViewChange,
  categories = [],
  warehouses = [],
  vendors = [],
  loading = false,
  viewMode = 'grid',
  sortBy = 'name',
  sortOrder = 'asc'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    warehouse: '',
    vendor: '',
    status: '',
    priceRange: ''
  });

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      warehouse: '',
      vendor: '',
      status: '',
      priceRange: ''
    });
    setSearchTerm('');
    onFilter({});
    onSearch('');
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '') || searchTerm !== '';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="البحث في الأصناف..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => onViewChange('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewChange('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => onSort(e.target.value, sortOrder)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="name">الاسم</option>
            <option value="sku">الرمز</option>
            <option value="purchasePrice">سعر الشراء</option>
            <option value="sellingPrice">سعر البيع</option>
            <option value="quantity">الكمية</option>
            <option value="category">الفئة</option>
          </select>
          
          <button
            onClick={() => onSort(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4 text-gray-600" />
            ) : (
              <SortDesc className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الفئة
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilter('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">جميع الفئات</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Warehouse Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            المخزن
          </label>
          <select
            value={filters.warehouse}
            onChange={(e) => handleFilter('warehouse', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">جميع المخازن</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        {/* Vendor Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            المورد
          </label>
          <select
            value={filters.vendor}
            onChange={(e) => handleFilter('vendor', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">جميع الموردين</option>
            {vendors.map(vendor => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الحالة
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilter('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="low_stock">مخزون منخفض</option>
            <option value="out_of_stock">نفد المخزون</option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            نطاق السعر
          </label>
          <select
            value={filters.priceRange}
            onChange={(e) => handleFilter('priceRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">جميع الأسعار</option>
            <option value="0-100">0 - 100 ج.م</option>
            <option value="100-500">100 - 500 ج.م</option>
            <option value="500-1000">500 - 1,000 ج.م</option>
            <option value="1000+">أكثر من 1,000 ج.م</option>
          </select>
        </div>
      </div>

      {/* Active Filters & Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <>
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">فلاتر نشطة</span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
              >
                <X className="h-3 w-3" />
                مسح الكل
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            disabled={loading}
          >
            <Download className="h-4 w-4" />
            تصدير
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={loading}
          >
            <Upload className="h-4 w-4" />
            استيراد
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilter;

