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
    const formattedData = rows.map(row => {
      // Map database status to frontend status
      const statusMapping = {
        'pending': 'RECEIVED',
        'in_progress': 'UNDER_REPAIR',
        'completed': 'COMPLETED',
        'cancelled': 'CANCELLED',
        'delivered': 'DELIVERED'
      };
      
      return {
        id: row.id,
        requestNumber: `REP-${new Date(row.createdAt).getFullYear()}${String(new Date(row.createdAt).getMonth() + 1).padStart(2, '0')}${String(new Date(row.createdAt).getDate()).padStart(3, '0')}`,
        customerName: row.customerName || 'غير محدد',
        customerPhone: row.customerPhone || 'غير محدد',
        customerEmail: row.customerEmail || 'غير محدد',
        deviceType: row.deviceType || 'غير محدد',
        deviceBrand: row.deviceBrand || 'غير محدد',
        deviceModel: row.deviceModel || 'غير محدد',
        problemDescription: row.issueDescription || 'لا توجد تفاصيل محددة للمشكلة',
        status: statusMapping[row.status] || 'RECEIVED',
        priority: row.priority || 'medium',
        estimatedCost: row.estimatedCost || '0.00',
        actualCost: row.actualCost || null,
        expectedDeliveryDate: row.expectedDeliveryDate || null,
        notes: row.notes || null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };
    });
    
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

// Create new repair request
router.post('/', async (req, res) => {
  try {
    const { 
      customerId, 
      customer,
      deviceBrand, 
      deviceModel, 
      deviceType,
      serialNumber,
      devicePassword,
      reportedProblem,
      issueDescription,
      customerNotes,
      priority = 'medium',
      estimatedCost
    } = req.body;
    
    let finalCustomerId = customerId;
    
    // If customer object provided, create new customer
    if (!finalCustomerId && customer) {
      const { firstName, lastName, phone, email, address } = customer;
      
      if (!firstName || !phone) {
        return res.status(400).json({ 
          success: false,
          error: 'Customer firstName and phone are required' 
        });
      }
      
      const [customerResult] = await db.query(
        `INSERT INTO Customer (firstName, lastName, phone, email, address) 
         VALUES (?, ?, ?, ?, ?)`,
        [firstName, lastName || '', phone, email || null, address || null]
      );
      
      finalCustomerId = customerResult.insertId;
    }
    
    // Validate required fields
    if (!finalCustomerId) {
      return res.status(400).json({ 
        success: false,
        error: 'Either customerId or customer object is required' 
      });
    }
    
    if (!deviceBrand || !deviceModel) {
      return res.status(400).json({ 
        success: false,
        error: 'deviceBrand and deviceModel are required' 
      });
    }
    
    const issue = issueDescription || reportedProblem;
    if (!issue) {
      return res.status(400).json({ 
        success: false,
        error: 'issueDescription or reportedProblem is required' 
      });
    }
    
    // Create repair request
    const [result] = await db.query(
      `INSERT INTO RepairRequest (
        customerId, deviceBrand, deviceModel, deviceType, serialNumber, 
        devicePassword, issueDescription, customerNotes, priority, estimatedCost, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalCustomerId,
        deviceBrand,
        deviceModel,
        deviceType || null,
        serialNumber || null,
        devicePassword || null,
        issue,
        customerNotes || null,
        priority,
        estimatedCost || null,
        'pending' // Set default status
      ]
    );
    
    // Fetch the created repair
    const [rows] = await db.query(
      `SELECT rr.*, CONCAT(c.firstName, ' ', c.lastName) as customerName
       FROM RepairRequest rr
       LEFT JOIN Customer c ON rr.customerId = c.id
       WHERE rr.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        ...rows[0]
      },
      message: 'تم إنشاء طلب الإصلاح بنجاح'
    });
    
  } catch (error) {
    console.error('Error creating repair:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server Error',
      details: error.message 
    });
  }
});

// Update repair request
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if repair exists
    const [existing] = await db.query(
      'SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (!existing.length) {
      return res.status(404).json({ 
        success: false,
        error: 'Repair request not found' 
      });
    }
    
    // Build update query
    const allowedFields = [
      'status', 'priority', 'estimatedCost', 'actualCost', 
      'customerNotes', 'devicePassword', 'assignedTechnicianId'
    ];
    
    const updateFields = [];
    const updateValues = [];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No valid fields to update' 
      });
    }
    
    // Update timestamps based on status
    if (updates.status) {
      if (updates.status === 'in_progress' && !existing[0].startedAt) {
        updateFields.push('startedAt = NOW()');
      } else if (updates.status === 'completed') {
        updateFields.push('completedAt = NOW()');
      } else if (updates.status === 'delivered') {
        updateFields.push('deliveredAt = NOW()');
      }
    }
    
    updateValues.push(id);
    
    await db.query(
      `UPDATE RepairRequest SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Fetch updated repair
    const [rows] = await db.query(
      `SELECT rr.*, CONCAT(c.firstName, ' ', c.lastName) as customerName
       FROM RepairRequest rr
       LEFT JOIN Customer c ON rr.customerId = c.id
       WHERE rr.id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      data: rows[0],
      message: 'تم تحديث طلب الإصلاح بنجاح'
    });
    
  } catch (error) {
    console.error('Error updating repair:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server Error',
      details: error.message 
    });
  }
});

// Delete repair request (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query(
      'UPDATE RepairRequest SET deletedAt = NOW() WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Repair request not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف طلب الإصلاح بنجاح'
    });
    
  } catch (error) {
    console.error('Error deleting repair:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server Error',
      details: error.message 
    });
  }
});

// Get repair by tracking number (for public tracking page)
router.get('/tracking', async (req, res) => {
  try {
    const { trackingToken, requestNumber } = req.query;
    
    if (!trackingToken && !requestNumber) {
      return res.status(400).json({
        success: false,
        error: 'Tracking token or request number is required'
      });
    }
    
    let query = `
      SELECT 
        rr.*,
        CONCAT(c.firstName, ' ', c.lastName) as customerName,
        c.phone as customerPhone,
        c.email as customerEmail,
        b.name as branchName,
        CONCAT(u.firstName, ' ', u.lastName) as technicianName
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id AND c.deletedAt IS NULL
      LEFT JOIN Branch b ON rr.branchId = b.id AND b.deletedAt IS NULL
      LEFT JOIN User u ON rr.technicianId = u.id AND u.deletedAt IS NULL
      WHERE rr.deletedAt IS NULL
    `;
    
    const params = [];
    
    if (trackingToken) {
      query += ' AND rr.trackingToken = ?';
      params.push(trackingToken);
    } else {
      query += ' AND rr.requestNumber = ?';
      params.push(requestNumber);
    }
    
    const [rows] = await db.query(query, params);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Repair request not found'
      });
    }
    
    const repair = rows[0];
    
    // Map database status to frontend status
    const statusMapping = {
      'pending': 'RECEIVED',
      'in_progress': 'UNDER_REPAIR',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED',
      'delivered': 'DELIVERED'
    };

    res.json({
      id: repair.id,
      requestNumber: repair.requestNumber || `REP-${new Date(repair.createdAt).getFullYear()}${String(new Date(repair.createdAt).getMonth() + 1).padStart(2, '0')}${String(new Date(repair.createdAt).getDate()).padStart(3, '0')}`,
      trackingToken: repair.trackingToken,
      status: statusMapping[repair.status] || 'RECEIVED',
      deviceType: repair.deviceType,
      deviceBrand: repair.deviceBrand,
      deviceModel: repair.deviceModel,
      problemDescription: repair.issueDescription,
      estimatedCost: repair.estimatedCost,
      actualCost: repair.actualCost,
      priority: repair.priority,
      estimatedCompletionDate: repair.estimatedCompletionDate,
      customerName: repair.customerName,
      customerPhone: repair.customerPhone,
      customerEmail: repair.customerEmail,
      branchName: repair.branchName,
      technicianName: repair.technicianName,
      notes: repair.notes,
      createdAt: repair.createdAt,
      updatedAt: repair.updatedAt
    });
    
  } catch (error) {
    console.error('Error tracking repair:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      details: error.message
    });
  }
});

module.exports = router;
