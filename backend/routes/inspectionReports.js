const express = require('express');
const router = express.Router();
const db = require('../db');
const websocketService = require('../services/websocketService');

// Get all inspection reports
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM InspectionReport');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching inspection reports:', err);
    res.status(500).send('Server Error');
  }
});

// Get inspection reports by repair request ID
router.get('/repair/:repairRequestId', async (req, res) => {
  const { repairRequestId } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        ir.*,
        COALESCE(it.name, 'تقرير فحص') as inspectionTypeName,
        u.name as technicianName,
        b.name as branchName
      FROM InspectionReport ir
      LEFT JOIN InspectionType it ON ir.inspectionTypeId = it.id AND (it.deletedAt IS NULL OR it.deletedAt = '0000-00-00 00:00:00')
      LEFT JOIN User u ON ir.technicianId = u.id AND u.deletedAt IS NULL
      LEFT JOIN Branch b ON ir.branchId = b.id
      WHERE ir.repairRequestId = ?
      ORDER BY ir.reportDate DESC, ir.createdAt DESC
    `, [repairRequestId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(`Error fetching inspection reports for repair ${repairRequestId}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Get inspection report by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM InspectionReport WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Inspection report not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching inspection report with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new inspection report (resilient to missing FKs)
router.post('/', async (req, res) => {
  let { repairRequestId, inspectionTypeId, technicianId, summary, result, recommendations, notes, reportDate, branchId, invoiceLink, qrCode, attachments } = req.body || {};
  if (!repairRequestId || !reportDate) {
    return res.status(400).json({ error: 'repairRequestId and reportDate are required' });
  }
  try {
    // Ensure repair exists
    const [repRows] = await db.query('SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [repairRequestId]);
    if (!repRows || repRows.length === 0) {
      return res.status(404).json({ error: 'Repair request not found' });
    }

    // Validate/resolve inspectionTypeId
    let validInspectionTypeId = null;
    if (inspectionTypeId) {
      const [it] = await db.query('SELECT id FROM InspectionType WHERE id = ? AND deletedAt IS NULL', [inspectionTypeId]);
      if (it && it.length > 0) validInspectionTypeId = it[0].id;
    }
    if (!validInspectionTypeId) {
      const [byName] = await db.query("SELECT id FROM InspectionType WHERE name IN ('فحص مبدئي','فحص نهائي','Initial Inspection') AND deletedAt IS NULL ORDER BY id LIMIT 1");
      if (byName && byName.length > 0) {
        validInspectionTypeId = byName[0].id;
      } else {
        const [created] = await db.query('INSERT INTO InspectionType (name, description, isActive) VALUES (?, ?, ?)', ['فحص مبدئي', 'نوع فحص افتراضي', 1]);
        validInspectionTypeId = created.insertId;
      }
    }

    // Validate/resolve technicianId (optional)
    let validTechnicianId = null;
    if (technicianId) {
      const [tech] = await db.query('SELECT id FROM User WHERE id = ? AND deletedAt IS NULL', [technicianId]);
      if (tech && tech.length > 0) validTechnicianId = tech[0].id;
    }

    // Validate branchId (optional)
    let validBranchId = null;
    if (branchId) {
      const [br] = await db.query('SELECT id FROM Branch WHERE id = ? AND deletedAt IS NULL', [branchId]);
      if (br && br.length > 0) validBranchId = br[0].id;
    }

    const payload = [
      Number(repairRequestId),
      validInspectionTypeId,
      validTechnicianId,
      summary || null,
      result || null,
      recommendations || null,
      notes || null,
      reportDate,
      validBranchId,
      invoiceLink || null,
      qrCode || null,
      attachments ? JSON.stringify(attachments) : null
    ];

    const [resultQuery] = await db.query(
      'INSERT INTO InspectionReport (repairRequestId, inspectionTypeId, technicianId, summary, result, recommendations, notes, reportDate, branchId, invoiceLink, qrCode, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      payload
    );
    
    // إرسال WebSocket notification لتحديث صفحة التتبع
    try {
      const [repairRows] = await db.query(
        'SELECT * FROM RepairRequest WHERE id = ? AND deletedAt IS NULL',
        [repairRequestId]
      );
      if (repairRows && repairRows.length > 0) {
        // إرسال تحديث للطلب لإعلام صفحة التتبع بوجود تقرير جديد
        websocketService.sendRepairUpdate('updated', repairRows[0]);
        console.log(`[InspectionReports] WebSocket notification sent for repair ${repairRequestId}`);
      }
    } catch (wsError) {
      // لا نوقف العملية إذا فشل WebSocket
      console.warn('[InspectionReports] Failed to send WebSocket notification:', wsError);
    }
    
    res.status(201).json({ 
      success: true,
      id: resultQuery.insertId, 
      repairRequestId, 
      inspectionTypeId: validInspectionTypeId, 
      technicianId: validTechnicianId, 
      summary, 
      result, 
      recommendations, 
      notes, 
      reportDate, 
      branchId: validBranchId, 
      invoiceLink, 
      qrCode 
    });
  } catch (err) {
    console.error('Error creating inspection report:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Update an inspection report
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { repairRequestId, inspectionTypeId, technicianId, summary, result, recommendations, notes, reportDate, branchId, invoiceLink, qrCode, attachments } = req.body;
  if (!repairRequestId || !inspectionTypeId || !technicianId || !reportDate) {
    return res.status(400).send('repairRequestId, inspectionTypeId, technicianId, and reportDate are required');
  }
  try {
    const [resultQuery] = await db.query(
      'UPDATE InspectionReport SET repairRequestId = ?, inspectionTypeId = ?, technicianId = ?, summary = ?, result = ?, recommendations = ?, notes = ?, reportDate = ?, branchId = ?, invoiceLink = ?, qrCode = ?, attachments = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [repairRequestId, inspectionTypeId, technicianId, summary, result, recommendations, notes, reportDate, branchId, invoiceLink, qrCode, attachments, id]
    );
    if (resultQuery.affectedRows === 0) {
      return res.status(404).send('Inspection report not found');
    }
    res.json({ message: 'Inspection report updated successfully' });
  } catch (err) {
    console.error(`Error updating inspection report with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Hard delete an inspection report
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM InspectionReport WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Inspection report not found');
    }
    res.json({ message: 'Inspection report deleted successfully' });
  } catch (err) {
    console.error(`Error deleting inspection report with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
