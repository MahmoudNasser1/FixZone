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
      const [rows] = await db.query('SELECT * FROM Customer WHERE deletedAt IS NULL ORDER BY createdAt DESC');
      return res.json(rows);
    }

    const where = ['deletedAt IS NULL'];
    const params = [];
    if (q) {
      where.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const offset = (page - 1) * pageSize;
    const [rows] = await db.query(
      `SELECT id, name, phone, email, address, createdAt, updatedAt
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
      `SELECT id, name, phone, email, address
       FROM Customer
       WHERE deletedAt IS NULL AND (name LIKE ? OR phone LIKE ?)
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [like, like, pageSize, offset]
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
    const [rows] = await db.query('SELECT * FROM Customer WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Customer not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching customer with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new customer
router.post('/', authMiddleware, async (req, res) => {
  const { name, phone, email, address, customFields } = req.body;
  if (!name) {
    return res.status(400).send('Customer name is required');
  }
  try {
    const [result] = await db.query('INSERT INTO Customer (name, phone, email, address, customFields) VALUES (?, ?, ?, ?, ?)', [name, phone, email, address, JSON.stringify(customFields)]);
    res.status(201).json({ id: result.insertId, name, phone, email, address, customFields });
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).send('Server Error');
  }
});

// Update a customer
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address, customFields } = req.body;
  if (!name) {
    return res.status(400).send('Customer name is required');
  }
  try {
    const [result] = await db.query('UPDATE Customer SET name = ?, phone = ?, email = ?, address = ?, customFields = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [name, phone, email, address, JSON.stringify(customFields), id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Customer not found or already deleted');
    }
    res.json({ message: 'Customer updated successfully' });
  } catch (err) {
    console.error(`Error updating customer with ID ${id}:`, err);
    res.status(500).send('Server Error');
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
