const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes (support frontend at 3001 and 3000 during dev)
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3000'
  ],
  credentials: true
}));
// Ensure cookies are parsed before routes
app.use(cookieParser());

app.use(express.json());
app.use(cookieParser());

// Import the main router
const apiRouter = require('./app');

// Use the API router
app.use('/api', apiRouter);

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

app.listen(PORT, () => {
  console.log(`🚀 Fix Zone Backend Server is running on port ${PORT}`);
  console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});
