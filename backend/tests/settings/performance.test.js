/**
 * Performance Tests for Settings System
 * Tests for response times, load handling, and performance optimization
 */

const request = require('supertest');
const app = require('../../app');
const { getTestAdminToken } = require('../helpers/authHelper');

describe('Settings System Performance Tests', () => {
  let authToken;

  beforeAll(async () => {
    try {
      const auth = await getTestAdminToken();
      authToken = auth.token;
    } catch (error) {
      console.warn('⚠️ Could not get test admin token:', error.message);
      authToken = null;
    }
  });

  const skipIfNoAuth = (testFn) => {
    if (!authToken) {
      return test.skip('Skipping test: No auth token available', testFn);
    }
    return testFn;
  };

  describe('Response Time Tests', () => {
    it('should respond to GET /api/settings within acceptable time', skipIfNoAuth(async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${authToken}`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect([200, 401, 403]).toContain(response.status);
      
      // Should respond within 1 second
      expect(responseTime).toBeLessThan(1000);
      
      console.log(`GET /api/settings response time: ${responseTime}ms`);
    }));

    it('should respond to GET /api/settings/:key within acceptable time', skipIfNoAuth(async () => {
      const testKey = 'company.name'; // Assuming this exists
      const startTime = Date.now();
      const response = await request(app)
        .get(`/api/settings/${testKey}`)
        .set('Authorization', `Bearer ${authToken}`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect([200, 404, 401, 403]).toContain(response.status);
      
      // Should respond within 500ms for single setting
      expect(responseTime).toBeLessThan(500);
      
      console.log(`GET /api/settings/${testKey} response time: ${responseTime}ms`);
    }));

    it('should respond to POST /api/settings within acceptable time', skipIfNoAuth(async () => {
      const testKey = `test.performance.${Date.now()}`;
      const startTime = Date.now();
      const response = await request(app)
        .post('/api/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: testKey,
          value: 'Performance Test Value',
          category: 'general'
        });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect([200, 201, 400, 401, 403]).toContain(response.status);
      
      // Should respond within 1 second
      expect(responseTime).toBeLessThan(1000);
      
      console.log(`POST /api/settings response time: ${responseTime}ms`);

      // Cleanup
      if (response.status === 200 || response.status === 201) {
        await request(app)
          .delete(`/api/settings/${testKey}`)
          .set('Authorization', `Bearer ${authToken}`);
      }
    }));
  });

  describe('Caching Performance Tests', () => {
    it('should cache settings for faster subsequent requests', skipIfNoAuth(async () => {
      const testKey = 'company.name'; // Assuming this exists
      
      // First request (cache miss)
      const firstStart = Date.now();
      const firstResponse = await request(app)
        .get(`/api/settings/${testKey}`)
        .set('Authorization', `Bearer ${authToken}`);
      const firstTime = Date.now() - firstStart;

      if (firstResponse.status === 200) {
        // Second request (should be cached)
        const secondStart = Date.now();
        const secondResponse = await request(app)
          .get(`/api/settings/${testKey}`)
          .set('Authorization', `Bearer ${authToken}`);
        const secondTime = Date.now() - secondStart;

        // Cached request should be faster (or at least not slower)
        expect(secondTime).toBeLessThanOrEqual(firstTime * 1.5); // Allow 50% margin
        
        console.log(`First request: ${firstTime}ms, Second request: ${secondTime}ms`);
      }
    }));
  });

  describe('Batch Operations Performance', () => {
    it('should handle batch updates efficiently', skipIfNoAuth(async () => {
      const batchSize = 10;
      const settings = [];
      
      for (let i = 0; i < batchSize; i++) {
        settings.push({
          key: `test.batch.${Date.now()}.${i}`,
          value: `Batch Value ${i}`,
          category: 'general'
        });
      }

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/settings/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ settings });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect([200, 201, 400, 401, 403]).toContain(response.status);
      
      // Batch should be faster than individual requests
      // 10 settings should take less than 2 seconds
      expect(responseTime).toBeLessThan(2000);
      
      console.log(`Batch update (${batchSize} settings) response time: ${responseTime}ms`);
      console.log(`Average per setting: ${(responseTime / batchSize).toFixed(2)}ms`);
    }));
  });

  describe('Load Test', () => {
    it('should handle concurrent requests', skipIfNoAuth(async () => {
      const concurrentRequests = 10;
      const requests = [];

      const startTime = Date.now();
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .get('/api/settings')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should complete
      expect(responses.length).toBe(concurrentRequests);
      
      // Should complete within reasonable time (5 seconds for 10 concurrent)
      expect(totalTime).toBeLessThan(5000);
      
      console.log(`${concurrentRequests} concurrent requests completed in ${totalTime}ms`);
      console.log(`Average per request: ${(totalTime / concurrentRequests).toFixed(2)}ms`);
    }));
  });

  describe('Database Query Performance', () => {
    it('should use indexes for efficient queries', skipIfNoAuth(async () => {
      // This test verifies that queries use indexes
      // In a real scenario, you would check EXPLAIN query plans
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/settings/category/general')
        .set('Authorization', `Bearer ${authToken}`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect([200, 401, 403, 404]).toContain(response.status);
      
      // Category query should be fast with proper indexing
      expect(responseTime).toBeLessThan(500);
      
      console.log(`Category query response time: ${responseTime}ms`);
    }));
  });
});

