const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');
const db = require('../db');
const websocketService = require('../services/websocketService');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeMiddleware = require('../middleware/authorizeMiddleware');

// Validation middleware
const validateComponent = [
  body('inspectionReportId')
    .notEmpty().withMessage('inspectionReportId is required')
    .isInt().withMessage('inspectionReportId must be an integer'),
  body('name')
    .notEmpty().withMessage('name is required')
    .isString().withMessage('name must be a string')
    .isLength({ max: 100 }).withMessage('name must not exceed 100 characters'),
  body('status')
    .notEmpty().withMessage('status is required')
    .isIn(['WORKING', 'PARTIAL', 'DEFECTIVE', 'NOT_PRESENT', 'working', 'not_working', 'needs_repair', 'replaced', 'not_applicable']).withMessage('Invalid status value'),
  body('componentType')
    .optional()
    .isString().withMessage('componentType must be a string')
    .isLength({ max: 100 }).withMessage('componentType must not exceed 100 characters'),
  body('condition')
    .optional()
    .isIn(['excellent', 'good', 'fair', 'poor', 'critical']).withMessage('Invalid condition value'),
  body('notes')
    .optional()
    .isString().withMessage('notes must be a string'),
  body('priority')
    .optional()
    .isIn(['HIGH', 'MEDIUM', 'LOW', 'NONE', 1, 2, 3, 4, 5]).withMessage('Invalid priority value'),
  body('estimatedCost')
    .optional()
    .isFloat({ min: 0 }).withMessage('estimatedCost must be a positive number'),
  body('partsUsedId')
    .optional()
    .isInt().withMessage('partsUsedId must be an integer'),
  body('isReplaced')
    .optional()
    .isBoolean().withMessage('isReplaced must be a boolean'),
];

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Get all inspection components or by reportId (Authenticated)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { reportId, componentType, status } = req.query;
    // #region agent log
    const fs = require('fs');
    const logPath = '/opt/lampp/htdocs/FixZone/.cursor/debug.log';
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'inspectionComponents.js:60',message:'GET inspection components entry',data:{reportId,componentType,status,query:req.query},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
    } catch(e){}
    // #endregion
    
    let query = `
      SELECT 
        ic.*,
        pu.inventoryItemId,
        pu.quantity,
        ii.name as partName,
        ii.sku as partSku
      FROM InspectionComponent ic
      LEFT JOIN PartsUsed pu ON ic.partsUsedId = pu.id
      LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id AND (ii.deletedAt IS NULL OR ii.deletedAt = '0000-00-00 00:00:00')
      WHERE 1=1
    `;
    const params = [];
    
    if (reportId) {
      query += ' AND ic.inspectionReportId = ?';
      params.push(reportId);
    }
    if (componentType) {
      query += ' AND ic.componentType = ?';
      params.push(componentType);
    }
    if (status) {
      query += ' AND ic.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY ic.priority DESC, ic.createdAt ASC';
    
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'inspectionComponents.js:89',message:'Before executing query',data:{query,params},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
    } catch(e){}
    // #endregion
    
    const [rows] = await db.query(query, params);
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'inspectionComponents.js:92',message:'Query executed successfully',data:{rowsCount:rows?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
    } catch(e){}
    // #endregion
    res.json({ success: true, data: rows });
  } catch (err) {
    // #region agent log
    const fs = require('fs');
    const logPath = '/opt/lampp/htdocs/FixZone/.cursor/debug.log';
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'inspectionComponents.js:95',message:'Error fetching inspection components',data:{error:err?.message,stack:err?.stack,reportId:req.query?.reportId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n');
    } catch(e){}
    // #endregion
    console.error('Error fetching inspection components:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get inspection component by ID (Authenticated)
router.get('/:id', 
  authMiddleware,
  param('id').isInt().withMessage('Component ID must be an integer'),
  checkValidation,
  async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        ic.*,
        pu.inventoryItemId,
        pu.quantity,
        ii.name as partName,
        ii.sku as partSku
      FROM InspectionComponent ic
      LEFT JOIN PartsUsed pu ON ic.partsUsedId = pu.id
      LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id AND (ii.deletedAt IS NULL OR ii.deletedAt = '0000-00-00 00:00:00')
      WHERE ic.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Inspection component not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(`Error fetching inspection component with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Create a new inspection component (Authenticated - Admin/Manager/Technician)
router.post('/', 
  authMiddleware, 
  authorizeMiddleware([1, 2, 3]), 
  validateComponent, 
  checkValidation, 
  async (req, res) => {
  const { 
    inspectionReportId, 
    name, 
    componentType,
    status, 
    condition,
    notes, 
    priority, 
    photo,
    estimatedCost,
    partsUsedId,
    isReplaced,
    replacedAt
  } = req.body;
  
  try {
    // Validate inspectionReportId exists
    const [report] = await db.query('SELECT id, repairRequestId FROM InspectionReport WHERE id = ?', [inspectionReportId]);
    if (!report || report.length === 0) {
      return res.status(404).json({ success: false, error: 'Inspection report not found' });
    }
    
    // Validate partsUsedId if provided
    if (partsUsedId) {
      const [part] = await db.query('SELECT id FROM PartsUsed WHERE id = ?', [partsUsedId]);
      if (!part || part.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid partsUsedId' });
      }
    }
    
    // Normalize status to uppercase enum values
    const normalizedStatus = status.toUpperCase();
    const validStatuses = ['WORKING', 'PARTIAL', 'DEFECTIVE', 'NOT_PRESENT'];
    const finalStatus = validStatuses.includes(normalizedStatus) ? normalizedStatus : 'WORKING';
    
    // Normalize priority
    let finalPriority = priority;
    if (typeof priority === 'number') {
      // Convert numeric priority (1-5) to enum
      if (priority >= 5) finalPriority = 'HIGH';
      else if (priority >= 4) finalPriority = 'HIGH';
      else if (priority >= 3) finalPriority = 'MEDIUM';
      else if (priority >= 2) finalPriority = 'LOW';
      else finalPriority = 'NONE';
    } else if (priority) {
      finalPriority = priority.toUpperCase();
    } else {
      finalPriority = 'MEDIUM';
    }
    
    const [result] = await db.query(
      `INSERT INTO InspectionComponent 
       (inspectionReportId, name, componentType, status, condition, notes, priority, photo, estimatedCost, partsUsedId, isReplaced, replacedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inspectionReportId, 
        name, 
        componentType || null,
        finalStatus, 
        condition || null,
        notes || null, 
        finalPriority, 
        photo || null,
        estimatedCost || null,
        partsUsedId || null,
        isReplaced ? 1 : 0,
        replacedAt || null
      ]
    );
    
    // Fetch created component with joins
    const [created] = await db.query(`
      SELECT 
        ic.*,
        pu.inventoryItemId,
        pu.quantity,
        ii.name as partName,
        ii.sku as partSku
      FROM InspectionComponent ic
      LEFT JOIN PartsUsed pu ON ic.partsUsedId = pu.id AND pu.deletedAt IS NULL
      LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id AND ii.deletedAt IS NULL
      WHERE ic.id = ?
    `, [result.insertId]);
    
    // Send WebSocket notification
    try {
      const [repairRows] = await db.query(
        'SELECT * FROM RepairRequest WHERE id = ? AND deletedAt IS NULL',
        [report[0].repairRequestId]
      );
      if (repairRows && repairRows.length > 0) {
        websocketService.sendRepairUpdate('component_created', repairRows[0]);
      }
    } catch (wsError) {
      console.warn('[InspectionComponents] Failed to send WebSocket notification:', wsError);
    }
    
    res.status(201).json({ success: true, data: created[0] });
  } catch (err) {
    console.error('Error creating inspection component:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Update an inspection component (Authenticated - Admin/Manager/Technician)
router.put('/:id', 
  authMiddleware, 
  authorizeMiddleware([1, 2, 3]), 
  param('id').isInt().withMessage('Component ID must be an integer'),
  validateComponent,
  checkValidation,
  async (req, res) => {
  const { id } = req.params;
  const { 
    inspectionReportId, 
    name, 
    componentType,
    status, 
    condition,
    notes, 
    priority, 
    photo,
    estimatedCost,
    partsUsedId,
    isReplaced,
    replacedAt
  } = req.body;
  
  try {
    // Check if component exists
    const [existing] = await db.query('SELECT id, inspectionReportId FROM InspectionComponent WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Component not found' });
    }
    
    // Validate partsUsedId if provided
    if (partsUsedId) {
      const [part] = await db.query('SELECT id FROM PartsUsed WHERE id = ?', [partsUsedId]);
      if (!part || part.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid partsUsedId' });
      }
    }
    
    // Normalize status and priority (same as POST)
    const normalizedStatus = status.toUpperCase();
    const validStatuses = ['WORKING', 'PARTIAL', 'DEFECTIVE', 'NOT_PRESENT'];
    const finalStatus = validStatuses.includes(normalizedStatus) ? normalizedStatus : 'WORKING';
    
    let finalPriority = priority;
    if (typeof priority === 'number') {
      if (priority >= 5) finalPriority = 'HIGH';
      else if (priority >= 4) finalPriority = 'HIGH';
      else if (priority >= 3) finalPriority = 'MEDIUM';
      else if (priority >= 2) finalPriority = 'LOW';
      else finalPriority = 'NONE';
    } else if (priority) {
      finalPriority = priority.toUpperCase();
    } else {
      finalPriority = 'MEDIUM';
    }
    
    const [result] = await db.query(
      `UPDATE InspectionComponent 
       SET inspectionReportId = ?, name = ?, componentType = ?, status = ?, condition = ?, notes = ?, priority = ?, 
           photo = ?, estimatedCost = ?, partsUsedId = ?, isReplaced = ?, replacedAt = ?, 
           updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        inspectionReportId, 
        name, 
        componentType || null,
        finalStatus, 
        condition || null,
        notes || null, 
        finalPriority, 
        photo || null,
        estimatedCost || null,
        partsUsedId || null,
        isReplaced ? 1 : 0,
        replacedAt || null,
        id
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Component not found' });
    }
    
    // Fetch updated component with joins
    const [updated] = await db.query(`
      SELECT 
        ic.*,
        pu.inventoryItemId,
        pu.quantity,
        ii.name as partName,
        ii.sku as partSku
      FROM InspectionComponent ic
      LEFT JOIN PartsUsed pu ON ic.partsUsedId = pu.id AND pu.deletedAt IS NULL
      LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id AND ii.deletedAt IS NULL
      WHERE ic.id = ?
    `, [id]);
    
    // Send WebSocket notification
    try {
      const [repairRows] = await db.query(
        'SELECT * FROM RepairRequest WHERE id = (SELECT repairRequestId FROM InspectionReport WHERE id = ?) AND deletedAt IS NULL',
        [existing[0].inspectionReportId]
      );
      if (repairRows && repairRows.length > 0) {
        websocketService.sendRepairUpdate('component_updated', repairRows[0]);
      }
    } catch (wsError) {
      console.warn('[InspectionComponents] Failed to send WebSocket notification:', wsError);
    }
    
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error(`Error updating inspection component with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Soft delete an inspection component (Authenticated - Admin/Manager/Technician)
router.delete('/:id', 
  authMiddleware, 
  authorizeMiddleware([1, 2, 3]), 
  param('id').isInt().withMessage('Component ID must be an integer'),
  checkValidation,
  async (req, res) => {
  const { id } = req.params;
  try {
    // Get inspectionReportId before delete
    const [component] = await db.query('SELECT inspectionReportId FROM InspectionComponent WHERE id = ?', [id]);
    
    if (component.length === 0) {
      return res.status(404).json({ success: false, error: 'Component not found' });
    }
    
    // Hard delete (since deletedAt column doesn't exist yet)
    const [result] = await db.query(
      'DELETE FROM InspectionComponent WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Component not found or already deleted' });
    }
    
    // Send WebSocket notification
    try {
      const [repairRows] = await db.query(
        'SELECT * FROM RepairRequest WHERE id = (SELECT repairRequestId FROM InspectionReport WHERE id = ?) AND deletedAt IS NULL',
        [component[0].inspectionReportId]
      );
      if (repairRows && repairRows.length > 0) {
        websocketService.sendRepairUpdate('component_deleted', repairRows[0]);
      }
    } catch (wsError) {
      console.warn('[InspectionComponents] Failed to send WebSocket notification:', wsError);
    }
    
    res.json({ success: true, message: 'Component deleted successfully' });
  } catch (err) {
    console.error(`Error deleting inspection component with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

module.exports = router;
