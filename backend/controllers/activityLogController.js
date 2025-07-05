const db = require('../db');

const logActivity = async (userId, action, details = null) => {
  try {
    const query = 'INSERT INTO activity_log (userId, action, details) VALUES (?, ?, ?)';
    await db.query(query, [userId, action, details ? JSON.stringify(details) : null]);
    console.log(`Activity logged for user ${userId}: ${action}`);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = { logActivity };
