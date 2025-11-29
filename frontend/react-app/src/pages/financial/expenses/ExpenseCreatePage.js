// Expense Create Page
// Page for creating new expense

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/api';
import vendorService from '../../../services/vendorService';
import {
  Box,
  Button,
  Typography,
  Paper
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useExpenses } from '../../../hooks/financial/useExpenses';
import ExpenseForm from '../../../components/financial/expenses/ExpenseForm';

const ExpenseCreatePage = () => {
  const navigate = useNavigate();
  const { createExpense, loading } = useExpenses();

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    vendorId: '',
    branchId: ''
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const handleChange = (e) => {
    const name = e.target?.name || e.name;
    const value = e.target?.value || e.value;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.categoryId) {
      newErrors.categoryId = 'التصنيف مطلوب';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون موجب';
    }

    if (!formData.description || formData.description.trim().length === 0) {
      newErrors.description = 'الوصف مطلوب';
    }

    if (!formData.date) {
      newErrors.date = 'التاريخ مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const expense = await createExpense({
        ...formData,
        amount: parseFloat(formData.amount),
        categoryId: parseInt(formData.categoryId),
        vendorId: formData.vendorId ? parseInt(formData.vendorId) : null,
        branchId: formData.branchId ? parseInt(formData.branchId) : null
      });

      navigate(`/financial/expenses/${expense.id}`);
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  // Load categories, branches, and vendors on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
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

        // Load vendors
        const vendorsResponse = await vendorService.getAllVendors({ limit: 100 });
        if (vendorsResponse?.success && vendorsResponse?.data) {
          setVendors(Array.isArray(vendorsResponse.data) ? vendorsResponse.data : []);
        } else if (Array.isArray(vendorsResponse)) {
          setVendors(vendorsResponse);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/financial/expenses')}
          sx={{ mr: 2 }}
        >
          رجوع
        </Button>
        <Typography variant="h4" component="h1">
          إضافة نفقة جديدة
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <ExpenseForm
            formData={formData}
            errors={errors}
            onChange={(name, value) => handleChange({ target: { name, value } })}
            categories={categories}
            branches={branches}
            vendors={vendors}
            loading={loadingData}
          />

          <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
            <Button
              variant="outlined"
              onClick={() => navigate('/financial/expenses')}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ExpenseCreatePage;

