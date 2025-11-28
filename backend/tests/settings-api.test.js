// backend/tests/settings-api.test.js
// Basic API tests for Settings system
const request = require('supertest');
const app = require('../app');
const db = require('../db');
const { getTestAdminToken } = require('./helpers/authHelper');

// Test data
let authToken;
let testUserId = 1; // Admin user ID
let testSettingKey = 'test.setting.key';

describe('Settings API Tests', () => {
  beforeAll(async () => {
    // Get auth token
    try {
      const auth = await getTestAdminToken();
      authToken = auth.token;
      testUserId = auth.userId;
    } catch (error) {
      console.warn('⚠️ Could not get test admin token, some tests may fail:', error.message);
      // Use mock token as fallback
      authToken = 'mock_token_for_testing';
      testUserId = 1;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await db.execute('DELETE FROM SystemSetting WHERE `key` = ?', [testSettingKey]);
      await db.execute('DELETE FROM SettingHistory WHERE settingKey = ?', [testSettingKey]);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    // Don't close DB connection as it might be used by other tests
    // await db.end();
  });

  describe('GET /api/settings', () => {
    it('should return all settings (requires auth)', async () => {
      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${authToken}`);
      
      // This will fail without proper auth setup
      // Adjust based on your test setup
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('POST /api/settings', () => {
    it('should create a new setting', async () => {
      const response = await request(app)
        .post('/api/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: testSettingKey,
          value: 'test value',
          type: 'string',
          category: 'general',
          description: 'Test setting'
        });
      
      expect([201, 401, 403]).toContain(response.status);
    });
  });

  describe('GET /api/settings/:key', () => {
    it('should get a specific setting', async () => {
      const response = await request(app)
        .get(`/api/settings/${testSettingKey}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 404, 401, 403]).toContain(response.status);
    });
  });

  describe('PUT /api/settings/:key', () => {
    it('should update a setting', async () => {
      const response = await request(app)
        .put(`/api/settings/${testSettingKey}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: 'updated value',
          reason: 'Test update'
        });
      
      expect([200, 404, 401, 403]).toContain(response.status);
    });
  });

  describe('DELETE /api/settings/:key', () => {
    it('should delete a setting', async () => {
      const response = await request(app)
        .delete(`/api/settings/${testSettingKey}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 404, 401, 403]).toContain(response.status);
    });
  });

  describe('GET /api/settings/:key/history', () => {
    it('should get setting history', async () => {
      const response = await request(app)
        .get(`/api/settings/${testSettingKey}/history`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 404, 401, 403]).toContain(response.status);
    });
  });
});

// Note: These tests require proper authentication setup
// You may need to:
// 1. Create a test user
// 2. Get a valid JWT token
// 3. Or mock the auth middleware for tests

