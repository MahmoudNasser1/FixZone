const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');
const { validate, customerSchemas } = require('../middleware/validation');
const customersFinancialService = require('../services/financial/customers.service');

const CUSTOMER_ROLE_ID = Number(process.env.CUSTOMER_ROLE_ID || 6);

const generateTemporaryPassword = (customer) => {
  const phoneSegment = (customer.phone || '').replace(/\D/g, '');
  const identifier = phoneSegment || String(customer.id || '');
  return `${identifier}123`;
};

// Apply authMiddleware to all routes
router.use(authMiddleware);

// Get all customers (optional pagination & search)
router.get('/', validate(customerSchemas.getCustomers, 'query'), async (req, res) => {
  try {
    const page = parseInt(req.query.page || '0', 10);
    const pageSize = Math.min(parseInt(req.query.pageSize || '20', 10), 100);
    const q = (req.query.q || '').trim();

    // Calculate isActive: customer is active if last repair was within last 90 days
    // Also calculate outstandingBalance: total invoices - total payments
    const activeDaysThreshold = 90;
    
    // If no pagination requested, return full list for backward compatibility
    if (!page) {
      const [rows] = await db.query(`
        SELECT 
          c.id,
          c.name,
          c.phone,
          c.email,
          c.address,
          c.companyId,
          c.customFields,
          c.createdAt,
          c.updatedAt,
          MAX(rr.createdAt) as lastRepairDate,
          COALESCE(
            CASE 
              WHEN MAX(rr.createdAt) IS NOT NULL AND 
                   DATEDIFF(NOW(), MAX(rr.createdAt)) <= ? THEN 1
              ELSE 0
            END, 0
          ) as isActive,
          COALESCE(
            (SELECT SUM(COALESCE(i.totalAmount, 0) - COALESCE(i.amountPaid, 0))
             FROM Invoice i
             WHERE i.customerId = c.id 
               AND i.deletedAt IS NULL
               AND (i.totalAmount - COALESCE(i.amountPaid, 0)) > 0), 0
          ) as outstandingBalance,
          EXISTS(
            SELECT 1 FROM User u WHERE u.customerId = c.id AND u.deletedAt IS NULL
          ) as hasUserAccount
        FROM Customer c
        LEFT JOIN RepairRequest rr ON c.id = rr.customerId AND rr.deletedAt IS NULL
        WHERE c.deletedAt IS NULL 
        GROUP BY c.id
        ORDER BY c.createdAt DESC
      `, [activeDaysThreshold]);
      
      // Format results
      const formattedRows = rows.map(row => ({
        ...row,
        isActive: row.isActive !== null && row.isActive !== undefined ? Boolean(row.isActive) : false,
        outstandingBalance: row.outstandingBalance !== null && row.outstandingBalance !== undefined ? parseFloat(row.outstandingBalance) || 0 : 0,
        hasUserAccount: Boolean(row.hasUserAccount)
      }));
      
      return res.json(formattedRows);
    }

    const where = ['c.deletedAt IS NULL'];
    const params = [];
    if (q) {
      where.push('(c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    
    // Add filter for isActive if provided (we'll handle this with HAVING clause in the query)
    const isActiveFilter = req.query.isActive;
    const isActiveValue = isActiveFilter !== undefined 
      ? ['1', 'true', 'TRUE', 'yes'].includes(String(isActiveFilter))
      : undefined;
    
    // Add filter for outstandingBalance (customers with debt)
    const hasDebtFilter = req.query.hasDebt;
    const hasDebtValue = hasDebtFilter !== undefined 
      ? ['1', 'true', 'TRUE', 'yes'].includes(String(hasDebtFilter))
      : undefined;
    
    // Add sort parameters
    const sortField = req.query.sort || 'createdAt';
    const sortDirection = req.query.sortDir || 'DESC';
    const allowedSortFields = ['id', 'name', 'phone', 'email', 'createdAt', 'outstandingBalance', 'isActive'];
    const safeSortField = allowedSortFields.includes(sortField) ? sortField : 'createdAt';
    const safeSortDirection = ['ASC', 'DESC'].includes(sortDirection.toUpperCase()) ? sortDirection.toUpperCase() : 'DESC';
    
    const baseWhereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const offset = (page - 1) * pageSize;
    
    // Build main query with HAVING clause for filters
    let mainQuery = `
      SELECT 
        c.id, 
        c.name,
        c.phone, 
        c.email, 
        c.address, 
        c.companyId,
        c.customFields,
        c.createdAt, 
        c.updatedAt,
        MAX(rr.createdAt) as lastRepairDate,
        COALESCE(
          CASE 
            WHEN MAX(rr.createdAt) IS NOT NULL AND 
                 DATEDIFF(NOW(), MAX(rr.createdAt)) <= ? THEN 1
            ELSE 0
          END, 0
        ) as isActive,
        COALESCE(
          (SELECT SUM(COALESCE(i.totalAmount, 0) - COALESCE(i.amountPaid, 0))
           FROM Invoice i
           WHERE i.customerId = c.id 
             AND i.deletedAt IS NULL
             AND (i.totalAmount - COALESCE(i.amountPaid, 0)) > 0), 0
        ) as outstandingBalance,
        MAX(u.id) as userId
       FROM Customer c
       LEFT JOIN RepairRequest rr ON c.id = rr.customerId AND rr.deletedAt IS NULL
       LEFT JOIN User u ON u.customerId = c.id AND u.deletedAt IS NULL
       ${baseWhereSql}
       GROUP BY c.id
    `;
    
    const mainParams = [...params, activeDaysThreshold];
    
    // Add HAVING clause for filters if needed
    const havingConditions = [];
    
    if (isActiveValue !== undefined) {
      havingConditions.push(`(
        CASE 
          WHEN MAX(rr.createdAt) IS NOT NULL AND 
               DATEDIFF(NOW(), MAX(rr.createdAt)) <= ? THEN 1
          ELSE 0
        END
      ) = ?`);
      mainParams.push(activeDaysThreshold, isActiveValue ? 1 : 0);
    }
    
    if (hasDebtValue !== undefined) {
      havingConditions.push(`COALESCE(
        (SELECT SUM(COALESCE(i.totalAmount, 0) - COALESCE(i.amountPaid, 0))
         FROM Invoice i
         WHERE i.customerId = c.id 
           AND i.deletedAt IS NULL
           AND (i.totalAmount - COALESCE(i.amountPaid, 0)) > 0), 0
      ) > 0`);
    }
    
    if (havingConditions.length > 0) {
      mainQuery += ` HAVING ${havingConditions.join(' AND ')}`;
    }
    
    // Add ORDER BY clause
    let orderByClause = '';
    if (safeSortField === 'outstandingBalance' || safeSortField === 'isActive') {
      // These are calculated fields, need to repeat the calculation
      if (safeSortField === 'outstandingBalance') {
        orderByClause = `ORDER BY COALESCE(
          (SELECT SUM(COALESCE(i.totalAmount, 0) - COALESCE(i.amountPaid, 0))
           FROM Invoice i
           WHERE i.customerId = c.id 
             AND i.deletedAt IS NULL
             AND (i.totalAmount - COALESCE(i.amountPaid, 0)) > 0), 0
        ) ${safeSortDirection}`;
      } else if (safeSortField === 'isActive') {
        orderByClause = `ORDER BY CASE 
          WHEN MAX(rr.createdAt) IS NOT NULL AND 
               DATEDIFF(NOW(), MAX(rr.createdAt)) <= ? THEN 1
          ELSE 0
        END ${safeSortDirection}`;
        mainParams.push(activeDaysThreshold);
      }
    } else {
      // Regular fields
      orderByClause = `ORDER BY c.${safeSortField} ${safeSortDirection}`;
    }
    
    // CRITICAL: Interpolate LIMIT/OFFSET directly - db.query with LIMIT ? OFFSET ? as parameters can cause issues in MariaDB strict mode
    mainQuery += ` ${orderByClause} LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`;
    
    const [rows] = await db.query(mainQuery, mainParams);
    
    // Format results
    const formattedRows = rows.map(row => ({
      ...row,
      isActive: row.isActive !== null && row.isActive !== undefined ? Boolean(row.isActive) : false,
      outstandingBalance: row.outstandingBalance !== null && row.outstandingBalance !== undefined ? parseFloat(row.outstandingBalance) || 0 : 0,
      hasUserAccount: Boolean(row.userId),
      userId: row.userId || null
    }));
    
    // Count query - use subquery to match the main query structure
    let countQuery = `
      SELECT COUNT(*) as cnt FROM (
        SELECT c.id
        FROM Customer c
        LEFT JOIN RepairRequest rr ON c.id = rr.customerId AND rr.deletedAt IS NULL
        ${baseWhereSql}
        GROUP BY c.id
    `;
    
    const countParams = [...params, activeDaysThreshold];
    
    // Add HAVING clause for count query if isActive filter is used
           const countHavingConditions = [];
           
           if (isActiveValue !== undefined) {
             countHavingConditions.push(`(
               CASE
                 WHEN MAX(rr.createdAt) IS NOT NULL AND
                      DATEDIFF(NOW(), MAX(rr.createdAt)) <= ? THEN 1
                 ELSE 0
               END
             ) = ?`);
             countParams.push(activeDaysThreshold, isActiveValue ? 1 : 0);
           }
           
           if (hasDebtValue !== undefined) {
             countHavingConditions.push(`COALESCE(
               (SELECT SUM(COALESCE(i.totalAmount, 0) - COALESCE(i.amountPaid, 0))
                FROM Invoice i
                WHERE i.customerId = c.id 
                  AND i.deletedAt IS NULL
                  AND (i.totalAmount - COALESCE(i.amountPaid, 0)) > 0), 0
             ) > 0`);
           }
           
           if (countHavingConditions.length > 0) {
             countQuery += ` HAVING ${countHavingConditions.join(' AND ')}`;
           }
    
    countQuery += `) as filtered_customers`;
    
    const [countRows] = await db.query(countQuery, countParams);
    
    return res.json({ 
      success: true,
      data: { 
        customers: formattedRows, 
        total: countRows[0]?.cnt || 0,
        page,
        pageSize 
      }
    });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).send('Server Error');
  }
});

// Search customers by name or phone with pagination
router.get('/search', validate(customerSchemas.searchCustomers, 'query'), async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = Math.min(parseInt(req.query.pageSize || '20', 10), 100);
    const offset = (page - 1) * pageSize;

    if (!q) {
      return res.json({ data: [], pagination: { page, pageSize, total: 0 } });
    }

    const like = `%${q}%`;
    const [rows] = await db.query(
      `SELECT 
        id, 
        name,
        phone, 
        email, 
        address
       FROM Customer
       WHERE deletedAt IS NULL AND (name LIKE ? OR phone LIKE ?)
       ORDER BY createdAt DESC
       LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`,
      [like, like]
    );

    // Get total count
    const [countRows] = await db.query(
      `SELECT COUNT(*) as cnt
       FROM Customer
       WHERE deletedAt IS NULL AND (name LIKE ? OR phone LIKE ?)`,
      [like, like]
    );

    res.json({ data: rows, pagination: { page, pageSize, total: countRows[0]?.cnt || 0 } });
  } catch (err) {
    console.error('Error searching customers:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        *
      FROM Customer 
      WHERE id = ? AND deletedAt IS NULL
    `, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    console.log('Fetched customer:', rows[0]);
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    console.error(`Error fetching customer with ID ${id}:`, err);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
});

router.post('/:id/create-account', authMiddleware, authorizeMiddleware([1, 2, 'admin', 'manager']), async (req, res) => {
  const customerId = parseInt(req.params.id, 10);
  if (isNaN(customerId) || customerId <= 0) {
    return res.status(400).json({ success: false, message: 'معرف العميل غير صالح' });
  }

  try {
    const [customers] = await db.execute(
      'SELECT id, name, phone, email FROM Customer WHERE id = ? AND deletedAt IS NULL',
      [customerId]
    );

    if (!customers.length) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }

    const customer = customers[0];

    const [existingUsers] = await db.execute(
      'SELECT id FROM User WHERE customerId = ? AND deletedAt IS NULL',
      [customerId]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'هذا العميل لديه حساب مستخدم بالفعل', 
        data: { userId: existingUsers[0].id } 
      });
    }

    const temporaryPassword = generateTemporaryPassword(customer);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const generatedEmail = customer.email && customer.email.trim()
      ? customer.email.trim()
      : `${customerId}@fixzzone.com`;

    const [result] = await db.execute(
      `INSERT INTO User 
        (name, email, phone, password, roleId, isActive, customerId, forcePasswordReset, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        customer.name || 'عميل',
        generatedEmail,
        customer.phone || null,
        hashedPassword,
        CUSTOMER_ROLE_ID,
        1,
        customerId,
        1
      ]
    );

    return res.json({
      success: true,
      message: 'تم إنشاء حساب العميل بنجاح',
      data: {
        userId: result.insertId,
        temporaryPassword
      }
    });
  } catch (error) {
    console.error('Error creating customer account:', error);
    if (error?.code === 'ER_DUP_ENTRY') {
      const conflictField = (error.sqlMessage && error.sqlMessage.includes('email')) 
        ? 'البريد الإلكتروني' 
        : (error.sqlMessage && error.sqlMessage.includes('phone')) 
          ? 'رقم الهاتف' 
          : 'معلومات الحساب';
      return res.status(409).json({ success: false, message: `يوجد مستخدم بنفس ${conflictField}` });
    }

    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنشاء حساب العميل' });
  }
});

// Create a new customer
router.post('/', validate(customerSchemas.createCustomer), async (req, res) => {
  const { name, phone, email, address, companyId, customFields } = req.body;
  
  console.log('Creating customer:', { name, phone, email, address, companyId, customFields });
  
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'الاسم ورقم الهاتف مطلوبان' });
  }
  
  // Phone number validation removed - accept any format
  
  try {
    // Check if phone already exists
    const [existing] = await db.query(
      'SELECT id FROM Customer WHERE phone = ? AND deletedAt IS NULL',
      [phone]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'رقم الهاتف مستخدم مسبقاً' 
      });
    }
    
    const [result] = await db.query(
      'INSERT INTO Customer (name, phone, email, address, companyId, customFields) VALUES (?, ?, ?, ?, ?, ?)', 
      [name, phone, email, address, companyId, JSON.stringify(customFields || {})]
    );
    
    console.log('Create result:', result);
    
    const customer = {
      id: result.insertId,
      name,
      phone,
      email,
      address,
      companyId,
      customFields
    };
    
    res.status(201).json({ success: true, customer });
  } catch (err) {
    console.error('Error creating customer:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A customer with this phone number already exists' });
    }
    res.status(500).json({ success: false, message: 'Server Error', details: err.message });
  }
});

// Update a customer
router.put('/:id', validate(customerSchemas.updateCustomer), async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address, companyId, customFields } = req.body;
  
  console.log('Updating customer:', { id, name, phone, email, address, companyId, customFields });
  
  // Build dynamic update query
  const updates = [];
  const values = [];
  
  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (phone !== undefined) {
    // Phone number validation removed - accept any format
    
    // Check if phone already exists (excluding current customer)
    const [existing] = await db.query(
      'SELECT id FROM Customer WHERE phone = ? AND id != ? AND deletedAt IS NULL',
      [phone, id]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'رقم الهاتف مستخدم مسبقاً' 
      });
    }
    
    updates.push('phone = ?');
    values.push(phone);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  if (address !== undefined) {
    updates.push('address = ?');
    values.push(address);
  }
  if (companyId !== undefined) {
    updates.push('companyId = ?');
    values.push(companyId);
  }
  if (customFields !== undefined) {
    updates.push('customFields = ?');
    values.push(JSON.stringify(customFields));
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }
  
  updates.push('updatedAt = CURRENT_TIMESTAMP');
  values.push(id);
  
  try {
    const [result] = await db.query(
      `UPDATE Customer SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL`,
      values
    );
    
    console.log('Update result:', result);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found or already deleted' });
    }
    res.json({ success: true, message: 'Customer updated successfully' });
  } catch (err) {
    console.error(`Error updating customer with ID ${id}:`, err);
    res.status(500).json({ success: false, message: 'Server Error', details: err.message });
  }
});

// Soft delete a customer
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE Customer SET deletedAt = NOW() WHERE id = ? AND deletedAt IS NULL', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Customer not found');
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error(`Error deleting customer with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Get customer statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // جلب إحصائيات العميل
    const activeDaysThreshold = 90;
    const statsQuery = `
      SELECT 
        COUNT(rr.id) as totalRepairs,
        COUNT(CASE WHEN rr.status = 'completed' THEN 1 END) as completedRepairs,
        COUNT(CASE WHEN rr.status = 'pending' THEN 1 END) as pendingRepairs,
        COUNT(CASE WHEN rr.status = 'in_progress' THEN 1 END) as inProgressRepairs,
        COUNT(CASE WHEN rr.status = 'cancelled' THEN 1 END) as cancelledRepairs,
        COALESCE(SUM(CASE WHEN rr.status = 'completed' THEN rr.actualCost END), 0) as totalPaid,
        COALESCE(AVG(CASE WHEN rr.status = 'completed' THEN rr.actualCost END), 0) as avgRepairCost,
        MAX(rr.createdAt) as lastRepairDate,
        MIN(rr.createdAt) as firstRepairDate,
        COALESCE(
          CASE 
            WHEN MAX(rr.createdAt) IS NOT NULL AND 
                 DATEDIFF(NOW(), MAX(rr.createdAt)) <= ? THEN 1
            ELSE 0
          END, 0
        ) as isActive
      FROM Customer c
      LEFT JOIN RepairRequest rr ON c.id = rr.customerId AND rr.deletedAt IS NULL
      WHERE c.id = ? AND c.deletedAt IS NULL
      GROUP BY c.id
    `;
    
    const [statsRows] = await db.query(statsQuery, [activeDaysThreshold, customerId]);
    
    if (statsRows.length === 0) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }
    
    const stats = statsRows[0];
    
    // حساب الرصيد المستحق
    const [balanceRows] = await db.query(`
      SELECT COALESCE(SUM(COALESCE(i.totalAmount, 0) - COALESCE(i.amountPaid, 0)), 0) as outstandingBalance
      FROM Invoice i
      WHERE i.customerId = ? 
        AND i.deletedAt IS NULL
        AND (i.totalAmount - COALESCE(i.amountPaid, 0)) > 0
    `, [customerId]);
    
    const outstandingBalance = parseFloat(balanceRows[0]?.outstandingBalance || 0);
    
    // حساب معدل الرضا (افتراضي بناءً على الطلبات المكتملة)
    const satisfactionRate = stats.totalRepairs > 0 
      ? Math.round((stats.completedRepairs / stats.totalRepairs) * 100)
      : 0;
    
    // تحديد حالة العميل
    const customerStatus = {
      isActive: Boolean(stats.isActive),
      isVip: stats.totalPaid > 5000 || stats.totalRepairs > 10, // VIP إذا دفع أكثر من 5000 أو لديه أكثر من 10 طلبات
      riskLevel: stats.cancelledRepairs > 2 ? 'high' : stats.pendingRepairs > 3 ? 'medium' : 'low'
    };
    
    // جلب آخر 3 طلبات للعميل
    const recentRepairsQuery = `
      SELECT 
        rr.id,
        rr.reportedProblem as reportedProblem,
        rr.status,
        rr.createdAt as createdAt,
        rr.actualCost as totalCost,
        rr.deviceType,
        rr.deviceBrand as brand
      FROM RepairRequest rr
      WHERE rr.customerId = ? AND rr.deletedAt IS NULL
      ORDER BY rr.createdAt DESC
      LIMIT 3
    `;
    
    const [recentRepairs] = await db.query(recentRepairsQuery, [customerId]);
    
    const response = {
      customerId: parseInt(customerId),
      totalRepairs: stats.totalRepairs || 0,
      completedRepairs: stats.completedRepairs || 0,
      pendingRepairs: stats.pendingRepairs || 0,
      inProgressRepairs: stats.inProgressRepairs || 0,
      cancelledRepairs: stats.cancelledRepairs || 0,
      totalPaid: parseFloat(stats.totalPaid) || 0,
      avgRepairCost: parseFloat(stats.avgRepairCost) || 0,
      outstandingBalance: outstandingBalance,
      satisfactionRate,
      lastRepairDate: stats.lastRepairDate,
      firstRepairDate: stats.firstRepairDate,
      customerStatus,
      recentRepairs: recentRepairs.map(repair => ({
        id: repair.id,
        problem: repair.reportedProblem,
        status: repair.status,
        createdAt: repair.createdAt,
        cost: parseFloat(repair.totalCost) || 0,
        device: `${repair.brand || ''} ${repair.deviceType || ''}`.trim() || 'غير محدد'
      }))
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ error: 'حدث خطأ في جلب إحصائيات العميل' });
  }
});

// Get customer repairs
router.get('/:id/repairs', async (req, res) => {
  try {
    const customerId = req.params.id;
    
    const [repairs] = await db.query(`
               SELECT 
                 rr.id,
                 rr.reportedProblem,
                 rr.status,
                 rr.createdAt,
                 rr.actualCost,
                 rr.deviceType,
                 rr.deviceBrand,
                 rr.estimatedCost,
                 rr.priority,
                 rr.notes,
                 rr.accessories
               FROM RepairRequest rr
               WHERE rr.customerId = ? AND rr.deletedAt IS NULL
               ORDER BY rr.createdAt DESC
    `, [customerId]);
    
    res.json({
      success: true,
      data: {
                 repairs: repairs.map(repair => ({
                   id: repair.id,
                   problem: repair.reportedProblem,
                   status: repair.status,
                   createdAt: repair.createdAt,
                   actualCost: parseFloat(repair.actualCost) || 0,
                   estimatedCost: parseFloat(repair.estimatedCost) || 0,
                   deviceType: repair.deviceType,
                   deviceBrand: repair.deviceBrand,
                   priority: repair.priority,
                   notes: repair.notes,
                   accessories: repair.accessories ? JSON.parse(repair.accessories) : []
                 }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching customer repairs:', error);
    res.status(500).json({ 
      success: false,
      error: 'حدث خطأ في جلب طلبات الإصلاح للعميل' 
    });
  }
});

// Customer Financial APIs
// GET /api/customers/:id/balance
router.get('/:id/balance', async (req, res) => {
  try {
    const { id } = req.params;
    const balance = await customersFinancialService.getBalance(parseInt(id));
    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('Error getting customer balance:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting customer balance',
      error: error.message
    });
  }
});

// GET /api/customers/:id/invoices
router.get('/:id/invoices', async (req, res) => {
  try {
    const { id } = req.params;
    const filters = {
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };
    const invoices = await customersFinancialService.getInvoices(parseInt(id), filters);
    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error getting customer invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting customer invoices',
      error: error.message
    });
  }
});

// GET /api/customers/:id/payments
router.get('/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };
    const payments = await customersFinancialService.getPayments(parseInt(id), filters);
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error getting customer payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting customer payments',
      error: error.message
    });
  }
});

module.exports = router;
