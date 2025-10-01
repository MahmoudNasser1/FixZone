const express = require('express');
const router = express.Router();
const db = require('../db');

// Simplified Repairs Route - Basic functionality only
router.get('/', async (req, res) => {
  try {
    const { customerId, status, priority } = req.query;
    
    // بناء الاستعلام مع الفلاتر
    let whereConditions = ['rr.deletedAt IS NULL'];
    let queryParams = [];
    
    if (customerId) {
      whereConditions.push('rr.customerId = ?');
      queryParams.push(customerId);
    }
    
    if (status) {
      whereConditions.push('rr.status = ?');
      queryParams.push(status);
    }
    
    // جلب جميع طلبات الإصلاح مع بيانات العملاء
    const query = `
      SELECT 
        rr.*,
        CONCAT(c.firstName, ' ', c.lastName) as customerName,
        c.phone as customerPhone,
        c.email as customerEmail
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY rr.createdAt DESC
      LIMIT 50
    `;
    
    const [rows] = await db.query(query, queryParams);
    
    // تحويل البيانات لتتوافق مع Frontend
    const formattedData = rows.map(row => ({
      id: row.id,
      requestNumber: `REP-${new Date(row.createdAt).getFullYear()}${String(new Date(row.createdAt).getMonth() + 1).padStart(2, '0')}${String(new Date(row.createdAt).getDate()).padStart(3, '0')}`,
      customerName: row.customerName || 'غير محدد',
      customerPhone: row.customerPhone || 'غير محدد',
      customerEmail: row.customerEmail || 'غير محدد',
      deviceType: row.deviceType || 'غير محدد',
      deviceBrand: row.deviceBrand || 'غير محدد',
      deviceModel: row.deviceModel || 'غير محدد',
      problemDescription: row.issueDescription || 'لا توجد تفاصيل محددة للمشكلة',
      status: row.status || 'pending',
      priority: row.priority || 'medium',
      estimatedCost: row.estimatedCost || '0.00',
      actualCost: row.actualCost || null,
      expectedDeliveryDate: row.expectedDeliveryDate || null,
      notes: row.notes || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
    
    res.json(formattedData);
    
  } catch (error) {
    console.error('Error fetching repairs:', error);
    res.status(500).json({ 
      error: 'Server Error',
      details: error.message 
    });
  }
});

// Get repair by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        rr.*,
        CONCAT(c.firstName, ' ', c.lastName) as customerName,
        c.phone as customerPhone,
        c.email as customerEmail
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      WHERE rr.id = ? AND rr.deletedAt IS NULL
    `;
    
    const [rows] = await db.query(query, [id]);
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Repair request not found' });
    }
    
    const repair = rows[0];
    const formattedRepair = {
      id: repair.id,
      requestNumber: `REP-${new Date(repair.createdAt).getFullYear()}${String(new Date(repair.createdAt).getMonth() + 1).padStart(2, '0')}${String(new Date(repair.createdAt).getDate()).padStart(3, '0')}`,
      customerName: repair.customerName || 'غير محدد',
      customerPhone: repair.customerPhone || 'غير محدد',
      customerEmail: repair.customerEmail || 'غير محدد',
      deviceType: repair.deviceType || 'غير محدد',
      deviceBrand: repair.deviceBrand || 'غير محدد',
      deviceModel: repair.deviceModel || 'غير محدد',
      problemDescription: repair.issueDescription || 'لا توجد تفاصيل محددة للمشكلة',
      status: repair.status || 'pending',
      priority: repair.priority || 'medium',
      estimatedCost: repair.estimatedCost || '0.00',
      actualCost: repair.actualCost || null,
      expectedDeliveryDate: repair.expectedDeliveryDate || null,
      notes: repair.notes || null,
      createdAt: repair.createdAt,
      updatedAt: repair.updatedAt
    };
    
    res.json(formattedRepair);
    
  } catch (error) {
    console.error('Error fetching repair:', error);
    res.status(500).json({ 
      error: 'Server Error',
      details: error.message 
    });
  }
});

module.exports = router;
