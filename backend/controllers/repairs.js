const db = require('../db');

/**
 * Enhanced Repairs Controller with Pagination, Sorting, Filtering
 * تحسين كنترولر الإصلاحات مع دعم الترقيم والفرز والتصفية
 */

exports.getAllRepairs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      customerId = '',
      technicianId = '',
      branchId = '',
      dateFrom = '',
      dateTo = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // بناء شروط البحث
    const conditions = ['rr.deletedAt IS NULL'];
    const params = [];

    if (search) {
      conditions.push(`(
        rr.requestNumber LIKE ? OR 
        rr.reportedProblem LIKE ? OR 
        rr.technicianReport LIKE ? OR
        d.deviceType LIKE ? OR
        d.brand LIKE ? OR
        d.model LIKE ? OR
        c.name LIKE ? OR
        c.phone LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      conditions.push('rr.status = ?');
      params.push(status);
    }

    if (customerId) {
      conditions.push('rr.customerId = ?');
      params.push(customerId);
    }

    if (technicianId) {
      conditions.push('rr.technicianId = ?');
      params.push(technicianId);
    }

    if (branchId) {
      conditions.push('rr.branchId = ?');
      params.push(branchId);
    }

    if (dateFrom) {
      conditions.push('DATE(rr.createdAt) >= ?');
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push('DATE(rr.createdAt) <= ?');
      params.push(dateTo);
    }

    // التحقق من صحة حقل الترتيب
    const validSortFields = ['createdAt', 'updatedAt', 'status', 'requestNumber', 'customerName', 'deviceType'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // استعلام العد الإجمالي
    const countQuery = `
      SELECT COUNT(*) as total
      FROM RepairRequest rr
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      WHERE ${conditions.join(' AND ')}
    `;

    const [countResult] = await db.query(countQuery, params);
    const totalItems = countResult[0].total;

    // استعلام البيانات الرئيسي
    const dataQuery = `
      SELECT 
        rr.*,
        c.name as customerName,
        c.phone as customerPhone,
        c.email as customerEmail,
        d.deviceType,
        d.brand,
        d.model,
        d.serialNumber,
        d.devicePassword,
        u.name as technicianName,
        b.name as branchName,
        CASE 
          WHEN rr.status = 'pending' THEN 'في الانتظار'
          WHEN rr.status = 'in_progress' THEN 'قيد التنفيذ'
          WHEN rr.status = 'completed' THEN 'مكتمل'
          WHEN rr.status = 'delivered' THEN 'تم التسليم'
          WHEN rr.status = 'cancelled' THEN 'ملغي'
          ELSE rr.status
        END as statusText
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN User u ON rr.technicianId = u.id
      LEFT JOIN Branch b ON rr.branchId = b.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${validSortBy === 'customerName' ? 'c.name' : validSortBy === 'deviceType' ? 'd.deviceType' : `rr.${validSortBy}`} ${validSortOrder}
      LIMIT ? OFFSET ?
    `;

    const [repairs] = await db.query(dataQuery, [...params, parseInt(limit), offset]);

    // إحصائيات سريعة
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM RepairRequest 
      WHERE deletedAt IS NULL
    `;

    const [statsResult] = await db.query(statsQuery);

    res.json({
      success: true,
      data: {
        repairs: repairs.map(repair => ({
          ...repair,
          attachments: repair.attachments ? JSON.parse(repair.attachments) : [],
          customFields: repair.customFields ? JSON.parse(repair.customFields) : {}
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalItems / parseInt(limit)),
          totalItems,
          itemsPerPage: parseInt(limit)
        },
        stats: statsResult[0]
      }
    });
  } catch (err) {
    console.error('Error fetching repairs:', err);
    res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
};

exports.getRepairById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Repair request not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRepair = async (req, res) => {
  try {
    const { deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields } = req.body;
    const [result] = await db.query(
      'INSERT INTO RepairRequest (deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, JSON.stringify(attachments || []), JSON.stringify(customFields || {})]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRepair = async (req, res) => {
  try {
    const { deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields } = req.body;
    const [result] = await db.query(
      'UPDATE RepairRequest SET deviceId=?, reportedProblem=?, technicianReport=?, status=?, customerId=?, branchId=?, technicianId=?, quotationId=?, invoiceId=?, deviceBatchId=?, attachments=?, customFields=?, updatedAt=NOW() WHERE id=? AND deletedAt IS NULL',
      [deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, JSON.stringify(attachments || []), JSON.stringify(customFields || {}), req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Repair request not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRepair = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE RepairRequest SET deletedAt=NOW() WHERE id=? AND deletedAt IS NULL', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Repair request not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRepairStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const [result] = await db.query('UPDATE RepairRequest SET status=?, updatedAt=NOW() WHERE id=? AND deletedAt IS NULL', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Repair request not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 