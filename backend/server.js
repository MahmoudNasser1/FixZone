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
  ? process.env.CORS_ORIGIN.split(',')
  : (process.env.NODE_ENV === 'production' 
      ? [] 
      : ['http://localhost:3001', 'http://localhost:3000']);

// Enable CORS for all routes
app.use(cors({
  origin: corsOrigins.length > 0 ? corsOrigins : true, // Allow all in production if not specified
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Ensure cookies are parsed before routes
app.use(cookieParser());

app.use(express.json());
app.use(cookieParser());

// Apply rate limiting middleware
// TEMPORARILY DISABLED FOR DEVELOPMENT AND TESTING - RE-ENABLE AFTER COMPLETION
// app.use('/api', applyEndpointRateLimit);

// Import the main router
const apiRouter = require('./app');

// Use the API router
app.use('/api', apiRouter);

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve public files statically (for logos, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Fix Zone Backend is running' });
});

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
