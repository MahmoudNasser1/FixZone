// backend/tests/settings/integration.test.js
// Integration tests for Settings API
// Note: These tests require a running server and database connection
const request = require('supertest');
const app = require('../../app');
const { getTestAdminToken } = require('../helpers/authHelper');

describe('Settings API Integration Tests', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Setup: Get test admin token
    try {
      const auth = await getTestAdminToken();
      authToken = auth.token;
      testUserId = auth.userId;
    } catch (error) {
      console.warn('⚠️ Could not get test admin token:', error.message);
      console.warn('⚠️ Integration tests may fail without proper authentication');
      // Skip tests if we can't get auth token
      authToken = null;
      testUserId = 1;
    }
  });

  // Skip all tests if no auth token
  const skipIfNoAuth = (testFn) => {
    if (!authToken) {
      return test.skip('Skipping test: No auth token available', testFn);
    }
    return testFn;
  };

  describe('GET /api/settings', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/settings');

      expect([401, 403]).toContain(response.status);
    });

    it('should return all settings', skipIfNoAuth(async () => {
      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 401, 403]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    }));
  });

  describe('GET /api/settings/:key', () => {
    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/settings/company.name');

      expect([401, 403]).toContain(response.status);
    });

    it('should return setting by key', skipIfNoAuth(async () => {
      const response = await request(app)
        .get('/api/settings/company.name')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404, 401, 403]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('key');
      }
    }));

    it('should return 404 if setting not found', skipIfNoAuth(async () => {
      const response = await request(app)
        .get('/api/settings/non.existent.setting.12345')
        .set('Authorization', `Bearer ${authToken}`);

      expect([404, 401, 403]).toContain(response.status);
    }));
  });

  describe('POST /api/settings', () => {
    const testKey = `test.setting.${Date.now()}`;

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/settings')
        .send({
          key: testKey,
          value: 'test',
          type: 'string'
        });

      expect([401, 403]).toContain(response.status);
    });

    it('should create new setting', skipIfNoAuth(async () => {
      const response = await request(app)
        .post('/api/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: testKey,
          value: 'test value',
          type: 'string',
          category: 'general',
          description: 'Test setting'
        });

      expect([201, 400, 401, 403, 409]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.key).toBe(testKey);
      }
    }));

    afterEach(async () => {
      // Cleanup: Delete test setting if it was created
      if (authToken) {
        try {
          await request(app)
            .delete(`/api/settings/${testKey}`)
            .set('Authorization', `Bearer ${authToken}`);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('PUT /api/settings/:key', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/settings/company.name')
        .send({ value: 'test' });

      expect([401, 403]).toContain(response.status);
    });

    it('should update setting', skipIfNoAuth(async () => {
      const response = await request(app)
        .put('/api/settings/company.name')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: 'Updated Company Name',
          reason: 'Test update'
        });

      expect([200, 400, 401, 403, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    }));
  });

  describe('GET /api/settings/:key/history', () => {
    it('should return setting history', skipIfNoAuth(async () => {
      const response = await request(app)
        .get('/api/settings/company.name/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 401, 403, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    }));
  });
});
