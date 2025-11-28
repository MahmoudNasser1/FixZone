// backend/tests/helpers/authHelper.js
// Helper functions for authentication in tests
const jwt = require('jsonwebtoken');
const db = require('../../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * Get test auth token for a user
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID (default: 1 for admin)
 * @returns {string} JWT token
 */
function getTestAuthToken(userId = 1, roleId = 1) {
  const payload = {
    id: userId,
    role: roleId,
    username: 'test_user',
    email: 'test@example.com'
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Get or create test admin user and return token
 * @returns {Promise<{token: string, userId: number}>}
 */
async function getTestAdminToken() {
  try {
    // Try to find existing admin user
    const [users] = await db.execute(
      'SELECT id, role FROM Users WHERE role = 1 LIMIT 1'
    );

    if (users.length > 0) {
      const user = users[0];
      const token = getTestAuthToken(user.id, user.role);
      return { token, userId: user.id };
    }

    // If no admin user found, create a test one (for testing only)
    // Note: In production, you should have admin users already
    const [result] = await db.execute(
      'INSERT INTO Users (username, email, password, role, active) VALUES (?, ?, ?, ?, ?)',
      ['test_admin', 'test_admin@example.com', 'hashed_password', 1, 1]
    );

    const token = getTestAuthToken(result.insertId, 1);
    return { token, userId: result.insertId };
  } catch (error) {
    console.error('Error getting test admin token:', error);
    // Fallback: return a mock token (tests will need to handle auth differently)
    return { token: getTestAuthToken(1, 1), userId: 1 };
  }
}

/**
 * Create a test user and return token
 * @param {object} userData - User data
 * @returns {Promise<{token: string, userId: number}>}
 */
async function createTestUser(userData = {}) {
  const defaultData = {
    username: `test_user_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'test_password',
    role: 1, // Admin
    active: 1
  };

  const finalData = { ...defaultData, ...userData };

  try {
    const [result] = await db.execute(
      'INSERT INTO Users (username, email, password, role, active) VALUES (?, ?, ?, ?, ?)',
      [finalData.username, finalData.email, finalData.password, finalData.role, finalData.active]
    );

    const token = getTestAuthToken(result.insertId, finalData.role);
    return { token, userId: result.insertId, user: finalData };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

module.exports = {
  getTestAuthToken,
  getTestAdminToken,
  createTestUser
};

