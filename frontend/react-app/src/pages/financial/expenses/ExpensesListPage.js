// Expenses List Page
// Main page for viewing and managing expenses

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/api';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useExpenses } from '../../../hooks/financial/useExpenses';
import FinancialSummaryCard from '../../../components/financial/shared/FinancialSummaryCard';
import FinancialFilters from '../../../components/financial/shared/FinancialFilters';
import { AttachMoney } from '@mui/icons-material';

const ExpensesListPage = () => {
  const navigate = useNavigate();
  const {
    expenses,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    setPagination,
    stats,
    deleteExpense,
    refetch
  } = useExpenses();

  // const [selectedExpenses, setSelectedExpenses] = useState([]); // Reserved for future bulk actions
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);

  const handleCreate = () => {
    navigate('/financial/expenses/create');
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    setPagination({ ...pagination, page: 1 });
  };

  const handleResetFilters = () => {
    setFilters({});
    setPagination({ ...pagination, page: 1 });
  };

  const handleEdit = (id) => {
    navigate(`/financial/expenses/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه النفقة؟')) {
      try {
        await deleteExpense(id);
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const handlePageChange = (event, newPage) => {
    setPagination({ ...pagination, page: newPage + 1 });
  };

  const handleRowsPerPageChange = (event) => {
    setPagination({ ...pagination, limit: parseInt(event.target.value, 10), page: 1 });
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

  // Load categories and branches on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load expense categories
        const categoriesResponse = await apiService.request('/expense-categories');
        if (categoriesResponse?.success && categoriesResponse?.data) {
          setCategories(categoriesResponse.data);
        } else if (Array.isArray(categoriesResponse)) {
          setCategories(categoriesResponse);
        }

        // Load branches
        const branchesResponse = await apiService.request('/branches');
        if (branchesResponse?.success && branchesResponse?.data) {
          setBranches(branchesResponse.data);
        } else if (Array.isArray(branchesResponse)) {
          setBranches(branchesResponse);
        }
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };

    loadData();
  }, []);

  if (error && !expenses.length) {
    const errorMessage = typeof error === 'string' 
      ? error 
      : error?.message || error?.title || 'حدث خطأ غير متوقع';
    return (
      <Box p={3}>
        <Typography color="error">خطأ: {errorMessage}</Typography>
        <Button onClick={refetch} variant="outlined" sx={{ mt: 2 }}>
          إعادة المحاولة
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          النفقات
        </Typography>
        <Box>
          <Tooltip title="تحديث">
            <IconButton onClick={refetch} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{ ml: 1 }}
          >
            إضافة نفقة جديدة
          </Button>
        </Box>
      </Box>

      {/* Summary Card */}
      <Box mb={3}>
        <FinancialSummaryCard
          title="ملخص النفقات"
          data={stats && typeof stats === 'object' && !Array.isArray(stats) ? stats : null}
          loading={loading}
          icon={AttachMoney}
        />
      </Box>

      {/* Filters */}
      <Box mb={3}>
        <FinancialFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          showDateRange={true}
          showCategory={true}
          showBranch={true}
          categories={categories}
          branches={branches}
        />
      </Box>

      {/* Expenses Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>التاريخ</TableCell>
              <TableCell>الوصف</TableCell>
              <TableCell>التصنيف</TableCell>
              <TableCell>المبلغ</TableCell>
              <TableCell>الفرع</TableCell>
              <TableCell>إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  لا توجد نفقات
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>
                    <Chip label={expense.categoryName || '-'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(expense.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>{expense.branchName || '-'}</TableCell>
                  <TableCell>
                    <Tooltip title="تعديل">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(expense.id)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="حذف">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(expense.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={handlePageChange}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="عدد الصفوف:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
          }
        />
      </TableContainer>
    </Box>
  );
};

export default ExpensesListPage;

