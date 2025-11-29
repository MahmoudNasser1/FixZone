// useInvoices Hook
// Custom hook for managing invoices

import { useState, useEffect, useCallback } from 'react';
import invoicesService from '../../services/financial/invoicesService';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState([]);
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
   * Fetch invoices
   */
  const fetchInvoices = useCallback(async (newFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoicesService.getAll(newFilters, {
        page: pagination.page,
        limit: pagination.limit
      });

      if (response.success) {
        setInvoices(response.data || []);
        setPagination(prev => response.pagination || prev);
      } else {
        throw new Error(response.message || 'Failed to fetch invoices');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  /**
   * Fetch invoice statistics
   */
  const fetchStats = useCallback(async (newFilters = filters) => {
    try {
      const response = await invoicesService.getStats(newFilters);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching invoice stats:', err);
    }
  }, [filters]);

  /**
   * Get invoice by ID
   */
  const getById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoicesService.getById(id);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch invoice');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create invoice
   */
  const createInvoice = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoicesService.create(data);
      if (response.success) {
        await fetchInvoices();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create invoice');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error creating invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  /**
   * Create invoice from repair request
   */
  const createFromRepair = useCallback(async (repairId, data = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoicesService.createFromRepair(repairId, data);
      if (response.success) {
        await fetchInvoices();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create invoice from repair');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error creating invoice from repair:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices]);

  /**
   * Get invoice by repair request ID
   */
  const getByRepair = useCallback(async (repairId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoicesService.getByRepair(repairId);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch invoice');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get overdue invoices
   */
  const getOverdue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoicesService.getOverdue();
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.message || 'Failed to fetch overdue invoices');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching overdue invoices:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate invoice PDF
   */
  const generatePDF = useCallback(async (id) => {
    try {
      const response = await invoicesService.generatePDF(id);
      return response;
    } catch (err) {
      console.error('Error generating PDF:', err);
      throw err;
    }
  }, []);

  /**
   * Refetch invoices
   */
  const refetch = useCallback(() => {
    fetchInvoices();
    fetchStats();
  }, [fetchInvoices, fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchInvoices();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  return {
    invoices,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    setPagination,
    stats,
    getById,
    createInvoice,
    createFromRepair,
    getByRepair,
    getOverdue,
    generatePDF,
    refetch
  };
};


