import { useState, useEffect } from 'react';
import apiService from '../services/api';

/**
 * Hook للحصول على الإحصائيات السريعة للعرض في Topbar
 */
export const useQuickStats = () => {
  const [stats, setStats] = useState({
    pendingRepairs: 0,
    newMessages: 0,
    lowStock: 0,
    todayRevenue: 0,
    loading: true
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        
        // Try to get from navigation stats first
        const navResponse = await apiService.getNavigationStats();
        const navStats = navResponse.success ? navResponse.data : {};
        
        // Try to get from dashboard stats if available
        let dashboardStats = {};
        try {
          const dashResponse = await apiService.getQuickStats();
          if (dashResponse.success) {
            dashboardStats = dashResponse.data;
          }
        } catch (err) {
          // Dashboard stats endpoint might not exist yet
          console.log('Dashboard stats endpoint not available, using navigation stats only');
        }
        
        // Merge stats
        setStats({
          pendingRepairs: navStats.pendingRepairs || dashboardStats.pendingRepairs || 0,
          newMessages: dashboardStats.newMessages || 0,
          lowStock: navStats.lowStock || dashboardStats.lowStock || 0,
          todayRevenue: dashboardStats.todayRevenue || 0,
          loading: false
        });
      } catch (err) {
        console.error('Failed to fetch quick stats:', err);
        setError(err.response?.data?.message || 'Failed to fetch stats');
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchStats();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return { stats, error, refetch: () => {
    const fetchStats = async () => {
      try {
        setError(null);
        const response = await apiService.getNavigationStats();
        if (response.success) {
          const navStats = response.data;
          setStats(prev => ({
            ...prev,
            pendingRepairs: navStats.pendingRepairs || 0,
            lowStock: navStats.lowStock || 0
          }));
        }
      } catch (err) {
        console.error('Error refetching stats:', err);
      }
    };
    fetchStats();
  }};
};

/**
 * Format currency
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0';
  
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

