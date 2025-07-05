const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Set your MySQL root password if any
  database: 'FZ' // Change to 'FZ System' if needed
});

module.exports = pool.promise(); 