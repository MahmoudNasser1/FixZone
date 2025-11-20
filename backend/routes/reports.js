const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, commonSchemas } = require('../middleware/validation');
const Joi = require('joi');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all reports (placeholder)
router.get('/', async (req, res) => {
  try {
    // This is a placeholder. You would typically have specific report generation logic here.
    res.json({ message: 'Reports endpoint. Implement specific report logic here.' });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Validation schemas for reports
const reportSchemas = {
  dailyRevenue: Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
      .messages({
        'string.pattern.base': 'التاريخ يجب أن يكون بصيغة YYYY-MM-DD'
      })
  }),
  monthlyRevenue: Joi.object({
    year: Joi.number().integer().min(2000).max(2100).optional(),
    month: Joi.number().integer().min(1).max(12).optional()
  }),
  dateRange: Joi.object({
    startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
  }),
  pendingPayments: Joi.object({
    days: Joi.number().integer().min(0).optional()
  })
};

// Get daily revenue report
router.get('/daily-revenue', validate(reportSchemas.dailyRevenue, 'query'), async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const [rows] = await db.execute(`
      SELECT 
        DATE_FORMAT(p.createdAt, '%Y-%m-%d') as date,
        SUM(p.amount) as totalRevenue,
        COUNT(p.id) as paymentCount,
        AVG(p.amount) as averagePayment
      FROM Payment p
      WHERE DATE(p.createdAt) = ?
      GROUP BY DATE(p.createdAt)
    `, [targetDate]);
    
    res.json({
      success: true,
      date: targetDate,
      totalRevenue: rows[0]?.totalRevenue || 0,
      paymentCount: rows[0]?.paymentCount || 0,
      averagePayment: rows[0]?.averagePayment || 0
    });
  } catch (err) {
    console.error('Error fetching daily revenue:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get monthly revenue report
router.get('/monthly-revenue', validate(reportSchemas.monthlyRevenue, 'query'), async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;
    
    const [rows] = await db.execute(`
      SELECT 
        DATE_FORMAT(p.createdAt, '%Y-%m') as month,
        SUM(p.amount) as totalRevenue,
        COUNT(p.id) as paymentCount,
        AVG(p.amount) as averagePayment
      FROM Payment p
      WHERE YEAR(p.createdAt) = ? AND MONTH(p.createdAt) = ?
      GROUP BY YEAR(p.createdAt), MONTH(p.createdAt)
    `, [targetYear, targetMonth]);
    
    res.json({
      success: true,
      year: targetYear,
      month: targetMonth,
      totalRevenue: rows[0]?.totalRevenue || 0,
      paymentCount: rows[0]?.paymentCount || 0,
      averagePayment: rows[0]?.averagePayment || 0
    });
  } catch (err) {
    console.error('Error fetching monthly revenue:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get expenses report
router.get('/expenses', validate(reportSchemas.dateRange, 'query'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        ec.name as category,
        SUM(e.amount) as totalAmount,
        COUNT(e.id) as expenseCount
      FROM Expense e
      LEFT JOIN ExpenseCategory ec ON e.categoryId = ec.id
      WHERE e.deletedAt IS NULL
    `;
    const params = [];
    
    if (startDate) {
      query += ' AND DATE(e.createdAt) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(e.createdAt) <= ?';
      params.push(endDate);
    }
    
    query += ' GROUP BY ec.id, ec.name ORDER BY totalAmount DESC';
    
    const [rows] = await db.execute(query, params);
    
    res.json({
      success: true,
      startDate: startDate || null,
      endDate: endDate || null,
      expenses: rows
    });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server Error',
      details: err.message 
    });
  }
});

// Get profit-loss report
router.get('/profit-loss', validate(reportSchemas.dateRange, 'query'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let revenueQuery = `
      SELECT SUM(p.amount) as totalRevenue
      FROM Payment p
      WHERE 1=1
    `;
    let expenseQuery = `
      SELECT SUM(e.amount) as totalExpenses
      FROM Expense e
      WHERE e.deletedAt IS NULL
    `;
    const revenueParams = [];
    const expenseParams = [];
    
    if (startDate) {
      revenueQuery += ' AND DATE(p.createdAt) >= ?';
      expenseQuery += ' AND DATE(e.createdAt) >= ?';
      revenueParams.push(startDate);
      expenseParams.push(startDate);
    }
    
    if (endDate) {
      revenueQuery += ' AND DATE(p.createdAt) <= ?';
      expenseQuery += ' AND DATE(e.createdAt) <= ?';
      revenueParams.push(endDate);
      expenseParams.push(endDate);
    }
    
    const [revenueRows] = await db.execute(revenueQuery, revenueParams);
    const [expenseRows] = await db.execute(expenseQuery, expenseParams);
    
    const totalRevenue = revenueRows[0]?.totalRevenue || 0;
    const totalExpenses = expenseRows[0]?.totalExpenses || 0;
    const profit = totalRevenue - totalExpenses;
    
    res.json({
      success: true,
      startDate: startDate || null,
      endDate: endDate || null,
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin: totalRevenue > 0 ? (profit / totalRevenue * 100) : 0
    });
  } catch (err) {
    console.error('Error fetching profit-loss:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get technician performance report
router.get('/technician-performance', validate(reportSchemas.dateRange, 'query'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        u.name as technicianName,
        COUNT(rr.id) as totalRepairs,
        COUNT(CASE WHEN rr.status = 'completed' THEN 1 END) as completedRepairs,
        AVG(CASE WHEN rr.status = 'completed' THEN 
          TIMESTAMPDIFF(HOUR, rr.createdAt, rr.updatedAt) END) as averageRepairTime,
        SUM(CASE WHEN rr.status = 'completed' THEN 
          COALESCE(rr.estimatedCost, 0) END) as totalRevenue
      FROM RepairRequest rr
      JOIN User u ON rr.technicianId = u.id
      WHERE u.roleId = 6 AND rr.deletedAt IS NULL
    `;
    const params = [];
    
    if (startDate) {
      query += ' AND DATE(rr.createdAt) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(rr.createdAt) <= ?';
      params.push(endDate);
    }
    
    query += ' GROUP BY u.id, u.name ORDER BY totalRepairs DESC';
    
    const [rows] = await db.execute(query, params);
    
    res.json({
      success: true,
      startDate: startDate || null,
      endDate: endDate || null,
      technicians: rows
    });
  } catch (err) {
    console.error('Error fetching technician performance:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get inventory value report
router.get('/inventory-value', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        ii.name as itemName,
        ii.type as category,
        sl.quantity,
        ii.purchasePrice as unitPrice,
        (sl.quantity * ii.purchasePrice) as totalValue
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE sl.quantity > 0 AND ii.deletedAt IS NULL
      ORDER BY totalValue DESC
    `);
    
    const totalValue = rows.reduce((sum, row) => sum + (parseFloat(row.totalValue) || 0), 0);
    
    res.json({
      success: true,
      totalValue,
      items: rows,
      itemCount: rows.length
    });
  } catch (err) {
    console.error('Error fetching inventory value:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get pending payments report
router.get('/pending-payments', validate(reportSchemas.pendingPayments, 'query'), async (req, res) => {
  try {
    const { days } = req.query;
    const daysThreshold = days ? parseInt(days) : 30;
    
    const [rows] = await db.execute(`
      SELECT 
        i.id as invoiceId,
        i.totalAmount,
        COALESCE(SUM(p.amount), 0) as paidAmount,
        (i.totalAmount - COALESCE(SUM(p.amount), 0)) as pendingAmount,
        DATEDIFF(NOW(), i.createdAt) as daysPending,
        c.name as customerName,
        c.phone as customerPhone
      FROM Invoice i
      LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Payment p ON i.id = p.invoiceId
      WHERE i.status != 'paid' AND i.deletedAt IS NULL
      GROUP BY i.id
      HAVING pendingAmount > 0 AND daysPending >= ?
      ORDER BY daysPending DESC
    `, [daysThreshold]);
    
    const totalPendingAmount = rows.reduce((sum, row) => sum + (parseFloat(row.pendingAmount) || 0), 0);
    
    res.json({
      success: true,
      daysThreshold,
      totalPendingAmount,
      paymentCount: rows.length,
      payments: rows
    });
  } catch (err) {
    console.error('Error fetching pending payments:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;
