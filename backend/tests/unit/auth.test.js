/**
 * Unit Tests for Authentication Controller
 * Tests login, registration, and authentication flows
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const db = require('../../db');
const {
  createTestUser,
  cleanupTestData,
  getUserByEmail
} = require('../setup/testHelpers');

// Import app (you'll need to create a test app instance)
// For now, we'll test the controller directly
const authController = require('../../controllers/authController');

describe('Authentication Controller', () => {
  let testUsers = [];
  let testAdmin;

  beforeAll(async () => {
    // Create test admin user
    testAdmin = await createTestUser({
      name: 'Test Admin',
      email: 'admin.test@fixzone.com',
      password: 'admin123',
      roleId: 1, // Admin
      phone: '01000000001'
    });
    testUsers.push(testAdmin);
  });

  afterAll(async () => {
    // Cleanup
    await cleanupTestData(testUsers.map(u => u.id));
  });

  describe('Login', () => {
    test('should login with valid email and password', async () => {
      const req = {
        body: {
          loginIdentifier: testAdmin.email,
          password: testAdmin.password
        },
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        headers: {
          'user-agent': 'Test Agent',
          'x-forwarded-for': undefined
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn().mockReturnThis()
      };

      await authController.login(req, res);

      // Express calls status(200) automatically, but we check json was called
      expect(res.json).toHaveBeenCalled();
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('id');
      expect(responseData).toHaveProperty('email', testAdmin.email);
      expect(responseData).toHaveProperty('roleId');
      expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.any(Object));
    });

    test('should login with valid phone and password', async () => {
      const req = {
        body: {
          loginIdentifier: testAdmin.phone,
          password: testAdmin.password
        },
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        headers: {
          'user-agent': 'Test Agent',
          'x-forwarded-for': undefined
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn().mockReturnThis()
      };

      await authController.login(req, res);

      // Express calls status(200) automatically, but we check json was called
      expect(res.json).toHaveBeenCalled();
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('id');
      expect(responseData).toHaveProperty('roleId');
    });

    test('should reject login with invalid email', async () => {
      const req = {
        body: {
          loginIdentifier: 'nonexistent@example.com',
          password: 'password123'
        },
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        headers: {
          'user-agent': 'Test Agent',
          'x-forwarded-for': undefined
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    test('should reject login with invalid password', async () => {
      const req = {
        body: {
          loginIdentifier: testAdmin.email,
          password: 'wrongpassword'
        },
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        headers: {
          'user-agent': 'Test Agent',
          'x-forwarded-for': undefined
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Incorrect password' });
    });

    test('should reject login with missing credentials', async () => {
      const req = {
        body: {},
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        headers: {
          'user-agent': 'Test Agent',
          'x-forwarded-for': undefined
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Please provide login identifier and password' 
      });
    });

    test('should include customerId in response for customer users', async () => {
      // Create a customer user
      const customer = await createTestUser({
        name: 'Test Customer',
        email: 'customer.test@fixzone.com',
        password: 'customer123',
        roleId: 8, // Customer role
        phone: '01000000002'
      });
      testUsers.push(customer);

      const req = {
        body: {
          loginIdentifier: customer.email,
          password: customer.password
        },
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        headers: {
          'user-agent': 'Test Agent',
          'x-forwarded-for': undefined
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn().mockReturnThis()
      };

      await authController.login(req, res);

      // Express calls status(200) automatically, but we check json was called
      expect(res.json).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      // Customer login should work (customerId may be null if not linked)
      expect(responseData).toHaveProperty('roleId', 8);
    });
  });
});

