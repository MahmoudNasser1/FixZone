const express = require('express');
const router = express.Router();
const db = require('../db');

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

// Get daily revenue report
router.get('/daily-revenue', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const [rows] = await db.query(`
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
      date: targetDate,
      totalRevenue: rows[0]?.totalRevenue || 0,
      paymentCount: rows[0]?.paymentCount || 0,
      averagePayment: rows[0]?.averagePayment || 0
    });
  } catch (err) {
    console.error('Error fetching daily revenue:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Get monthly revenue report
router.get('/monthly-revenue', async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;
    
    const [rows] = await db.query(`
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
      year: targetYear,
      month: targetMonth,
      totalRevenue: rows[0]?.totalRevenue || 0,
      paymentCount: rows[0]?.paymentCount || 0,
      averagePayment: rows[0]?.averagePayment || 0
    });
  } catch (err) {
    console.error('Error fetching monthly revenue:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Get expenses report
router.get('/expenses', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        e.category,
        SUM(e.amount) as totalAmount,
        COUNT(e.id) as expenseCount
      FROM Expense e
      WHERE 1=1
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
    
    query += ' GROUP BY e.category ORDER BY totalAmount DESC';
    
    const [rows] = await db.query(query, params);
    
    res.json({
      startDate: startDate || null,
      endDate: endDate || null,
      expenses: rows
    });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ 
      error: 'Server Error',
      details: err.message 
    });
  }
});

// Get profit-loss report
router.get('/profit-loss', async (req, res) => {
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
      WHERE 1=1
    `;
    const params = [];
    
    if (startDate) {
      revenueQuery += ' AND DATE(p.createdAt) >= ?';
      expenseQuery += ' AND DATE(e.createdAt) >= ?';
      params.push(startDate, startDate);
    }
    
    if (endDate) {
      revenueQuery += ' AND DATE(p.createdAt) <= ?';
      expenseQuery += ' AND DATE(e.createdAt) <= ?';
      params.push(endDate, endDate);
    }
    
    const [revenueRows] = await db.query(revenueQuery, params.slice(0, params.length / 2));
    const [expenseRows] = await db.query(expenseQuery, params.slice(params.length / 2));
    
    const totalRevenue = revenueRows[0]?.totalRevenue || 0;
    const totalExpenses = expenseRows[0]?.totalExpenses || 0;
    const profit = totalRevenue - totalExpenses;
    
    res.json({
      startDate: startDate || null,
      endDate: endDate || null,
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin: totalRevenue > 0 ? (profit / totalRevenue * 100) : 0
    });
  } catch (err) {
    console.error('Error fetching profit-loss:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Get technician performance report
router.get('/technician-performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        CONCAT(u.firstName, ' ', u.lastName) as technicianName,
        COUNT(rr.id) as totalRepairs,
        COUNT(CASE WHEN rr.status = 'completed' THEN 1 END) as completedRepairs,
        AVG(CASE WHEN rr.status = 'completed' THEN 
          TIMESTAMPDIFF(HOUR, rr.createdAt, rr.updatedAt) END) as averageRepairTime,
        SUM(CASE WHEN rr.status = 'completed' THEN 
          COALESCE(rr.estimatedCost, 0) END) as totalRevenue
      FROM RepairRequest rr
      JOIN User u ON rr.assignedTechnicianId = u.id
      WHERE u.role = 'technician'
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
    
    query += ' GROUP BY u.id, u.firstName, u.lastName ORDER BY totalRepairs DESC';
    
    const [rows] = await db.query(query, params);
    
    res.json({
      startDate: startDate || null,
      endDate: endDate || null,
      technicians: rows
    });
  } catch (err) {
    console.error('Error fetching technician performance:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Get inventory value report
router.get('/inventory-value', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ii.name as itemName,
        ii.category,
        sl.quantity,
        ii.unitPrice,
        (sl.quantity * ii.unitPrice) as totalValue
      FROM InventoryItem ii
      JOIN StockLevel sl ON ii.id = sl.inventoryItemId
      WHERE sl.quantity > 0
      ORDER BY totalValue DESC
    `);
    
    const totalValue = rows.reduce((sum, row) => sum + row.totalValue, 0);
    
    res.json({
      totalValue,
      items: rows,
      itemCount: rows.length
    });
  } catch (err) {
    console.error('Error fetching inventory value:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Get pending payments report
router.get('/pending-payments', async (req, res) => {
  try {
    const { days } = req.query;
    const daysThreshold = days ? parseInt(days) : 30;
    
    const [rows] = await db.query(`
      SELECT 
        i.id as invoiceId,
        i.invoiceNumber,
        CONCAT(c.firstName, ' ', c.lastName) as customerName,
        i.totalAmount,
        COALESCE(SUM(p.amount), 0) as paidAmount,
        (i.totalAmount - COALESCE(SUM(p.amount), 0)) as pendingAmount,
        DATEDIFF(NOW(), i.createdAt) as daysPending
      FROM Invoice i
      JOIN Customer c ON i.customerId = c.id
      LEFT JOIN Payment p ON i.id = p.invoiceId
      WHERE i.status != 'paid'
      GROUP BY i.id
      HAVING pendingAmount > 0 AND daysPending >= ?
      ORDER BY daysPending DESC
    `, [daysThreshold]);
    
    res.json({
      daysThreshold,
      totalPendingAmount: rows.reduce((sum, row) => sum + row.pendingAmount, 0),
      paymentCount: rows.length,
      payments: rows
    });
  } catch (err) {
    console.error('Error fetching pending payments:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

module.exports = router;
