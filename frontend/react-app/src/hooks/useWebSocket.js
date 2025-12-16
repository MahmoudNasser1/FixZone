import { useEffect, useRef, useState } from 'react';
import websocketService from '../services/websocketService';

// Hook for WebSocket connection status
export const useWebSocketStatus = () => {
  const [status, setStatus] = useState('disconnected');
  const [connectionInfo, setConnectionInfo] = useState({});

  useEffect(() => {
    const updateStatus = () => {
      setStatus(websocketService.getStatus());
      setConnectionInfo(websocketService.getConnectionInfo());
    };

    // Initial status
    updateStatus();

    // Listen for connection changes
    websocketService.on('connected', updateStatus);
    websocketService.on('disconnected', updateStatus);

    // Update status periodically (reduced from 5s to 30s to reduce CPU usage)
    const interval = setInterval(updateStatus, 30000);

    return () => {
      websocketService.off('connected', updateStatus);
      websocketService.off('disconnected', updateStatus);
      clearInterval(interval);
    };
  }, []);

  return { status, connectionInfo };
};

// Hook for real-time repair updates
export const useRepairUpdates = (onUpdate) => {
  const callbackRef = useRef(onUpdate);

  useEffect(() => {
    callbackRef.current = onUpdate;
  });

  useEffect(() => {
    const handleRepairUpdate = (message) => {
      if (callbackRef.current) {
        callbackRef.current(message);
      }
    };

    // Subscribe to repair updates
    websocketService.subscribeToRepairs();
    websocketService.on('repairUpdate', handleRepairUpdate);

    return () => {
      websocketService.off('repairUpdate', handleRepairUpdate);
      websocketService.unsubscribe(['repairs']);
    };
  }, []);
};

// Hook for real-time customer updates
export const useCustomerUpdates = (onUpdate) => {
  const callbackRef = useRef(onUpdate);

  useEffect(() => {
    callbackRef.current = onUpdate;
  });

  useEffect(() => {
    const handleCustomerUpdate = (message) => {
      if (callbackRef.current) {
        callbackRef.current(message);
      }
    };

    // Subscribe to customer updates
    websocketService.subscribeToCustomers();
    websocketService.on('customerUpdate', handleCustomerUpdate);

    return () => {
      websocketService.off('customerUpdate', handleCustomerUpdate);
      websocketService.unsubscribe(['customers']);
    };
  }, []);
};

// Hook for system notifications
export const useSystemNotifications = (onNotification) => {
  const callbackRef = useRef(onNotification);

  useEffect(() => {
    callbackRef.current = onNotification;
  });

  useEffect(() => {
    const handleNotification = (notification) => {
      if (callbackRef.current) {
        callbackRef.current(notification);
      }
    };

    websocketService.on('systemNotification', handleNotification);

    return () => {
      websocketService.off('systemNotification', handleNotification);
    };
  }, []);
};

// Hook for specific repair updates
export const useRepairUpdatesById = (repairId, onUpdate) => {
  const callbackRef = useRef(onUpdate);

  useEffect(() => {
    callbackRef.current = onUpdate;
  });

  useEffect(() => {
    if (!repairId) return;

    const handleRepairUpdate = (message) => {
      if (callbackRef.current) {
        callbackRef.current(message);
      }
    };

    // Subscribe to specific repair updates
    websocketService.subscribeToRepair(repairId);
    websocketService.on('repairUpdate', handleRepairUpdate);

    return () => {
      websocketService.off('repairUpdate', handleRepairUpdate);
      websocketService.unsubscribe([`repair_${repairId}`]);
    };
  }, [repairId]);
};

// Hook for specific customer updates
export const useCustomerUpdatesById = (customerId, onUpdate) => {
  const callbackRef = useRef(onUpdate);

  useEffect(() => {
    callbackRef.current = onUpdate;
  });

  useEffect(() => {
    if (!customerId) return;

    const handleCustomerUpdate = (message) => {
      if (callbackRef.current) {
        callbackRef.current(message);
      }
    };

    // Subscribe to specific customer updates
    websocketService.subscribeToCustomer(customerId);
    websocketService.on('customerUpdate', handleCustomerUpdate);

    return () => {
      websocketService.off('customerUpdate', handleCustomerUpdate);
      websocketService.unsubscribe([`customer_${customerId}`]);
    };
  }, [customerId]);
};

// Main WebSocket hook with all functionality
export const useWebSocket = () => {
  const [status, setStatus] = useState('disconnected');
  const [notifications, setNotifications] = useState([]);
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(websocketService.getStatus());
    };

    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
    };

    // Initial status
    updateStatus();

    // Auto-connect on first use (only once per session)
    if (!hasConnectedRef.current && websocketService.getStatus() === 'disconnected') {
      hasConnectedRef.current = true;
      websocketService.connect();
    }

    // Listen for connection changes
    websocketService.on('connected', updateStatus);
    websocketService.on('disconnected', updateStatus);
    websocketService.on('systemNotification', handleNotification);

    return () => {
      websocketService.off('connected', updateStatus);
      websocketService.off('disconnected', updateStatus);
      websocketService.off('systemNotification', handleNotification);
    };
  }, []);

  const connect = () => websocketService.connect();
  const disconnect = () => websocketService.disconnect();
  const subscribe = (rooms) => websocketService.subscribe(rooms);
  const unsubscribe = (rooms) => websocketService.unsubscribe(rooms);

  const clearNotifications = () => setNotifications([]);

  return {
    status,
    notifications,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    clearNotifications,
    isConnected: websocketService.isConnected()
  };
};

