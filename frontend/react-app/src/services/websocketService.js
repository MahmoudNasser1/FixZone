class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 seconds
    this.heartbeatInterval = 30000; // 30 seconds
    this.listeners = new Map();
    this.isConnecting = false;
    this.url = process.env.REACT_APP_WS_URL || 'ws://localhost:4000/ws';
  }

  // Connect to WebSocket server
  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    console.log('🔌 Connecting to WebSocket server...');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = (event) => {
        console.log('✅ WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected', event);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.emit('disconnected', event);
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  // Disconnect from WebSocket server
  disconnect() {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
  }

  // Reconnect to WebSocket server
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  // Send message to server
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('⚠️ WebSocket is not connected');
      return false;
    }
  }

  // Handle incoming messages
  handleMessage(message) {
    console.log('📨 WebSocket message received:', message);

    switch (message.type) {
      case 'welcome':
        console.log('👋 Welcome message:', message.message);
        this.emit('welcome', message);
        break;

      case 'repair_update':
        this.emit('repairUpdate', message);
        break;

      case 'customer_update':
        this.emit('customerUpdate', message);
        break;

      case 'system_notification':
        this.emit('systemNotification', message.notification);
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.log('📨 Unknown message type:', message.type);
        this.emit('message', message);
    }
  }

  // Subscribe to specific rooms
  subscribe(rooms) {
    return this.send({
      type: 'subscribe',
      rooms: Array.isArray(rooms) ? rooms : [rooms]
    });
  }

  // Unsubscribe from specific rooms
  unsubscribe(rooms) {
    return this.send({
      type: 'unsubscribe',
      rooms: Array.isArray(rooms) ? rooms : [rooms]
    });
  }

  // Subscribe to repairs updates
  subscribeToRepairs() {
    return this.subscribe(['repairs']);
  }

  // Subscribe to specific repair updates
  subscribeToRepair(repairId) {
    return this.subscribe([`repair_${repairId}`]);
  }

  // Subscribe to customers updates
  subscribeToCustomers() {
    return this.subscribe(['customers']);
  }

  // Subscribe to specific customer updates
  subscribeToCustomer(customerId) {
    return this.subscribe([`customer_${customerId}`]);
  }

  // Start heartbeat to keep connection alive
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, this.heartbeatInterval);
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  getStatus() {
    if (!this.ws) {
      return 'disconnected';
    }

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  // Check if connected
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  // Get connection info
  getConnectionInfo() {
    return {
      status: this.getStatus(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      url: this.url,
      listeners: Array.from(this.listeners.keys())
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

// Auto-connect when the service is imported
websocketService.connect();

export default websocketService;

