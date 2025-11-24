// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const websocketService = require('./services/websocketService');
// TEMPORARILY DISABLED FOR DEVELOPMENT AND TESTING - RE-ENABLE AFTER COMPLETION
// const { applyEndpointRateLimit, ipBasedRateLimit } = require('./middleware/rateLimitMiddleware');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS Configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : (process.env.NODE_ENV === 'production' 
      ? ['https://system.fixzzone.com', 'https://fixzzone.com', 'https://www.fixzzone.com']
      : ['http://localhost:4000', 'http://localhost:3000', 'https://system.fixzzone.com']);

// Enable CORS for all routes
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      callback(null, true);
    } else {
      // In production, be strict; in development, allow localhost
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Auth-Token'],
  exposedHeaders: ['Set-Cookie']
}));

// Parse JSON bodies
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// Apply rate limiting middleware
// TEMPORARILY DISABLED FOR DEVELOPMENT AND TESTING - RE-ENABLE AFTER COMPLETION
// app.use('/api', applyEndpointRateLimit);

// Import the main router
const apiRouter = require('./app');

// Health check endpoint (before API routes)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Fix Zone Backend is running' });
});

// API root endpoint (must be before app.use('/api', apiRouter))
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Fix Zone API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      repairs: '/api/repairs',
      customers: '/api/customers',
      inventory: '/api/inventory',
      invoices: '/api/invoices',
      payments: '/api/payments'
    }
  });
});

// Use the API router
app.use('/api', apiRouter);

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve public files statically (for logos, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service
websocketService.initialize(server);

server.listen(PORT, () => {
  console.log(`🚀 Fix Zone Backend Server is running on port ${PORT}`);
  console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket URL: ws://localhost:${PORT}/ws`);
});
