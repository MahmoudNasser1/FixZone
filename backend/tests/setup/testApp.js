/**
 * Test App Setup
 * Creates Express app instance for testing
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const apiRouter = require('../../app');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4000'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// API routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server is running' });
});

module.exports = app;

