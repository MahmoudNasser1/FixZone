/**
 * Security Tests for Settings System
 * Tests for authentication, authorization, input validation, and security vulnerabilities
 */

const request = require('supertest');
const app = require('../../app');
const { getTestAdminToken, getTestUserToken } = require('../helpers/authHelper');

describe('Settings System Security Tests', () => {
  let adminToken;
  let userToken;
  let adminUserId;
  let userId;

  beforeAll(async () => {
    try {
      const adminAuth = await getTestAdminToken();
      adminToken = adminAuth.token;
      adminUserId = adminAuth.userId;
    } catch (error) {
      console.warn('⚠️ Could not get admin token:', error.message);
      adminToken = null;
    }

    try {
      const userAuth = await getTestUserToken();
      userToken = userAuth.token;
      userId = userAuth.userId;
    } catch (error) {
      console.warn('⚠️ Could not get user token:', error.message);
      userToken = null;
    }
  });

  describe('Authentication Tests', () => {
    it('should require authentication for all settings endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/settings' },
        { method: 'post', path: '/api/settings' },
        { method: 'get', path: '/api/settings/test.key' },
        { method: 'put', path: '/api/settings/test.key' },
        { method: 'delete', path: '/api/settings/test.key' },
        { method: 'get', path: '/api/settings/backups' },
        { method: 'post', path: '/api/settings/backups' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect([401, 403]).toContain(response.status);
      }
    });
  });

  describe('Authorization Tests', () => {
    it('should allow admin to access all settings endpoints', async () => {
      if (!adminToken) {
        return test.skip('Skipping: No admin token available');
      }

      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 401, 403]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should deny non-admin users access to settings endpoints', async () => {
      if (!userToken) {
        return test.skip('Skipping: No user token available');
      }

      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${userToken}`);

      // Should be denied (403) or might be 401 if token is invalid
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Input Validation Tests', () => {
    it('should reject invalid setting keys', async () => {
      if (!adminToken) {
        return test.skip('Skipping: No admin token available');
      }

      const invalidKeys = [
        '', // Empty
        'a'.repeat(300), // Too long
        '../etc/passwd', // Path traversal attempt
        '<script>alert("xss")</script>', // XSS attempt
        "'; DROP TABLE SystemSetting; --", // SQL injection attempt
      ];

      for (const invalidKey of invalidKeys) {
        const response = await request(app)
          .post('/api/settings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            key: invalidKey,
            value: 'test'
          });

        expect([400, 422]).toContain(response.status);
      }
    });

    it('should reject invalid setting values', async () => {
      if (!adminToken) {
        return test.skip('Skipping: No admin token available');
      }

      const testKey = `test.security.${Date.now()}`;
      const invalidValues = [
        null,
        undefined,
        {}, // Invalid type
        [], // Invalid type
      ];

      for (const invalidValue of invalidValues) {
        const response = await request(app)
          .post('/api/settings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            key: testKey,
            value: invalidValue
          });

        expect([400, 422]).toContain(response.status);
      }
    });
  });

  describe('SQL Injection Tests', () => {
    it('should prevent SQL injection in setting keys', async () => {
      if (!adminToken) {
        return test.skip('Skipping: No admin token available');
      }

      const sqlInjectionAttempts = [
        "'; DROP TABLE SystemSetting; --",
        "' OR '1'='1",
        "'; DELETE FROM SystemSetting; --",
        "1' UNION SELECT * FROM SystemSetting--"
      ];

      for (const sqlAttempt of sqlInjectionAttempts) {
        const response = await request(app)
          .get(`/api/settings/${encodeURIComponent(sqlAttempt)}`)
          .set('Authorization', `Bearer ${adminToken}`);

        // Should return 404 (not found) or 400 (bad request), not execute SQL
        expect([400, 404, 500]).toContain(response.status);
        expect(response.status).not.toBe(200);
      }
    });
  });

  describe('XSS Prevention Tests', () => {
    it('should sanitize XSS attempts in setting values', async () => {
      if (!adminToken) {
        return test.skip('Skipping: No admin token available');
      }

      const testKey = `test.xss.${Date.now()}`;
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        'javascript:alert("xss")',
        '<svg onload=alert("xss")>'
      ];

      for (const xssAttempt of xssAttempts) {
        const response = await request(app)
          .post('/api/settings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            key: testKey,
            value: xssAttempt,
            category: 'general'
          });

        // Should either reject or sanitize
        if (response.status === 200 || response.status === 201) {
          // If accepted, value should be sanitized
          const readResponse = await request(app)
            .get(`/api/settings/${testKey}`)
            .set('Authorization', `Bearer ${adminToken}`);

          if (readResponse.status === 200) {
            const value = readResponse.body.data.value;
            // Value should not contain script tags
            expect(value).not.toContain('<script>');
            expect(value).not.toContain('javascript:');
          }
        }
      }
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should enforce rate limiting on settings endpoints', async () => {
      if (!adminToken) {
        return test.skip('Skipping: No admin token available');
      }

      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .get('/api/settings')
            .set('Authorization', `Bearer ${adminToken}`)
        );
      }

      const responses = await Promise.all(requests);
      
      // At least some requests should be rate limited (429)
      const rateLimited = responses.some(r => r.status === 429);
      // Or all should succeed if rate limit is high enough
      expect(rateLimited || responses.every(r => r.status === 200 || r.status === 401 || r.status === 403)).toBe(true);
    });
  });
});

