// Expense Edit Page
// Page for editing expense

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import apiService from '../../../services/api';
import vendorService from '../../../services/vendorService';
import { SimpleCard, SimpleCardContent } from '../../../components/ui/SimpleCard';
import SimpleButton from '../../../components/ui/SimpleButton';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useExpenses } from '../../../hooks/financial/useExpenses';
import expensesService from '../../../services/financial/expensesService';
import ExpenseForm from '../../../components/financial/expenses/ExpenseForm';

const ExpenseEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateExpense, loading } = useExpenses();

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    vendorId: '',
    branchId: ''
  });

  const [errors, setErrors] = useState({});
  const [loadingExpense, setLoadingExpense] = useState(true);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoadingExpense(true);
        const response = await expensesService.getById(id);
        if (response.success) {
          const expense = response.data;
          setFormData({
            categoryId: expense.categoryId?.toString() || '',
            amount: expense.amount?.toString() || '',
            description: expense.description || '',
            date: expense.expenseDate || expense.date || new Date().toISOString().split('T')[0],
            vendorId: expense.vendorId?.toString() || '',
            branchId: expense.branchId?.toString() || ''
          });
        }
      } catch (error) {
        console.error('Error fetching expense:', error);
      } finally {
        setLoadingExpense(false);
      }
    };

    if (id) {
      fetchExpense();
    }
  }, [id]);

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
      const expense = await updateExpense(id, {
        ...formData,
        amount: parseFloat(formData.amount),
        categoryId: parseInt(formData.categoryId),
        vendorId: formData.vendorId ? parseInt(formData.vendorId) : null,
        branchId: formData.branchId ? parseInt(formData.branchId) : null
      });

      navigate(`/financial/expenses`);
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  if (loadingExpense) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <SimpleButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/financial/expenses')}
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            رجوع
          </SimpleButton>
          <h1 className="text-3xl font-bold text-foreground">تعديل النفقة</h1>
        </div>

        {/* Form */}
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <ExpenseForm
                formData={formData}
                errors={errors}
                onChange={(name, value) => handleChange({ name, value })}
                categories={categories}
                branches={branches}
                vendors={vendors}
                loading={loadingData}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <SimpleButton
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/financial/expenses')}
                >
                  إلغاء
                </SimpleButton>
                <SimpleButton
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </SimpleButton>
              </div>
            </form>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    </div>
  );
};

export default ExpenseEditPage;
