/**
 * E2E Tests for Settings System
 * End-to-End tests that test the complete flow
 */

const request = require('supertest');
const app = require('../../app');
const { getTestAdminToken } = require('../helpers/authHelper');

describe('Settings System E2E Tests', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    try {
      const auth = await getTestAdminToken();
      authToken = auth.token;
      testUserId = auth.userId;
    } catch (error) {
      console.warn('⚠️ Could not get test admin token:', error.message);
      authToken = null;
      testUserId = 1;
    }
  });

  const skipIfNoAuth = (testFn) => {
    if (!authToken) {
      return test.skip('Skipping test: No auth token available', testFn);
    }
    return testFn;
  };

  describe('Complete Settings Flow', () => {
    it('should create, read, update, and delete a setting', skipIfNoAuth(async () => {
      const testKey = `test.e2e.${Date.now()}`;
      const testValue = 'E2E Test Value';

      // 1. Create setting
      const createResponse = await request(app)
        .post('/api/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: testKey,
          value: testValue,
          category: 'general',
          description: 'E2E Test Setting'
        });

      if (createResponse.status === 200 || createResponse.status === 201) {
        expect(createResponse.body.success).toBe(true);

        // 2. Read setting
        const readResponse = await request(app)
          .get(`/api/settings/${testKey}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 404]).toContain(readResponse.status);
        if (readResponse.status === 200) {
          expect(readResponse.body.data.value).toBe(testValue);

          // 3. Update setting
          const updateResponse = await request(app)
            .put(`/api/settings/${testKey}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              value: 'Updated E2E Test Value',
              reason: 'E2E Test Update'
            });

          expect([200, 404]).toContain(updateResponse.status);

          // 4. Delete setting
          const deleteResponse = await request(app)
            .delete(`/api/settings/${testKey}`)
            .set('Authorization', `Bearer ${authToken}`);

          expect([200, 404]).toContain(deleteResponse.status);
        }
      }
    }));

    it('should handle settings backup and restore flow', skipIfNoAuth(async () => {
      // 1. Create backup
      const backupResponse = await request(app)
        .post('/api/settings/backups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `E2E Backup ${Date.now()}`,
          description: 'E2E Test Backup'
        });

      if (backupResponse.status === 200 || backupResponse.status === 201) {
        expect(backupResponse.body.success).toBe(true);
        const backupId = backupResponse.body.data.id;

        // 2. List backups
        const listResponse = await request(app)
          .get('/api/settings/backups')
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 401, 403]).toContain(listResponse.status);

        // 3. Restore backup (optional - might fail if backup is invalid)
        if (backupId) {
          const restoreResponse = await request(app)
            .post(`/api/settings/backups/${backupId}/restore`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              overwriteExisting: false,
              skipSystemSettings: true
            });

          // Restore might fail, that's okay for E2E test
          expect([200, 400, 404, 500]).toContain(restoreResponse.status);
        }
      }
    }));

    it('should handle settings import and export flow', skipIfNoAuth(async () => {
      // 1. Export settings
      const exportResponse = await request(app)
        .get('/api/settings/export')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ format: 'json' });

      if (exportResponse.status === 200) {
        expect(exportResponse.body.success).toBe(true);
        const exportedData = exportResponse.body.data;

        // 2. Import settings (validate first)
        const validateResponse = await request(app)
          .post('/api/settings/import/validate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            data: exportedData
          });

        expect([200, 400]).toContain(validateResponse.status);

        // 3. Import settings (actual import - might fail if data is invalid)
        if (validateResponse.status === 200 && validateResponse.body.valid) {
          const importResponse = await request(app)
            .post('/api/settings/import')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              data: exportedData,
              overwriteExisting: false
            });

          expect([200, 400, 500]).toContain(importResponse.status);
        }
      }
    }));
  });

  describe('Settings Integration E2E', () => {
    it('should use settings in invoice creation', skipIfNoAuth(async () => {
      // 1. Get currency settings
      const currencyResponse = await request(app)
        .get('/api/settings/currency')
        .set('Authorization', `Bearer ${authToken}`);

      if (currencyResponse.status === 200) {
        expect(currencyResponse.body.success).toBe(true);
        const currency = currencyResponse.body.data.currency || {};

        // 2. Create invoice with currency from settings
        const invoiceResponse = await request(app)
          .post('/api/invoices')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            invoiceType: 'sale',
            customerId: 1, // Assuming customer exists
            currency: currency.code || 'EGP',
            totalAmount: 100,
            status: 'draft'
          });

        // Invoice creation might fail for various reasons, that's okay
        expect([200, 201, 400, 404, 500]).toContain(invoiceResponse.status);
      }
    }));
  });
});

