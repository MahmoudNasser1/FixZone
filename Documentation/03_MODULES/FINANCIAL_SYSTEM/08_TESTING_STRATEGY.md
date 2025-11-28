# استراتيجية الاختبار - نظام المالية
## Financial System - Testing Strategy

**تاريخ الإنشاء:** 2025-01-27  
**الحالة:** Production System - استراتيجية اختبار شاملة  
**الإصدار:** 1.0.0

---

## 📋 جدول المحتويات

1. [نظرة عامة](#1-نظرة-عامة)
2. [Unit Tests](#2-unit-tests)
3. [Integration Tests](#3-integration-tests)
4. [E2E Tests](#4-e2e-tests)
5. [Performance Tests](#5-performance-tests)
6. [Security Tests](#6-security-tests)
7. [Test Coverage](#7-test-coverage)

---

## 1. نظرة عامة

### 1.1 Test Pyramid

```
        /\
       /E2E\        (10%)
      /------\
     /Integration\  (30%)
    /------------\
   /  Unit Tests  \ (60%)
  /----------------\
```

### 1.2 Testing Tools

- **Unit Tests:** Jest, Mocha
- **Integration Tests:** Supertest, Jest
- **E2E Tests:** Playwright, Cypress
- **Performance Tests:** Artillery, k6
- **Security Tests:** OWASP ZAP, Burp Suite

---

## 2. Unit Tests

### 2.1 Services Tests

```javascript
// tests/services/financial/expenses.service.test.js
const expensesService = require('../../../backend/services/financial/expenses.service');
const expensesRepository = require('../../../backend/repositories/financial/expenses.repository');

jest.mock('../../../backend/repositories/financial/expenses.repository');

describe('ExpensesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create expense successfully', async () => {
      const expenseData = {
        categoryId: 1,
        amount: 1000,
        description: 'Test expense',
        date: '2025-01-27'
      };

      expensesRepository.create.mockResolvedValue({
        id: 1,
        ...expenseData
      });

      const result = await expensesService.create(expenseData, { id: 1 });

      expect(expensesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining(expenseData)
      );
      expect(result.id).toBe(1);
    });

    it('should throw error for invalid amount', async () => {
      const expenseData = {
        categoryId: 1,
        amount: -100,
        description: 'Test expense',
        date: '2025-01-27'
      };

      await expect(
        expensesService.create(expenseData, { id: 1 })
      ).rejects.toThrow('Amount must be positive');
    });
  });
});
```

### 2.2 Repositories Tests

```javascript
// tests/repositories/financial/expenses.repository.test.js
const expensesRepository = require('../../../backend/repositories/financial/expenses.repository');
const db = require('../../../backend/db');

jest.mock('../../../backend/db');

describe('ExpensesRepository', () => {
  describe('findAll', () => {
    it('should return paginated expenses', async () => {
      const mockExpenses = [
        { id: 1, amount: 1000 },
        { id: 2, amount: 2000 }
      ];

      db.query.mockResolvedValueOnce([mockExpenses]);
      db.query.mockResolvedValueOnce([[{ total: 2 }]]);

      const result = await expensesRepository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });
});
```

---

## 3. Integration Tests

### 3.1 API Endpoints Tests

```javascript
// tests/integration/financial/expenses.api.test.js
const request = require('supertest');
const app = require('../../../backend/app');
const db = require('../../../backend/db');

describe('Expenses API', () => {
  let authToken;

  beforeAll(async () => {
    // Login and get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authToken = response.body.token;
  });

  describe('GET /api/financial/expenses', () => {
    it('should return expenses list', async () => {
      const response = await request(app)
        .get('/api/financial/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/financial/expenses')
        .expect(401);
    });
  });

  describe('POST /api/financial/expenses', () => {
    it('should create expense', async () => {
      const expenseData = {
        categoryId: 1,
        amount: 1000,
        description: 'Test expense',
        date: '2025-01-27'
      };

      const response = await request(app)
        .post('/api/financial/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/financial/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });
});
```

---

## 4. E2E Tests

### 4.1 Playwright Tests

```javascript
// tests/e2e/financial/expenses.e2e.test.js
const { test, expect } = require('@playwright/test');

test.describe('Expenses E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create expense', async ({ page }) => {
    // Navigate to expenses
    await page.goto('/financial/expenses');
    
    // Click create button
    await page.click('button:has-text("إضافة نفقة جديدة")');
    
    // Fill form
    await page.selectOption('#categoryId', '1');
    await page.fill('#amount', '1000');
    await page.fill('#description', 'Test expense');
    await page.fill('#date', '2025-01-27');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page).toHaveURL(/\/financial\/expenses\/\d+/);
  });

  test('should list expenses', async ({ page }) => {
    await page.goto('/financial/expenses');
    
    // Verify expenses list is visible
    await expect(page.locator('.expenses-list')).toBeVisible();
    
    // Verify pagination
    await expect(page.locator('.pagination')).toBeVisible();
  });
});
```

---

## 5. Performance Tests

### 5.1 Load Testing

```javascript
// tests/performance/financial/expenses.load.test.js
const artillery = require('artillery');

const config = {
  target: 'http://localhost:5000',
  phases: [
    { duration: 60, arrivalRate: 10 }, // Ramp up
    { duration: 120, arrivalRate: 50 }, // Sustained load
    { duration: 60, arrivalRate: 10 }   // Ramp down
  ],
  scenarios: [
    {
      name: 'Get Expenses',
      flow: [
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: 'test@example.com',
              password: 'password'
            },
            capture: {
              json: '$.token',
              as: 'token'
            }
          }
        },
        {
          get: {
            url: '/api/financial/expenses',
            headers: {
              'Authorization': 'Bearer {{ token }}'
            }
          }
        }
      ]
    }
  ]
};

artillery.run(config);
```

---

## 6. Security Tests

### 6.1 SQL Injection Tests

```javascript
// tests/security/financial/sql-injection.test.js
describe('SQL Injection Protection', () => {
  it('should prevent SQL injection in expense search', async () => {
    const maliciousInput = "'; DROP TABLE Expense; --";
    
    const response = await request(app)
      .get(`/api/financial/expenses?q=${encodeURIComponent(maliciousInput)}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Should not cause error or data loss
    expect(response.status).toBe(200);
    
    // Verify table still exists
    const [tables] = await db.query("SHOW TABLES LIKE 'Expense'");
    expect(tables.length).toBe(1);
  });
});
```

### 6.2 XSS Tests

```javascript
// tests/security/financial/xss.test.js
describe('XSS Protection', () => {
  it('should sanitize expense description', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    
    const response = await request(app)
      .post('/api/financial/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        categoryId: 1,
        amount: 1000,
        description: xssPayload,
        date: '2025-01-27'
      });

    expect(response.status).toBe(201);
    
    // Verify script tags are removed
    const expense = await expensesRepository.findById(response.body.data.id);
    expect(expense.description).not.toContain('<script>');
  });
});
```

---

## 7. Test Coverage

### 7.1 Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Services | 85%+ |
| Repositories | 80%+ |
| Controllers | 75%+ |
| Routes | 70%+ |
| Overall | 80%+ |

### 7.2 Coverage Report

```bash
# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

---

## 📚 المراجع

- [خطة Backend](./02_BACKEND_DEVELOPMENT_PLAN.md)
- [خطة Frontend](./03_FRONTEND_DEVELOPMENT_PLAN.md)
- [خطة التنفيذ](./07_IMPLEMENTATION_PLAN.md)

---

**آخر تحديث:** 2025-01-27

