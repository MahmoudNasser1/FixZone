const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Set your MySQL root password if any
  database: 'FZ' // Fixed case sensitivity
});

// Export both the promise pool and the original pool for transactions
const promisePool = pool.promise();
promisePool.getConnection = () => pool.promise().getConnection();

module.exports = promisePool; 