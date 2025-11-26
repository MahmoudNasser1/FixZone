import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';

import apiService from '../../services/apiService';

const ItemVendorsManager = ({ itemId }) => {
  const [vendors, setVendors] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [price, setPrice] = useState('');
  const [leadTime, setLeadTime] = useState('');

  useEffect(() => {
    if (itemId) {
      loadData();
    }
  }, [itemId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // جلب موردي الصنف
      const itemVendors = await apiService.request(`/inventory/${itemId}/vendors`);
      setVendors(itemVendors || []);

      // جلب جميع الموردين
      const allVendorsData = await apiService.request('/vendors');
      setAllVendors(allVendorsData || []);
      
    } catch (err) {
      console.error('Error loading vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async () => {
    try {
      if (!selectedVendor) return;

      await apiService.request(`/inventory/${itemId}/vendors`, {
        method: 'POST',
        body: JSON.stringify({
          vendorId: selectedVendor,
          isPrimary,
          price: parseFloat(price) || 0,
          leadTime: parseInt(leadTime) || 7
        })
      });

      setOpenDialog(false);
      setSelectedVendor('');
      setIsPrimary(false);
      setPrice('');
      setLeadTime('');
      await loadData();
      
    } catch (err) {
      console.error('Error adding vendor:', err);
      alert('حدث خطأ في إضافة المورد');
    }
  };

  const handleRemoveVendor = async (vendorId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المورد؟')) return;

    try {
      await apiService.request(`/inventory/${itemId}/vendors/${vendorId}`, {
        method: 'DELETE'
      });
      await loadData();
    } catch (err) {
      console.error('Error removing vendor:', err);
      alert('حدث خطأ في حذف المورد');
    }
  };

  const handleSetPrimary = async (vendorId) => {
    try {
      await apiService.request(`/inventory/${itemId}/vendors/${vendorId}/set-primary`, {
        method: 'PUT'
      });
      await loadData();
    } catch (err) {
      console.error('Error setting primary vendor:', err);
      alert('حدث خطأ في تعيين المورد الرئيسي');
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">الموردون</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          إضافة مورد
        </Button>
      </Box>

      {vendors.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>المورد</TableCell>
                <TableCell>السعر</TableCell>
                <TableCell>مدة التوصيل</TableCell>
                <TableCell>رئيسي</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>{vendor.vendorName}</TableCell>
                  <TableCell>{parseFloat(vendor.price || 0).toFixed(2)} ج.م</TableCell>
                  <TableCell>{vendor.leadTime || 7} يوم</TableCell>
                  <TableCell>
                    {vendor.isPrimary ? (
                      <Chip icon={<StarIcon />} label="رئيسي" color="primary" size="small" />
                    ) : (
                      <IconButton size="small" onClick={() => handleSetPrimary(vendor.vendorId)}>
                        <StarBorderIcon />
                      </IconButton>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveVendor(vendor.vendorId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            لم يتم إضافة موردين لهذا الصنف بعد
          </Typography>
        </Paper>
      )}

      {/* Add Vendor Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة مورد للصنف</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>المورد</InputLabel>
                  <Select
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                  >
                    {allVendors
                      .filter(v => !vendors.find(iv => iv.vendorId === v.id))
                      .map((vendor) => (
                        <MenuItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="السعر"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="مدة التوصيل (أيام)"
                  type="number"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>مورد رئيسي؟</InputLabel>
                  <Select
                    value={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.value)}
                  >
                    <MenuItem value={false}>لا</MenuItem>
                    <MenuItem value={true}>نعم</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>إلغاء</Button>
          <Button
            onClick={handleAddVendor}
            variant="contained"
            disabled={!selectedVendor}
          >
            إضافة
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItemVendorsManager;
