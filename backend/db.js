const mysql = require('mysql2');
require('dotenv').config();

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.DB_PASSWORD) {
    console.error('❌ ERROR: DB_PASSWORD environment variable is required in production!');
    console.error('Please set DB_PASSWORD in your production environment variables.');
    process.exit(1);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'FZ',
  port: process.env.DB_PORT || 3306,
  // Connection pool options
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  // Timeouts
  connectTimeout: 10000,
  // Reconnection
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Export both the promise pool and the original pool for transactions
const promisePool = pool.promise();
promisePool.getConnection = () => pool.promise().getConnection();

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    connection.release();
  }
});

module.exports = promisePool; 