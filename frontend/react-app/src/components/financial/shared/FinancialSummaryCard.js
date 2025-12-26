// Financial Summary Card Component
// Displays financial summary statistics

import React from 'react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader } from '../../ui/SimpleCard';
import LoadingSpinner from '../../ui/LoadingSpinner';

const FinancialSummaryCard = ({ title, data, loading, icon: Icon }) => {
  if (loading) {
    return (
      <SimpleCard>
        <SimpleCardContent className="p-6">
          <div className="flex justify-center items-center min-h-[200px]">
            <LoadingSpinner size="md" />
          </div>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return (
      <SimpleCard>
        <SimpleCardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ar-EG').format(num || 0);
  };

  return (
    <SimpleCard>
      <SimpleCardHeader>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-primary" />}
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
      </SimpleCardHeader>
      <SimpleCardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.totalAmount !== undefined && typeof data.totalAmount === 'number' && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">الإجمالي</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(data.totalAmount)}
              </p>
            </div>
          )}

          {data.totalCount !== undefined && typeof data.totalCount === 'number' && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">العدد</p>
              <p className="text-xl font-bold text-foreground">
                {formatNumber(data.totalCount)}
              </p>
            </div>
          )}

          {data.averageAmount !== undefined && typeof data.averageAmount === 'number' && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">المتوسط</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(data.averageAmount)}
              </p>
            </div>
          )}

          {data.paidAmount !== undefined && typeof data.paidAmount === 'number' && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">المدفوع</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(data.paidAmount)}
              </p>
            </div>
          )}

          {data.unpaidAmount !== undefined && typeof data.unpaidAmount === 'number' && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">غير المدفوع</p>
              <p className="text-xl font-bold text-destructive">
                {formatCurrency(data.unpaidAmount)}
              </p>
            </div>
          )}

          {data.overdueAmount !== undefined && typeof data.overdueAmount === 'number' && data.overdueAmount > 0 && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">المتأخر</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(data.overdueAmount)}
              </p>
            </div>
          )}
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );
};

export default FinancialSummaryCard;
