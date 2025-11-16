/**
 * Test Helpers for Authentication and Permissions
 * Provides utilities for creating test users, roles, and making authenticated requests
 */

const db = require('../../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * Create a test user with specific role and permissions
 */
async function createTestUser(userData) {
  const {
    name = 'Test User',
    email = `test${Date.now()}${Math.random().toString(36).substr(2, 9)}@example.com`,
    password = 'password123',
    phone = `0100${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
    roleId = 1,
    isActive = true,
    customerId = null
  } = userData;

  // Ensure unique email
  const uniqueEmail = email.includes('@') 
    ? email.replace('@', `_${Date.now()}${Math.random().toString(36).substr(2, 5)}@`)
    : `test${Date.now()}${Math.random().toString(36).substr(2, 9)}@example.com`;

  // Ensure unique phone
  const uniquePhone = `0100${Date.now()}${Math.random().toString(36).substr(2, 5)}`;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user exists (soft deleted), delete first
  try {
    await db.execute(
      'DELETE FROM User WHERE email = ?',
      [uniqueEmail]
    );
  } catch (e) {
    // Ignore if user doesn't exist
  }

  // Insert user
  const [result] = await db.execute(
    `INSERT INTO User (name, email, password, phone, roleId, isActive, customerId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [name, uniqueEmail, hashedPassword, uniquePhone, roleId, isActive, customerId]
  );

  return {
    id: result.insertId,
    name,
    email: uniqueEmail,
    phone: uniquePhone,
    roleId,
    isActive,
    password: password // Return plain password for testing
  };
}

/**
 * Create a test role with specific permissions
 */
async function createTestRole(roleData) {
  const {
    name = `TestRole${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
    description = 'Test Role',
    permissions = {},
    parentRoleId = null,
    isSystem = false,
    isActive = true
  } = roleData;

  // Ensure unique name
  const uniqueName = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const [result] = await db.execute(
    `INSERT INTO Role (name, description, permissions, parentRoleId, isSystem, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [uniqueName, description, JSON.stringify(permissions), parentRoleId, isSystem, isActive]
  );

  return {
    id: result.insertId,
    name: uniqueName,
    description,
    permissions,
    parentRoleId,
    isSystem,
    isActive
  };
}

/**
 * Generate JWT token for a user
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    role: user.roleId,
    roleId: user.roleId,
    name: user.name
  };

  if (user.customerId) {
    payload.customerId = user.customerId;
    payload.type = 'customer';
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

/**
 * Create authenticated request headers
 */
function createAuthHeaders(user) {
  const token = generateToken(user);
  return {
    'Cookie': `token=${token}`,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Clean up test data
 */
async function cleanupTestData(userIds = [], roleIds = []) {
  try {
    // Delete test users (soft delete or hard delete with proper order)
    if (userIds.length > 0) {
      // First delete related records (UserLoginLog)
      try {
        await db.execute(
          `DELETE FROM UserLoginLog WHERE userId IN (${userIds.map(() => '?').join(',')})`,
          userIds
        );
      } catch (e) {
        // Ignore if table doesn't exist or error
      }

      // Soft delete users first
      try {
        await db.execute(
          `UPDATE User SET deletedAt = NOW() WHERE id IN (${userIds.map(() => '?').join(',')})`,
          userIds
        );
      } catch (e) {
        // If soft delete fails, try hard delete
        await db.execute(
          `DELETE FROM User WHERE id IN (${userIds.map(() => '?').join(',')})`,
          userIds
        );
      }
    }

    // Delete test roles (only non-system roles)
    // Delete in reverse order to handle parent role dependencies
    if (roleIds.length > 0) {
      // First, update any users referencing these roles to NULL
      try {
        await db.execute(
          `UPDATE User SET roleId = NULL WHERE roleId IN (${roleIds.map(() => '?').join(',')})`,
          roleIds
        );
      } catch (e) {
        // Ignore error
      }

      // Then delete roles (in reverse order to handle parent relationships)
      const sortedRoleIds = [...roleIds].reverse();
      for (const roleId of sortedRoleIds) {
        try {
          // First, remove parent role references
          await db.execute(
            'UPDATE Role SET parentRoleId = NULL WHERE parentRoleId = ?',
            [roleId]
          );
          
          // Then delete the role
          await db.execute(
            'DELETE FROM Role WHERE id = ? AND isSystem = FALSE',
            [roleId]
          );
        } catch (e) {
          // If deletion fails, try soft delete
          try {
            await db.execute(
              'UPDATE Role SET deletedAt = NOW() WHERE id = ? AND isSystem = FALSE',
              [roleId]
            );
          } catch (e2) {
            // Ignore soft delete errors too
          }
        }
      }
    }
  } catch (error) {
    // Log error but don't throw - cleanup errors shouldn't fail tests
    console.error('Error cleaning up test data:', error.message);
  }
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  const [users] = await db.execute(
    'SELECT * FROM User WHERE email = ? AND deletedAt IS NULL',
    [email]
  );
  return users[0] || null;
}

/**
 * Get role by ID
 */
async function getRoleById(roleId) {
  const [roles] = await db.execute(
    'SELECT * FROM Role WHERE id = ? AND deletedAt IS NULL',
    [roleId]
  );
  return roles[0] || null;
}

/**
 * Update role permissions
 */
async function updateRolePermissions(roleId, permissions) {
  await db.execute(
    'UPDATE Role SET permissions = ?, updatedAt = NOW() WHERE id = ?',
    [JSON.stringify(permissions), roleId]
  );
}

module.exports = {
  createTestUser,
  createTestRole,
  generateToken,
  createAuthHeaders,
  cleanupTestData,
  getUserByEmail,
  getRoleById,
  updateRolePermissions
};

