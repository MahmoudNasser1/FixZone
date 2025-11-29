// Financial Summary Card Component
// Displays financial summary statistics

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Box
} from '@mui/material';
// Icons are passed as props, no need to import here

const FinancialSummaryCard = ({ title, data, loading, icon: Icon }) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="textSecondary">
            {title}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            لا توجد بيانات
          </Typography>
        </CardContent>
      </Card>
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
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {Icon && <Icon sx={{ mr: 1, color: 'primary.main' }} />}
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {data.totalAmount !== undefined && typeof data.totalAmount === 'number' && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                الإجمالي
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(data.totalAmount)}
              </Typography>
            </Grid>
          )}

          {data.totalCount !== undefined && typeof data.totalCount === 'number' && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                العدد
              </Typography>
              <Typography variant="h6">
                {formatNumber(data.totalCount)}
              </Typography>
            </Grid>
          )}

          {data.averageAmount !== undefined && typeof data.averageAmount === 'number' && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                المتوسط
              </Typography>
              <Typography variant="h6">
                {formatCurrency(data.averageAmount)}
              </Typography>
            </Grid>
          )}

          {data.paidAmount !== undefined && typeof data.paidAmount === 'number' && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                المدفوع
              </Typography>
              <Typography variant="h6" color="success.main">
                {formatCurrency(data.paidAmount)}
              </Typography>
            </Grid>
          )}

          {data.unpaidAmount !== undefined && typeof data.unpaidAmount === 'number' && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                غير المدفوع
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatCurrency(data.unpaidAmount)}
              </Typography>
            </Grid>
          )}

          {data.overdueAmount !== undefined && typeof data.overdueAmount === 'number' && data.overdueAmount > 0 && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                المتأخر
              </Typography>
              <Typography variant="h6" color="warning.main">
                {formatCurrency(data.overdueAmount)}
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryCard;


