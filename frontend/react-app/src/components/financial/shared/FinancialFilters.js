// Financial Filters Component
// Reusable filters component for financial pages

import React from 'react';
import {
  Box,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Paper
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

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
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <FilterListIcon sx={{ mr: 1 }} />
        <strong>الفلاتر</strong>
      </Box>

      <Grid container spacing={2}>
        {showDateRange && (
          <>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="من تاريخ"
                name="dateFrom"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="إلى تاريخ"
                name="dateTo"
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleChange('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </>
        )}

        {showCategory && (
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>التصنيف</InputLabel>
              <Select
                name="categoryId"
                value={filters.categoryId || ''}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                label="التصنيف"
              >
                <MenuItem value="">الكل</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {showBranch && (
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>الفرع</InputLabel>
              <Select
                name="branchId"
                value={filters.branchId || ''}
                onChange={(e) => handleChange('branchId', e.target.value)}
                label="الفرع"
              >
                <MenuItem value="">الكل</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {showCustomer && (
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>العميل</InputLabel>
              <Select
                name="customerId"
                value={filters.customerId || ''}
                onChange={(e) => handleChange('customerId', e.target.value)}
                label="العميل"
              >
                <MenuItem value="">الكل</MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {showStatus && (
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>الحالة</InputLabel>
              <Select
                name="status"
                value={filters.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
                label="الحالة"
              >
                <MenuItem value="">الكل</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="بحث"
            name="search"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="ابحث..."
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={onReset}
              fullWidth
            >
              مسح
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FinancialFilters;


