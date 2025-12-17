// Load environment variables
// Use explicit path to ensure .env is loaded correctly
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
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

// Security Headers Middleware
app.use((req, res, next) => {
  // Content Security Policy - يمنع XSS و injection attacks
  // ملاحظة: قد نحتاج لتعديل CSP حسب احتياجات التطبيق
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' " + corsOrigins.join(' ') + ";"
    );
  }
  
  // X-Frame-Options - يمنع clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // X-Content-Type-Options - يمنع MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection - حماية إضافية من XSS (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy - يتحكم في معلومات referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy - يتحكم في APIs المتاحة
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Strict-Transport-Security - HTTPS only في production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
});

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

// Start messaging cron jobs
try {
  const messagingCronJobs = require('./jobs/messagingCronJobs');
  messagingCronJobs.startAllJobs();
  console.log('✅ Messaging cron jobs initialized');
} catch (error) {
  console.error('⚠️ Failed to start messaging cron jobs:', error.message);
  // Don't fail server startup if cron jobs fail
}

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

// Initialize Auto Backup Scheduler
const autoBackupScheduler = require('./services/database/autoBackupScheduler');
autoBackupScheduler.init().catch(err => {
  console.error('Failed to initialize Auto Backup Scheduler:', err);
});

server.listen(PORT, () => {
  console.log(`🚀 Fix Zone Backend Server is running on port ${PORT}`);
  console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket URL: ws://localhost:${PORT}/ws`);
});
