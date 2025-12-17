const WebSocket = require('ws');
const EventEmitter = require('events');

class WebSocketService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // Map to store connected clients
    this.rooms = new Map(); // Map to store room subscriptions
    this.heartbeatInterval = 30000; // 30 seconds heartbeat
    this.maxClients = 1000; // Maximum concurrent connections
    this.heartbeatTimer = null; // Store heartbeat interval timer
  }

  // Initialize WebSocket server
  initialize(server) {
    // Prevent re-initialization
    if (this.wss) {
      console.log('⚠️ WebSocket service already initialized');
      return;
    }

    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      maxPayload: 1024 * 1024, // 1MB max payload
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();
    
    console.log('🔌 WebSocket service initialized');
  }

  // Verify client connection (basic authentication)
  verifyClient(info) {
    // يمكن إضافة authentication logic هنا
    return true;
  }

  // Handle new WebSocket connection
  handleConnection(ws, req) {
    if (this.clients.size >= this.maxClients) {
      ws.close(1013, 'Server overloaded');
      return;
    }

    const clientId = this.generateClientId();
    const clientInfo = {
      id: clientId,
      ws: ws,
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      connectedAt: new Date(),
      lastPing: Date.now(),
      subscriptions: new Set()
    };

    this.clients.set(clientId, clientInfo);
    
    console.log(`🔗 Client connected: ${clientId} (Total: ${this.clients.size})`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'welcome',
      clientId: clientId,
      timestamp: new Date().toISOString(),
      message: 'Connected to FixZone Real-time Updates'
    });

    // Handle messages from client
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.handleDisconnect(clientId);
    });

    // Handle pong responses
    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastPing = Date.now();
      }
    });
  }

  // Handle incoming messages from clients
  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data);
      const client = this.clients.get(clientId);

      if (!client) {
        return;
      }

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(clientId, message.rooms);
          break;
        
        case 'unsubscribe':
          this.handleUnsubscribe(clientId, message.rooms);
          break;
        
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
          break;
        
        default:
          console.log(`Unknown message type: ${message.type} from client ${clientId}`);
      }
    } catch (error) {
      console.error(`Error parsing message from client ${clientId}:`, error);
    }
  }

  // Handle client disconnect
  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove from all rooms
      client.subscriptions.forEach(room => {
        this.removeFromRoom(clientId, room);
      });
      
      this.clients.delete(clientId);
      console.log(`🔌 Client disconnected: ${clientId} (Total: ${this.clients.size})`);
    }
  }

  // Handle room subscription
  handleSubscribe(clientId, rooms) {
    const client = this.clients.get(clientId);
    if (!client) return;

    rooms.forEach(room => {
      client.subscriptions.add(room);
      this.addToRoom(clientId, room);
      
      console.log(`📺 Client ${clientId} subscribed to room: ${room}`);
    });

    this.sendToClient(clientId, {
      type: 'subscribed',
      rooms: rooms,
      timestamp: new Date().toISOString()
    });
  }

  // Handle room unsubscription
  handleUnsubscribe(clientId, rooms) {
    const client = this.clients.get(clientId);
    if (!client) return;

    rooms.forEach(room => {
      client.subscriptions.delete(room);
      this.removeFromRoom(clientId, room);
      
      console.log(`📺 Client ${clientId} unsubscribed from room: ${room}`);
    });

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      rooms: rooms,
      timestamp: new Date().toISOString()
    });
  }

  // Add client to room
  addToRoom(clientId, room) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room).add(clientId);
  }

  // Remove client from room
  removeFromRoom(clientId, room) {
    const roomClients = this.rooms.get(room);
    if (roomClients) {
      roomClients.delete(clientId);
      if (roomClients.size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  // Send message to specific client
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error(`Error sending message to client ${clientId}:`, error);
        this.handleDisconnect(clientId);
        return false;
      }
    }
    return false;
  }

  // Broadcast message to all clients in a room
  broadcastToRoom(room, message) {
    const roomClients = this.rooms.get(room);
    if (!roomClients) return 0;

    let sentCount = 0;
    roomClients.forEach(clientId => {
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    });

    console.log(`📢 Broadcast to room "${room}": ${sentCount}/${roomClients.size} clients`);
    return sentCount;
  }

  // Broadcast message to all connected clients
  broadcastToAll(message) {
    let sentCount = 0;
    this.clients.forEach((client, clientId) => {
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    });

    console.log(`📢 Broadcast to all: ${sentCount}/${this.clients.size} clients`);
    return sentCount;
  }

  // Generate unique client ID
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start heartbeat to detect dead connections
  startHeartbeat() {
    // Prevent multiple heartbeat timers
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          const timeSinceLastPing = Date.now() - client.lastPing;
          
          if (timeSinceLastPing > this.heartbeatInterval * 2) {
            console.log(`💔 Client ${clientId} heartbeat timeout, disconnecting`);
            client.ws.terminate();
          } else {
            client.ws.ping();
          }
        }
      });
    }, this.heartbeatInterval);
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Get connection statistics
  getStats() {
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.entries()).map(([room, clients]) => ({
        room,
        clientCount: clients.size
      })),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  // Send repair updates
  sendRepairUpdate(type, repairData) {
    const message = {
      type: 'repair_update',
      updateType: type, // 'created', 'updated', 'deleted', 'status_changed'
      data: repairData,
      timestamp: new Date().toISOString()
    };

    // Broadcast to repairs room
    this.broadcastToRoom('repairs', message);
    
    // Broadcast to specific repair room if available
    if (repairData.id) {
      this.broadcastToRoom(`repair_${repairData.id}`, message);
    }
  }

  // Send customer updates
  sendCustomerUpdate(type, customerData) {
    const message = {
      type: 'customer_update',
      updateType: type,
      data: customerData,
      timestamp: new Date().toISOString()
    };

    this.broadcastToRoom('customers', message);
    
    if (customerData.id) {
      this.broadcastToRoom(`customer_${customerData.id}`, message);
    }
  }

  // Send system notifications
  sendSystemNotification(title, message, type = 'info') {
    const notification = {
      type: 'system_notification',
      notification: {
        title,
        message,
        type,
        timestamp: new Date().toISOString(),
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };

    this.broadcastToAll(notification);
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

module.exports = websocketService;

