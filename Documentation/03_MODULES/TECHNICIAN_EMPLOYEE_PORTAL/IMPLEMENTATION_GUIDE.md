# دليل التنفيذ العملي - بورتال الفنيين والموظفين
## Implementation Guide - Technician & Employee Portal

**التاريخ:** 2025-01-27  
**الحالة:** Production System  
**الأولوية:** 🔥 عالية جداً

---

## 📋 جدول المحتويات

1. [المتطلبات الأساسية](#المتطلبات-الأساسية)
2. [إعداد قاعدة البيانات](#إعداد-قاعدة-البيانات)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [التكامل والاختبار](#التكامل-والاختبار)
6. [النشر في Production](#النشر-في-production)
7. [المراقبة والصيانة](#المراقبة-والصيانة)

---

## 1. المتطلبات الأساسية

### 1.1 المتطلبات التقنية

```bash
# Backend
Node.js >= 18.0.0
MySQL >= 8.0
Express.js >= 4.18.0
Socket.io >= 4.5.0

# Frontend
React >= 18.0.0
Zustand >= 4.3.0
React Router >= 6.8.0
Axios >= 1.3.0
```

### 1.2 المتطلبات الأمنية

- SSL Certificate
- Environment Variables
- JWT Secret Key
- Database Credentials
- File Upload Directory Permissions

---

## 2. إعداد قاعدة البيانات

### 2.1 إنشاء الجداول الجديدة

```sql
-- File: backend/migrations/20250127_create_portal_tables.sql

-- Technician Status Table
CREATE TABLE IF NOT EXISTS TechnicianStatus (
  id INT PRIMARY KEY AUTO_INCREMENT,
  technicianId INT NOT NULL,
  status ENUM('ONLINE', 'BUSY', 'BREAK', 'OFFLINE') DEFAULT 'OFFLINE',
  location JSON,
  lastSeenAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_technician_status (technicianId, status),
  INDEX idx_last_seen (lastSeenAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Activity Table
CREATE TABLE IF NOT EXISTS EmployeeActivity (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employeeId INT NOT NULL,
  activityType VARCHAR(50) NOT NULL,
  entityType VARCHAR(50),
  entityId INT,
  details JSON,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employeeId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_employee_activity (employeeId, createdAt),
  INDEX idx_activity_type (activityType, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Time Tracking Table
CREATE TABLE IF NOT EXISTS TimeTracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  userType ENUM('TECHNICIAN', 'EMPLOYEE') NOT NULL,
  clockInAt TIMESTAMP NOT NULL,
  clockOutAt TIMESTAMP NULL,
  location JSON,
  totalMinutes INT,
  breakMinutes INT DEFAULT 0,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_user_time (userId, clockInAt),
  INDEX idx_date_range (clockInAt, clockOutAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Portal Notifications Table
CREATE TABLE IF NOT EXISTS PortalNotification (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  userType ENUM('TECHNICIAN', 'EMPLOYEE', 'CUSTOMER') NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSON,
  isRead BOOLEAN DEFAULT FALSE,
  readAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_user_notifications (userId, isRead, createdAt),
  INDEX idx_type (type, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 تحسين الفهارس الموجودة

```sql
-- File: backend/migrations/20250127_optimize_existing_indexes.sql

-- Optimize RepairRequest indexes
ALTER TABLE RepairRequest 
  ADD INDEX IF NOT EXISTS idx_technician_status (technicianId, status, createdAt),
  ADD INDEX IF NOT EXISTS idx_status_created (status, createdAt);

-- Optimize StatusUpdateLog indexes
ALTER TABLE StatusUpdateLog 
  ADD INDEX IF NOT EXISTS idx_repair_created (repairRequestId, createdAt);

-- Optimize AuditLog indexes
ALTER TABLE AuditLog 
  ADD INDEX IF NOT EXISTS idx_entity_user (entityType, entityId, userId, createdAt);
```

### 2.3 تشغيل Migrations

```bash
# في Production - احذر! قم بعمل Backup أولاً
mysql -u root -p fixzone_db < backend/migrations/20250127_create_portal_tables.sql
mysql -u root -p fixzone_db < backend/migrations/20250127_optimize_existing_indexes.sql
```

---

## 3. Backend Implementation

### 3.1 إنشاء Service Layer

#### 3.1.1 Technician Service

```javascript
// File: backend/services/technicianService.js

const db = require('../db');
const technicianRepository = require('../repositories/technicianRepository');
const { logActivity } = require('../utils/activityLogger');

class TechnicianService {
  async getDashboard(technicianId, filters = {}) {
    try {
      // Get basic stats
      const stats = await technicianRepository.getStats(technicianId, filters);
      
      // Get recent jobs
      const recentJobs = await technicianRepository.findJobsByTechnician(
        technicianId,
        { limit: 10 },
        { page: 1, pageSize: 10 }
      );

      // Get performance metrics
      const performance = await technicianRepository.getPerformance(
        technicianId,
        filters.dateRange
      );

      return {
        success: true,
        data: {
          stats,
          recentJobs: recentJobs.data,
          performance
        }
      };
    } catch (error) {
      console.error('Error in getDashboard:', error);
      throw error;
    }
  }

  async getJobs(technicianId, filters = {}, pagination = {}) {
    try {
      const result = await technicianRepository.findJobsByTechnician(
        technicianId,
        filters,
        pagination
      );

      return {
        success: true,
        data: result.data,
        pagination: result.pagination
      };
    } catch (error) {
      console.error('Error in getJobs:', error);
      throw error;
    }
  }

  async updateJobStatus(technicianId, jobId, status, notes = null) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verify job belongs to technician
      const job = await technicianRepository.findJobById(technicianId, jobId);
      if (!job) {
        throw new Error('Job not found or not assigned to technician');
      }

      // Update status
      await technicianRepository.updateJobStatus(
        jobId,
        status,
        notes,
        technicianId
      );

      // Log activity
      await logActivity(
        technicianId,
        'JOB_STATUS_UPDATE',
        'RepairRequest',
        jobId,
        { fromStatus: job.status, toStatus: status, notes }
      );

      await connection.commit();

      return {
        success: true,
        message: 'Job status updated successfully'
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ... المزيد من الدوال
}

module.exports = new TechnicianService();
```

#### 3.1.2 Employee Service

```javascript
// File: backend/services/employeeService.js

const db = require('../db');
const employeeRepository = require('../repositories/employeeRepository');
const { logActivity } = require('../utils/activityLogger');

class EmployeeService {
  async getDashboard(employeeId, filters = {}) {
    try {
      const stats = await employeeRepository.getStats(employeeId, filters);
      const recentRepairs = await employeeRepository.getRecentRepairs(
        employeeId,
        { limit: 10 }
      );

      return {
        success: true,
        data: {
          stats,
          recentRepairs
        }
      };
    } catch (error) {
      console.error('Error in getDashboard:', error);
      throw error;
    }
  }

  async createRepair(employeeId, data) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Create repair
      const repair = await employeeRepository.createRepair(data);

      // Log activity
      await logActivity(
        employeeId,
        'REPAIR_CREATE',
        'RepairRequest',
        repair.id,
        { customerId: data.customerId, deviceId: data.deviceId }
      );

      await connection.commit();

      return {
        success: true,
        data: repair,
        message: 'Repair created successfully'
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ... المزيد من الدوال
}

module.exports = new EmployeeService();
```

### 3.2 إنشاء Repository Layer

#### 3.2.1 Technician Repository

```javascript
// File: backend/repositories/technicianRepository.js

const db = require('../db');

class TechnicianRepository {
  async findJobsByTechnician(technicianId, filters = {}, pagination = {}) {
    const { page = 1, pageSize = 20 } = pagination;
    const offset = (page - 1) * pageSize;

    let where = ['rr.deletedAt IS NULL', 'rr.technicianId = ?'];
    const params = [technicianId];

    if (filters.status) {
      where.push('rr.status = ?');
      params.push(filters.status);
    }

    if (filters.search) {
      where.push('(c.name LIKE ? OR d.model LIKE ?)');
      const search = `%${filters.search}%`;
      params.push(search, search);
    }

    const whereClause = where.join(' AND ');

    // Get total count
    const [countRows] = await db.execute(
      `SELECT COUNT(*) as total 
       FROM RepairRequest rr
       LEFT JOIN Customer c ON rr.customerId = c.id
       LEFT JOIN Device d ON rr.deviceId = d.id
       WHERE ${whereClause}`,
      params
    );

    const total = countRows[0].total;

    // Get jobs
    const [rows] = await db.execute(
      `SELECT 
         rr.*,
         c.name AS customerName,
         c.phone AS customerPhone,
         d.model AS deviceModel,
         d.deviceType
       FROM RepairRequest rr
       LEFT JOIN Customer c ON rr.customerId = c.id
       LEFT JOIN Device d ON rr.deviceId = d.id
       WHERE ${whereClause}
       ORDER BY rr.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return {
      data: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async getStats(technicianId, filters = {}) {
    const [stats] = await db.execute(
      `SELECT 
         COUNT(*) as totalJobs,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedJobs,
         SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgressJobs,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingJobs
       FROM RepairRequest
       WHERE technicianId = ? AND deletedAt IS NULL`,
      [technicianId]
    );

    return stats[0];
  }

  // ... المزيد من الدوال
}

module.exports = new TechnicianRepository();
```

### 3.3 إنشاء Routes الجديدة

#### 3.3.1 Employee Routes

```javascript
// File: backend/routes/employeeRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');
const portalAuthMiddleware = require('../middleware/portalAuthMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');
const employeeController = require('../controllers/employeeController');
const { portalRateLimit } = require('../middleware/portalRateLimit');

// جميع مسارات الموظفين تتطلب تسجيل الدخول
router.use(authMiddleware);
router.use(portalRateLimit);
// السماح فقط بدور الموظف (roleId = 3)
router.use(portalAuthMiddleware(['EMPLOYEE']));

// Dashboard
router.get(
  '/dashboard',
  checkPermission('employee.dashboard.view'),
  employeeController.getDashboard
);

// Repairs
router.get(
  '/repairs',
  checkPermission('repairs.view'),
  employeeController.getRepairs
);

router.post(
  '/repairs',
  checkPermission('repairs.create'),
  employeeController.createRepair
);

// ... المزيد من Routes

module.exports = router;
```

### 3.4 إضافة Routes في app.js

```javascript
// File: backend/app.js (أو server.js)

// ... existing code ...

const technicianRoutes = require('./routes/technicianRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const portalRoutes = require('./routes/portalRoutes');

// ... existing code ...

app.use('/api/tech', technicianRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/portal', portalRoutes);

// ... existing code ...
```

---

## 4. Frontend Implementation

### 4.1 إنشاء Stores

#### 4.1.1 Technician Store

```javascript
// File: frontend/react-app/src/stores/technicianStore.js

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useTechnicianStore = create(
  devtools(
    persist(
      (set, get) => ({
        dashboard: null,
        jobs: [],
        currentJob: null,
        status: 'OFFLINE',
        loading: false,
        error: null,

        setDashboard: (data) => set({ dashboard: data }),
        setJobs: (jobs) => set({ jobs }),
        setCurrentJob: (job) => set({ currentJob: job }),
        updateJob: (jobId, updates) => {
          const jobs = get().jobs.map(job =>
            job.id === jobId ? { ...job, ...updates } : job
          );
          set({ jobs });
        },
        setStatus: (status) => set({ status }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        reset: () => set({
          dashboard: null,
          jobs: [],
          currentJob: null,
          status: 'OFFLINE',
          loading: false,
          error: null
        })
      }),
      {
        name: 'technician-store',
        partialize: (state) => ({ status: state.status })
      }
    ),
    { name: 'TechnicianStore' }
  )
);

export default useTechnicianStore;
```

### 4.2 إنشاء Services

#### 4.2.1 Employee Service

```javascript
// File: frontend/react-app/src/services/employeeService.js

import api from './api';

export async function getEmployeeDashboard() {
  try {
    const response = await api.request('/employee/dashboard');
    return response;
  } catch (error) {
    console.error('Error fetching employee dashboard:', error);
    throw error;
  }
}

export async function getEmployeeRepairs(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/employee/repairs${query ? `?${query}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching employee repairs:', error);
    throw error;
  }
}

export async function createRepair(data) {
  try {
    const response = await api.request('/employee/repairs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  } catch (error) {
    console.error('Error creating repair:', error);
    throw error;
  }
}

// ... المزيد من الدوال

export default {
  getEmployeeDashboard,
  getEmployeeRepairs,
  createRepair
};
```

### 4.3 إنشاء Pages

#### 4.3.1 Employee Dashboard

```javascript
// File: frontend/react-app/src/pages/employee/EmployeeDashboard.js

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useEmployeeStore from '../../stores/employeeStore';
import EmployeeHeader from '../../components/employee/EmployeeHeader';
import { useEmployee } from '../../hooks/useEmployee';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { loadDashboard, dashboard, loading } = useEmployee();

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            مرحباً، {dashboard?.user?.name} 👋
          </h1>
          <p className="text-gray-600 mt-1">
            إليك ملخص لأدائك والمهام الموكلة إليك اليوم
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats cards implementation */}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          {/* Quick actions implementation */}
        </div>

        {/* Recent Activities */}
        <div>
          {/* Recent activities implementation */}
        </div>
      </div>
    </div>
  );
}
```

### 4.4 إضافة Routes في App.js

```javascript
// File: frontend/react-app/src/App.js

// ... existing imports ...

import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import RepairsManagementPage from './pages/employee/RepairsManagementPage';
// ... المزيد من الصفحات

// ... existing code ...

<Routes>
  {/* ... existing routes ... */}
  
  {/* Employee Routes */}
  <Route path="/employee/dashboard" element={
    <ProtectedRoute>
      <EmployeeDashboard />
    </ProtectedRoute>
  } />
  
  <Route path="/employee/repairs" element={
    <ProtectedRoute>
      <RepairsManagementPage />
    </ProtectedRoute>
  } />
  
  {/* ... المزيد من Routes ... */}
</Routes>
```

---

## 5. التكامل والاختبار

### 5.1 اختبار Backend

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run all tests
npm test
```

### 5.2 اختبار Frontend

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e
```

### 5.3 اختبار التكامل

```bash
# Test API endpoints
curl -X GET http://localhost:5000/api/tech/dashboard \
  -H "Cookie: token=YOUR_TOKEN"

curl -X GET http://localhost:5000/api/employee/dashboard \
  -H "Cookie: token=YOUR_TOKEN"
```

---

## 6. النشر في Production

### 6.1 Checklist قبل النشر

- [ ] Backup قاعدة البيانات
- [ ] اختبار جميع الوظائف
- [ ] مراجعة الأمان
- [ ] تحديث Environment Variables
- [ ] تحديث Documentation
- [ ] إعداد Monitoring
- [ ] إعداد Error Tracking

### 6.2 خطوات النشر

```bash
# 1. Backup Database
mysqldump -u root -p fixzone_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run Migrations
mysql -u root -p fixzone_db < backend/migrations/20250127_create_portal_tables.sql

# 3. Build Frontend
cd frontend/react-app
npm run build

# 4. Restart Backend
pm2 restart fixzone-backend

# 5. Restart Frontend (if separate server)
pm2 restart fixzone-frontend
```

### 6.3 Feature Flags

```javascript
// Use feature flags for gradual rollout
const FEATURES = {
  EMPLOYEE_PORTAL: process.env.ENABLE_EMPLOYEE_PORTAL === 'true',
  TIME_TRACKING: process.env.ENABLE_TIME_TRACKING === 'true',
  WEBSOCKET: process.env.ENABLE_WEBSOCKET === 'true'
};
```

---

## 7. المراقبة والصيانة

### 7.1 Monitoring

```javascript
// Set up monitoring endpoints
app.get('/api/health/portal', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      websocket: 'connected'
    }
  });
});
```

### 7.2 Logging

```javascript
// Enhanced logging
const logger = require('./utils/logger');

logger.info('Portal request', {
  userId: req.user.id,
  endpoint: req.path,
  method: req.method,
  ip: req.ip
});
```

### 7.3 Error Tracking

```javascript
// Set up error tracking (Sentry)
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

---

## 📝 ملاحظات مهمة

1. **Backup دائماً** قبل أي تغيير في Production
2. **Test thoroughly** قبل النشر
3. **Monitor closely** بعد النشر
4. **Document changes** بشكل مستمر
5. **Collect feedback** من المستخدمين

---

**آخر تحديث:** 2025-01-27  
**الإصدار:** 1.0.0  
**الحالة:** Implementation Guide


