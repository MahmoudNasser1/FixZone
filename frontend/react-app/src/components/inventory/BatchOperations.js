import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const BatchOperations = ({ open, onClose, selectedItems, onExecute }) => {
  const [operation, setOperation] = useState('');
  const [updateField, setUpdateField] = useState('');
  const [updateValue, setUpdateValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!operation) return;

    setLoading(true);
    try {
      const itemIds = selectedItems.map(item => item.id);
      
      let payload = { itemIds };
      
      switch (operation) {
        case 'updatePrices':
          payload.updateData = {
            purchasePrice: parseFloat(updateValue) || 0
          };
          break;
        case 'updateCategory':
          payload.updateData = {
            category: updateValue
          };
          break;
        case 'activate':
          payload.updateData = { isActive: true };
          break;
        case 'deactivate':
          payload.updateData = { isActive: false };
          break;
        case 'delete':
          payload.action = 'delete';
          break;
        default:
          break;
      }

      await onExecute(operation, payload);
      onClose();
    } catch (error) {
      console.error('Batch operation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOperationLabel = (op) => {
    const labels = {
      updatePrices: 'تحديث الأسعار',
      updateCategory: 'تغيير الفئة',
      activate: 'تفعيل',
      deactivate: 'تعطيل',
      delete: 'حذف'
    };
    return labels[op] || op;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        عمليات جماعية
        <Typography variant="body2" color="text.secondary">
          تم اختيار {selectedItems.length} صنف
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Alert severity="info">
            سيتم تطبيق العملية على جميع الأصناف المحددة
          </Alert>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>نوع العملية</InputLabel>
              <Select
                value={operation}
                label="نوع العملية"
                onChange={(e) => setOperation(e.target.value)}
              >
                <MenuItem value="updatePrices">تحديث الأسعار</MenuItem>
                <MenuItem value="updateCategory">تغيير الفئة</MenuItem>
                <MenuItem value="activate">تفعيل</MenuItem>
                <MenuItem value="deactivate">تعطيل</MenuItem>
                <MenuItem value="delete">حذف</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {operation === 'updatePrices' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="السعر الجديد"
                type="number"
                value={updateValue}
                onChange={(e) => setUpdateValue(e.target.value)}
                placeholder="أدخل السعر الجديد"
              />
            </Grid>
          )}

          {operation === 'updateCategory' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="الفئة الجديدة"
                value={updateValue}
                onChange={(e) => setUpdateValue(e.target.value)}
                placeholder="أدخل اسم الفئة"
              />
            </Grid>
          )}

          {operation === 'delete' && (
            <Grid item xs={12}>
              <Alert severity="warning">
                <strong>تحذير:</strong> سيتم حذف جميع الأصناف المحددة. هذا الإجراء لا يمكن التراجع عنه.
              </Alert>
            </Grid>
          )}
        </Grid>

        {selectedItems.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              الأصناف المحددة:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedItems.slice(0, 5).map((item) => (
                <Chip
                  key={item.id}
                  label={item.name}
                  size="small"
                />
              ))}
              {selectedItems.length > 5 && (
                <Chip
                  label={`+${selectedItems.length - 5} أخرى`}
                  size="small"
                  color="primary"
                />
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          إلغاء
        </Button>
        <Button
          onClick={handleExecute}
          variant="contained"
          disabled={!operation || loading}
          color={operation === 'delete' ? 'error' : 'primary'}
        >
          {loading ? 'جاري التنفيذ...' : 'تنفيذ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchOperations;

