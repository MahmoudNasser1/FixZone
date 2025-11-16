/**
 * Unit Tests for Permission Middleware
 * Tests permission checking logic with various scenarios
 */

const db = require('../../db');
const {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  hasPermission
} = require('../../middleware/permissionMiddleware');
const {
  createTestUser,
  createTestRole,
  cleanupTestData
} = require('../setup/testHelpers');

describe('Permission Middleware', () => {
  let testUsers = [];
  let testRoles = [];
  let adminUser;
  let managerUser;
  let technicianUser;
  let customerUser;

  beforeAll(async () => {
    // Create test roles with different permissions
    const adminRole = await createTestRole({
      name: 'AdminTest',
      permissions: { all: true },
      isSystem: false
    });
    testRoles.push(adminRole);

    const managerRole = await createTestRole({
      name: 'ManagerTest',
      permissions: {
        'repairs.view_all': true,
        'repairs.update': true,
        'invoices.view_all': true,
        'users.view': true
      },
      isSystem: false
    });
    testRoles.push(managerRole);

    const technicianRole = await createTestRole({
      name: 'TechnicianTest',
      permissions: {
        'repairs.view': true,
        'repairs.update': true,
        'repairs.view_own': true
      },
      isSystem: false
    });
    testRoles.push(technicianRole);

    const customerRole = await createTestRole({
      name: 'CustomerTest',
      permissions: {
        'repairs.view_own': true,
        'invoices.view_own': true,
        'devices.view_own': true
      },
      isSystem: false
    });
    testRoles.push(customerRole);

    // Create test users
    adminUser = await createTestUser({
      name: 'Admin Test',
      email: 'admin.permission@fixzone.com',
      roleId: adminRole.id
    });
    testUsers.push(adminUser);

    managerUser = await createTestUser({
      name: 'Manager Test',
      email: 'manager.permission@fixzone.com',
      roleId: managerRole.id
    });
    testUsers.push(managerUser);

    technicianUser = await createTestUser({
      name: 'Technician Test',
      email: 'technician.permission@fixzone.com',
      roleId: technicianRole.id
    });
    testUsers.push(technicianUser);

    customerUser = await createTestUser({
      name: 'Customer Test',
      email: 'customer.permission@fixzone.com',
      roleId: customerRole.id
    });
    testUsers.push(customerUser);
  });

  afterAll(async () => {
    await cleanupTestData(
      testUsers.map(u => u.id),
      testRoles.map(r => r.id)
    );
  });

  describe('checkPermission', () => {
    test('admin should have all permissions', async () => {
      const req = {
        user: {
          id: adminUser.id,
          roleId: adminUser.roleId,
          role: adminUser.roleId
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkPermission('repairs.delete');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('manager should have repairs.view_all permission', async () => {
      const req = {
        user: {
          id: managerUser.id,
          roleId: managerUser.roleId,
          role: managerUser.roleId
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkPermission('repairs.view_all');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('manager should NOT have repairs.delete permission', async () => {
      const req = {
        user: {
          id: managerUser.id,
          roleId: managerUser.roleId,
          role: managerUser.roleId
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkPermission('repairs.delete');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('technician should have repairs.view permission', async () => {
      const req = {
        user: {
          id: technicianUser.id,
          roleId: technicianUser.roleId,
          role: technicianUser.roleId
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkPermission('repairs.view');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('customer should have repairs.view_own permission', async () => {
      const req = {
        user: {
          id: customerUser.id,
          roleId: customerUser.roleId,
          role: customerUser.roleId
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkPermission('repairs.view_own');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('customer should NOT have repairs.view_all permission', async () => {
      const req = {
        user: {
          id: customerUser.id,
          roleId: customerUser.roleId,
          role: customerUser.roleId
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkPermission('repairs.view_all');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject unauthenticated requests', async () => {
      const req = {
        user: null
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkPermission('repairs.view');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('checkAnyPermission', () => {
    test('should allow if user has any of the required permissions', async () => {
      const req = {
        user: {
          id: managerUser.id,
          roleId: managerUser.roleId,
          role: managerUser.roleId
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkAnyPermission(['repairs.delete', 'repairs.view_all']);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should reject if user has none of the required permissions', async () => {
      const req = {
        user: {
          id: technicianUser.id,
          roleId: technicianUser.roleId,
          role: technicianUser.roleId
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkAnyPermission(['repairs.delete', 'invoices.delete']);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('checkAllPermissions', () => {
    test('should allow if user has all required permissions', async () => {
      const req = {
        user: {
          id: managerUser.id,
          roleId: managerUser.roleId,
          role: managerUser.roleId
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkAllPermissions(['repairs.view_all', 'repairs.update']);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should reject if user missing any required permission', async () => {
      const req = {
        user: {
          id: technicianUser.id,
          roleId: technicianUser.roleId,
          role: technicianUser.roleId
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkAllPermissions(['repairs.view', 'invoices.view_all']);
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('hasPermission helper', () => {
    test('should return true for admin', async () => {
      const result = await hasPermission(1, 'any.permission');
      expect(result).toBe(true);
    });

    test('should return true if role has permission', async () => {
      const result = await hasPermission(managerUser.roleId, 'repairs.view_all');
      expect(result).toBe(true);
    });

    test('should return false if role lacks permission', async () => {
      const result = await hasPermission(technicianUser.roleId, 'repairs.delete');
      expect(result).toBe(false);
    });
  });

  describe('Permission Inheritance', () => {
    test('should inherit permissions from parent role', async () => {
      // Create parent role
      const parentRole = await createTestRole({
        name: 'ParentRoleTest',
        permissions: {
          'repairs.view': true,
          'invoices.view': true
        }
      });
      testRoles.push(parentRole);

      // Create child role
      const childRole = await createTestRole({
        name: 'ChildRoleTest',
        permissions: {
          'repairs.update': true
        },
        parentRoleId: parentRole.id
      });
      testRoles.push(childRole);

      // Create user with child role
      const childUser = await createTestUser({
        name: 'Child User',
        email: 'child.permission@fixzone.com',
        roleId: childRole.id
      });
      testUsers.push(childUser);

      // Test inherited permission
      const req = {
        user: {
          id: childUser.id,
          roleId: childUser.roleId,
          role: childUser.roleId
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkPermission('repairs.view');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});

