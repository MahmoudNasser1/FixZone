// Expense Details Page
// Page for viewing expense details

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useExpenses } from '../../../hooks/financial/useExpenses';
import expensesService from '../../../services/financial/expensesService';

const ExpenseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteExpense } = useExpenses();

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true);
        const response = await expensesService.getById(id);
        if (response.success) {
          setExpense(response.data);
        }
      } catch (error) {
        console.error('Error fetching expense:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExpense();
    }
  }, [id]);

  const handleEdit = () => {
    navigate(`/financial/expenses/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذه النفقة؟')) {
      try {
        await deleteExpense(id);
        navigate('/financial/expenses');
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG');
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>جاري التحميل...</Typography>
      </Box>
    );
  }

  if (!expense) {
    return (
      <Box p={3}>
        <Typography color="error">النفقة غير موجودة</Typography>
        <Button onClick={() => navigate('/financial/expenses')} sx={{ mt: 2 }}>
          رجوع
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/financial/expenses')}
            sx={{ mr: 2 }}
          >
            رجوع
          </Button>
          <Typography variant="h4" component="h1">
            نفقة #{expense.id}
          </Typography>
        </Box>
        <Box>
          <Tooltip title="تعديل">
            <IconButton onClick={handleEdit} color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="حذف">
            <IconButton onClick={handleDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Expense Info */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          معلومات النفقة
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              المبلغ
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">
              {formatCurrency(expense.amount)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              التصنيف
            </Typography>
            <Chip
              label={expense.categoryName || '-'}
              color="primary"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              التاريخ
            </Typography>
            <Typography variant="body1">
              {formatDate(expense.expenseDate || expense.date)}
            </Typography>
          </Grid>

          {expense.branchName && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                الفرع
              </Typography>
              <Typography variant="body1">
                {expense.branchName}
              </Typography>
            </Grid>
          )}

          {expense.vendorName && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                المورد
              </Typography>
              <Typography variant="body1">
                {expense.vendorName}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              الوصف
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {expense.description || '-'}
            </Typography>
          </Grid>

          {expense.createdByName && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                تم الإنشاء بواسطة
              </Typography>
              <Typography variant="body1">
                {expense.createdByName}
              </Typography>
            </Grid>
          )}

          {expense.createdAt && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                تاريخ الإنشاء
              </Typography>
              <Typography variant="body1">
                {formatDate(expense.createdAt)}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default ExpenseDetailsPage;


