// Invoice Items Form Component
// Component for managing invoice items

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  Typography,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const InvoiceItemsForm = ({ items = [], onChange, errors }) => {
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0
  });

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unitPrice' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddItem = () => {
    if (!newItem.description || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      return;
    }

    const item = {
      ...newItem,
      id: Date.now(),
      totalPrice: newItem.quantity * newItem.unitPrice
    };

    const updatedItems = [...items, item];
    onChange(updatedItems);

    // Reset form
    setNewItem({
      description: '',
      quantity: 1,
      unitPrice: 0
    });
  };

  const handleRemoveItem = (itemId) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    onChange(updatedItems);
  };

  const handleUpdateItem = (itemId, field, value) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    });
    onChange(updatedItems);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        عناصر الفاتورة
      </Typography>
      
      {errors?.items && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.items}
        </Alert>
      )}

      {/* Add Item Form */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="الوصف"
              name="description"
              value={newItem.description}
              onChange={handleItemChange}
              size="small"
              required
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="الكمية"
              name="quantity"
              type="number"
              value={newItem.quantity}
              onChange={handleItemChange}
              size="small"
              inputProps={{ min: 1 }}
              required
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="سعر الوحدة"
              name="unitPrice"
              type="number"
              value={newItem.unitPrice}
              onChange={handleItemChange}
              size="small"
              inputProps={{ min: 0, step: 0.01 }}
              required
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              disabled={!newItem.description || newItem.quantity <= 0 || newItem.unitPrice <= 0}
            >
              إضافة
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Items Table */}
      {items.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>الوصف</TableCell>
                <TableCell align="right">الكمية</TableCell>
                <TableCell align="right">سعر الوحدة</TableCell>
                <TableCell align="right">الإجمالي</TableCell>
                <TableCell align="center">إجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 1, style: { textAlign: 'right', width: '80px' } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right', width: '100px' } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(item.totalPrice)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveItem(item.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Grid container spacing={2} sx={{ maxWidth: 400 }}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                المجموع الفرعي
              </Typography>
            </Grid>
            <Grid item xs={6} align="right">
              <Typography variant="body1" fontWeight="bold">
                {formatCurrency(subtotal)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}

      {items.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          لا توجد عناصر. أضف عنصراً على الأقل.
        </Alert>
      )}
    </Box>
  );
};

export default InvoiceItemsForm;


