const express = require('express');
const router = express.Router();
const db = require('../db');

// Calculate repair cost including parts and services
router.post('/financial/calculate-repair-cost', async (req, res) => {
  try {
    const { repairId } = req.body;
    
    // Get parts used cost
    const [partsRows] = await db.query(`
      SELECT 
        pu.quantity,
        pu.unitCost,
        pu.totalCost,
        ii.name as partName
      FROM PartsUsed pu
      JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
      WHERE pu.repairRequestId = ?
    `, [repairId]);
    
    // Get services used cost
    const [servicesRows] = await db.query(`
      SELECT 
        rrs.quantity,
        rrs.unitPrice,
        rrs.totalPrice,
        s.serviceName
      FROM RepairRequestService rrs
      JOIN Service s ON rrs.serviceId = s.id
      WHERE rrs.repairRequestId = ?
    `, [repairId]);
    
    // Calculate totals
    const partsCost = partsRows.reduce((sum, part) => sum + (part.totalCost || 0), 0);
    const servicesCost = servicesRows.reduce((sum, service) => sum + (service.totalPrice || 0), 0);
    const totalCost = partsCost + servicesCost;
    
    // Update repair with calculated cost
    await db.query(
      'UPDATE RepairRequest SET actualCost = ? WHERE id = ?',
      [totalCost, repairId]
    );
    
    res.json({
      repairId,
      partsCost,
      servicesCost,
      totalCost,
      parts: partsRows,
      services: servicesRows
    });
  } catch (error) {
    console.error('Error calculating repair cost:', error);
    res.status(500).json({ message: 'خطأ في حساب تكلفة الإصلاح' });
  }
});

// Track expenses by category and repair
router.post('/financial/track-expense', async (req, res) => {
  try {
    const { 
      category, 
      amount, 
      description, 
      repairId = null, 
      userId, 
      expenseType = 'operational' 
    } = req.body;
    
    // Create expense record
    const [expenseResult] = await db.query(
      'INSERT INTO Expense (category, amount, description, repairId, userId, expenseType, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [category, amount, description, repairId, userId, expenseType]
    );
    
    const expenseId = expenseResult.insertId;
    
    // If expense is related to a repair, update repair cost
    if (repairId) {
      await db.query(
        'UPDATE RepairRequest SET actualCost = actualCost + ? WHERE id = ?',
        [amount, repairId]
      );
    }
    
    res.json({
      message: 'تم تسجيل المصروف بنجاح',
      expenseId,
      amount,
      category
    });
  } catch (error) {
    console.error('Error tracking expense:', error);
    res.status(500).json({ message: 'خطأ في تسجيل المصروف' });
  }
});

// Calculate profit and loss for a repair
router.get('/financial/repair-profit-loss/:repairId', async (req, res) => {
  try {
    const { repairId } = req.params;
    
    // Get repair revenue (from invoice)
    const [revenueRows] = await db.query(`
      SELECT 
        i.totalAmount as revenue,
        COALESCE(SUM(p.amount), 0) as receivedAmount
      FROM Invoice i
      LEFT JOIN Payment p ON i.id = p.invoiceId
      WHERE i.repairRequestId = ?
      GROUP BY i.id
    `, [repairId]);
    
    // Get repair costs
    const [costRows] = await db.query(`
      SELECT 
        rr.actualCost as repairCost,
        COALESCE(SUM(e.amount), 0) as additionalExpenses
      FROM RepairRequest rr
      LEFT JOIN Expense e ON rr.id = e.repairId
      WHERE rr.id = ?
      GROUP BY rr.id
    `, [repairId]);
    
    const revenue = revenueRows[0]?.revenue || 0;
    const receivedAmount = revenueRows[0]?.receivedAmount || 0;
    const repairCost = costRows[0]?.repairCost || 0;
    const additionalExpenses = costRows[0]?.additionalExpenses || 0;
    
    const totalCost = repairCost + additionalExpenses;
    const profit = revenue - totalCost;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    res.json({
      repairId,
      revenue,
      receivedAmount,
      totalCost,
      profit,
      profitMargin,
      repairCost,
      additionalExpenses,
      isProfitable: profit > 0
    });
  } catch (error) {
    console.error('Error calculating profit-loss:', error);
    res.status(500).json({ message: 'خطأ في حساب الأرباح والخسائر' });
  }
});

// Get financial dashboard data
router.get('/financial/dashboard', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    if (period === 'day') {
      dateFilter = 'AND DATE(createdAt) = CURDATE()';
    } else if (period === 'week') {
      dateFilter = 'AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
    } else if (period === 'month') {
      dateFilter = 'AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    }
    
    // Get revenue data
    const [revenueRows] = await db.query(`
      SELECT 
        SUM(p.amount) as totalRevenue,
        COUNT(p.id) as paymentCount,
        AVG(p.amount) as averagePayment
      FROM Payment p
      WHERE 1=1 ${dateFilter}
    `);
    
    // Get expense data
    const [expenseRows] = await db.query(`
      SELECT 
        SUM(amount) as totalExpenses,
        COUNT(id) as expenseCount
      FROM Expense
      WHERE 1=1 ${dateFilter}
    `);
    
    // Get repair statistics
    const [repairRows] = await db.query(`
      SELECT 
        COUNT(*) as totalRepairs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedRepairs,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as inProgressRepairs,
        SUM(actualCost) as totalRepairCosts
      FROM RepairRequest
      WHERE 1=1 ${dateFilter}
    `);
    
    // Get outstanding payments
    const [outstandingRows] = await db.query(`
      SELECT 
        COUNT(*) as outstandingInvoices,
        SUM(i.totalAmount - COALESCE(SUM(p.amount), 0)) as outstandingAmount
      FROM Invoice i
      LEFT JOIN Payment p ON i.id = p.invoiceId
      WHERE i.status != 'paid'
      GROUP BY i.id
    `);
    
    const totalRevenue = revenueRows[0]?.totalRevenue || 0;
    const totalExpenses = expenseRows[0]?.totalExpenses || 0;
    const netProfit = totalRevenue - totalExpenses;
    
    res.json({
      period,
      revenue: {
        total: totalRevenue,
        count: revenueRows[0]?.paymentCount || 0,
        average: revenueRows[0]?.averagePayment || 0
      },
      expenses: {
        total: totalExpenses,
        count: expenseRows[0]?.expenseCount || 0
      },
      profit: {
        net: netProfit,
        margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      },
      repairs: {
        total: repairRows[0]?.totalRepairs || 0,
        completed: repairRows[0]?.completedRepairs || 0,
        inProgress: repairRows[0]?.inProgressRepairs || 0,
        totalCosts: repairRows[0]?.totalRepairCosts || 0
      },
      outstanding: {
        invoices: outstandingRows[0]?.outstandingInvoices || 0,
        amount: outstandingRows[0]?.outstandingAmount || 0
      }
    });
  } catch (error) {
    console.error('Error getting financial dashboard:', error);
    res.status(500).json({ message: 'خطأ في جلب بيانات لوحة التحكم المالية' });
  }
});

// Generate financial reports
router.get('/financial/reports', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      reportType = 'summary' 
    } = req.query;
    
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `AND DATE(createdAt) BETWEEN '${startDate}' AND '${endDate}'`;
    }
    
    if (reportType === 'detailed') {
      // Detailed financial report
      const [detailedRows] = await db.query(`
        SELECT 
          DATE(createdAt) as date,
          SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END) as dailyRevenue,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as dailyExpenses,
          COUNT(CASE WHEN type = 'revenue' THEN 1 END) as revenueTransactions,
          COUNT(CASE WHEN type = 'expense' THEN 1 END) as expenseTransactions
        FROM (
          SELECT 'revenue' as type, amount, createdAt FROM Payment
          UNION ALL
          SELECT 'expense' as type, amount, createdAt FROM Expense
        ) as financial_data
        WHERE 1=1 ${dateFilter}
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
      `);
      
      res.json({
        reportType: 'detailed',
        data: detailedRows,
        period: { startDate, endDate }
      });
    } else {
      // Summary report
      const [summaryRows] = await db.query(`
        SELECT 
          'Revenue' as category,
          SUM(amount) as total,
          COUNT(*) as transactions
        FROM Payment
        WHERE 1=1 ${dateFilter}
        UNION ALL
        SELECT 
          'Expenses' as category,
          SUM(amount) as total,
          COUNT(*) as transactions
        FROM Expense
        WHERE 1=1 ${dateFilter}
      `);
      
      res.json({
        reportType: 'summary',
        data: summaryRows,
        period: { startDate, endDate }
      });
    }
  } catch (error) {
    console.error('Error generating financial reports:', error);
    res.status(500).json({ message: 'خطأ في إنشاء التقارير المالية' });
  }
});

// Update costs automatically based on market prices
router.post('/financial/update-market-prices', async (req, res) => {
  try {
    const { items, userId } = req.body;
    
    const results = [];
    
    for (const item of items) {
      // Update inventory item price
      await db.query(
        'UPDATE InventoryItem SET unitPrice = ? WHERE id = ?',
        [item.newPrice, item.inventoryItemId]
      );
      
      // Log the price change
      await db.query(
        'INSERT INTO Expense (category, amount, description, userId, expenseType, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
        ['price_adjustment', 0, `تحديث سعر ${item.name} من ${item.oldPrice} إلى ${item.newPrice}`, userId, 'system']
      );
      
      results.push({
        inventoryItemId: item.inventoryItemId,
        name: item.name,
        oldPrice: item.oldPrice,
        newPrice: item.newPrice
      });
    }
    
    res.json({
      message: 'تم تحديث الأسعار حسب السوق بنجاح',
      items: results
    });
  } catch (error) {
    console.error('Error updating market prices:', error);
    res.status(500).json({ message: 'خطأ في تحديث الأسعار' });
  }
});

module.exports = router;
