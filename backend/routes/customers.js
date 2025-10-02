const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all customers (optional pagination & search)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '0', 10);
    const pageSize = Math.min(parseInt(req.query.pageSize || '20', 10), 100);
    const q = (req.query.q || '').trim();

    // If no pagination requested, return full list for backward compatibility
    if (!page) {
      const [rows] = await db.query(`
        SELECT 
          id,
          CONCAT(firstName, ' ', lastName) as name,
          firstName,
          lastName,
          phone,
          email,
          address,
          companyId,
          status,
          isActive,
          notes,
          createdAt,
          updatedAt
        FROM Customer 
        WHERE deletedAt IS NULL 
        ORDER BY createdAt DESC
      `);
      return res.json(rows);
    }

    const where = ['deletedAt IS NULL'];
    const params = [];
    if (q) {
      where.push('(CONCAT(firstName, " ", lastName) LIKE ? OR phone LIKE ? OR email LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const offset = (page - 1) * pageSize;
    const [rows] = await db.query(
      `SELECT 
        id, 
        CONCAT(firstName, ' ', lastName) as name,
        firstName,
        lastName,
        phone, 
        email, 
        address, 
        companyId,
        status,
        createdAt, 
        updatedAt
       FROM Customer
       ${whereSql}
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    const [countRows] = await db.query(
      `SELECT COUNT(*) as cnt FROM Customer ${whereSql}`,
      params
    );
    return res.json({ data: rows, pagination: { page, pageSize, total: countRows[0]?.cnt || 0 } });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).send('Server Error');
  }
});

// Search customers by name or phone with pagination
router.get('/search', async (req, res) => {
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
        CONCAT(firstName, ' ', lastName) as name,
        firstName,
        lastName,
        phone, 
        email, 
        address
       FROM Customer
       WHERE deletedAt IS NULL AND (CONCAT(firstName, ' ', lastName) LIKE ? OR phone LIKE ?)
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [like, like, pageSize, offset]
    );

    // Get total count
    const [countRows] = await db.query(
      `SELECT COUNT(*) as cnt
       FROM Customer
       WHERE deletedAt IS NULL AND (CONCAT(firstName, ' ', lastName) LIKE ? OR phone LIKE ?)`,
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
        *,
        CONCAT(firstName, ' ', lastName) as name
      FROM Customer 
      WHERE id = ? AND deletedAt IS NULL
    `, [id]);
    if (rows.length === 0) {
      return res.status(404).send('Customer not found');
    }
    
    console.log('Fetched customer:', rows[0]);
    
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching customer with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new customer
router.post('/', authMiddleware, async (req, res) => {
  const { firstName, lastName, phone, email, address, companyId, status = 'active', notes } = req.body;
  
  console.log('Creating customer:', { firstName, lastName, phone, email, address, companyId, status, notes });
  
  if (!firstName || !phone) {
    return res.status(400).json({ success: false, message: 'First name and phone are required' });
  }
  
  try {
    // Check if phone already exists
    const [existing] = await db.query(
      'SELECT id FROM Customer WHERE phone = ? AND deletedAt IS NULL',
      [phone]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'A customer with this phone number already exists' 
      });
    }
    
    const [result] = await db.query(
      'INSERT INTO Customer (firstName, lastName, phone, email, address, companyId, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [firstName, lastName || '', phone, email, address, companyId, status, notes]
    );
    
    console.log('Create result:', result);
    
    const customer = {
      id: result.insertId,
      firstName,
      lastName,
      phone,
      email,
      address,
      companyId,
      status,
      notes
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
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, email, address, companyId, status, notes } = req.body;
  
  console.log('Updating customer:', { id, firstName, lastName, phone, email, address, companyId, status, notes });
  
  // Build dynamic update query
  const updates = [];
  const values = [];
  
  if (firstName !== undefined) {
    updates.push('firstName = ?');
    values.push(firstName);
  }
  if (lastName !== undefined) {
    updates.push('lastName = ?');
    values.push(lastName);
  }
  if (phone !== undefined) {
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
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    values.push(notes);
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
router.delete('/:id', authMiddleware, async (req, res) => {
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
    const statsQuery = `
      SELECT 
        COUNT(rr.id) as totalRepairs,
        COUNT(CASE WHEN rr.status = 'completed' THEN 1 END) as completedRepairs,
        COUNT(CASE WHEN rr.status = 'pending' THEN 1 END) as pendingRepairs,
        COUNT(CASE WHEN rr.status = 'in_progress' THEN 1 END) as inProgressRepairs,
        COUNT(CASE WHEN rr.status = 'cancelled' THEN 1 END) as cancelledRepairs,
        COALESCE(SUM(CASE WHEN rr.status = 'completed' THEN rr.totalCost END), 0) as totalPaid,
        COALESCE(AVG(CASE WHEN rr.status = 'completed' THEN rr.totalCost END), 0) as avgRepairCost,
        MAX(rr.createdAt) as lastRepairDate,
        MIN(rr.createdAt) as firstRepairDate
      FROM Customer c
      LEFT JOIN RepairRequest rr ON c.id = rr.customerId AND rr.deletedAt IS NULL
      WHERE c.id = ? AND c.deletedAt IS NULL
      GROUP BY c.id
    `;
    
    const [statsRows] = await db.query(statsQuery, [customerId]);
    
    if (statsRows.length === 0) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }
    
    const stats = statsRows[0];
    
    // حساب معدل الرضا (افتراضي بناءً على الطلبات المكتملة)
    const satisfactionRate = stats.totalRepairs > 0 
      ? Math.round((stats.completedRepairs / stats.totalRepairs) * 100)
      : 0;
    
    // تحديد حالة العميل
    const customerStatus = {
      isActive: stats.lastRepairDate && 
        new Date(stats.lastRepairDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // آخر 90 يوم
      isVip: stats.totalPaid > 5000 || stats.totalRepairs > 10, // VIP إذا دفع أكثر من 5000 أو لديه أكثر من 10 طلبات
      riskLevel: stats.cancelledRepairs > 2 ? 'high' : stats.pendingRepairs > 3 ? 'medium' : 'low'
    };
    
    // جلب آخر 3 طلبات للعميل
    const recentRepairsQuery = `
      SELECT 
        rr.id,
        rr.reportedProblem,
        rr.status,
        rr.createdAt,
        rr.totalCost,
        d.deviceType,
        d.brand
      FROM RepairRequest rr
      LEFT JOIN Device d ON rr.deviceId = d.id
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

module.exports = router;
