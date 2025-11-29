// Expense Form Component
// Reusable form component for creating/editing expenses

import React from 'react';
import {
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';

const ExpenseForm = ({ formData, errors, onChange, categories = [], branches = [], vendors = [] }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth error={!!errors.categoryId} required>
          <InputLabel>التصنيف *</InputLabel>
          <Select
            name="categoryId"
            value={formData.categoryId || ''}
            onChange={handleChange}
            label="التصنيف *"
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
          {errors.categoryId && (
            <FormHelperText>{errors.categoryId}</FormHelperText>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="المبلغ *"
          name="amount"
          type="number"
          value={formData.amount || ''}
          onChange={handleChange}
          error={!!errors.amount}
          helperText={errors.amount}
          inputProps={{ min: 0, step: 0.01 }}
          required
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="الوصف *"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          error={!!errors.description}
          helperText={errors.description}
          multiline
          rows={4}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="التاريخ *"
          name="date"
          type="date"
          value={formData.date || ''}
          onChange={handleChange}
          error={!!errors.date}
          helperText={errors.date}
          InputLabelProps={{ shrink: true }}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>الفرع</InputLabel>
          <Select
            name="branchId"
            value={formData.branchId || ''}
            onChange={handleChange}
            label="الفرع"
          >
            <MenuItem value="">اختر الفرع</MenuItem>
            {branches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>
                {branch.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {vendors.length > 0 && (
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>المورد</InputLabel>
            <Select
              name="vendorId"
              value={formData.vendorId || ''}
              onChange={handleChange}
              label="المورد"
            >
              <MenuItem value="">اختر المورد</MenuItem>
              {vendors.map((vendor) => (
                <MenuItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="رقم المرجع"
          name="referenceNumber"
          value={formData.referenceNumber || ''}
          onChange={handleChange}
          helperText="رقم المرجع أو الفاتورة من المورد"
        />
      </Grid>
    </Grid>
  );
};

export default ExpenseForm;


