const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'FZ',
  port: process.env.DB_PORT || 3306,
  // Disable prepared statements to avoid protocol issues
  prepare: false,
  // Connection pool options
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  // Timeouts
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000,
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