// useExpenses Hook
// Custom hook for managing expenses

import { useState, useEffect, useCallback } from 'react';
import expensesService from '../../services/financial/expensesService';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState(null);

  /**
   * Fetch expenses
   */
  const fetchExpenses = useCallback(async (newFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expensesService.getAll(newFilters, {
        page: pagination.page,
        limit: pagination.limit
      });

      if (response.success) {
        setExpenses(response.data || []);
        setPagination(prev => response.pagination || prev);
      } else {
        throw new Error(response.message || 'Failed to fetch expenses');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  /**
   * Fetch expense statistics
   */
  const fetchStats = useCallback(async (newFilters = filters) => {
    try {
      const response = await expensesService.getStats(newFilters);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching expense stats:', err);
    }
  }, [filters]);

  /**
   * Create expense
   */
  const createExpense = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expensesService.create(data);
      if (response.success) {
        await fetchExpenses();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create expense');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error creating expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchExpenses]);

  /**
   * Update expense
   */
  const updateExpense = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expensesService.update(id, data);
      if (response.success) {
        await fetchExpenses();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update expense');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error updating expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchExpenses]);

  /**
   * Delete expense
   */
  const deleteExpense = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expensesService.delete(id);
      if (response.success) {
        await fetchExpenses();
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete expense');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error deleting expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchExpenses]);

  /**
   * Refetch expenses
   */
  const refetch = useCallback(() => {
    fetchExpenses();
    fetchStats();
  }, [fetchExpenses, fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchExpenses();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  return {
    expenses,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    setPagination,
    stats,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch
  };
};


