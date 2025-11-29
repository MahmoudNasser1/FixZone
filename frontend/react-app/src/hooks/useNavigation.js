import { useState, useEffect, useMemo } from 'react';
import apiService from '../services/api';

/**
 * Hook للحصول على عناصر التنقل من API
 */
export const useNavigation = () => {
  const [navItems, setNavItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getNavigationItems();
        
        if (response.success) {
          setNavItems(response.data);
        } else {
          setError(response.message || 'Failed to fetch navigation items');
        }
      } catch (err) {
        console.error('Error fetching navigation items:', err);
        setError(err.message || 'Failed to fetch navigation items');
        // Fallback to default items if API fails
        setNavItems(getDefaultNavItems());
      } finally {
        setLoading(false);
      }
    };

    fetchNavigation();
  }, []);

  return { navItems, loading, error, refetch: () => {
    const fetchNavigation = async () => {
      try {
        setLoading(true);
        const response = await apiService.getNavigationItems();
        if (response.success) {
          setNavItems(response.data);
        }
      } catch (err) {
        console.error('Error refetching navigation:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNavigation();
  }};
};

/**
 * Hook للحصول على إحصائيات التنقل (للـ Badges)
 */
export const useNavigationStats = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await apiService.getNavigationStats();
      
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to fetch navigation stats');
      }
    } catch (err) {
      console.error('Error fetching navigation stats:', err);
      setError(err.message || 'Failed to fetch navigation stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};

/**
 * Default navigation items (fallback)
 */
const getDefaultNavItems = () => {
  return [
    {
      section: 'الرئيسية',
      items: [
        { href: '/', label: 'لوحة التحكم', icon: 'Home' }
      ]
    }
  ];
};

/**
 * Helper: Get badge count from stats
 */
export const getBadgeCount = (stats, badgeKey) => {
  if (!stats || !badgeKey) return null;
  
  const count = stats[badgeKey];
  if (count === undefined || count === null) return null;
  
  return count > 0 ? count.toString() : null;
};

/**
 * Hook للبحث داخل Navigation Items
 */
export const useNavigationSearch = (navItems, searchQuery) => {
  const filteredItems = useMemo(() => {
    if (!searchQuery || !navItems || navItems.length === 0) {
      return navItems;
    }

    const query = searchQuery.toLowerCase().trim();

    return navItems
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          // Search in label
          const matchesLabel = item.label?.toLowerCase().includes(query);
          
          // Search in subItems
          const matchesSubItems = item.subItems?.some(subItem =>
            subItem.label?.toLowerCase().includes(query)
          );
          
          return matchesLabel || matchesSubItems;
        })
      }))
      .filter(section => section.items.length > 0);
  }, [navItems, searchQuery]);

  return filteredItems;
};

