const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const { cacheMiddleware, invalidateCache } = require('../middleware/cacheMiddleware');
const websocketService = require('../services/websocketService');

// Simplified Repairs Route - Basic functionality only
router.get('/', cacheMiddleware(180), async (req, res) => { // Cache for 3 minutes
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
        c.name as customerName,
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
        'RECEIVED': 'RECEIVED',
        'INSPECTION': 'INSPECTION',
        'AWAITING_APPROVAL': 'AWAITING_APPROVAL',
        'UNDER_REPAIR': 'UNDER_REPAIR',
        'READY_FOR_DELIVERY': 'READY_FOR_DELIVERY',
        'DELIVERED': 'DELIVERED',
        'REJECTED': 'REJECTED',
        'WAITING_PARTS': 'WAITING_PARTS',
        'ON_HOLD': 'ON_HOLD'
      };

      return {
        id: row.id,
        requestNumber: `REP-${new Date(row.createdAt).getFullYear()}${String(new Date(row.createdAt).getMonth() + 1).padStart(2, '0')}${String(new Date(row.createdAt).getDate()).padStart(2, '0')}-${String(row.id).padStart(3, '0')}`,
        customerName: row.customerName || 'غير محدد',
        customerPhone: row.customerPhone || 'غير محدد',
        customerEmail: row.customerEmail || 'غير محدد',
        deviceType: 'غير محدد', // الجدول الحالي لا يحتوي على هذا الحقل
        deviceBrand: 'غير محدد', // الجدول الحالي لا يحتوي على هذا الحقل
        deviceModel: 'غير محدد', // الجدول الحالي لا يحتوي على هذا الحقل
        problemDescription: row.reportedProblem || 'لا توجد تفاصيل محددة للمشكلة',
        status: row.status || 'RECEIVED',
        priority: 'normal', // الجدول الحالي لا يحتوي على هذا الحقل
        estimatedCost: '0.00', // الجدول الحالي لا يحتوي على هذا الحقل
        actualCost: null, // الجدول الحالي لا يحتوي على هذا الحقل
        expectedDeliveryDate: null, // الجدول الحالي لا يحتوي على هذا الحقل
        notes: null, // الجدول الحالي لا يحتوي على هذا الحقل
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

// Get repair by tracking number (for public tracking page) - MUST BE BEFORE /:id
// لا نستخدم cache هنا لأننا نريد بيانات محدثة دائماً
router.get('/tracking', async (req, res) => {
  try {
    const { trackingToken, id } = req.query;

    if (!trackingToken && !id) {
      return res.status(400).json({
        success: false,
        error: 'Tracking token or ID is required'
      });
    }

    let query = `
      SELECT 
        rr.id,
        rr.reportedProblem,
        rr.status,
        rr.trackingToken,
        rr.createdAt,
        rr.updatedAt,
        rr.estimatedCost,
        rr.expectedDeliveryDate,
        c.name as customerName,
        c.phone as customerPhone,
        c.email as customerEmail,
        d.deviceType,
        COALESCE(vo.label, d.brand) as deviceBrand,
        d.model as deviceModel,
        d.serialNumber,
        d.cpu,
        d.ram,
        d.storage,
        d.gpu,
        d.devicePassword,
        b.name as branchName,
        (SELECT i.totalAmount FROM Invoice i WHERE i.repairRequestId = rr.id AND i.deletedAt IS NULL ORDER BY i.createdAt DESC LIMIT 1) as invoiceTotal,
        (SELECT 
            (SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.invoiceId = i.id)
         FROM Invoice i WHERE i.repairRequestId = rr.id AND i.deletedAt IS NULL ORDER BY i.createdAt DESC LIMIT 1) as invoicePaid,
        (SELECT GROUP_CONCAT(COALESCE(vo_acc.label, vo_acc.value) SEPARATOR ', ')
         FROM RepairRequestAccessory rra
         LEFT JOIN VariableOption vo_acc ON rra.accessoryOptionId = vo_acc.id
         WHERE rra.repairRequestId = rr.id) as accessories
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id AND c.deletedAt IS NULL
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      LEFT JOIN Branch b ON rr.branchId = b.id AND b.deletedAt IS NULL
      WHERE rr.deletedAt IS NULL
    `;

    const params = [];

    // دعم البحث بـ trackingToken أو ID
    // إذا كان trackingToken رقم فقط، نبحث بالـ ID أيضاً
    if (trackingToken) {
      // التحقق إذا كان trackingToken رقم فقط (ليس hex string)
      const isNumeric = /^\d+$/.test(trackingToken);
      if (isNumeric) {
        // إذا كان رقم، نبحث بالـ ID
        const repairId = parseInt(trackingToken, 10);
        if (!isNaN(repairId) && repairId > 0) {
          query += ' AND rr.id = ?';
          params.push(repairId);
        } else {
          query += ' AND rr.trackingToken = ?';
          params.push(trackingToken);
        }
      } else {
        // إذا كان hex string، نبحث بالـ trackingToken
        query += ' AND rr.trackingToken = ?';
        params.push(trackingToken);
      }
    } else if (id) {
      // البحث مباشرة بالـ ID
      query += ' AND rr.id = ?';
      const repairId = parseInt(id, 10);
      if (isNaN(repairId) || repairId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ID format'
        });
      }
      params.push(repairId);
    }

    console.log('Final query:', query);
    console.log('Query params:', params);

    const [rows] = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Repair request not found'
      });
    }

    const repair = rows[0];

    // تحويل الحالة من الإنجليزية إلى العربية للعرض
    const statusMap = {
      'RECEIVED': 'تم الاستلام',
      'INSPECTION': 'قيد الفحص',
      'AWAITING_APPROVAL': 'في انتظار الموافقة',
      'UNDER_REPAIR': 'قيد الإصلاح',
      'READY_FOR_DELIVERY': 'جاهز للتسليم',
      'READY_FOR_PICKUP': 'جاهز للاستلام',
      'DELIVERED': 'تم التسليم',
      'REJECTED': 'مرفوض',
      'WAITING_PARTS': 'في انتظار القطع',
      'ON_HOLD': 'معلق',
      'COMPLETED': 'مكتمل'
    };

    // تحويل الحالة من العربية إلى الإنجليزية (إذا كانت عربية)
    const arabicToEnglishStatusMap = {
      'تم الاستلام': 'RECEIVED',
      'قيد الفحص': 'INSPECTION',
      'في انتظار الموافقة': 'AWAITING_APPROVAL',
      'قيد الإصلاح': 'UNDER_REPAIR',
      'جاهز للتسليم': 'READY_FOR_DELIVERY',
      'جاهز للاستلام': 'READY_FOR_PICKUP',
      'تم التسليم': 'DELIVERED',
      'مرفوض': 'REJECTED',
      'في انتظار القطع': 'WAITING_PARTS',
      'معلق': 'ON_HOLD',
      'مكتمل': 'COMPLETED'
    };

    // الحالة من قاعدة البيانات (قد تكون عربية أو إنجليزية)
    const dbStatus = repair.status || 'RECEIVED';
    // تحويل إلى إنجليزية إذا كانت عربية
    const englishStatus = arabicToEnglishStatusMap[dbStatus] || dbStatus;
    // التسمية العربية
    const arabicStatusLabel = statusMap[englishStatus] || statusMap[dbStatus] || dbStatus;

    res.json({
      id: repair.id,
      requestNumber: `REP-${new Date(repair.createdAt).getFullYear()}${String(new Date(repair.createdAt).getMonth() + 1).padStart(2, '0')}${String(new Date(repair.createdAt).getDate()).padStart(2, '0')}-${String(repair.id).padStart(3, '0')}`,
      trackingToken: repair.trackingToken || null,
      status: englishStatus, // إرجاع الحالة بالإنجليزية دائماً
      statusLabel: arabicStatusLabel, // التسمية العربية للعرض
      deviceType: repair.deviceType || 'غير محدد',
      deviceBrand: repair.deviceBrand || 'غير محدد',
      deviceModel: repair.deviceModel || 'غير محدد',
      problemDescription: repair.reportedProblem || 'لا توجد تفاصيل',
      estimatedCost: repair.estimatedCost ? parseFloat(repair.estimatedCost).toFixed(2) : '0.00',
      actualCost: repair.invoiceTotal ? parseFloat(repair.invoiceTotal).toFixed(2) : null,
      amountPaid: repair.invoicePaid ? parseFloat(repair.invoicePaid).toFixed(2) : '0.00',
      priority: 'normal',
      estimatedCompletionDate: repair.expectedDeliveryDate || null,
      customerName: repair.customerName || 'غير محدد',
      customerPhone: repair.customerPhone || 'غير محدد',
      customerEmail: repair.customerEmail || null,
      branchName: repair.branchName || 'غير محدد',
      notes: null,
      createdAt: repair.createdAt,
      updatedAt: repair.updatedAt,
      // Device Specs
      serialNumber: repair.serialNumber,
      cpu: repair.cpu,
      ram: repair.ram,
      storage: repair.storage,
      gpu: repair.gpu,
      devicePassword: repair.devicePassword,
      // Accessories
      accessories: repair.accessories ? repair.accessories.split(', ') : []
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

// Get attachments for a repair (public endpoint - no auth required)
router.get('/:id/attachments', async (req, res) => {
  const repairId = req.params.id;
  try {
    console.log(`[ATTACHMENTS API] Fetching attachments for repair ID: ${repairId}`);

    // Verify repair exists
    const [repairRows] = await db.execute('SELECT id, attachments FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [repairId]);
    if (!repairRows || repairRows.length === 0) {
      console.log(`[ATTACHMENTS API] Repair request ${repairId} not found`);
      return res.status(404).json({ success: false, error: 'Repair request not found' });
    }

    console.log(`[ATTACHMENTS API] Repair found. Attachments field type: ${typeof repairRows[0].attachments}, value:`, repairRows[0].attachments);

    // Parse attachments from JSON field
    let attachments = [];
    try {
      if (repairRows[0].attachments) {
        // Check if it's already a string or object
        if (typeof repairRows[0].attachments === 'string') {
          attachments = JSON.parse(repairRows[0].attachments);
        } else if (Array.isArray(repairRows[0].attachments)) {
          attachments = repairRows[0].attachments;
        } else if (typeof repairRows[0].attachments === 'object') {
          attachments = [repairRows[0].attachments];
        }
        console.log(`[ATTACHMENTS API] Parsed ${attachments.length} attachments from database`);
      } else {
        console.log(`[ATTACHMENTS API] No attachments field in database (null or empty)`);
      }
    } catch (e) {
      console.warn('[ATTACHMENTS API] Failed to parse attachments from database:', e);
      console.warn('[ATTACHMENTS API] Raw attachments value:', repairRows[0].attachments);
      attachments = [];
    }

    // Get upload root directory
    const uploadRoot = path.join(__dirname, '../../uploads/repairs');
    console.log(`[ATTACHMENTS API] Upload root directory: ${uploadRoot}`);

    // Verify files still exist on filesystem and filter out missing ones
    const validAttachments = [];
    console.log(`[ATTACHMENTS API] Starting to process ${attachments.length} attachments`);

    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      console.log(`[ATTACHMENTS API] ===== Processing attachment ${i + 1}/${attachments.length} =====`);
      console.log(`[ATTACHMENTS API] Attachment data:`, JSON.stringify(attachment, null, 2));

      const filePath = path.join(uploadRoot, String(repairId), attachment.id);
      const fileExists = fs.existsSync(filePath);
      console.log(`[ATTACHMENTS API] Checking file: ${filePath}`);
      console.log(`[ATTACHMENTS API] File exists: ${fileExists}`);

      // Check if directory exists
      const dirPath = path.join(uploadRoot, String(repairId));
      const dirExists = fs.existsSync(dirPath);
      console.log(`[ATTACHMENTS API] Directory exists: ${dirExists}, path: ${dirPath}`);

      // If directory exists, list files in it
      if (dirExists) {
        try {
          const filesInDir = fs.readdirSync(dirPath);
          console.log(`[ATTACHMENTS API] Files in directory:`, filesInDir);
        } catch (e) {
          console.error(`[ATTACHMENTS API] Error reading directory:`, e);
        }
      }

      // Build public URL
      let publicUrl = attachment.url;
      if (!publicUrl) {
        // Build relative URL if no URL exists
        publicUrl = `/uploads/repairs/${repairId}/${encodeURIComponent(attachment.id)}`;
      } else if (publicUrl.startsWith('http://') || publicUrl.startsWith('https://')) {
        // If absolute URL, extract pathname to make it relative (works better with same origin)
        try {
          const urlObj = new URL(publicUrl);
          publicUrl = urlObj.pathname;
        } catch (e) {
          // If URL parsing fails, use relative path
          publicUrl = `/uploads/repairs/${repairId}/${encodeURIComponent(attachment.id)}`;
        }
      } else if (!publicUrl.startsWith('/')) {
        // If URL doesn't start with /, add it
        publicUrl = `/${publicUrl}`;
      }

      if (fileExists) {
        // File exists, add it
        validAttachments.push({
          ...attachment,
          url: publicUrl
        });
        console.log(`[ATTACHMENTS API] Added valid attachment: ${attachment.id || attachment.name}`);
      } else {
        // File doesn't exist, try to find it by alternative name
        let foundFile = null;
        if (dirExists && attachment.name) {
          try {
            const filesInDir = fs.readdirSync(dirPath);
            // Try exact match first
            foundFile = filesInDir.find(f => f === attachment.id || f === attachment.name);

            // If not found, try partial match (filename without extension)
            if (!foundFile && attachment.name) {
              const nameWithoutExt = attachment.name.replace(/\.[^/.]+$/, '');
              foundFile = filesInDir.find(f => {
                const fWithoutExt = f.replace(/\.[^/.]+$/, '');
                return fWithoutExt === nameWithoutExt || f.includes(nameWithoutExt) || nameWithoutExt.includes(fWithoutExt);
              });
            }

            if (foundFile) {
              console.log(`[ATTACHMENTS API] Found file by alternative name: ${foundFile}`);
              const alternativePublicUrl = `/uploads/repairs/${repairId}/${encodeURIComponent(foundFile)}`;

              validAttachments.push({
                ...attachment,
                id: foundFile, // Update id to match actual filename
                url: alternativePublicUrl
              });
              console.log(`[ATTACHMENTS API] Added attachment with corrected filename: ${foundFile}`);
            } else {
              console.warn(`[ATTACHMENTS API] Attachment file not found: ${filePath}`);
              if (filesInDir && filesInDir.length > 0) {
                console.warn(`[ATTACHMENTS API] Available files: ${filesInDir.join(', ')}`);
              }

              // Still return the attachment with URL even if file doesn't exist
              // The file might be in a different location or accessible via the URL
              validAttachments.push({
                ...attachment,
                url: publicUrl,
                _warning: 'File not found on filesystem, but URL is available'
              });
              console.log(`[ATTACHMENTS API] ✅ Added attachment with warning (file not found but URL available): ${attachment.id || attachment.name}`);
            }
          } catch (e) {
            console.error(`[ATTACHMENTS API] Error searching for alternative file:`, e);

            // Still return the attachment with URL even if we can't verify file existence
            validAttachments.push({
              ...attachment,
              url: publicUrl,
              _warning: 'Could not verify file existence, but URL is available'
            });
            console.log(`[ATTACHMENTS API] ✅ Added attachment with warning (could not verify): ${attachment.id || attachment.name}`);
          }
        } else {
          // Directory doesn't exist, but still return attachment with URL
          // The file might be accessible via the URL even if directory doesn't exist
          console.warn(`[ATTACHMENTS API] Directory does not exist: ${dirPath}`);
          console.warn(`[ATTACHMENTS API] Attachment file path: ${filePath}`);

          validAttachments.push({
            ...attachment,
            url: publicUrl,
            _warning: 'Directory not found, but URL is available'
          });
          console.log(`[ATTACHMENTS API] ✅ Added attachment with warning (directory not found but URL available): ${attachment.id || attachment.name}`);
        }
      }
    }

    console.log(`[ATTACHMENTS API] ===== FINAL RESULT =====`);
    console.log(`[ATTACHMENTS API] Raw attachments from DB: ${attachments.length}`);
    console.log(`[ATTACHMENTS API] Valid attachments to return: ${validAttachments.length}`);
    console.log(`[ATTACHMENTS API] Valid attachments data:`, JSON.stringify(validAttachments, null, 2));

    res.json({
      success: true,
      data: validAttachments,
      debug: {
        repairId: repairId,
        rawAttachmentsCount: attachments.length,
        validAttachmentsCount: validAttachments.length,
        uploadRoot: uploadRoot,
        hasAttachmentsField: !!repairRows[0].attachments,
        rawAttachments: attachments,
        validAttachments: validAttachments
      }
    });
  } catch (e) {
    console.error('[ATTACHMENTS API] List attachments error:', e);
    res.status(500).json({ success: false, error: 'Failed to list attachments', details: e.message });
  }
});

// Get repair by ID
router.get('/:id', cacheMiddleware(180), async (req, res) => { // Cache for 3 minutes
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        rr.*,
        c.name as customerName,
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
      requestNumber: `REP-${new Date(repair.createdAt).getFullYear()}${String(new Date(repair.createdAt).getMonth() + 1).padStart(2, '0')}${String(new Date(repair.createdAt).getDate()).padStart(2, '0')}-${String(repair.id).padStart(3, '0')}`,
      trackingToken: repair.trackingToken || null,
      customerName: repair.customerName || 'غير محدد',
      customerPhone: repair.customerPhone || 'غير محدد',
      customerEmail: repair.customerEmail || 'غير محدد',
      deviceType: 'غير محدد', // الجدول الحالي لا يحتوي على هذا الحقل
      deviceBrand: 'غير محدد', // الجدول الحالي لا يحتوي على هذا الحقل
      deviceModel: 'غير محدد', // الجدول الحالي لا يحتوي على هذا الحقل
      problemDescription: repair.reportedProblem || 'لا توجد تفاصيل محددة للمشكلة',
      status: repair.status || 'RECEIVED',
      priority: 'normal', // الجدول الحالي لا يحتوي على هذا الحقل
      estimatedCost: '0.00', // الجدول الحالي لا يحتوي على هذا الحقل
      actualCost: null, // الجدول الحالي لا يحتوي على هذا الحقل
      expectedDeliveryDate: null, // الجدول الحالي لا يحتوي على هذا الحقل
      notes: null, // الجدول الحالي لا يحتوي على هذا الحقل
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
      customerName,
      customerPhone,
      customerEmail,
      deviceBrand,
      deviceModel,
      deviceType,
      serialNumber,
      devicePassword,
      reportedProblem,
      customerNotes,
      priority = 'medium',
      estimatedCost
    } = req.body;

    let finalCustomerId = customerId;

    // If customer object provided, create new customer
    if (!finalCustomerId && customer) {
      const { name, phone, email, address } = customer;

      if (!name || !phone) {
        return res.status(400).json({
          success: false,
          error: 'Customer name and phone are required'
        });
      }

      const [customerResult] = await db.query(
        `INSERT INTO Customer (name, phone, email, address) 
         VALUES (?, ?, ?, ?)`,
        [name, phone, email || null, address || null]
      );

      finalCustomerId = customerResult.insertId;
    }

    // If customerName and customerPhone provided directly, create new customer
    if (!finalCustomerId && customerName && customerPhone) {
      const nameParts = customerName.trim().split(' ');
      const firstName = nameParts[0] || customerName;
      const lastName = nameParts.slice(1).join(' ') || '';

      const [customerResult] = await db.query(
        `INSERT INTO Customer (name, phone, email, address) 
         VALUES (?, ?, ?, ?)`,
        [customerName, customerPhone, customerEmail || null, null]
      );

      finalCustomerId = customerResult.insertId;
    }

    // Validate required fields
    if (!finalCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'Either customerId, customer object, or customerName+customerPhone are required'
      });
    }

    // deviceBrand and deviceModel are optional for simplified repairs

    const issue = reportedProblem;
    if (!issue) {
      return res.status(400).json({
        success: false,
        error: 'reportedProblem is required'
      });
    }

    // Create repair request
    const [result] = await db.query(
      `INSERT INTO RepairRequest (
        customerId, reportedProblem, status
      ) VALUES (?, ?, ?)`,
      [
        finalCustomerId,
        issue,
        'RECEIVED' // Set default status
      ]
    );

    // Fetch the created repair
    const [rows] = await db.query(
      `SELECT rr.*, c.name as customerName
       FROM RepairRequest rr
       LEFT JOIN Customer c ON rr.customerId = c.id
       WHERE rr.id = ?`,
      [result.insertId]
    );

    // مسح الـ cache عند إنشاء طلب جديد
    invalidateCache('repairs');

    // إرسال إشعار real-time
    const repairData = {
      id: result.insertId,
      ...rows[0],
      requestNumber: `REP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(result.insertId).padStart(3, '0')}`
    };
    websocketService.sendRepairUpdate('created', repairData);
    websocketService.sendSystemNotification('طلب إصلاح جديد', `تم إنشاء طلب إصلاح جديد: ${repairData.requestNumber}`, 'success');

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
      'status', 'reportedProblem'
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
      `SELECT rr.*, c.name as customerName
       FROM RepairRequest rr
       LEFT JOIN Customer c ON rr.customerId = c.id
       WHERE rr.id = ?`,
      [id]
    );

    // مسح الـ cache عند تحديث طلب
    invalidateCache('repairs');

    // إرسال إشعار real-time
    const repairData = {
      ...rows[0],
      requestNumber: `REP-${new Date(rows[0].createdAt).getFullYear()}${String(new Date(rows[0].createdAt).getMonth() + 1).padStart(2, '0')}${String(new Date(rows[0].createdAt).getDate()).padStart(2, '0')}-${String(rows[0].id).padStart(3, '0')}`
    };
    websocketService.sendRepairUpdate('updated', repairData);

    // إرسال إشعار خاص عند تغيير الحالة
    if (updates.status) {
      websocketService.sendSystemNotification('تحديث حالة الطلب', `تم تحديث حالة الطلب ${repairData.requestNumber} إلى: ${updates.status}`, 'info');
    }

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

    // مسح الـ cache عند حذف طلب
    invalidateCache('repairs');

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

module.exports = router;
