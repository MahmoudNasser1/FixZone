// Financial Filters Component
// Reusable filters component for financial pages

import React from 'react';
import { SimpleCard, SimpleCardContent } from '../../ui/SimpleCard';
import SimpleButton from '../../ui/SimpleButton';
import { Filter, X } from 'lucide-react';

const FinancialFilters = ({
  filters,
  onFilterChange,
  onReset,
  showDateRange = true,
  showCategory = false,
  showBranch = false,
  showCustomer = false,
  showStatus = false,
  categories = [],
  branches = [],
  customers = [],
  statuses = []
}) => {
  const handleChange = (name, value) => {
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <SimpleCard className="mb-6">
      <SimpleCardContent className="p-4">
        <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
          <Filter className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">الفلاتر</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {showDateRange && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground mr-1">من تاريخ</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-background text-foreground text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground mr-1">إلى تاريخ</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-background text-foreground text-sm"
                />
              </div>
            </>
          )}

          {showCategory && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground mr-1">التصنيف</label>
              <select
                name="categoryId"
                value={filters.categoryId || ''}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-background text-foreground text-sm"
              >
                <option value="">الكل</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showBranch && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground mr-1">الفرع</label>
              <select
                name="branchId"
                value={filters.branchId || ''}
                onChange={(e) => handleChange('branchId', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-background text-foreground text-sm"
              >
                <option value="">الكل</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showCustomer && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground mr-1">العميل</label>
              <select
                name="customerId"
                value={filters.customerId || ''}
                onChange={(e) => handleChange('customerId', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-background text-foreground text-sm"
              >
                <option value="">الكل</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showStatus && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground mr-1">الحالة</label>
              <select
                name="status"
                value={filters.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-background text-foreground text-sm"
              >
                <option value="">الكل</option>
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground mr-1">بحث</label>
            <input
              type="text"
              name="search"
              value={filters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              placeholder="ابحث..."
              className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:outline-none bg-background text-foreground text-sm"
            />
          </div>

          <div className="flex items-end">
            <SimpleButton
              variant="outline"
              onClick={onReset}
              className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/5"
            >
              <X className="w-4 h-4" />
              <span>مسح الفلاتر</span>
            </SimpleButton>
          </div>
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );
};

export default FinancialFilters;
