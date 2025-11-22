const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// 🔧 Fix #3: Get pending approvals
// GET /api/repairs-approvals
router.get('/', async (req, res) => {
  try {
    const { status = 'pending', repairRequestId, priority } = req.query;
    
    let whereConditions = [];
    let queryParams = [];
    
    if (status) {
      whereConditions.push('rpa.status = ?');
      queryParams.push(status);
    }
    
    if (repairRequestId) {
      whereConditions.push('rpa.repairRequestId = ?');
      queryParams.push(repairRequestId);
    }
    
    if (priority) {
      whereConditions.push('rpa.priority = ?');
      queryParams.push(priority);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const [approvals] = await db.query(`
      SELECT 
        rpa.*,
        rr.id as repairId,
        CONCAT(d.brand, ' ', d.model) as deviceInfo,
        c.name as customerName,
        c.phone as customerPhone,
        ii.name as partName,
        ii.sku as partSku,
        pu.quantity as partQuantity,
        pu.unitPurchasePrice,
        pu.totalCost,
        u_requested.name as requestedByName,
        u_approved.name as approvedByName,
        r.name as approverRoleName
      FROM RepairPartsApproval rpa
      LEFT JOIN RepairRequest rr ON rpa.repairRequestId = rr.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN PartsUsed pu ON rpa.partsUsedId = pu.id
      LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
      LEFT JOIN User u_requested ON rpa.requestedBy = u_requested.id
      LEFT JOIN User u_approved ON rpa.approvedBy = u_approved.id
      LEFT JOIN Role r ON rpa.approverRoleId = r.id
      ${whereClause}
      ORDER BY 
        CASE rpa.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END,
        rpa.requestedAt ASC
    `, queryParams);
    
    res.json({
      success: true,
      data: approvals,
      count: approvals.length
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب طلبات الموافقة',
      details: error.message
    });
  }
});

// 🔧 Fix #3: Get approval by ID
// GET /api/repairs-approvals/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [approvals] = await db.query(`
      SELECT 
        rpa.*,
        rr.id as repairId,
        CONCAT(d.brand, ' ', d.model) as deviceInfo,
        c.name as customerName,
        c.phone as customerPhone,
        ii.name as partName,
        ii.sku as partSku,
        pu.quantity as partQuantity,
        pu.unitPurchasePrice,
        pu.totalCost,
        u_requested.name as requestedByName,
        u_approved.name as approvedByName,
        r.name as approverRoleName
      FROM RepairPartsApproval rpa
      LEFT JOIN RepairRequest rr ON rpa.repairRequestId = rr.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN PartsUsed pu ON rpa.partsUsedId = pu.id
      LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
      LEFT JOIN User u_requested ON rpa.requestedBy = u_requested.id
      LEFT JOIN User u_approved ON rpa.approvedBy = u_approved.id
      LEFT JOIN Role r ON rpa.approverRoleId = r.id
      WHERE rpa.id = ?
    `, [id]);
    
    if (approvals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'طلب الموافقة غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: approvals[0]
    });
  } catch (error) {
    console.error('Error fetching approval:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب طلب الموافقة',
      details: error.message
    });
  }
});

// 🔧 Fix #3: Approve a part request
// POST /api/repairs-approvals/:id/approve
router.post('/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { notes = '' } = req.body || {};
  const userId = req.user?.id || null;
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get approval details
    const [approvals] = await connection.query(
      'SELECT * FROM RepairPartsApproval WHERE id = ? AND status = "pending"',
      [id]
    );
    
    if (approvals.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'طلب الموافقة غير موجود أو تم معالجته مسبقاً'
      });
    }
    
    const approval = approvals[0];
    
    // Update approval status
    await connection.query(`
      UPDATE RepairPartsApproval 
      SET status = 'approved', 
          approvedBy = ?, 
          reviewedAt = NOW(),
          requestReason = CONCAT(COALESCE(requestReason, ''), IF(?, CONCAT('\n', ?), ''))
      WHERE id = ?
    `, [userId, notes ? 1 : 0, notes, id]);
    
    // Update PartsUsed status to 'approved'
    if (approval.partsUsedId) {
      await connection.query(`
        UPDATE PartsUsed 
        SET status = 'approved', 
            approvedBy = ?, 
            approvedAt = NOW(),
            updatedAt = NOW()
        WHERE id = ?
      `, [userId, approval.partsUsedId]);
    }
    
    // If the part can be used immediately, also deduct stock
    // (This is already handled when the part was issued, but we can confirm it here)
    
    await connection.commit();
    connection.release();
    
    res.json({
      success: true,
      message: 'تم الموافقة على القطعة بنجاح',
      data: {
        approvalId: id,
        partsUsedId: approval.partsUsedId,
        status: 'approved'
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error approving part:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الموافقة على القطعة',
      details: error.message
    });
  }
});

// 🔧 Fix #3: Reject a part request
// POST /api/repairs-approvals/:id/reject
router.post('/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { rejectionReason = 'تم رفض الطلب' } = req.body || {};
  const userId = req.user?.id || null;
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get approval details
    const [approvals] = await connection.query(
      'SELECT * FROM RepairPartsApproval WHERE id = ? AND status = "pending"',
      [id]
    );
    
    if (approvals.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'طلب الموافقة غير موجود أو تم معالجته مسبقاً'
      });
    }
    
    const approval = approvals[0];
    
    // Update approval status
    await connection.query(`
      UPDATE RepairPartsApproval 
      SET status = 'rejected', 
          approvedBy = ?, 
          rejectionReason = ?,
          reviewedAt = NOW()
      WHERE id = ?
    `, [userId, rejectionReason, id]);
    
    // Update PartsUsed status to 'cancelled'
    if (approval.partsUsedId) {
      await connection.query(`
        UPDATE PartsUsed 
        SET status = 'cancelled', 
            updatedAt = NOW()
        WHERE id = ?
      `, [approval.partsUsedId]);
      
      // Return stock if already deducted (optional - depends on business logic)
      // This would require tracking the stock movement
    }
    
    await connection.commit();
    connection.release();
    
    res.json({
      success: true,
      message: 'تم رفض الطلب بنجاح',
      data: {
        approvalId: id,
        partsUsedId: approval.partsUsedId,
        status: 'rejected'
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error rejecting part:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في رفض الطلب',
      details: error.message
    });
  }
});

module.exports = router;


