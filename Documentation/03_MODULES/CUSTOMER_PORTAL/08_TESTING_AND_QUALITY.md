# الاختبارات والجودة - بورتال العملاء

## 1. نظرة عامة

هذا المستند يغطي استراتيجية الاختبارات وضمان الجودة لبورتال العملاء، بما في ذلك Unit Tests، Integration Tests، E2E Tests، Performance Tests، Security Tests، و QA Checklist.

## 2. استراتيجية الاختبارات

### 2.1 هرم الاختبارات (Testing Pyramid)

```
        /\
       /  \
      /E2E \         10% - End-to-End Tests
     /------\
    /        \
   /Integration\    30% - Integration Tests
  /------------\
 /              \
/   Unit Tests   \  60% - Unit Tests
------------------
```

### 2.2 Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: 70%+ coverage
- **E2E Tests**: Critical user journeys
- **Performance Tests**: All API endpoints
- **Security Tests**: All security-critical paths

## 3. Unit Tests

### 3.1 Backend Unit Tests

#### 3.1.1 Customer Service Tests

**الملف**: `backend/__tests__/services/customer/customerService.test.js`

```javascript
const customerService = require('../../../services/customer/customerService');
const db = require('../../../db');

jest.mock('../../../db');

describe('CustomerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByLoginIdentifier', () => {
    test('should find customer by phone', async () => {
      const mockCustomer = {
        id: 1,
        phone: '01012345678',
        email: 'test@example.com'
      };

      db.query.mockResolvedValue([[mockCustomer]]);

      const result = await customerService.findByLoginIdentifier('01012345678');

      expect(result).toEqual(mockCustomer);
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['01012345678', '01012345678']
      );
    });

    test('should find customer by email', async () => {
      const mockCustomer = {
        id: 1,
        phone: '01012345678',
        email: 'test@example.com'
      };

      db.query.mockResolvedValue([[mockCustomer]]);

      const result = await customerService.findByLoginIdentifier('test@example.com');

      expect(result).toEqual(mockCustomer);
    });

    test('should return null if customer not found', async () => {
      db.query.mockResolvedValue([[]]);

      const result = await customerService.findByLoginIdentifier('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    test('should update customer profile', async () => {
      const customerId = 1;
      const updateData = {
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        phone: '01012345678',
        address: 'القاهرة'
      };

      db.query
        .mockResolvedValueOnce([[]]) // Update query
        .mockResolvedValueOnce([[{ id: 1, ...updateData }]]); // Select query

      const result = await customerService.updateProfile(customerId, updateData);

      expect(result).toMatchObject(updateData);
      expect(db.query).toHaveBeenCalledTimes(2);
    });
  });
});
```

#### 3.1.2 Repair Service Tests

**الملف**: `backend/__tests__/services/customer/repairService.test.js`

```javascript
const repairService = require('../../../services/customer/repairService');
const db = require('../../../db');

jest.mock('../../../db');

describe('RepairService', () => {
  describe('getRepairs', () => {
    test('should get repairs with pagination', async () => {
      const customerId = 1;
      const options = {
        page: 1,
        limit: 20,
        status: 'in_progress',
        sortBy: 'createdAt',
        sortDir: 'DESC'
      };

      const mockRepairs = [
        { id: 1, customerId: 1, status: 'in_progress' },
        { id: 2, customerId: 1, status: 'in_progress' }
      ];

      db.query
        .mockResolvedValueOnce([mockRepairs]) // Get repairs
        .mockResolvedValueOnce([[{ total: 2 }]]); // Get count

      const result = await repairService.getRepairs(customerId, options);

      expect(result.repairs).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    test('should filter by status', async () => {
      const customerId = 1;
      const options = {
        page: 1,
        limit: 20,
        status: 'completed'
      };

      db.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total: 0 }]]);

      const result = await repairService.getRepairs(customerId, options);

      expect(result.repairs).toHaveLength(0);
    });
  });

  describe('getRepairDetails', () => {
    test('should get repair details', async () => {
      const customerId = 1;
      const repairId = 1;

      const mockRepair = {
        id: 1,
        customerId: 1,
        deviceName: 'لابتوب Dell',
        status: 'in_progress'
      };

      db.query.mockResolvedValue([[mockRepair]]);

      const result = await repairService.getRepairDetails(customerId, repairId);

      expect(result).toEqual(mockRepair);
    });

    test('should return null if repair not found', async () => {
      const customerId = 1;
      const repairId = 999;

      db.query.mockResolvedValue([[]]);

      const result = await repairService.getRepairDetails(customerId, repairId);

      expect(result).toBeNull();
    });

    test('should return null if repair does not belong to customer', async () => {
      const customerId = 1;
      const repairId = 1;

      const mockRepair = {
        id: 1,
        customerId: 2, // Different customer
        deviceName: 'لابتوب Dell'
      };

      db.query.mockResolvedValue([[mockRepair]]);

      const result = await repairService.getRepairDetails(customerId, repairId);

      expect(result).toBeNull();
    });
  });

  describe('addComment', () => {
    test('should add comment to repair', async () => {
      const customerId = 1;
      const repairId = 1;
      const comment = 'متى سيكتمل الإصلاح؟';

      db.query
        .mockResolvedValueOnce([[{ id: 1, customerId: 1 }]]) // Verify ownership
        .mockResolvedValueOnce([{ insertId: 100 }]); // Insert comment

      const result = await repairService.addComment(customerId, repairId, comment);

      expect(result.comment).toBe(comment);
      expect(result.repairId).toBe(repairId);
    });

    test('should throw error if repair not found', async () => {
      const customerId = 1;
      const repairId = 999;
      const comment = 'Test comment';

      db.query.mockResolvedValueOnce([[]]); // Repair not found

      await expect(
        repairService.addComment(customerId, repairId, comment)
      ).rejects.toThrow('Repair not found');
    });
  });
});
```

#### 3.1.3 Auth Controller Tests

**الملف**: `backend/__tests__/controllers/customer/authController.test.js`

```javascript
const authController = require('../../../controllers/customer/authController');
const customerService = require('../../../services/customer/customerService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../../services/customer/customerService');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      cookies: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };
  });

  describe('login', () => {
    test('should login successfully', async () => {
      const mockCustomer = {
        id: 1,
        userId: 10,
        phone: '01012345678',
        email: 'test@example.com',
        password: 'hashed_password',
        isActive: true,
        roleId: 6
      };

      req.body = {
        loginIdentifier: '01012345678',
        password: 'password123'
      };

      customerService.findByLoginIdentifier.mockResolvedValue(mockCustomer);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock_token');
      customerService.updateLastLogin.mockResolvedValue();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.any(Object),
            token: 'mock_token'
          })
        })
      );
      expect(res.cookie).toHaveBeenCalled();
    });

    test('should return 401 for invalid credentials', async () => {
      req.body = {
        loginIdentifier: '01012345678',
        password: 'wrong_password'
      };

      const mockCustomer = {
        id: 1,
        password: 'hashed_password'
      };

      customerService.findByLoginIdentifier.mockResolvedValue(mockCustomer);
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'بيانات الدخول غير صحيحة'
        })
      );
    });

    test('should return 401 for non-existent customer', async () => {
      req.body = {
        loginIdentifier: '01012345678',
        password: 'password123'
      };

      customerService.findByLoginIdentifier.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 403 for inactive account', async () => {
      const mockCustomer = {
        id: 1,
        password: 'hashed_password',
        isActive: false
      };

      req.body = {
        loginIdentifier: '01012345678',
        password: 'password123'
      };

      customerService.findByLoginIdentifier.mockResolvedValue(mockCustomer);
      bcrypt.compare.mockResolvedValue(true);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'الحساب غير مفعّل'
        })
      );
    });
  });
});
```

### 3.2 Frontend Unit Tests

#### 3.2.1 Customer API Service Tests

**الملف**: `frontend/react-app/src/__tests__/services/customerApi.test.js`

```javascript
import customerApi from '../../services/customerApi';
import api from '../../services/api';

jest.mock('../../services/api');

describe('CustomerApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRepairs', () => {
    test('should fetch repairs successfully', async () => {
      const mockRepairs = [
        { id: 1, deviceName: 'لابتوب Dell', status: 'in_progress' }
      ];

      api.request.mockResolvedValue({
        success: true,
        data: mockRepairs
      });

      const result = await customerApi.getRepairs();

      expect(result).toEqual(mockRepairs);
      expect(api.request).toHaveBeenCalledWith(
        '/api/customer/repairs',
        expect.any(Object)
      );
    });

    test('should handle errors', async () => {
      api.request.mockRejectedValue(new Error('Network error'));

      await expect(customerApi.getRepairs()).rejects.toThrow('Network error');
    });
  });

  describe('getRepairDetails', () => {
    test('should fetch repair details', async () => {
      const repairId = 1;
      const mockRepair = {
        id: 1,
        deviceName: 'لابتوب Dell',
        status: 'in_progress',
        timeline: []
      };

      api.request.mockResolvedValue({
        success: true,
        data: mockRepair
      });

      const result = await customerApi.getRepairDetails(repairId);

      expect(result).toEqual(mockRepair);
      expect(api.request).toHaveBeenCalledWith(
        `/api/customer/repairs/${repairId}`,
        expect.any(Object)
      );
    });
  });
});
```

#### 3.2.2 Customer Store Tests

**الملف**: `frontend/react-app/src/__tests__/stores/customerStore.test.js`

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import useCustomerStore from '../../stores/customerStore';

describe('CustomerStore', () => {
  beforeEach(() => {
    // Reset store
    useCustomerStore.setState({
      profile: null,
      repairs: [],
      invoices: [],
      devices: [],
      notifications: [],
      unreadCount: 0
    });
  });

  test('should set profile', () => {
    const { result } = renderHook(() => useCustomerStore());

    act(() => {
      result.current.setProfile({
        id: 1,
        name: 'أحمد محمد',
        email: 'ahmed@example.com'
      });
    });

    expect(result.current.profile).toEqual({
      id: 1,
      name: 'أحمد محمد',
      email: 'ahmed@example.com'
    });
  });

  test('should set repairs', () => {
    const { result } = renderHook(() => useCustomerStore());

    const mockRepairs = [
      { id: 1, deviceName: 'لابتوب Dell' },
      { id: 2, deviceName: 'موبايل Samsung' }
    ];

    act(() => {
      result.current.setRepairs(mockRepairs);
    });

    expect(result.current.repairs).toEqual(mockRepairs);
  });

  test('should clear all data', () => {
    const { result } = renderHook(() => useCustomerStore());

    act(() => {
      result.current.setProfile({ id: 1, name: 'Test' });
      result.current.setRepairs([{ id: 1 }]);
    });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.repairs).toEqual([]);
  });
});
```

#### 3.2.3 Component Tests

**الملف**: `frontend/react-app/src/__tests__/components/customer/CustomerDashboard.test.js`

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CustomerDashboard from '../../../pages/customer/CustomerDashboard';
import customerApi from '../../../services/customerApi';

jest.mock('../../../services/customerApi');
jest.mock('../../../stores/authStore', () => ({
  __esModule: true,
  default: () => ({
    user: { id: 1, customerId: 1, type: 'customer' },
    forcePasswordReset: false
  })
}));

describe('CustomerDashboard', () => {
  test('should render dashboard', async () => {
    const mockStats = {
      repairs: { total: 10, active: 2, completed: 8 },
      invoices: { total: 5, paid: 4, pending: 1 }
    };

    customerApi.getDashboardStats.mockResolvedValue(mockStats);
    customerApi.getRecentRepairs.mockResolvedValue([]);
    customerApi.getRecentInvoices.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CustomerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('لوحة التحكم')).toBeInTheDocument();
    });
  });

  test('should display loading state', () => {
    customerApi.getDashboardStats.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <CustomerDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  test('should display error state', async () => {
    customerApi.getDashboardStats.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <CustomerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/خطأ/i)).toBeInTheDocument();
    });
  });
});
```

## 4. Integration Tests

### 4.1 API Integration Tests

**الملف**: `backend/__tests__/integration/customer-api.test.js`

```javascript
const request = require('supertest');
const app = require('../../app');
const db = require('../../db');

describe('Customer API Integration', () => {
  let customerToken;
  let customerId;

  beforeAll(async () => {
    // Create test customer
    const [result] = await db.query(
      'INSERT INTO Customer (name, phone, email) VALUES (?, ?, ?)',
      ['Test Customer', '01012345678', 'test@example.com']
    );
    customerId = result.insertId;

    // Create user account
    const hashedPassword = await bcrypt.hash('password123', 10);
    await db.query(
      'INSERT INTO User (customerId, email, password, roleId) VALUES (?, ?, ?, ?)',
      [customerId, 'test@example.com', hashedPassword, 6]
    );

    // Login to get token
    const loginRes = await request(app)
      .post('/api/customer/auth/login')
      .send({
        loginIdentifier: '01012345678',
        password: 'password123'
      });

    customerToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    // Cleanup
    await db.query('DELETE FROM User WHERE customerId = ?', [customerId]);
    await db.query('DELETE FROM Customer WHERE id = ?', [customerId]);
  });

  describe('GET /api/customer/dashboard/stats', () => {
    test('should get dashboard stats', async () => {
      const response = await request(app)
        .get('/api/customer/dashboard/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('repairs');
      expect(response.body.data).toHaveProperty('invoices');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/customer/dashboard/stats');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/customer/repairs', () => {
    test('should get customer repairs', async () => {
      // Create test repair
      const [repairResult] = await db.query(
        'INSERT INTO RepairRequest (customerId, deviceName, issue, status) VALUES (?, ?, ?, ?)',
        [customerId, 'Test Device', 'Test Issue', 'pending']
      );

      const response = await request(app)
        .get('/api/customer/repairs')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Cleanup
      await db.query('DELETE FROM RepairRequest WHERE id = ?', [repairResult.insertId]);
    });

    test('should only return customer own repairs', async () => {
      // Create repair for different customer
      const [otherCustomer] = await db.query(
        'INSERT INTO Customer (name, phone) VALUES (?, ?)',
        ['Other Customer', '01099999999']
      );

      await db.query(
        'INSERT INTO RepairRequest (customerId, deviceName, issue) VALUES (?, ?, ?)',
        [otherCustomer.insertId, 'Other Device', 'Other Issue']
      );

      const response = await request(app)
        .get('/api/customer/repairs')
        .set('Authorization', `Bearer ${customerToken}`);

      // Should not include other customer's repairs
      const otherCustomerRepairs = response.body.data.filter(
        r => r.customerId !== customerId
      );
      expect(otherCustomerRepairs).toHaveLength(0);

      // Cleanup
      await db.query('DELETE FROM RepairRequest WHERE customerId = ?', [otherCustomer.insertId]);
      await db.query('DELETE FROM Customer WHERE id = ?', [otherCustomer.insertId]);
    });
  });

  describe('POST /api/customer/repairs/:id/comments', () => {
    test('should add comment to repair', async () => {
      // Create test repair
      const [repairResult] = await db.query(
        'INSERT INTO RepairRequest (customerId, deviceName, issue) VALUES (?, ?, ?)',
        [customerId, 'Test Device', 'Test Issue']
      );
      const repairId = repairResult.insertId;

      const response = await request(app)
        .post(`/api/customer/repairs/${repairId}/comments`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          comment: 'Test comment'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.comment).toBe('Test comment');

      // Cleanup
      await db.query('DELETE FROM RepairComment WHERE repairId = ?', [repairId]);
      await db.query('DELETE FROM RepairRequest WHERE id = ?', [repairId]);
    });

    test('should not allow comment on other customer repair', async () => {
      // Create repair for different customer
      const [otherCustomer] = await db.query(
        'INSERT INTO Customer (name, phone) VALUES (?, ?)',
        ['Other Customer', '01099999999']
      );

      const [repairResult] = await db.query(
        'INSERT INTO RepairRequest (customerId, deviceName, issue) VALUES (?, ?, ?)',
        [otherCustomer.insertId, 'Other Device', 'Other Issue']
      );
      const repairId = repairResult.insertId;

      const response = await request(app)
        .post(`/api/customer/repairs/${repairId}/comments`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          comment: 'Test comment'
        });

      expect(response.status).toBe(403);

      // Cleanup
      await db.query('DELETE FROM RepairRequest WHERE id = ?', [repairId]);
      await db.query('DELETE FROM Customer WHERE id = ?', [otherCustomer.insertId]);
    });
  });
});
```

### 4.2 Frontend-Backend Integration Tests

**الملف**: `frontend/react-app/src/__tests__/integration/customer-flow.test.js`

```javascript
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CustomerDashboard from '../../pages/customer/CustomerDashboard';
import customerApi from '../../services/customerApi';
import api from '../../services/api';

// Mock API
jest.mock('../../services/api');
jest.mock('../../services/customerApi');

describe('Customer Flow Integration', () => {
  test('complete customer journey', async () => {
    // Mock API responses
    const mockStats = {
      repairs: { total: 5, active: 2, completed: 3 },
      invoices: { total: 3, paid: 2, pending: 1 }
    };

    const mockRepairs = [
      { id: 1, deviceName: 'لابتوب Dell', status: 'in_progress' },
      { id: 2, deviceName: 'موبايل Samsung', status: 'completed' }
    ];

    customerApi.getDashboardStats.mockResolvedValue(mockStats);
    customerApi.getRecentRepairs.mockResolvedValue(mockRepairs);
    customerApi.getRecentInvoices.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CustomerDashboard />
      </BrowserRouter>
    );

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('لوحة التحكم')).toBeInTheDocument();
    });

    // Check stats are displayed
    expect(screen.getByText(/5/i)).toBeInTheDocument(); // Total repairs

    // Navigate to repairs
    const repairsLink = screen.getByText(/طلبات الإصلاح/i);
    fireEvent.click(repairsLink);

    // Mock repairs page API
    customerApi.getRepairs.mockResolvedValue({
      repairs: mockRepairs,
      pagination: { page: 1, total: 2, totalPages: 1 }
    });

    await waitFor(() => {
      expect(customerApi.getRepairs).toHaveBeenCalled();
    });
  });
});
```

## 5. End-to-End Tests

### 5.1 E2E Tests with Playwright

**الملف**: `e2e/customer-portal.spec.js`

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Customer Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/customer/login');
  });

  test('customer can login and view dashboard', async ({ page }) => {
    // Login
    await page.fill('#loginIdentifier', '01012345678');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL(/\/customer\/dashboard/);
    await expect(page.locator('text=لوحة التحكم')).toBeVisible();
  });

  test('customer can view repairs', async ({ page }) => {
    // Login (assuming we have a helper function)
    await login(page, '01012345678', 'password123');

    // Navigate to repairs
    await page.click('text=طلبات الإصلاح');
    await expect(page).toHaveURL(/\/customer\/repairs/);

    // Check repairs are displayed
    await expect(page.locator('.repair-card')).toHaveCount(2);
  });

  test('customer can view repair details', async ({ page }) => {
    await login(page, '01012345678', 'password123');

    // Go to repairs page
    await page.click('text=طلبات الإصلاح');
    await page.waitForSelector('.repair-card');

    // Click on first repair
    await page.click('.repair-card:first-child');
    await expect(page).toHaveURL(/\/customer\/repairs\/\d+/);

    // Check repair details are displayed
    await expect(page.locator('text=تفاصيل طلب الإصلاح')).toBeVisible();
  });

  test('customer can add comment to repair', async ({ page }) => {
    await login(page, '01012345678', 'password123');

    // Navigate to repair details
    await page.goto('/customer/repairs/1');
    await page.waitForSelector('.comments-section');

    // Add comment
    await page.fill('#comment-input', 'متى سيكتمل الإصلاح؟');
    await page.click('button:has-text("إضافة تعليق")');

    // Check comment appears
    await expect(page.locator('text=متى سيكتمل الإصلاح؟')).toBeVisible();
  });

  test('customer can view invoices', async ({ page }) => {
    await login(page, '01012345678', 'password123');

    // Navigate to invoices
    await page.click('text=الفواتير');
    await expect(page).toHaveURL(/\/customer\/invoices/);

    // Check invoices are displayed
    await expect(page.locator('.invoice-card')).toHaveCount(3);
  });

  test('customer can download invoice PDF', async ({ page }) => {
    await login(page, '01012345678', 'password123');

    // Navigate to invoice details
    await page.goto('/customer/invoices/1');
    await page.waitForSelector('.invoice-details');

    // Click download button
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("تحميل PDF")')
    ]);

    expect(download.suggestedFilename()).toContain('.pdf');
  });
});

// Helper function
async function login(page, identifier, password) {
  await page.goto('http://localhost:3000/customer/login');
  await page.fill('#loginIdentifier', identifier);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/customer\/dashboard/);
}
```

## 6. Performance Tests

### 6.1 Load Testing

**الملف**: `tests/performance/load-test.js`

```javascript
const http = require('http');
const { performance } = require('perf_hooks');

const API_URL = 'http://localhost:3000';
const CONCURRENT_REQUESTS = 100;
const REQUESTS_PER_SECOND = 50;

async function makeRequest(endpoint, token) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const duration = performance.now() - start;
        resolve({
          statusCode: res.statusCode,
          duration,
          success: res.statusCode === 200
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function loadTest() {
  const token = 'test_token'; // Get from login
  const endpoint = '/api/customer/dashboard/stats';
  
  const results = [];
  const startTime = performance.now();

  // Make concurrent requests
  const promises = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    promises.push(makeRequest(endpoint, token));
  }

  const responses = await Promise.all(promises);
  const endTime = performance.now();

  // Calculate metrics
  const totalTime = endTime - startTime;
  const successful = responses.filter(r => r.success).length;
  const failed = responses.length - successful;
  const avgResponseTime = responses.reduce((sum, r) => sum + r.duration, 0) / responses.length;
  const maxResponseTime = Math.max(...responses.map(r => r.duration));
  const minResponseTime = Math.min(...responses.map(r => r.duration));

  console.log('Load Test Results:');
  console.log(`Total Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Max Response Time: ${maxResponseTime.toFixed(2)}ms`);
  console.log(`Min Response Time: ${minResponseTime.toFixed(2)}ms`);
  console.log(`Requests Per Second: ${(CONCURRENT_REQUESTS / (totalTime / 1000)).toFixed(2)}`);

  // Assertions
  expect(successful).toBeGreaterThan(CONCURRENT_REQUESTS * 0.95); // 95% success rate
  expect(avgResponseTime).toBeLessThan(500); // < 500ms average
  expect(maxResponseTime).toBeLessThan(2000); // < 2s max
}

loadTest();
```

### 6.2 Stress Testing

**الملف**: `tests/performance/stress-test.js`

```javascript
// Gradually increase load
async function stressTest() {
  const loads = [10, 50, 100, 200, 500, 1000];
  
  for (const load of loads) {
    console.log(`Testing with ${load} concurrent requests...`);
    
    const results = await runLoadTest(load);
    
    console.log(`Results for ${load} requests:`);
    console.log(`Success Rate: ${(results.successful / load * 100).toFixed(2)}%`);
    console.log(`Average Response Time: ${results.avgResponseTime.toFixed(2)}ms`);
    
    // Stop if failure rate is too high
    if (results.successful / load < 0.8) {
      console.log(`System failed at ${load} concurrent requests`);
      break;
    }
    
    // Wait before next load
    await sleep(5000);
  }
}
```

## 7. Security Tests

### 7.1 SQL Injection Tests

**الملف**: `tests/security/sql-injection.test.js`

```javascript
describe('SQL Injection Prevention', () => {
  test('should prevent SQL injection in repair ID', async () => {
    const maliciousInput = "1' OR '1'='1";
    
    const response = await request(app)
      .get(`/api/customer/repairs/${maliciousInput}`)
      .set('Authorization', `Bearer ${token}`);

    // Should not return all repairs
    expect(response.status).not.toBe(200);
  });

  test('should prevent SQL injection in search', async () => {
    const maliciousInput = "'; DROP TABLE Customer; --";
    
    const response = await request(app)
      .get('/api/customer/repairs')
      .query({ search: maliciousInput })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});
```

### 7.2 XSS Tests

**الملف**: `tests/security/xss.test.js`

```javascript
describe('XSS Prevention', () => {
  test('should sanitize user input in comments', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    
    const response = await request(app)
      .post('/api/customer/repairs/1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ comment: xssPayload });

    expect(response.status).toBe(200);
    expect(response.body.data.comment).not.toContain('<script>');
    expect(response.body.data.comment).toContain('&lt;script&gt;');
  });

  test('should sanitize user input in profile', async () => {
    const xssPayload = '<img src=x onerror=alert(1)>';
    
    const response = await request(app)
      .put('/api/customer/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: xssPayload });

    expect(response.status).toBe(200);
    expect(response.body.data.name).not.toContain('<img');
  });
});
```

### 7.3 Authentication Tests

**الملف**: `tests/security/authentication.test.js`

```javascript
describe('Authentication Security', () => {
  test('should require authentication for protected routes', async () => {
    const response = await request(app)
      .get('/api/customer/dashboard/stats');

    expect(response.status).toBe(401);
  });

  test('should reject invalid tokens', async () => {
    const response = await request(app)
      .get('/api/customer/dashboard/stats')
      .set('Authorization', 'Bearer invalid_token');

    expect(response.status).toBe(401);
  });

  test('should reject expired tokens', async () => {
    // Create expired token
    const expiredToken = jwt.sign(
      { id: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' }
    );

    const response = await request(app)
      .get('/api/customer/dashboard/stats')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  test('should prevent access to other customer data', async () => {
    // Create token for customer 1
    const token1 = createToken({ customerId: 1 });

    // Try to access customer 2's data
    const response = await request(app)
      .get('/api/customer/repairs')
      .set('Authorization', `Bearer ${token1}`);

    // Should only return customer 1's repairs
    response.body.data.forEach(repair => {
      expect(repair.customerId).toBe(1);
    });
  });
});
```

## 8. QA Checklist

### 8.1 Functional Testing

- [ ] **Authentication**
  - [ ] Login with valid credentials
  - [ ] Login with invalid credentials
  - [ ] Login with inactive account
  - [ ] Logout functionality
  - [ ] Password reset
  - [ ] Session timeout

- [ ] **Dashboard**
  - [ ] Stats display correctly
  - [ ] Recent repairs display
  - [ ] Recent invoices display
  - [ ] Quick actions work
  - [ ] Responsive design

- [ ] **Repairs**
  - [ ] List repairs
  - [ ] Filter repairs
  - [ ] Sort repairs
  - [ ] View repair details
  - [ ] Add comment
  - [ ] View timeline
  - [ ] View attachments

- [ ] **Invoices**
  - [ ] List invoices
  - [ ] Filter invoices
  - [ ] View invoice details
  - [ ] Download PDF
  - [ ] Pay invoice
  - [ ] View payment history

- [ ] **Devices**
  - [ ] List devices
  - [ ] Add device
  - [ ] Update device
  - [ ] Delete device
  - [ ] View device repairs

- [ ] **Notifications**
  - [ ] View notifications
  - [ ] Mark as read
  - [ ] Mark all as read
  - [ ] Delete notification
  - [ ] Real-time updates

- [ ] **Profile**
  - [ ] View profile
  - [ ] Update profile
  - [ ] Change password
  - [ ] Upload avatar

### 8.2 Non-Functional Testing

- [ ] **Performance**
  - [ ] Page load time < 2s
  - [ ] API response time < 500ms
  - [ ] Supports 1000+ concurrent users
  - [ ] No memory leaks

- [ ] **Security**
  - [ ] SQL injection prevention
  - [ ] XSS prevention
  - [ ] CSRF protection
  - [ ] Authentication required
  - [ ] Authorization checks
  - [ ] Input validation
  - [ ] Rate limiting

- [ ] **Usability**
  - [ ] Intuitive navigation
  - [ ] Clear error messages
  - [ ] Helpful tooltips
  - [ ] Accessible (WCAG AA)
  - [ ] Mobile responsive

- [ ] **Compatibility**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)
  - [ ] Mobile browsers

### 8.3 Edge Cases

- [ ] Empty states (no repairs, no invoices)
- [ ] Large datasets (1000+ items)
- [ ] Special characters in input
- [ ] Very long text inputs
- [ ] Network failures
- [ ] Server errors
- [ ] Concurrent requests
- [ ] Session expiration during use

## 9. Test Coverage Reports

### 9.1 Coverage Tools

- **Backend**: Jest with coverage
- **Frontend**: Jest + React Testing Library
- **E2E**: Playwright coverage

### 9.2 Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### 9.3 Generating Reports

```bash
# Backend coverage
npm run test:coverage

# Frontend coverage
npm run test:coverage:frontend

# Combined report
npm run test:coverage:all
```

## 10. Continuous Testing

### 10.1 CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## 11. Test Data Management

### 11.1 Test Fixtures

```javascript
// fixtures/customers.js
export const testCustomers = {
  active: {
    id: 1,
    name: 'أحمد محمد',
    phone: '01012345678',
    email: 'ahmed@example.com',
    isActive: true
  },
  inactive: {
    id: 2,
    name: 'محمد علي',
    phone: '01099999999',
    email: 'mohamed@example.com',
    isActive: false
  }
};
```

### 11.2 Test Database

```javascript
// Use separate test database
const TEST_DB = process.env.TEST_DATABASE_URL;

beforeAll(async () => {
  // Setup test database
  await setupTestDatabase();
});

afterAll(async () => {
  // Cleanup test database
  await cleanupTestDatabase();
});

beforeEach(async () => {
  // Reset test data
  await resetTestData();
});
```

## 12. Checklist

### 12.1 Test Implementation
- [ ] Unit tests for all services
- [ ] Unit tests for all controllers
- [ ] Unit tests for all components
- [ ] Integration tests for API
- [ ] Integration tests for Frontend-Backend
- [ ] E2E tests for critical flows
- [ ] Performance tests
- [ ] Security tests

### 12.2 Test Quality
- [ ] Test coverage > 80%
- [ ] All tests passing
- [ ] Tests are maintainable
- [ ] Tests are fast
- [ ] Tests are isolated

### 12.3 Test Documentation
- [ ] Test strategy documented
- [ ] Test cases documented
- [ ] Test results documented
- [ ] Coverage reports generated

---

**نهاية الوثائق - العودة إلى [الفهرس الرئيسي](./00_INDEX.md)**

