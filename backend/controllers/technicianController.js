const db = require('../db');

// Helper: build WHERE clause for technician jobs
const buildTechJobsWhere = (technicianId, filters = {}) => {
  const where = ['rr.deletedAt IS NULL'];
  const params = [];

  // Technician scope
  if (technicianId) {
    where.push('rr.technicianId = ?');
    params.push(technicianId);
  }

  // Status filter
  if (filters.status) {
    where.push('rr.status = ?');
    params.push(filters.status);
  }

  // Simple search (customer name / phone / device model)
  if (filters.search) {
    where.push('(c.name LIKE ? OR c.phone LIKE ? OR d.model LIKE ?)');
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }

  return { where: where.join(' AND '), params };
};

// GET /api/tech/dashboard
exports.getTechnicianDashboard = async (req, res) => {
  try {
    const technicianId = req.user?.id;
    if (!technicianId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Basic stats scoped to technician
    const [totalRows] = await db.execute(
      'SELECT COUNT(*) AS cnt FROM RepairRequest rr WHERE rr.deletedAt IS NULL AND rr.technicianId = ?',
      [technicianId]
    );

    const [byStatus] = await db.execute(
      `SELECT rr.status, COUNT(*) AS cnt 
       FROM RepairRequest rr 
       WHERE rr.deletedAt IS NULL AND rr.technicianId = ?
       GROUP BY rr.status`,
      [technicianId]
    );

    const [todayRows] = await db.execute(
      `SELECT COUNT(*) AS todayCount 
       FROM RepairRequest rr 
       WHERE rr.deletedAt IS NULL 
       AND rr.technicianId = ? 
       AND DATE(rr.updatedAt) = CURDATE()`,
      [technicianId]
    );

    res.json({
      success: true,
      data: {
        totalJobs: totalRows[0]?.cnt || 0,
        byStatus,
        todayUpdated: todayRows[0]?.todayCount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching technician dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to fetch technician dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// GET /api/tech/jobs
exports.getTechnicianJobs = async (req, res) => {
  try {
    const technicianId = req.user?.id;
    if (!technicianId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { status, search } = req.query;
    const { where, params } = buildTechJobsWhere(technicianId, { status, search });

    const [rows] = await db.execute(
      `SELECT 
         rr.id,
         rr.id AS requestNumber,
         rr.reportedProblem,
         rr.status,
         rr.createdAt,
         c.id AS customerId,
         c.name AS customerName,
         c.phone AS customerPhone,
         COALESCE(vo.label, d.brand) AS deviceBrand,
         d.model AS deviceModel,
         d.deviceType
       FROM RepairRequest rr
       LEFT JOIN Customer c ON rr.customerId = c.id
       LEFT JOIN Device d ON rr.deviceId = d.id
       LEFT JOIN VariableOption vo ON d.brandId = vo.id
       WHERE ${where}
       ORDER BY rr.createdAt DESC
       LIMIT 100`,
      params
    );

    res.json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error('Error fetching technician jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to fetch technician jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// GET /api/tech/jobs/:id
exports.getTechnicianJobById = async (req, res) => {
  try {
    const technicianId = req.user?.id;
    if (!technicianId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;

    const [rows] = await db.execute(
      `SELECT 
         rr.*,
         c.id AS customerId,
         c.name AS customerName,
         c.phone AS customerPhone,
         c.email AS customerEmail,
         COALESCE(vo.label, d.brand) AS deviceBrand,
         d.model AS deviceModel,
         d.deviceType,
         d.serialNumber
       FROM RepairRequest rr
       LEFT JOIN Customer c ON rr.customerId = c.id
       LEFT JOIN Device d ON rr.deviceId = d.id
       LEFT JOIN VariableOption vo ON d.brandId = vo.id
       WHERE rr.id = ? 
         AND rr.deletedAt IS NULL 
         AND rr.technicianId = ?`,
      [id, technicianId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repair request not found or not assigned to this technician',
      });
    }

    const job = rows[0];

    // Load timeline using existing logs endpoint logic (StatusUpdateLog + AuditLog)
    const [statusLogs] = await db.query(
      'SELECT id, fromStatus, toStatus, notes, changedById, createdAt FROM StatusUpdateLog WHERE repairRequestId = ? ORDER BY createdAt DESC',
      [id]
    );
    const [auditLogs] = await db.query(
      "SELECT id, action, actionType, details, userId, createdAt FROM AuditLog WHERE entityType = 'RepairRequest' AND entityId = ? ORDER BY createdAt DESC",
      [id]
    );

    const timeline = [];
    for (const s of statusLogs) {
      timeline.push({
        id: `status-${s.id}`,
        type: 'status_change',
        content: s.notes || `${s.fromStatus || ''} → ${s.toStatus || ''}`,
        author: s.changedById ? `User #${s.changedById}` : 'System',
        createdAt: s.createdAt,
      });
    }
    for (const a of auditLogs) {
      timeline.push({
        id: `audit-${a.id}`,
        type: a.actionType || 'note',
        content: a.details || a.action,
        author: a.userId ? `User #${a.userId}` : 'System',
        createdAt: a.createdAt,
      });
    }
    timeline.sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));

    res.json({
      success: true,
      data: {
        job,
        timeline,
      },
    });
  } catch (error) {
    console.error('Error fetching technician job details:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to fetch job details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// POST /api/tech/jobs/:id/media  (upload media metadata; multipart to be added later)
exports.uploadTechnicianJobMedia = async (req, res) => {
  try {
    const technicianId = req.user?.id;
    if (!technicianId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params; // repairRequestId
    const { items } = req.body || {};
    // items: [{ filename, fileType, filePath, category }]

    // Ensure job belongs to technician
    const [jobRows] = await db.execute(
      'SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL AND technicianId = ?',
      [id, technicianId]
    );
    if (!jobRows || jobRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repair request not found or not assigned to this technician',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No media items provided' });
    }

    const values = [];
    for (const it of items) {
      const filename = it?.filename || null;
      const fileType = it?.fileType || null;
      const filePath = it?.filePath || null;
      const category = it?.category || null; // Before/During/After/Parts/Evidence
      if (!filename || !filePath) continue;
      values.push([id, filename, fileType, filePath, category]);
    }

    if (values.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid media items' });
    }

    await db.query(
      'INSERT INTO RepairRequestAttachment (repairRequestId, filename, fileType, filePath, category, uploadedAt) VALUES ?',
      [values.map(v => [...v,])] // mysql2 formats VALUES ? with array of arrays
    );

    return res.json({ success: true, message: 'Media uploaded successfully' });
  } catch (error) {
    console.error('Error uploading technician job media:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to upload media',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// POST /api/tech/parts-request  (create spare parts request)
exports.createPartsRequest = async (req, res) => {
  try {
    const technicianId = req.user?.id;
    if (!technicianId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { repairRequestId, partName, quantity, notes, expectedPrice } = req.body || {};
    if (!repairRequestId || !partName || !quantity) {
      return res.status(400).json({ success: false, message: 'repairRequestId, partName, and quantity are required' });
    }
    // Ensure job belongs to technician
    const [jobRows] = await db.execute(
      'SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL AND technicianId = ?',
      [repairRequestId, technicianId]
    );
    if (!jobRows || jobRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repair request not found or not assigned to this technician',
      });
    }

    const [result] = await db.execute(
      `INSERT INTO SparePartRequest (repairRequestId, partName, quantity, status, requestedAt, requestedById, notes, expectedPrice)
       VALUES (?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, ?, ?, ?)`,
      [repairRequestId, String(partName).trim(), parseInt(quantity, 10), technicianId, notes || null, expectedPrice || null]
    );

    res.json({
      success: true,
      message: 'Parts request created',
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error('Error creating parts request:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to create parts request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// GET /api/tech/parts-request/:id  (get status of a parts request)
exports.getPartsRequestById = async (req, res) => {
  try {
    const technicianId = req.user?.id;
    if (!technicianId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { id } = req.params;
    const [rows] = await db.execute(
      `SELECT spr.*, rr.technicianId
       FROM SparePartRequest spr
       JOIN RepairRequest rr ON spr.repairRequestId = rr.id
       WHERE spr.id = ? AND rr.deletedAt IS NULL`,
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Parts request not found' });
    }
    const pr = rows[0];
    if (pr.technicianId !== technicianId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this request' });
    }
    res.json({ success: true, data: pr });
  } catch (error) {
    console.error('Error fetching parts request:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to fetch parts request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// GET /api/tech/profile  (technician's own profile)
exports.getTechnicianProfile = async (req, res) => {
  try {
    const technicianId = req.user?.id;
    if (!technicianId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const [rows] = await db.execute(
      'SELECT id, name, email, phone, roleId, isActive FROM User WHERE id = ? AND deletedAt IS NULL',
      [technicianId]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching technician profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// PUT /api/tech/profile  (update own profile - limited fields)
exports.updateTechnicianProfile = async (req, res) => {
  try {
    const technicianId = req.user?.id;
    if (!technicianId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { name, phone } = req.body || {};
    const fields = [];
    const values = [];
    if (name && String(name).trim()) {
      fields.push('name = ?');
      values.push(String(name).trim());
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      values.push(phone ? String(phone).trim() : null);
    }
    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    values.push(technicianId);
    const [result] = await db.execute(
      `UPDATE User SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL`,
      values
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Technician not found or no changes made' });
    }
    const [updated] = await db.execute(
      'SELECT id, name, email, phone, roleId, isActive FROM User WHERE id = ?',
      [technicianId]
    );
    res.json({ success: true, message: 'Profile updated', data: updated[0] });
  } catch (error) {
    console.error('Error updating technician profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// PUT /api/tech/status  (update technician presence/availability)
exports.updateTechnicianStatus = async (req, res) => {
  try {
    const technicianId = req.user?.id;
    if (!technicianId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { status } = req.body || {}; // Online / Busy / Break / Offline
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    // Persist status in a simple TechnicianStatus table if exists, otherwise AuditLog
    // We will record it in AuditLog for now
    await db.execute(
      'INSERT INTO AuditLog (action, actionType, details, entityType, entityId, userId) VALUES (?, ?, ?, ?, ?, ?)',
      ['tech_presence', 'STATUS', JSON.stringify({ status }), 'User', technicianId, technicianId]
    );
    res.json({ success: true, message: 'Technician status updated', data: { status } });
  } catch (error) {
    console.error('Error updating technician status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to update status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// PUT /api/tech/jobs/:id/status  (update status for technician's own job)
exports.updateTechnicianJobStatus = async (req, res) => {
  try {
    const technicianId = req.user?.id;
    if (!technicianId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;
    let { status } = req.body || {};
    const notes = req.body && req.body.notes ? String(req.body.notes) : null;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    // Ensure job belongs to technician
    const [jobRows] = await db.execute(
      'SELECT status FROM RepairRequest WHERE id = ? AND deletedAt IS NULL AND technicianId = ?',
      [id, technicianId]
    );
    if (!jobRows || jobRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repair request not found or not assigned to this technician',
      });
    }

    const fromStatus = jobRows[0].status || null;
    
    // Update status
    const [result] = await db.query(
      'UPDATE RepairRequest SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repair request not found or already deleted',
      });
    }

    const changedById = technicianId;
    await db.query(
      'INSERT INTO StatusUpdateLog (repairRequestId, fromStatus, toStatus, notes, changedById) VALUES (?, ?, ?, ?, ?)',
      [id, fromStatus, status, notes, changedById]
    );

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: { fromStatus, toStatus: status },
    });
  } catch (error) {
    console.error('Error updating technician job status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to update job status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// POST /api/tech/jobs/:id/notes  (add timeline note)
exports.addTechnicianJobNote = async (req, res) => {
  try {
    const technicianId = req.user?.id;
    if (!technicianId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;
    const { note } = req.body || {};

    if (!note || !String(note).trim()) {
      return res.status(400).json({ success: false, message: 'Note is required' });
    }

    // Ensure job belongs to technician
    const [jobRows] = await db.execute(
      'SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL AND technicianId = ?',
      [id, technicianId]
    );
    if (!jobRows || jobRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repair request not found or not assigned to this technician',
      });
    }

    // Store note in AuditLog as timeline entry
    await db.execute(
      'INSERT INTO AuditLog (action, actionType, details, entityType, entityId, userId) VALUES (?, ?, ?, ?, ?, ?)',
      ['tech_note', 'note', JSON.stringify({ note }), 'RepairRequest', id, technicianId]
    );

    res.json({
      success: true,
      message: 'Note added successfully',
    });
  } catch (error) {
    console.error('Error adding technician job note:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to add note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// POST /api/tech/jobs/:id/media  (upload media - images/videos)
exports.uploadJobMedia = async (req, res) => {
  try {
    const technicianId = req.user?.id;
    if (!technicianId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;
    const { fileUrl, fileType, category, description } = req.body || {};

    if (!fileUrl || !fileType) {
      return res.status(400).json({ success: false, message: 'File URL and type are required' });
    }

    // Validate category
    const validCategories = ['BEFORE', 'DURING', 'AFTER', 'PARTS', 'EVIDENCE'];
    const mediaCategory = category && validCategories.includes(category.toUpperCase()) 
      ? category.toUpperCase() 
      : 'DURING';

    // Validate file type
    const validTypes = ['IMAGE', 'VIDEO', 'DOCUMENT'];
    const mediaType = fileType && validTypes.includes(fileType.toUpperCase())
      ? fileType.toUpperCase()
      : 'IMAGE';

    // Ensure job belongs to technician
    const [jobRows] = await db.execute(
      'SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL AND technicianId = ?',
      [id, technicianId]
    );
    if (!jobRows || jobRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repair request not found or not assigned to this technician',
      });
    }

    // Store in AuditLog with media info
    const mediaDetails = {
      fileUrl,
      fileType: mediaType,
      category: mediaCategory,
      description: description || null,
      uploadedBy: technicianId,
    };

    await db.execute(
      'INSERT INTO AuditLog (action, actionType, details, entityType, entityId, userId) VALUES (?, ?, ?, ?, ?, ?)',
      ['media_upload', 'media', JSON.stringify(mediaDetails), 'RepairRequest', id, technicianId]
    );

    res.json({
      success: true,
      message: 'Media uploaded successfully',
      data: mediaDetails,
    });
  } catch (error) {
    console.error('Error uploading job media:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to upload media',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// GET /api/tech/jobs/:id/media  (get all media for a job)
exports.getJobMedia = async (req, res) => {
  try {
    const technicianId = req.user?.id;
    if (!technicianId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;

    // Ensure job belongs to technician
    const [jobRows] = await db.execute(
      'SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL AND technicianId = ?',
      [id, technicianId]
    );
    if (!jobRows || jobRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repair request not found or not assigned to this technician',
      });
    }

    // Get all media from AuditLog
    const [mediaLogs] = await db.query(
      "SELECT id, details, userId, createdAt FROM AuditLog WHERE entityType = 'RepairRequest' AND entityId = ? AND actionType = 'media' ORDER BY createdAt DESC",
      [id]
    );

    const media = mediaLogs.map(log => {
      try {
        const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        return {
          id: log.id,
          ...details,
          uploadedAt: log.createdAt,
          uploadedBy: log.userId,
        };
      } catch (e) {
        return null;
      }
    }).filter(m => m !== null);

    res.json({
      success: true,
      data: media,
      count: media.length,
    });
  } catch (error) {
    console.error('Error fetching job media:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error: Failed to fetch media',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};



