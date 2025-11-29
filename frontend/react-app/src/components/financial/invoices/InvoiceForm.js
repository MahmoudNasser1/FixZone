// Invoice Form Component
// Reusable form component for creating/editing invoices

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

const InvoiceForm = ({ formData, errors, onChange, customers = [], repairs = [] }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (onChange) {
      onChange(name, value);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="رقم طلب الإصلاح"
          name="repairRequestId"
          type="number"
          value={formData.repairRequestId || ''}
          onChange={handleChange}
          helperText="اختياري - إذا كان الفاتورة مرتبطة بطلب إصلاح"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>العميل</InputLabel>
          <Select
            name="customerId"
            value={formData.customerId || ''}
            onChange={handleChange}
            label="العميل"
          >
            <MenuItem value="">اختر العميل</MenuItem>
            {customers.map((customer) => (
              <MenuItem key={customer.id} value={customer.id}>
                {customer.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="تاريخ الاستحقاق"
          name="dueDate"
          type="date"
          value={formData.dueDate || ''}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>العملة</InputLabel>
          <Select
            name="currency"
            value={formData.currency || 'EGP'}
            onChange={handleChange}
            label="العملة"
          >
            <MenuItem value="EGP">جنيه مصري</MenuItem>
            <MenuItem value="USD">دولار أمريكي</MenuItem>
            <MenuItem value="EUR">يورو</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="الخصم"
          name="discountAmount"
          type="number"
          value={formData.discountAmount || 0}
          onChange={handleChange}
          inputProps={{ min: 0, step: 0.01 }}
          helperText="مبلغ الخصم"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="الضريبة (%)"
          name="taxRate"
          type="number"
          value={formData.taxRate || 14}
          onChange={handleChange}
          inputProps={{ min: 0, max: 100, step: 0.01 }}
          helperText="نسبة الضريبة (افتراضي: 14%)"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="ملاحظات"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          multiline
          rows={4}
        />
      </Grid>
    </Grid>
  );
};

export default InvoiceForm;


