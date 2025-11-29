// usePayments Hook
// Custom hook for managing payments

import { useState, useEffect, useCallback } from 'react';
import paymentsService from '../../services/financial/paymentsService';

export const usePayments = () => {
  const [payments, setPayments] = useState([]);
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
   * Fetch payments
   */
  const fetchPayments = useCallback(async (newFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentsService.getAll(newFilters, {
        page: pagination.page,
        limit: pagination.limit
      });

      if (response.success) {
        setPayments(response.data || []);
        setPagination(prev => response.pagination || prev);
      } else {
        throw new Error(response.message || 'Failed to fetch payments');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  /**
   * Fetch payment statistics
   */
  const fetchStats = useCallback(async (newFilters = filters) => {
    try {
      const response = await paymentsService.getStats(newFilters);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching payment stats:', err);
    }
  }, [filters]);

  /**
   * Create payment
   */
  const createPayment = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentsService.create(data);
      if (response.success) {
        await fetchPayments();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create payment');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error creating payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPayments]);

  /**
   * Get payments by invoice
   */
  const getByInvoice = useCallback(async (invoiceId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentsService.getByInvoice(invoiceId);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch payments');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching payments:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get overdue payments
   */
  const getOverdue = useCallback(async (days = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentsService.getOverdue(days);
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.message || 'Failed to fetch overdue payments');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching overdue payments:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refetch payments
   */
  const refetch = useCallback(() => {
    fetchPayments();
    fetchStats();
  }, [fetchPayments, fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchPayments();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  return {
    payments,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    setPagination,
    stats,
    createPayment,
    getByInvoice,
    getOverdue,
    refetch
  };
};


