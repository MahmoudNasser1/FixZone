// إصلاح ترتيب الاستيراد والتعريفات
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, repairSchemas } = require('../middleware/validation');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// مسارات إعدادات الطباعة (قراءة/تحديث ملف JSON)
const PRINT_SETTINGS_PATH = path.join(__dirname, '..', 'config', 'print-settings.json');

router.get('/print-settings', async (req, res) => {
  try {
    const raw = await fs.promises.readFile(PRINT_SETTINGS_PATH, 'utf-8');
    const json = JSON.parse(raw);
    res.json(json);
  } catch (e) {
    console.error('Failed to read print-settings.json', e);
    res.status(500).json({ error: 'Failed to read print settings' });
  }
});

router.put('/print-settings', authMiddleware, async (req, res) => {
  try {
    // تحقق مبسط من الحقول المسموحة فقط
    const allowed = [
      'title', 'showLogo', 'logoUrl', 'showQr', 'qrSize', 'showDevicePassword',
      'showSerialBarcode', 'barcodeWidth', 'barcodeHeight', 'compactMode',
      'branchName', 'branchAddress', 'branchPhone', 'margins', 'dateDisplay', 'terms',
      'companyName', 'address', 'phone', 'email', 'deliveryAcknowledgement',
      'companyName', 'address', 'phone', 'email', 'deliveryAcknowledgement'
    ];
    const next = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) next[k] = req.body[k];
    }
    // حافظ على القيم غير المرسلة كما هي
    const current = JSON.parse(await fs.promises.readFile(PRINT_SETTINGS_PATH, 'utf-8'));
    const merged = { ...current, ...next };
    await fs.promises.writeFile(PRINT_SETTINGS_PATH, JSON.stringify(merged, null, 2), 'utf-8');
    res.json({ message: 'تم حفظ إعدادات الطباعة', settings: merged });
  } catch (e) {
    console.error('Failed to update print-settings.json', e);
    res.status(500).json({ error: 'Failed to update print settings' });
  }
});

// تحميل إعدادات الطباعة من ملف JSON
function loadPrintSettings() {
  try {
    const p = path.join(__dirname, '..', 'config', 'print-settings.json');
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {
      title: 'إيصال استلام',
      showLogo: false,
      logoUrl: '',
      margins: { top: 16, right: 16, bottom: 16, left: 16 },
      dateDisplay: 'both',
      terms: ''
    };
  }
}

function formatDates(dateObj, mode) {
  const formats = { gregorian: '', hijri: '' };
  try {
    formats.gregorian = new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full', timeStyle: 'short' }).format(dateObj);
  } catch (_) {
    formats.gregorian = dateObj.toLocaleString('ar-EG');
  }
  try {
    // محاول ة تنسيق هجري باستخدام تقويم إسلامي عبر ICU
    formats.hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { dateStyle: 'full' }).format(dateObj);
  } catch (_) {
    formats.hijri = '';
  }
  const selected = (mode || 'both').toLowerCase();
  if (selected === 'gregorian') return { primary: formats.gregorian, secondary: '' };
  if (selected === 'hijri') return { primary: formats.hijri || formats.gregorian, secondary: '' };
  return { primary: formats.gregorian, secondary: formats.hijri };
}

// تحويل حالة الواجهة الأمامية إلى حالة قاعدة البيانات
function mapFrontendStatusToDb(frontStatus) {
  if (!frontStatus) return null;
  const s = String(frontStatus).toLowerCase().replace(/-/g, '_');
  const map = {
    pending: 'RECEIVED',
    in_progress: 'UNDER_REPAIR',
    'in-progress': 'UNDER_REPAIR', // دعم الشرطة أيضاً
    on_hold: 'WAITING_PARTS',
    'on-hold': 'WAITING_PARTS', // دعم الشرطة أيضاً
    completed: 'DELIVERED',
    cancelled: 'REJECTED'
  };
  // إذا كانت القيمة بالفعل من قيم قاعدة البيانات، أعدها كما هي
  const dbValues = new Set([
    'RECEIVED', 'INSPECTION', 'AWAITING_APPROVAL', 'UNDER_REPAIR', 'READY_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'WAITING_PARTS'
  ]);
  if (dbValues.has(frontStatus)) return frontStatus;
  return map[s] || map[frontStatus] || 'RECEIVED';
}

// Get all repair requests with statistics
// Get all repair requests with improved pagination and filters
router.get('/', authMiddleware, validate(repairSchemas.getRepairs, 'query'), async (req, res) => {
  try {
    const {
      customerId,
      status,
      priority,
      page = 1,
      limit = 10,
      search = ''
    } = req.query;

    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE conditions
    let whereConditions = ['rr.deletedAt IS NULL'];
    let queryParams = [];

    // Customer filter
    if (customerId) {
      whereConditions.push('rr.customerId = ?');
      queryParams.push(customerId);
    }

    // Status filter - support both frontend and database statuses
    if (status) {
      const dbStatus = mapFrontendStatusToDb(status);
      whereConditions.push('rr.status = ?');
      queryParams.push(dbStatus || status);
    }

    // Priority filter
    if (priority) {
      whereConditions.push('rr.priority = ?');
      queryParams.push(priority.toUpperCase());
    }

    // Search filter (device type, brand, model, or problem description)
    if (search && search.trim()) {
      whereConditions.push(`(
        rr.reportedProblem LIKE ? OR 
        d.deviceType LIKE ? OR 
        COALESCE(vo.label, d.brand) LIKE ? OR 
        d.model LIKE ? OR
        rr.id = ?
      )`);
      const searchPattern = `%${search.trim()}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, search.trim());
    }

    // Build main query with pagination
    const query = `
      SELECT 
        rr.*,
        rr.accessories as accessoriesJson,
        c.name as customerName,
        c.phone as customerPhone,
        c.email as customerEmail,
        COALESCE(vo.label, d.brand) as deviceBrand,
        d.model as deviceModel,
        d.deviceType as deviceType,
        d.serialNumber
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY rr.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limitNum, offset);

    const [rows] = await db.execute(query, queryParams);

    //Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM RepairRequest rr
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE ${whereConditions.join(' AND ')}
    `;

    // Remove limit and offset params for count query
    const countParams = queryParams.slice(0, -2);
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    // Format data for frontend
    const formattedData = rows.map(row => ({
      id: row.id,
      requestNumber: `REP-${new Date(row.createdAt).getFullYear()}${String(new Date(row.createdAt).getMonth() + 1).padStart(2, '0')}${String(new Date(row.createdAt).getDate()).padStart(2, '0')}-${String(row.id).padStart(3, '0')}`,
      customerId: row.customerId,
      customerName: row.customerName || 'غير محدد',
      customerPhone: row.customerPhone || 'غير محدد',
      customerEmail: row.customerEmail || 'غير محدد',
      deviceType: row.deviceType || 'غير محدد',
      deviceBrand: row.deviceBrand || 'غير محدد',
      deviceModel: row.deviceModel || 'غير محدد',
      issueDescription: row.reportedProblem || row.problemDescription || 'لا توجد تفاصيل',
      status: getStatusMapping(row.status),
      priority: row.priority || 'MEDIUM',
      estimatedCost: parseFloat(row.estimatedCost) || 0,
      actualCost: row.actualCost ? parseFloat(row.actualCost) : null,
      expectedDeliveryDate: row.expectedDeliveryDate || null,
      estimatedCompletionDate: row.expectedDeliveryDate || null,
      assignedTechnician: row.technicianId || null,
      notes: row.notes || null,
      accessories: row.accessoriesJson ? JSON.parse(row.accessoriesJson).filter(a => a != null) : [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    // Return response with pagination metadata
    res.json({
      success: true,
      data: {
        repairs: formattedData,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total
        }
      }
    });
  } catch (err) {
    console.error('Error fetching repair requests:', err);
    res.status(500).json({
      success: false,
      message: 'حصل خطأ في السيرفر',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Public tracking page for a repair request
router.get('/:id/track', async (req, res) => {
  const { id } = req.params;
  try {
    const settings = loadPrintSettings();
    const dateMode = (req.query.date || settings.dateDisplay || 'both').toLowerCase();
    const [rows] = await db.execute(`
      SELECT 
        rr.*,
        c.name as customerName,
        c.phone as customerPhone,
        d.deviceType,
        COALESCE(vo.label, d.brand) as deviceBrand,
        d.model as deviceModel
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE rr.id = ? AND rr.deletedAt IS NULL
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).send('لم يتم العثور على الطلب');
    }

    const r = rows[0];
    const created = new Date(r.createdAt);
    const dates = formatDates(created, dateMode);
    const requestNumber = `REP-${created.getFullYear()}${String(created.getMonth() + 1).padStart(2, '0')}${String(created.getDate()).padStart(2, '0')}-${String(r.id).padStart(3, '0')}`;

    const html = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>متابعة الطلب - ${requestNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; direction: rtl; color:#111827; }
        .container { max-width: 760px; margin: 0 auto; padding: 16px; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; }
        .title { font-size: 18px; font-weight: bold; }
        .muted { color:#6b7280; font-size:12px; }
        .section { border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin:12px 0; }
        .row { display:flex; gap:16px; flex-wrap:wrap; }
        .col { flex:1 1 240px; }
        .label { font-size:12px; color:#6b7280; }
        .value { font-size:14px; font-weight:600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">متابعة حالة طلب الإصلاح</div>
          <div class="muted">${requestNumber}</div>
        </div>

        <div class="section">
          <div class="row">
            <div class="col"><div class="label">العميل</div><div class="value">${r.customerName || '—'}</div></div>
            <div class="col"><div class="label">الهاتف</div><div class="value">${r.customerPhone || '—'}</div></div>
            <div class="col"><div class="label">التاريخ</div><div class="value">${dates.primary || '—'}${dates.secondary ? ` — ${dates.secondary}` : ''}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="row">
            <div class="col"><div class="label">الحالة</div><div class="value">${r.status || '—'}</div></div>
            <div class="col"><div class="label">نوع الجهاز</div><div class="value">${r.deviceType || '—'}</div></div>
            <div class="col"><div class="label">الماركة</div><div class="value">${r.deviceBrand || '—'}</div></div>
            <div class="col"><div class="label">الموديل</div><div class="value">${r.deviceModel || '—'}</div></div>
          </div>
        </div>

        <div class="muted">ملاحظة: يتم تحديث حالة الطلب عند حدوث تغييرات في مركز الصيانة.</div>
      </div>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
  } catch (err) {
    console.error('Error rendering track page:', err);
    res.status(500).send('Server Error');
  }
});

// Public tracking page using tracking token (recommended)
router.get('/track/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const settings = loadPrintSettings();
    const dateMode = (req.query.date || settings.dateDisplay || 'both').toLowerCase();
    const [rows] = await db.execute(`
      SELECT 
        rr.*,
        c.name as customerName,
        c.phone as customerPhone,
        d.deviceType,
        COALESCE(vo.label, d.brand) as deviceBrand,
        d.model as deviceModel
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE rr.trackingToken = ? AND rr.deletedAt IS NULL
    `, [token]);

    if (!rows || rows.length === 0) {
      return res.status(404).send('لم يتم العثور على الطلب');
    }

    const r = rows[0];
    const created = new Date(r.createdAt);
    const dates = formatDates(created, dateMode);
    const requestNumber = `REP-${created.getFullYear()}${String(created.getMonth() + 1).padStart(2, '0')}${String(created.getDate()).padStart(2, '0')}-${String(r.id).padStart(3, '0')}`;

    const html = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>متابعة الطلب - ${requestNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; direction: rtl; color:#111827; }
        .container { max-width: 760px; margin: 0 auto; padding: 16px; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; }
        .title { font-size: 18px; font-weight: bold; }
        .muted { color:#6b7280; font-size:12px; }
        .section { border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin:12px 0; }
        .row { display:flex; gap:16px; flex-wrap:wrap; }
        .col { flex:1 1 240px; }
        .label { font-size:12px; color:#6b7280; }
        .value { font-size:14px; font-weight:600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">متابعة حالة طلب الإصلاح</div>
          <div class="muted">${requestNumber}</div>
        </div>

        <div class="section">
          <div class="row">
            <div class="col"><div class="label">العميل</div><div class="value">${r.customerName || '—'}</div></div>
            <div class="col"><div class="label">الهاتف</div><div class="value">${r.customerPhone || '—'}</div></div>
            <div class="col"><div class="label">التاريخ</div><div class="value">${dates.primary || '—'}${dates.secondary ? ` — ${dates.secondary}` : ''}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="row">
            <div class="col"><div class="label">الحالة</div><div class="value">${r.status || '—'}</div></div>
            <div class="col"><div class="label">نوع الجهاز</div><div class="value">${r.deviceType || '—'}</div></div>
            <div class="col"><div class="label">الماركة</div><div class="value">${r.deviceBrand || '—'}</div></div>
            <div class="col"><div class="label">الموديل</div><div class="value">${r.deviceModel || '—'}</div></div>
          </div>
        </div>

        <div class="muted">ملاحظة: يتم تحديث حالة الطلب عند حدوث تغييرات في مركز الصيانة.</div>
      </div>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
  } catch (err) {
    console.error('Error rendering track page by token:', err);
    res.status(500).send('Server Error');
  }
});

// دالة مساعدة لتحويل حالات قاعدة البيانات إلى حالات Frontend
function getStatusMapping(dbStatus) {
  const statusMap = {
    'RECEIVED': 'pending',
    'INSPECTION': 'pending',
    'AWAITING_APPROVAL': 'pending',
    'UNDER_REPAIR': 'in-progress',
    'READY_FOR_DELIVERY': 'completed',
    'DELIVERED': 'completed',
    'REJECTED': 'cancelled',
    'WAITING_PARTS': 'on-hold'
  };
  return statusMap[dbStatus] || 'pending';
}

// Get repair request by ID
// Note: Public tracking routes use /:id/track and /track/:token instead
router.get('/:id', authMiddleware, validate(repairSchemas.getRepairById, 'params'), async (req, res) => {
  const { id } = req.params;
  try {
    // جلب معلومات الطلب مع العميل والجهاز والماركة (Label)
    const [rows] = await db.execute(`
      SELECT 
        rr.*,
        c.name as customerName,
        c.phone as customerPhone,
        c.email as customerEmail,
        u.name as technicianName,
        d.deviceType,
        COALESCE(vo.label, d.brand) as deviceBrand,
        d.brandId,
        d.model as deviceModel,
        d.serialNumber,
        d.devicePassword,
        d.cpu, d.gpu, d.ram, d.storage
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN User u ON rr.technicianId = u.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE rr.id = ? AND rr.deletedAt IS NULL
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).send('Repair request not found');
    }

    const repair = rows[0];

    // جلب الملحقات المرتبطة بالطلب
    const [accRows] = await db.execute(`
      SELECT rra.accessoryOptionId as id, vo.label
      FROM RepairRequestAccessory rra
      LEFT JOIN VariableOption vo ON rra.accessoryOptionId = vo.id
      WHERE rra.repairRequestId = ?
    `, [id]);

    const response = {
      id: repair.id,
      requestNumber: `REP-${new Date(repair.createdAt).getFullYear()}${String(new Date(repair.createdAt).getMonth() + 1).padStart(2, '0')}${String(new Date(repair.createdAt).getDate()).padStart(2, '0')}-${String(repair.id).padStart(3, '0')}`,
      customerId: repair.customerId,
      customerName: repair.customerName,
      customerPhone: repair.customerPhone,
      customerEmail: repair.customerEmail,
      deviceId: repair.deviceId,
      technicianId: repair.technicianId,
      technicianName: repair.technicianName || null,
      deviceType: repair.deviceType || 'غير محدد',
      deviceBrand: repair.deviceBrand || 'غير محدد',
      deviceModel: repair.deviceModel || 'غير محدد',
      serialNumber: repair.serialNumber,
      reportedProblem: repair.reportedProblem,
      problemDescription: repair.reportedProblem || repair.problemDescription || null,
      status: getStatusMapping(repair.status),
      estimatedCost: repair.estimatedCost || 0,
      actualCost: repair.actualCost || null,
      priority: repair.priority || 'MEDIUM',
      expectedDeliveryDate: repair.expectedDeliveryDate || null,
      notes: repair.notes || null,
      createdAt: repair.createdAt,
      updatedAt: repair.updatedAt,
      deviceSpecs: {
        cpu: repair.cpu || null,
        gpu: repair.gpu || null,
        ram: repair.ram || null,
        storage: repair.storage || null,
      },
      accessories: repair.accessories ? JSON.parse(repair.accessories).filter(a => a != null) : []
    };

    res.json(response);
  } catch (err) {
    console.error(`Error fetching repair request with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new repair request
router.post('/', authMiddleware, validate(repairSchemas.createRepair), async (req, res) => {
  const {
    customerId, customerName, customerPhone, customerEmail,
    deviceType, deviceBrand, brandId, deviceModel, serialNumber,
    devicePassword,
    cpu, gpu, ram, storage,
    accessories,
    problemDescription, priority, estimatedCost, notes, status, expectedDeliveryDate
  } = req.body;

  // Debug logging
  console.log('Received repair data:', {
    estimatedCost,
    expectedDeliveryDate,
    customerName,
    deviceType,
    problemDescription,
    accessories
  });
  console.log('Accessories type:', typeof accessories, 'Is array:', Array.isArray(accessories), 'Value:', accessories);

  // Get database connection for transaction
  const connection = await db.getConnection();

  try {
    // Start transaction
    await connection.beginTransaction();

    // أولاً: إنشاء أو العثور على العميل
    let actualCustomerId = customerId;
    if (!customerId) {
      // البحث عن العميل بالهاتف أولاً
      const [existingCustomer] = await connection.execute(
        'SELECT id FROM Customer WHERE phone = ? AND deletedAt IS NULL',
        [customerPhone]
      );

      if (existingCustomer.length > 0) {
        actualCustomerId = existingCustomer[0].id;
      } else {
        // إنشاء عميل جديد
        const [customerResult] = await connection.execute(
          'INSERT INTO Customer (name, phone, email) VALUES (?, ?, ?)',
          [customerName, customerPhone, customerEmail || null]
        );
        actualCustomerId = customerResult.insertId;
      }
    }

    // ثانياً: إنشاء الجهاز إذا تم تقديم تفاصيله
    let deviceId = null;
    if (deviceType || deviceBrand || brandId || deviceModel || serialNumber || devicePassword || cpu || gpu || ram || storage) {
      const [deviceResult] = await connection.execute(
        'INSERT INTO Device (customerId, deviceType, brand, brandId, model, serialNumber, devicePassword, cpu, gpu, ram, storage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          actualCustomerId,
          deviceType || null,
          deviceBrand || null,
          brandId || null,
          deviceModel || null,
          serialNumber || null,
          devicePassword || null,
          cpu || null,
          gpu || null,
          ram || null,
          storage || null
        ]
      );
      deviceId = deviceResult.insertId;
    }

    // ثالثاً: إنشاء طلب الإصلاح
    const repairStatus = mapFrontendStatusToDb(status) || 'RECEIVED';
    // توليد توكن تتبع عام للعميل
    const crypto = require('crypto');
    const trackingToken = crypto.randomBytes(24).toString('hex');
    const insertQuery = `
      INSERT INTO RepairRequest (
        deviceId, reportedProblem, status, trackingToken, customerId, branchId, technicianId, estimatedCost, expectedDeliveryDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    console.log('Inserting repair with values:', {
      deviceId, problemDescription, repairStatus, trackingToken, actualCustomerId,
      estimatedCost: estimatedCost || 0, expectedDeliveryDate: expectedDeliveryDate || null
    });

    const [result] = await connection.execute(insertQuery, [
      deviceId, problemDescription, repairStatus, trackingToken, actualCustomerId, 1, null, estimatedCost || 0, expectedDeliveryDate || null // branchId = 1 افتراضي
    ]);

    // رابعاً: حفظ الملحقات إن وجدت
    if (Array.isArray(accessories) && accessories.length > 0) {
      // حفظ المتعلقات كـ JSON في حقل accessories
      const accessoriesJson = JSON.stringify(accessories);
      await connection.execute(
        'UPDATE RepairRequest SET accessories = ? WHERE id = ?',
        [accessoriesJson, result.insertId]
      );
      console.log('Accessories saved:', accessories);
    }

    // Commit transaction
    await connection.commit();

    // إرجاع البيانات المُنشأة مع تفاصيل كاملة
    const [newRepairData] = await connection.execute(`
      SELECT 
        rr.*,
        rr.accessories as accessoriesJson,
        c.name as customerName,
        c.phone as customerPhone,
        c.email as customerEmail,
        COALESCE(vo.label, d.brand) as deviceBrand,
        d.model as deviceModel,
        d.deviceType as deviceType,
        d.serialNumber,
        d.devicePassword,
        d.cpu, d.gpu, d.ram, d.storage
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE rr.id = ?
    `, [result.insertId]);

    // Commit transaction
    await connection.commit();
    connection.release();

    const newRepair = {
      id: result.insertId,
      requestNumber: `REP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(result.insertId).padStart(3, '0')}`,
      customerName: newRepairData[0]?.customerName || customerName,
      customerPhone: newRepairData[0]?.customerPhone || customerPhone,
      customerEmail: newRepairData[0]?.customerEmail || customerEmail,
      deviceType: newRepairData[0]?.deviceType || deviceType,
      deviceBrand: newRepairData[0]?.deviceBrand || deviceBrand,
      deviceModel: newRepairData[0]?.deviceModel || deviceModel,
      problemDescription: problemDescription,
      status: getStatusMapping(repairStatus),
      priority: priority || 'medium',
      estimatedCost: estimatedCost || 0,
      deviceSpecs: {
        cpu: newRepairData[0]?.cpu || cpu || null,
        gpu: newRepairData[0]?.gpu || gpu || null,
        ram: newRepairData[0]?.ram || ram || null,
        storage: newRepairData[0]?.storage || storage || null,
      },
      accessories: newRepairData[0]?.accessoriesJson ? JSON.parse(newRepairData[0].accessoriesJson).filter(a => a != null) : (Array.isArray(accessories) ? accessories.filter(a => a != null) : []),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json(newRepair);
  } catch (err) {
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error creating repair request:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      details: err.message
    });
  }
});

// Update a repair request
router.put('/:id', authMiddleware, validate(repairSchemas.getRepairById, 'params'), validate(repairSchemas.updateRepair), async (req, res) => {
  const { id } = req.params;
  let { deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields } = req.body;
  try {
    status = mapFrontendStatusToDb(status);
    const [result] = await db.execute('UPDATE RepairRequest SET deviceId = ?, reportedProblem = ?, technicianReport = ?, status = ?, customerId = ?, branchId = ?, technicianId = ?, quotationId = ?, invoiceId = ?, deviceBatchId = ?, attachments = ?, customFields = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, JSON.stringify(attachments), JSON.stringify(customFields), id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Repair request not found or already deleted' });
    }
    res.json({ success: true, message: 'Repair request updated successfully' });
  } catch (err) {
    console.error(`Error updating repair request with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Soft delete a repair request
router.delete('/:id', authMiddleware, validate(repairSchemas.deleteRepair, 'params'), async (req, res) => {
  const { id } = req.params;
  try {
    // Soft delete instead of hard delete
    const [result] = await db.execute('UPDATE RepairRequest SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Repair request not found or already deleted' });
    }
    res.json({ success: true, message: 'Repair request deleted successfully' });
  } catch (err) {
    console.error(`Error deleting repair request with ID ${id}:`, err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Update only status
router.patch('/:id/status', authMiddleware, validate(repairSchemas.getRepairById, 'params'), validate(repairSchemas.updateStatus), async (req, res) => {
  const { id } = req.params;
  let { status, notes } = req.body || {};

  // Get database connection for transaction
  const connection = await db.getConnection();

  try {
    // Start transaction
    await connection.beginTransaction();

    // دعم التحويل من صيغة الواجهة إلى صيغة قاعدة البيانات
    status = mapFrontendStatusToDb(status);
    const [beforeRows] = await connection.execute('SELECT status FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [id]);
    if (!beforeRows || beforeRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, error: 'Repair request not found or already deleted' });
    }
    const fromStatus = beforeRows[0].status || null;
    const [result] = await connection.execute('UPDATE RepairRequest SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [status, id]);
    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, error: 'Repair request not found or already deleted' });
    }
    const changedById = (req.user && req.user.id) ? req.user.id : null;
    await connection.execute(
      'INSERT INTO StatusUpdateLog (repairRequestId, fromStatus, toStatus, notes, changedById) VALUES (?, ?, ?, ?, ?)',
      [id, fromStatus, status, notes, changedById]
    );

    // 🔧 Fix #2: Auto-create invoice when status changes to READY_FOR_DELIVERY or DELIVERED
    let createdInvoiceId = null;
    if ((status === 'READY_FOR_DELIVERY' || status === 'DELIVERED') && (fromStatus !== 'READY_FOR_DELIVERY' && fromStatus !== 'DELIVERED')) {
      try {
        // Check if invoice already exists for this repair
        const [existingInvoice] = await connection.execute(
          'SELECT id FROM Invoice WHERE repairRequestId = ? AND deletedAt IS NULL',
          [id]
        );

        if (existingInvoice.length === 0) {
          // Get repair details
          const [repairRows] = await connection.execute(
            'SELECT customerId, actualCost FROM RepairRequest WHERE id = ?',
            [id]
          );

          if (repairRows.length > 0) {
            const repair = repairRows[0];
            const customerId = repair.customerId;

            // Calculate total from parts and services
            const [partsTotal] = await connection.execute(`
              SELECT COALESCE(SUM(pu.totalPrice), 0) as total
              FROM PartsUsed pu
              WHERE pu.repairRequestId = ? AND pu.status IN ('used', 'approved', 'reserved')
            `, [id]);

            const [servicesTotal] = await connection.execute(`
              SELECT COALESCE(SUM(rrs.finalPrice), 0) as total
              FROM RepairRequestService rrs
              WHERE rrs.repairRequestId = ? AND rrs.status = 'completed'
            `, [id]);

            const calculatedTotal = Number(partsTotal[0]?.total || 0) + Number(servicesTotal[0]?.total || 0);
            const finalTotal = calculatedTotal > 0 ? calculatedTotal : (repair.actualCost || 0);

            // Create invoice
            const [invoiceResult] = await connection.execute(`
              INSERT INTO Invoice (
                repairRequestId, customerId, totalAmount, amountPaid, status, 
                currency, taxAmount, discountAmount, createdAt, updatedAt
              ) VALUES (?, ?, ?, 0, 'pending', 'EGP', 0, 0, NOW(), NOW())
            `, [id, customerId, finalTotal]);

            createdInvoiceId = invoiceResult.insertId;

            // Add parts used to invoice items
            const [partsUsed] = await connection.execute(`
              SELECT pu.*, ii.name, ii.sellingPrice, pu.unitSellingPrice, pu.totalPrice
              FROM PartsUsed pu
              LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
              WHERE pu.repairRequestId = ? AND pu.status IN ('used', 'approved', 'reserved')
            `, [id]);

            for (const part of partsUsed) {
              const unitPrice = part.unitSellingPrice || part.sellingPrice || 0;
              const quantity = part.quantity || 1;
              const totalPrice = part.totalPrice || (quantity * unitPrice);

              const [itemResult] = await connection.execute(`
                INSERT INTO InvoiceItem (
                  invoiceId, inventoryItemId, quantity, unitPrice, totalPrice, itemType, description, partsUsedId
                ) VALUES (?, ?, ?, ?, ?, 'part', ?, ?)
              `, [
                createdInvoiceId,
                part.inventoryItemId,
                quantity,
                unitPrice,
                totalPrice,
                `قطعة غيار: ${part.name || 'غير محدد'}`,
                part.id
              ]);

              // Update PartsUsed to link to invoice item
              await connection.execute(
                'UPDATE PartsUsed SET invoiceItemId = ? WHERE id = ?',
                [itemResult.insertId, part.id]
              );
            }

            // Add services used to invoice items
            const [services] = await connection.execute(`
              SELECT rrs.*, s.name, s.basePrice
              FROM RepairRequestService rrs
              LEFT JOIN Service s ON rrs.serviceId = s.id
              WHERE rrs.repairRequestId = ? AND rrs.status = 'completed'
            `, [id]);

            for (const service of services) {
              const unitPrice = service.finalPrice || service.price || service.basePrice || 0;
              await connection.execute(`
                INSERT INTO InvoiceItem (
                  invoiceId, serviceId, quantity, unitPrice, totalPrice, itemType, description
                ) VALUES (?, ?, 1, ?, ?, 'service', ?)
              `, [
                createdInvoiceId,
                service.serviceId,
                unitPrice,
                unitPrice,
                `خدمة: ${service.name || 'غير محدد'}`
              ]);
            }

            // Recalculate and update total amount
            const [totalResult] = await connection.execute(`
              SELECT COALESCE(SUM(quantity * unitPrice), 0) as calculatedTotal
              FROM InvoiceItem WHERE invoiceId = ?
            `, [createdInvoiceId]);

            const finalInvoiceTotal = Number(totalResult[0]?.calculatedTotal || 0);
            await connection.execute(
              'UPDATE Invoice SET totalAmount = ?, updatedAt = NOW() WHERE id = ?',
              [finalInvoiceTotal, createdInvoiceId]
            );

            // Update repair request with invoice ID
            await connection.execute(
              'UPDATE RepairRequest SET invoiceId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
              [createdInvoiceId, id]
            );

            console.log(`✅ Auto-created invoice ${createdInvoiceId} for repair request ${id}`);
          }
        } else {
          // Invoice already exists, just link it
          createdInvoiceId = existingInvoice[0].id;
          await connection.execute(
            'UPDATE RepairRequest SET invoiceId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [createdInvoiceId, id]
          );
        }
      } catch (invoiceError) {
        // Log error but don't fail the status update
        console.error('Error auto-creating invoice:', invoiceError);
        // Continue with status update even if invoice creation fails
      }
    }

    // 🔔 Fix #4: Send notifications when status changes
    try {
      // Get repair details for notifications
      const [repairDetails] = await connection.execute(`
        SELECT rr.*, c.name as customerName, c.phone as customerPhone, c.email as customerEmail
        FROM RepairRequest rr
        LEFT JOIN Customer c ON rr.customerId = c.id
        WHERE rr.id = ?
      `, [id]);

      if (repairDetails.length > 0) {
        const repair = repairDetails[0];

        // Map status to notification type
        const notificationTypes = {
          'RECEIVED': 'repair_received',
          'UNDER_REPAIR': 'repair_started',
          'READY_FOR_DELIVERY': 'repair_completed',
          'DELIVERED': 'ready_pickup'
        };

        const notificationType = notificationTypes[status];

        if (notificationType && fromStatus !== status) {
          // Create notification log (RepairNotificationLog table should exist from migrations)
          try {
            await connection.execute(`
              INSERT INTO RepairNotificationLog (
                repairRequestId, customerId, notificationType, channel, status, 
                title, message, recipient, sentBy, sentAt, createdAt
              ) VALUES (?, ?, ?, 'system', 'pending', ?, ?, ?, ?, NOW(), NOW())
            `, [
              id,
              repair.customerId,
              notificationType,
              `تحديث حالة الطلب #${id}`,
              `تم تحديث حالة طلب الإصلاح #${id} إلى: ${status}`,
              repair.customerPhone || repair.customerEmail,
              changedById || 1
            ]);

            console.log(`✅ Created notification log for repair ${id}, type: ${notificationType}`);
          } catch (notifError) {
            // If RepairNotificationLog table doesn't exist, skip silently
            console.warn('Notification log table may not exist:', notifError.message);
          }
        }
      }
    } catch (notifError) {
      // Don't fail the status update if notification fails
      console.warn('Error creating notification:', notifError.message);
    }

    // Commit transaction
    await connection.commit();
    connection.release();

    // أعِد الصيغة الأمريكية للواجهة للتوحيد
    const uiMap = {
      'RECEIVED': 'pending',
      'INSPECTION': 'pending',
      'AWAITING_APPROVAL': 'pending',
      'UNDER_REPAIR': 'in-progress',
      'READY_FOR_DELIVERY': 'completed',
      'DELIVERED': 'completed',
      'REJECTED': 'cancelled',
      'WAITING_PARTS': 'on-hold'
    };

    // 🔧 Fix #6: Include invoice information in response if auto-created
    const response = {
      success: true,
      message: 'Status updated successfully',
      status: uiMap[status] || 'pending'
    };

    // Add invoice information if one was auto-created
    if (createdInvoiceId) {
      response.invoiceCreated = true;
      response.invoiceId = createdInvoiceId;
      response.invoiceMessage = `تم إنشاء فاتورة تلقائياً رقم #${createdInvoiceId}`;
    }

    // Add invoice info if created
    if (createdInvoiceId) {
      response.invoiceCreated = true;
      response.invoiceId = createdInvoiceId;
      response.message += `. تم إنشاء الفاتورة تلقائياً (#${createdInvoiceId})`;
    }

    res.json(response);
  } catch (err) {
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error updating status:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

// Update repair details (estimatedCost, actualCost, priority, expectedDeliveryDate, notes, accessories)
router.patch('/:id/details', authMiddleware, validate(repairSchemas.getRepairById, 'params'), validate(repairSchemas.updateDetails), async (req, res) => {
  const { id } = req.params;
  const { estimatedCost, actualCost, priority, expectedDeliveryDate, notes, accessories } = req.body;

  try {
    // Validate priority if provided
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    const priorityMap = {
      'medium': 'normal',
      'MEDIUM': 'normal',
      'LOW': 'low',
      'HIGH': 'high',
      'URGENT': 'urgent'
    };

    let normalizedPriority = priority;
    if (priority) {
      // Convert to lowercase and map common values
      normalizedPriority = priorityMap[priority] || priority.toLowerCase();

      if (!validPriorities.includes(normalizedPriority)) {
        return res.status(400).json({ error: 'Invalid priority. Must be one of: low, normal, high, urgent' });
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (estimatedCost !== undefined) {
      updates.push('estimatedCost = ?');
      values.push(parseFloat(estimatedCost));
    }

    if (actualCost !== undefined) {
      updates.push('actualCost = ?');
      values.push(actualCost ? parseFloat(actualCost) : null);
    }

    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(normalizedPriority);
    }

    if (expectedDeliveryDate !== undefined) {
      updates.push('expectedDeliveryDate = ?');
      values.push(expectedDeliveryDate ? new Date(expectedDeliveryDate) : null);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (accessories !== undefined) {
      updates.push('accessories = ?');
      values.push(Array.isArray(accessories) ? JSON.stringify(accessories) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE RepairRequest SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL`;

    const [result] = await db.execute(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Repair request not found or already deleted' });
    }

    res.json({ message: 'Repair details updated successfully' });
  } catch (err) {
    console.error('Error updating repair details:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Rotate tracking token for a single repair request
router.post('/:id/rotate-token', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [upd] = await db.execute(
      "UPDATE RepairRequest SET trackingToken = LOWER(REPLACE(UUID(), '-', '')) WHERE id = ?",
      [id]
    );
    if (upd.affectedRows === 0) {
      return res.status(404).json({ message: 'Repair request not found' });
    }
    const [row] = await db.execute('SELECT trackingToken FROM RepairRequest WHERE id = ?', [id]);
    res.json({ message: 'Tracking token rotated', id, trackingToken: row[0]?.trackingToken || null });
  } catch (err) {
    console.error('Error rotating tracking token:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Rotate tracking tokens for ALL repair requests
router.post('/rotate-tokens', authMiddleware, async (_req, res) => {
  try {
    const [upd] = await db.execute("UPDATE RepairRequest SET trackingToken = LOWER(REPLACE(UUID(), '-', ''))");
    res.json({ message: 'All tracking tokens rotated', affectedRows: upd.affectedRows || 0 });
  } catch (err) {
    console.error('Error rotating all tracking tokens:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// =========================
// Attachments (List / Upload / Delete)
// =========================

const uploadRoot = path.join(__dirname, '..', 'uploads', 'repairs');
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(uploadRoot, String(req.params.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (_req, file, cb) {
    const safe = Date.now() + '-' + file.originalname.replace(/[^\w.\-]+/g, '_');
    cb(null, safe);
  }
});

const upload = multer({ storage });

// List attachments
router.get('/:id/attachments', authMiddleware, async (req, res) => {
  const repairId = req.params.id;
  try {
    // Get attachments from database
    const [repairRows] = await db.execute('SELECT attachments FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [repairId]);
    if (!repairRows || repairRows.length === 0) {
      return res.status(404).json({ error: 'Repair request not found' });
    }

    // Parse attachments from JSON field
    let attachments = [];
    try {
      attachments = repairRows[0].attachments ? JSON.parse(repairRows[0].attachments) : [];
    } catch (e) {
      console.warn('Failed to parse attachments from database:', e);
      attachments = [];
    }

    // Verify files still exist on filesystem and filter out missing ones
    const validAttachments = [];
    for (const attachment of attachments) {
      const filePath = path.join(uploadRoot, String(repairId), attachment.id);
      if (fs.existsSync(filePath)) {
        validAttachments.push(attachment);
      } else {
        console.warn(`Attachment file not found: ${filePath}`);
      }
    }

    // If there are missing files, update the database
    if (validAttachments.length !== attachments.length) {
      await db.execute('UPDATE RepairRequest SET attachments = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(validAttachments), repairId]);
    }

    res.json(validAttachments);
  } catch (e) {
    console.error('List attachments error:', e);
    res.status(500).json({ error: 'Failed to list attachments' });
  }
});

// Upload attachment
router.post('/:id/attachments', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const repairId = req.params.id;
    const url = `${req.protocol}://${req.get('host')}/uploads/repairs/${repairId}/${encodeURIComponent(req.file.filename)}`;

    // Create attachment object
    const attachmentData = {
      id: req.file.filename,
      name: req.file.originalname,
      title: req.file.originalname.replace(/\.[^/.]+$/, ''),
      url: url,
      size: req.file.size,
      type: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.name || 'Unknown User'
    };

    // Get current attachments from database
    const [repairRows] = await db.execute('SELECT attachments FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [repairId]);
    if (!repairRows || repairRows.length === 0) {
      return res.status(404).json({ error: 'Repair request not found' });
    }

    // Parse existing attachments or create empty array
    let existingAttachments = [];
    try {
      existingAttachments = repairRows[0].attachments ? JSON.parse(repairRows[0].attachments) : [];
    } catch (e) {
      console.warn('Failed to parse existing attachments, starting fresh:', e);
      existingAttachments = [];
    }

    // Add new attachment to the array
    existingAttachments.push(attachmentData);

    // Update database with new attachments array
    await db.execute('UPDATE RepairRequest SET attachments = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(existingAttachments), repairId]);

    res.status(201).json(attachmentData);
  } catch (e) {
    console.error('Upload attachment error:', e);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

// Delete attachment
router.delete('/:id/attachments/:attachmentId', authMiddleware, async (req, res) => {
  const repairId = req.params.id;
  const attachmentId = req.params.attachmentId;
  const filePath = path.join(uploadRoot, String(repairId), attachmentId);

  try {
    // Remove file from filesystem
    await fs.promises.unlink(filePath);

    // Get current attachments from database
    const [repairRows] = await db.execute('SELECT attachments FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [repairId]);
    if (!repairRows || repairRows.length === 0) {
      return res.status(404).json({ error: 'Repair request not found' });
    }

    // Parse existing attachments
    let existingAttachments = [];
    try {
      existingAttachments = repairRows[0].attachments ? JSON.parse(repairRows[0].attachments) : [];
    } catch (e) {
      console.warn('Failed to parse existing attachments:', e);
      existingAttachments = [];
    }

    // Remove attachment from array
    const updatedAttachments = existingAttachments.filter(att => att.id !== attachmentId);

    // Update database with updated attachments array
    await db.execute('UPDATE RepairRequest SET attachments = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(updatedAttachments), repairId]);

    res.json({ success: true });
  } catch (e) {
    console.error('Delete attachment error:', e);
    if (e.code === 'ENOENT') return res.status(404).json({ error: 'Attachment not found' });
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// =========================
// Logs (Timeline)
// =========================
router.get('/:id/logs', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [statusLogs] = await db.execute(
      'SELECT id, fromStatus, toStatus, notes, changedById, createdAt FROM StatusUpdateLog WHERE repairRequestId = ? ORDER BY createdAt DESC',
      [id]
    );
    const [auditLogs] = await db.execute(
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
        createdAt: s.createdAt
      });
    }
    for (const a of auditLogs) {
      timeline.push({
        id: `audit-${a.id}`,
        type: a.actionType || 'note',
        content: a.details || a.action,
        author: a.userId ? `User #${a.userId}` : 'System',
        createdAt: a.createdAt
      });
    }
    timeline.sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
    res.json(timeline);
  } catch (e) {
    console.error('Error fetching logs:', e);
    res.status(500).json({ error: 'Server Error' });
  }
});

// =========================
// Assign technician to repair request
// =========================
router.post('/:id/assign', authMiddleware, validate(repairSchemas.getRepairById, 'params'), validate(repairSchemas.assignTechnician), async (req, res) => {
  const { id } = req.params;
  const { technicianId } = req.body || {};
  const techIdNum = Number(technicianId);

  // Get database connection for transaction
  const connection = await db.getConnection();

  try {
    // Start transaction
    await connection.beginTransaction();

    // Ensure repair exists
    const [repRows] = await connection.execute('SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [id]);
    if (!repRows || repRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, error: 'Repair request not found' });
    }

    // Ensure technician exists (optionally check role)
    const [userRows] = await connection.execute('SELECT u.id, u.name, r.name AS roleName FROM User u LEFT JOIN Role r ON u.roleId = r.id WHERE u.id = ? AND u.deletedAt IS NULL', [techIdNum]);
    if (!userRows || userRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, error: 'Technician not found' });
    }

    await connection.execute('UPDATE RepairRequest SET technicianId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [techIdNum, id]);

    // Audit
    const changedById = (req.user && req.user.id) ? req.user.id : null;
    await connection.execute(
      'INSERT INTO AuditLog (action, actionType, details, entityType, entityId, userId) VALUES (?, ?, ?, ?, ?, ?)',
      ['assign_technician', 'UPDATE', JSON.stringify({ technicianId: techIdNum }), 'RepairRequest', id, changedById]
    );

    // Commit transaction
    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Technician assigned successfully', technician: { id: userRows[0].id, name: userRows[0].name } });
  } catch (e) {
    // Rollback transaction on error
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error assigning technician:', e);
    res.status(500).json({ success: false, error: 'Server Error', details: e.message });
  }
});

// Print receipt (HTML) for a repair request including devicePassword
router.get('/:id/print/receipt', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const settings = loadPrintSettings();
    const dateMode = (req.query.date || settings.dateDisplay || 'both').toLowerCase();
    const [rows] = await db.execute(`
      SELECT 
        rr.*,
        c.name as customerName,
        c.phone as customerPhone,
        c.email as customerEmail,
        d.deviceType,
        COALESCE(vo.label, d.brand) as deviceBrand,
        d.model as deviceModel,
        d.serialNumber,
        d.devicePassword,
        d.cpu, d.gpu, d.ram, d.storage
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE rr.id = ? AND rr.deletedAt IS NULL
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).send('Repair request not found');
    }

    const repair = rows[0];
    const [accRows] = await db.execute(`
      SELECT vo.label
      FROM RepairRequestAccessory rra
      LEFT JOIN VariableOption vo ON rra.accessoryOptionId = vo.id
      WHERE rra.repairRequestId = ?
    `, [id]);

    const accessories = repair.accessories ? JSON.parse(repair.accessories).filter(a => a != null) : [];
    const reqDate = new Date(repair.createdAt);
    const requestNumber = `REP-${reqDate.getFullYear()}${String(reqDate.getMonth() + 1).padStart(2, '0')}${String(reqDate.getDate()).padStart(2, '0')}-${String(repair.id).padStart(3, '0')}`;
    const dates = formatDates(reqDate, dateMode);

    // حساب الهوامش مع وضع مضغوط إن لزم
    const mm = settings.margins || {};
    const factor = settings.compactMode ? 0.6 : 1;
    const padTop = Math.max(8, Math.floor((mm.top || 16) * factor));
    const padRight = Math.max(8, Math.floor((mm.right || 16) * factor));
    const padBottom = Math.max(8, Math.floor((mm.bottom || 16) * factor));
    const padLeft = Math.max(8, Math.floor((mm.left || 16) * factor));

    // نص الشروط مع استبدال القوالب الديناميكية
    const renderTemplate = (str, vars) => String(str || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => (vars[k] ?? ''));
    const termsVars = {
      branchName: settings.branchName || '',
      branchAddress: settings.branchAddress || '',
      branchPhone: settings.branchPhone || '',
      requestNumber,
      customerName: repair.customerName || ''
    };
    const termsRendered = renderTemplate(settings.terms || '', termsVars)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // إنشاء رابط التتبع - يجب أن يكون الرابط الصحيح للواجهة الأمامية
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const trackUrl = `${frontendUrl}/track/${repair.trackingToken || repair.id}`;

    // Generate QR Code server-side
    let qrCodeDataUrl = '';
    try {
      const QRCode = require('qrcode');
      qrCodeDataUrl = await QRCode.toDataURL(trackUrl, {
        width: 60,
        margin: 1,
        color: {
          dark: '#111827',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('QR Code generation error:', error);
    }

    const html = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${settings.title || 'إيصال استلام'} - ${requestNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700&family=Cairo:wght@400;600&display=swap" rel="stylesheet" />
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html {
          width: 210mm;
          max-width: 210mm;
          margin: 0;
          padding: 0;
        }
        body {
          width: 210mm;
          max-width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 0;
          overflow-x: hidden;
        }
        body { 
          font-family: 'Tajawal','Cairo', Arial, sans-serif; 
          direction: rtl; 
          color:#111827; 
          font-size: ${settings.fontSize || 11}px;
          background: #fff;
          line-height: 1.4;
        }
        .container { 
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 5.5mm;
          background: #fff;
          box-sizing: border-box;
        }
        .header { 
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          padding-bottom: 5px;
          border-bottom: 1px solid #3b82f6;
          position: relative;
        }
        .header-left {
          flex: 1;
          text-align: right;
        }
        .header-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .title { 
          font-size: 18px; 
          font-weight: 700; 
          color: #111827;
          margin-bottom: 0px;
        }
        .company-info {
          font-size: 10px;
          color: #6b7280;
          line-height: 1.4;
        }
        .header-right {
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          min-width: 140px;
          flex-shrink: 0;
        }
        .request-number-box {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #fff;
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          box-shadow: 0 1px 4px rgba(59, 130, 246, 0.3);
          width: 100%;
          text-align: center;
        }
        .request-number-label {
          font-size: 8px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2px;
          font-weight: 500;
        }
        .request-number-value {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.5px;
        }
        .qr-code-container {
          text-align: center;
        }
        .qr-code-container img {
          width: 60px !important;
          height: 60px !important;
        }
        .qr-code-label {
          font-size: 8px;
          color: #6b7280;
          margin-top: 4px;
        }
        .section { 
          border: 1px solid #e5e7eb; 
          border-radius: 3px; 
          padding: 5px; 
          margin-bottom: 5px;
          background: #fafafa;
        }
        .section-title {
          font-size: ${settings.sectionTitleFontSize || 12}px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
          padding-bottom: 3px;
          border-bottom: 1px solid #3b82f6;
        }
        .row { 
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 4px;
          margin-bottom: 3px;
        }
        .row:last-child {
          margin-bottom: 0;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .label { 
          font-size: 9px; 
          color: #6b7280;
          font-weight: 600;
        }
        .value { 
          font-size: 11px; 
          font-weight: 600;
          color: #111827;
        }
        .full-width {
          grid-column: 1 / -1;
        }
        .problem-box {
          background: #fff;
          padding: 6px;
          border-radius: 3px;
          border-right: 2px solid #3b82f6;
          min-height: 30px;
          font-size: 10px;
          line-height: 1.4;
        }
        .notes-box {
          background: #fffbf0;
          padding: 6px;
          border-radius: 3px;
          border-right: 2px solid #f59e0b;
          min-height: 30px;
          font-size: 10px;
          line-height: 1.4;
        }
        .terms-box {
          background: #fff;
          padding: 6px;
          border-radius: 3px;
          border: 1px solid #e5e7eb;
          line-height: 1.4;
          font-size: 9px;
        }
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 5px;
          padding-top: 5px;
          border-top: 1px dashed #9ca3af;
        }
        .signature-box {
          text-align: center;
        }
        .signature-label {
          font-size: 10px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 3px;
        }
        .signature-line {
          height: 30px;
          border-bottom: 1px solid #111827;
          margin-bottom: 3px;
        }
        .signature-date {
          font-size: 8px;
          color: #6b7280;
        }
        .footer { 
          text-align: center; 
          margin-top: 4px; 
          padding-top: 4px;
          border-top: 1px solid #e5e7eb;
          font-size: 9px; 
          color: #6b7280;
          line-height: 1.3;
        }
        .accessories { 
          list-style: disc; 
          padding-inline-start: 24px;
          margin-top: 8px;
        }
        .accessories li {
          margin-bottom: 6px;
        }
        @media print { 
          .no-print { display: none; }
          html, body {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 0;
          }
          .container { 
            padding: 10mm !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-left">
            <div class="title" style="text-align: right;">${settings.title || 'إيصال استلام الجهاز'}</div>
            <div class="company-info" style="margin-top:4px;">
              <strong>${settings.companyName || 'FixZone'}</strong><br>
              ${settings.address || ''}<br>
              ${settings.phone ? `هاتف: ${settings.phone}` : ''} ${settings.email ? `| بريد: ${settings.email}` : ''}
            </div>
            ${(settings.branchName || settings.branchAddress || settings.branchPhone) ? `<div class="company-info" style="margin-top:6px; padding-top:6px; border-top:1px solid #e5e7eb;">
              <strong>الفرع:</strong> ${settings.branchName || ''}<br>
              ${settings.branchAddress || ''}<br>
              ${settings.branchPhone || ''}
            </div>` : ''}
          </div>
          ${settings.showLogo && settings.logoUrl ? `<div class="header-center" style="position: absolute; left: 50%; transform: translateX(-50%);">
            <img src="${settings.logoUrl}" alt="logo" style="height:${settings.logoHeight || 40}px;"/>
          </div>` : ''}
          ${settings.showLogo && settings.logoUrl ? `<div class="header-center">
            <img src="${settings.logoUrl}" alt="logo" style="height:45px;"/>
          </div>` : ''}
          <div class="header-right">
            <div class="request-number-box">
              <div class="request-number-label">رقم أمر الشغل</div>
              <div class="request-number-value">${requestNumber}</div>
            </div>
            ${settings.showQr !== false && qrCodeDataUrl ? `
            <div class="qr-code-container">
              <div style="background: #fff; padding: 4px; border: 1.5px solid #3b82f6; border-radius: 6px; display: inline-block;">
                <img src="${qrCodeDataUrl}" alt="QR Code" style="display: block; width: 60px; height: 60px;" />
              </div>
              <div class="qr-code-label" style="margin-top: 4px; font-weight: 700; color: #3b82f6; font-size: 8px;">📱 تتبع حالة الجهاز</div>
              <div style="font-size: 7px; color: #6b7280; margin-top: 1px;">امسح الكود لمتابعة الطلب</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">بيانات العميل</div>
          <div class="row">
            <div class="field"><span class="label">الاسم</span><span class="value">${repair.customerName || '—'}</span></div>
            <div class="field"><span class="label">رقم الهاتف</span><span class="value">${repair.customerPhone || '—'}</span></div>
            <div class="field"><span class="label">البريد الإلكتروني</span><span class="value">${repair.customerEmail || '—'}</span></div>
            <div class="field"><span class="label">تاريخ الاستلام</span><span class="value">${dates.primary || '—'}${dates.secondary ? ` — ${dates.secondary}` : ''}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">بيانات الجهاز</div>
          <div class="row">
            <div class="field"><span class="label">نوع الجهاز</span><span class="value">${repair.deviceType || '—'}</span></div>
            <div class="field"><span class="label">الماركة</span><span class="value">${repair.deviceBrand || '—'}</span></div>
            <div class="field"><span class="label">الموديل</span><span class="value">${repair.deviceModel || '—'}</span></div>
            <div class="field"><span class="label">الرقم التسلسلي</span><span class="value">${repair.serialNumber || '—'}</span></div>
          </div>
          <div class="row" style="margin-top: 12px;">
            <div class="field"><span class="label">المعالج (CPU)</span><span class="value">${repair.cpu || '—'}</span></div>
            <div class="field"><span class="label">كرت الشاشة (GPU)</span><span class="value">${repair.gpu || '—'}</span></div>
            <div class="field"><span class="label">الذاكرة (RAM)</span><span class="value">${repair.ram || '—'}</span></div>
            <div class="field"><span class="label">التخزين (Storage)</span><span class="value">${repair.storage || '—'}</span></div>
          </div>
          ${repair.devicePassword ? `<div class="row" style="margin-top: 12px;">
            <div class="field full-width">
              <span class="label">كلمة مرور الجهاز</span>
              <span class="value">${settings.showDevicePassword === true ? repair.devicePassword : 'تم إدخال كلمة سر على النظام (لا تُعرض لأسباب أمنية)'}</span>
            </div>
          </div>` : ''}
        </div>

        <div class="section">
          <div class="section-title">وصف المشكلة</div>
          <div class="problem-box">${(repair.reportedProblem || repair.problemDescription || '—').replace(/\n/g, '<br>')}</div>
        </div>

        ${repair.notes || repair.technicianReport ? `
        <div class="section">
          <div class="section-title">الملاحظات</div>
          <div class="notes-box">${(repair.notes || repair.technicianReport || '').replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">المتعلقات المستلمة من العميل</div>
          ${accessories.length ? `<ul class="accessories">${accessories.map(a => `<li>${a}</li>`).join('')}</ul>` : '<div style="color: #6b7280; font-size: 13px;">لا توجد متعلقات</div>'}
        </div>

        ${settings.terms ? `
        <div class="section">
          <div class="section-title">شروط الاستلام</div>
          <div class="terms-box">${termsRendered.replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-label">توقيع العميل</div>
            <div class="signature-line"></div>
            <div class="signature-date">التاريخ: ${dates.primary || ''}</div>
          </div>
          <div class="signature-box">
            <div class="signature-label">ختم/توقيع الفرع</div>
            <div class="signature-line"></div>
            <div class="signature-date">التاريخ: ${dates.primary || ''}</div>
          </div>
        </div>

        <div class="footer">
          <strong>يرجى الاحتفاظ بهذا الإيصال لمراجعة الطلب</strong><br>
          يمكنك تتبع حالة الجهاز من خلال رمز QR أعلاه
        </div>
        <div class="no-print" style="text-align:center; margin-top:12px;">
          <button onclick="window.print()" style="padding:8px 12px; border:1px solid #e5e7eb; border-radius:6px; background:#111827; color:#fff;">طباعة</button>
        </div>
      </div>

      ${(settings.showSerialBarcode !== false && repair.serialNumber) ? `
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
      <script>
        (function(){
          try {
            var svg = document.getElementById('snBarcode');
            if (svg && window.JsBarcode) {
              JsBarcode(svg, '${repair.serialNumber}', { width: ${settings.barcodeWidth || 1}, height: ${settings.barcodeHeight || 28}, displayValue: false, margin: 0 });
            }
          } catch (e) { console.error(e); }
        })();
      </script>
      ` : ''}
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
  } catch (err) {
    console.error('Error printing receipt:', err);
    res.status(500).send('Server Error');
  }
});

// Print inspection report
router.get('/:id/print/inspection', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const settings = loadPrintSettings();
    const dateMode = (req.query.date || settings.dateDisplay || 'both').toLowerCase();
    const [rows] = await db.execute(`
      SELECT ir.*, it.name as inspectionTypeName,
             rr.id as repairId, rr.createdAt as repairCreatedAt,
             c.name as customerName, c.phone as customerPhone,
             u.name as technicianName,
             d.deviceType, COALESCE(vo.label, d.brand) as deviceBrand, d.model as deviceModel, d.serialNumber
      FROM InspectionReport ir
      LEFT JOIN InspectionType it ON ir.inspectionTypeId = it.id
      LEFT JOIN RepairRequest rr ON ir.repairRequestId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN User u ON ir.technicianId = u.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE ir.repairRequestId = ?
      ORDER BY ir.reportDate DESC LIMIT 1
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).send('لا يوجد تقرير فحص لهذا الطلب');
    }

    const rep = rows[0];
    const [components] = await db.execute(`
      SELECT name, status, notes, priority FROM InspectionComponent WHERE inspectionReportId = ?
    `, [rep.id]);

    const reqDate = new Date(rep.reportDate || rep.repairCreatedAt || Date.now());
    const requestNumber = `REP-${reqDate.getFullYear()}${String(reqDate.getMonth() + 1).padStart(2, '0')}${String(reqDate.getDate()).padStart(2, '0')}-${String(rep.repairId).padStart(3, '0')}`;
    const dates = formatDates(reqDate, dateMode);
    const trackUrl = `${req.protocol}://${req.get('host')}/api/repairs/track/${rep.qrCode || ''}`;

    const html = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>تقرير الفحص - ${requestNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700&family=Cairo:wght@400;600&display=swap" rel="stylesheet" />
      <style>
        body { font-family: 'Tajawal','Cairo', Arial, sans-serif; direction: rtl; color:#111827; font-size: ${settings.compactMode ? '12px' : '14px'}; }
        .container { max-width: 760px; margin: 0 auto; padding: 16px; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; }
        .title { font-size: 18px; font-weight: bold; display:flex; align-items:center; gap:8px; }
        .muted { color:#6b7280; font-size:12px; }
        .section { border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin:12px 0; }
        .row { display:flex; gap:16px; flex-wrap:wrap; }
        .col { flex:1 1 240px; }
        .label { font-size:12px; color:#6b7280; }
        .value { font-size:14px; font-weight:600; }
        table { width:100%; border-collapse: collapse; }
        th, td { border:1px solid #e5e7eb; padding:8px; font-size:12px; }
        th { background:#f9fafb; text-align:right; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <div class="title">
              ${settings.showLogo && settings.logoUrl ? `<img src="${settings.logoUrl}" alt="logo" style="height:28px;"/>` : ''}
              <span>تقرير الفحص</span>
            </div>
            ${(settings.branchName || settings.branchAddress || settings.branchPhone) ? `<div class="muted">${[settings.branchName, settings.branchAddress, settings.branchPhone].filter(Boolean).join(' — ')}</div>` : ''}
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="muted">${requestNumber}</div>
            ${settings.showQr !== false ? `<canvas id="qrCanvas" width="80" height="80" style="border:1px solid #e5e7eb; border-radius:6px;"></canvas>` : ''}
          </div>
        </div>

        <div class="section">
          <div class="row">
            <div class="col"><div class="label">العميل</div><div class="value">${rep.customerName || '—'}</div></div>
            <div class="col"><div class="label">الهاتف</div><div class="value">${rep.customerPhone || '—'}</div></div>
            <div class="col"><div class="label">التاريخ</div><div class="value">${dates.primary || '—'}${dates.secondary ? ` — ${dates.secondary}` : ''}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="row">
            <div class="col"><div class="label">نوع الجهاز</div><div class="value">${rep.deviceType || '—'}</div></div>
            <div class="col"><div class="label">الماركة</div><div class="value">${rep.deviceBrand || '—'}</div></div>
            <div class="col"><div class="label">الموديل</div><div class="value">${rep.deviceModel || '—'}</div></div>
            <div class="col"><div class="label">S/N</div><div class="value">${rep.serialNumber || '—'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="row">
            <div class="col"><div class="label">نوع الفحص</div><div class="value">${rep.inspectionTypeName || '—'}</div></div>
            <div class="col"><div class="label">الفني المسؤول</div><div class="value">${rep.technicianName || '—'}</div></div>
            <div class="col"><div class="label">تاريخ التقرير</div><div class="value">${new Date(rep.reportDate).toLocaleDateString('ar-SA') || '—'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="label">ملخص الفحص</div>
          <div class="value" style="white-space:pre-wrap">${rep.summary || '—'}</div>
        </div>

        <div class="section">
          <div class="label">النتيجة والتشخيص</div>
          <div class="value" style="white-space:pre-wrap">${rep.result || '—'}</div>
        </div>

        <div class="section">
          <div class="label">التوصيات</div>
          <div class="value" style="white-space:pre-wrap">${rep.recommendations || '—'}</div>
        </div>

        <div class="section">
          <div class="label">ملاحظات إضافية</div>
          <div class="value" style="white-space:pre-wrap">${rep.notes || '—'}</div>
        </div>

        <div class="section">
          <div class="label">تفاصيل المكونات</div>
          ${components && components.length ? `
          <table>
            <thead>
              <tr><th>المكون</th><th>الحالة</th><th>الأولوية</th><th>ملاحظات</th></tr>
            </thead>
            <tbody>
            ${components.map(c => `<tr><td>${c.name || ''}</td><td>${c.status || ''}</td><td>${c.priority || ''}</td><td>${c.notes || ''}</td></tr>`).join('')}
            </tbody>
          </table>
          ` : '<div class="muted">لا توجد تفاصيل</div>'}
        </div>



      </div>
      ${settings.showQr !== false ? `
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
      <script>
        (function(){
          try { var canvas = document.getElementById('qrCanvas'); if (canvas && window.QRCode) { QRCode.toCanvas(canvas, '${trackUrl}', { width: 80, margin: 1 }, function (error) { if (error) console.error(error); }); } } catch (e) { console.error(e); }
        })();
      </script>
      ` : ''}
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
  } catch (err) {
    console.error('Error printing inspection:', err);
    res.status(500).send('Server Error');
  }
});

// Print invoice for a repair request
router.get('/:id/print/invoice', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const settings = loadPrintSettings();
    const [repairRows] = await db.execute(`
      SELECT rr.*, 
             c.name AS customerName, c.phone AS customerPhone, c.email AS customerEmail,
             c.address AS customerAddress, 
             b.name AS branchName, b.address AS branchAddress, b.phone AS branchPhone, 
             u.name AS technicianName,
             d.deviceType, COALESCE(vo.label, d.brand) AS deviceBrand, d.model AS deviceModel
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Branch b ON rr.branchId = b.id
      LEFT JOIN User u ON rr.technicianId = u.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE rr.id = ? AND rr.deletedAt IS NULL
    `, [id]);

    if (!repairRows || repairRows.length === 0) {
      return res.status(404).send('طلب الإصلاح غير موجود');
    }

    const repair = repairRows[0];

    // جلب عناصر الفاتورة متوافقة مع المخطط الحالي
    // InvoiceItem يحتوي على inventoryItemId (للقطع) و serviceId (للخدمات)
    const [invoiceItems] = await db.execute(`
      SELECT 
        ii.*,
        CASE 
          WHEN ii.itemType = 'part' THEN invItem.name
          WHEN ii.itemType = 'service' THEN s.name
          ELSE ii.description
        END AS itemName,
        CASE 
          WHEN ii.itemType = 'part' THEN invItem.sku
          ELSE NULL
        END AS sku
      FROM InvoiceItem ii
      LEFT JOIN Invoice inv ON ii.invoiceId = inv.id
      LEFT JOIN InventoryItem invItem ON ii.inventoryItemId = invItem.id AND ii.itemType = 'part'
      LEFT JOIN Service s ON ii.serviceId = s.id AND ii.itemType = 'service'
      WHERE inv.repairRequestId = ?
    `, [id]);

    // حساب الإجماليات
    let subtotal = 0;
    invoiceItems.forEach(item => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      subtotal += qty * price;
    });
    const taxRate = 0.15; // 15% ضريبة
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // ترجمة حالة الطلب (سيرفر سايد)
    const statusTextMap = {
      'RECEIVED': 'تم الاستلام',
      'INSPECTION': 'قيد الفحص',
      'UNDER_REPAIR': 'قيد الإصلاح',
      'READY_FOR_DELIVERY': 'جاهز للتسليم',
      'DELIVERED': 'تم التسليم',
      'REJECTED': 'مرفوض',
      'WAITING_PARTS': 'في انتظار القطع'
    };
    const statusText = statusTextMap[repair.status] || repair.status;

    // حساب requestNumber بنفس طريقة print receipt
    const reqDate = new Date(repair.createdAt);
    const requestNumber = repair.requestNumber || `REP-${reqDate.getFullYear()}${String(reqDate.getMonth() + 1).padStart(2, '0')}${String(reqDate.getDate()).padStart(2, '0')}-${String(repair.id).padStart(3, '0')}`;

    // إنشاء رابط التتبع للفاتورة
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const trackUrl = `${frontendUrl}/track/${repair.trackingToken || repair.id}`;

    const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة - ${requestNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700&family=Cairo:wght@400;600&display=swap" rel="stylesheet" />
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { 
          font-family: 'Tajawal','Cairo', 'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; 
          font-size:14px; 
          line-height:1.6; 
          color:#1f2937; 
          background:#fff; 
        }
        .container { 
          max-width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 20mm;
          background: #fff;
        }
        .header { 
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #3b82f6;
        }
        .header-left {
          flex: 1;
        }
        .logo { 
          font-size:28px; 
          font-weight:700; 
          color:#3b82f6; 
          margin-bottom:10px; 
        }
        .company-info { 
          font-size:13px; 
          color:#6b7280;
          line-height: 1.8;
        }
        .header-right {
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 15px;
        }
        .invoice-number-box {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #fff;
          padding: 15px 25px;
          border-radius: 10px;
          text-align: center;
        }
        .invoice-number-label {
          font-size: 11px;
          opacity: 0.9;
          margin-bottom: 5px;
        }
        .invoice-number-value {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .qr-code-container {
          text-align: center;
        }
        .qr-code-label {
          font-size: 10px;
          color: #6b7280;
          margin-top: 6px;
        }
        .invoice-info { 
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
          margin-bottom: 25px;
        }
        .invoice-details, .customer-details { 
          background: #f9fafb;
          padding: 18px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .section-title { 
          font-size: 16px;
          font-weight:700; 
          color:#111827; 
          margin-bottom:12px; 
          padding-bottom:8px;
          border-bottom: 2px solid #3b82f6;
        }
        .info-row { 
          margin-bottom:10px;
          display: flex;
          justify-content: space-between;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .label { 
          font-weight:600; 
          color:#6b7280;
          font-size: 12px;
        }
        .value {
          font-weight: 600;
          color: #111827;
          font-size: 13px;
        }
        .table { 
          width:100%; 
          border-collapse:collapse; 
          margin:25px 0;
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .table th, .table td { 
          padding:14px 12px; 
          text-align:right; 
          border-bottom:1px solid #e5e7eb;
        }
        .table th { 
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #fff;
          font-weight:600;
          font-size: 13px;
        }
        .table tbody tr:hover {
          background: #f9fafb;
        }
        .table .number { 
          text-align:center; 
          font-family:monospace;
          font-weight: 600;
        }
        .totals { 
          margin-top:25px;
          display: flex;
          justify-content: flex-end;
        }
        .totals-table { 
          width:350px;
          border-collapse: collapse;
        }
        .totals-table td { 
          padding:12px 18px;
          border-bottom: 1px solid #e5e7eb;
        }
        .totals-table td:first-child {
          text-align: right;
          color: #6b7280;
          font-weight: 600;
        }
        .totals-table td:last-child {
          text-align: left;
          font-weight: 600;
          color: #111827;
        }
        .total-row { 
          font-weight:700; 
          font-size:18px; 
          border-top:3px solid #3b82f6;
          background: #f9fafb;
        }
        .total-row td {
          color: #111827;
          font-size: 18px;
        }
        .footer { 
          text-align:center; 
          margin-top:40px; 
          padding-top:20px;
          border-top:1px solid #e5e7eb; 
          font-size:12px; 
          color:#6b7280;
          line-height: 1.8;
        }
        @media print { 
          .no-print { display:none; }
          body { margin: 0; }
          .container { padding: 15mm; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-left">
            <div class="logo">${settings.companyName || 'FixZone'}</div>
            <div class="company-info">
              ${settings.address || 'العنوان غير محدد'}<br>
              ${settings.phone ? `هاتف: ${settings.phone}` : ''} ${settings.email ? `| بريد إلكتروني: ${settings.email}` : ''}
            </div>
          </div>
          <div class="header-right">
            <div class="invoice-number-box">
              <div class="invoice-number-label">رقم الفاتورة</div>
              <div class="invoice-number-value">INV-${requestNumber}</div>
            </div>
            ${settings.showQr !== false ? `
            <div class="qr-code-container">
              <canvas id="qrCanvas" width="100" height="100" style="border:1px solid #e5e7eb; border-radius:8px; padding:4px;"></canvas>
              <div class="qr-code-label">تتبع حالة الجهاز</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="invoice-info">
          <div class="invoice-details">
            <div class="section-title">تفاصيل الفاتورة</div>
            <div class="info-row"><span class="label">رقم طلب الإصلاح:</span><span class="value">${requestNumber}</span></div>
            <div class="info-row"><span class="label">تاريخ الإصدار:</span><span class="value">${new Date().toLocaleDateString('ar-SA')}</span></div>
            <div class="info-row"><span class="label">حالة الطلب:</span><span class="value">${statusText}</span></div>
          </div>
          <div class="customer-details">
            <div class="section-title">بيانات العميل</div>
            <div class="info-row"><span class="label">الاسم:</span><span class="value">${repair.customerName || 'غير محدد'}</span></div>
            <div class="info-row"><span class="label">الهاتف:</span><span class="value">${repair.customerPhone || 'غير محدد'}</span></div>
            ${repair.customerEmail ? `<div class="info-row"><span class="label">البريد:</span><span class="value">${repair.customerEmail}</span></div>` : ''}
            ${repair.customerAddress ? `<div class="info-row"><span class="label">العنوان:</span><span class="value">${repair.customerAddress}</span></div>` : ''}
          </div>
        </div>

        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
          <div class="section-title" style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">تفاصيل الجهاز</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
            <div><span class="label">نوع الجهاز:</span> <strong>${repair.deviceType || 'غير محدد'}</strong></div>
            <div><span class="label">الماركة:</span> <strong>${repair.deviceBrand || 'غير محدد'}</strong></div>
            <div><span class="label">الموديل:</span> <strong>${repair.deviceModel || 'غير محدد'}</strong></div>
          </div>
        </div>

        <div class="section-title" style="margin-top: 10px;">التكاليف والخدمات</div>
        <table class="table">
          <thead>
            <tr>
              <th>الوصف</th>
              <th class="number">الكمية</th>
              <th class="number">سعر الوحدة</th>
              <th class="number">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceItems.map(item => `
              <tr>
                <td>${item.itemName || item.serviceName || item.description || 'عنصر غير محدد'}</td>
                <td class="number">${Number(item.quantity) || 1}</td>
                <td class="number">${(Number(item.unitPrice) || 0).toFixed(2)} جنيه</td>
                <td class="number">${(((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0))).toFixed(2)} جنيه</td>
              </tr>
            `).join('')}
            ${invoiceItems.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:#6b7280;">لا توجد عناصر في الفاتورة</td></tr>' : ''}
          </tbody>
        </table>

        <div class="totals">
          <table class="totals-table">
            <tr>
              <td>المجموع الفرعي:</td>
              <td class="number">${subtotal.toFixed(2)} جنيه</td>
            </tr>
            <tr>
              <td>الضريبة (15%):</td>
              <td class="number">${taxAmount.toFixed(2)} جنيه</td>
            </tr>
            <tr class="total-row">
              <td>الإجمالي:</td>
              <td class="number">${total.toFixed(2)} جنيه</td>
            </tr>
          </table>
        </div>

        ${repair.problemDescription ? `
          <div style="margin-top:20px;">
            <div class="section-title">وصف المشكلة</div>
            <div style="background:#f9fafb; padding:12px; border-radius:6px; margin-top:8px;">
              ${repair.problemDescription}
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <strong>شكراً لثقتكم بنا | ${settings.companyName || 'FixZone'}</strong><br>
          هذه فاتورة رسمية صادرة بتاريخ ${new Date().toLocaleDateString('ar-SA')}<br>
          يمكنك تتبع حالة الجهاز من خلال رمز QR أعلاه
        </div>

        <div class="no-print" style="text-align:center; margin-top:30px;">
          <button onclick="window.print()" style="padding:12px 30px; border:none; border-radius:8px; background:linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color:#fff; cursor:pointer; font-size:14px; font-weight:600; box-shadow: 0 2px 8px rgba(59,130,246,0.3);">🖨️ طباعة الفاتورة</button>
        </div>
      </div>
      ${settings.showQr !== false ? `
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
      <script>
        (function(){
          try {
            var canvas = document.getElementById('qrCanvas');
            if (canvas && window.QRCode) {
              QRCode.toCanvas(canvas, '${trackUrl}', { 
                width: 100, 
                margin: 2,
                color: {
                  dark: '#111827',
                  light: '#ffffff'
                }
              }, function (error) { 
                if (error) console.error(error); 
              });
            }
          } catch (e) { console.error(e); }
        })();
      </script>
      ` : ''}
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
  } catch (err) {
    console.error('Error printing invoice:', err);
    console.error('Error stack:', err.stack);
    res.status(500).send(`<html dir="rtl"><body><h1>خطأ في الخادم</h1><p>${err.message || 'حدث خطأ أثناء الطباعة'}</p></body></html>`);
  }
});

// Print delivery form
router.get('/:id/print/delivery', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const settings = loadPrintSettings();
    const dateMode = (req.query.date || settings.dateDisplay || 'both').toLowerCase();
    const [rows] = await db.execute(`
      SELECT rr.*, c.name as customerName, c.phone as customerPhone,
             d.deviceType, COALESCE(vo.label, d.brand) as deviceBrand, d.model as deviceModel, d.serialNumber
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE rr.id = ? AND rr.deletedAt IS NULL
    `, [id]);
    if (!rows || rows.length === 0) return res.status(404).send('طلب غير موجود');
    const r = rows[0];
    const reqDate = new Date(r.updatedAt || r.createdAt);
    const dates = formatDates(reqDate, dateMode);
    const requestNumber = `REP-${reqDate.getFullYear()}${String(reqDate.getMonth() + 1).padStart(2, '0')}${String(reqDate.getDate()).padStart(2, '0')}-${String(r.id).padStart(3, '0')}`;

    const html = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>نموذج تسليم الجهاز - ${requestNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700&family=Cairo:wght@400;600&display=swap" rel="stylesheet" />
      <style>
        body { font-family: 'Tajawal','Cairo', Arial, sans-serif; direction: rtl; color:#111827; font-size: ${settings.compactMode ? '12px' : '14px'}; }
        .container { max-width: 760px; margin: 0 auto; padding: 16px; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; }
        .title { font-size: 18px; font-weight: bold; display:flex; align-items:center; gap:8px; }
        .muted { color:#6b7280; font-size:12px; }
        .section { border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin:12px 0; }
        .row { display:flex; gap:16px; flex-wrap:wrap; }
        .col { flex:1 1 240px; }
        .label { font-size:12px; color:#6b7280; }
        .value { font-size:14px; font-weight:600; }
        .signature { height: 90px; border: 1px dashed #9ca3af; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <div class="title">
              ${settings.showLogo && settings.logoUrl ? `<img src="${settings.logoUrl}" alt="logo" style="height:28px;"/>` : ''}
              <span>نموذج تسليم الجهاز</span>
            </div>
            ${(settings.branchName || settings.branchAddress || settings.branchPhone) ? `<div class="muted">${[settings.branchName, settings.branchAddress, settings.branchPhone].filter(Boolean).join(' — ')}</div>` : ''}
          </div>
          <div class="muted">${requestNumber}</div>
        </div>

        <div class="section">
          <div class="row">
            <div class="col"><div class="label">العميل</div><div class="value">${r.customerName || '—'}</div></div>
            <div class="col"><div class="label">الهاتف</div><div class="value">${r.customerPhone || '—'}</div></div>
            <div class="col"><div class="label">التاريخ</div><div class="value">${dates.primary || '—'}${dates.secondary ? ` — ${dates.secondary}` : ''}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="row">
            <div class="col"><div class="label">نوع الجهاز</div><div class="value">${r.deviceType || '—'}</div></div>
            <div class="col"><div class="label">الماركة</div><div class="value">${r.deviceBrand || '—'}</div></div>
            <div class="col"><div class="label">الموديل</div><div class="value">${r.deviceModel || '—'}</div></div>
            <div class="col"><div class="label">S/N</div><div class="value">${r.serialNumber || '—'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="label">إقرار الاستلام</div>
          <div class="value" style="white-space:pre-wrap">${settings.deliveryAcknowledgement || 'أقر أنا العميل باستلام الجهاز بحالة سليمة بعد الإصلاح وأتعهد بمراجعة الجهاز خلال 48 ساعة من الاستلام.'}</div>
          <div class="row" style="margin-top: 8px; align-items:center;">
            <div class="col">
              <div class="label">توقيع العميل</div>
              <div class="signature"></div>
            </div>
            <div class="col">
              <div class="label">ختم/توقيع الفرع</div>
              <div class="signature"></div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
  } catch (err) {
    console.error('Error printing delivery:', err);
    res.status(500).send('Server Error');
  }
});

// Print sticker with basic laptop details
router.get('/:id/print/sticker', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const settings = loadPrintSettings();
    const [rows] = await db.execute(`
      SELECT 
        rr.*,
        c.name as customerName,
        c.phone as customerPhone,
        d.deviceType,
        COALESCE(vo.label, d.brand) as deviceBrand,
        d.model as deviceModel,
        d.serialNumber,
        d.cpu, d.ram, d.storage
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE rr.id = ? AND rr.deletedAt IS NULL
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).send('Repair request not found');
    }

    const repair = rows[0];
    const reqDate = new Date(repair.createdAt);
    const requestNumber = `REP-${reqDate.getFullYear()}${String(reqDate.getMonth() + 1).padStart(2, '0')}${String(reqDate.getDate()).padStart(2, '0')}-${String(repair.id).padStart(3, '0')}`;
    const dates = formatDates(reqDate, 'both');

    const problem = repair.reportedProblem || repair.problemDescription || '—';
    const html = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>استيكر - ${requestNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700&family=Cairo:wght@400;600&display=swap" rel="stylesheet" />
      <style>
        @page { 
          size: 40mm 58mm; 
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body { 
          font-family: 'Tajawal','Cairo', Arial, sans-serif; 
          direction: rtl; 
          color: #111827; 
          font-size: 8px;
          margin: 0;
          padding: 0;
          width: 40mm;
          height: 58mm;
        }
        .sticker-container {
          width: 40mm;
          height: 58mm;
          border: 2px solid #111827;
          padding: 3mm;
          display: flex;
          flex-direction: column;
          background: #fff;
        }
        .header {
          border-bottom: 1.5px solid #111827;
          padding-bottom: 2mm;
          margin-bottom: 2mm;
        }
        .request-number {
          font-size: 9px;
          font-weight: 700;
          color: #111827;
          text-align: center;
          letter-spacing: 0.5px;
        }
        .company-name {
          font-size: 7px;
          color: #6b7280;
          text-align: center;
          margin-bottom: 1mm;
        }
        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2mm;
          font-size: 7px;
        }
        .row {
          display: flex;
          gap: 1.5mm;
          align-items: flex-start;
        }
        .label {
          color: #6b7280;
          font-size: 6.5px;
          font-weight: 600;
          min-width: 18mm;
          flex-shrink: 0;
        }
        .value {
          font-weight: 600;
          font-size: 7px;
          color: #111827;
          flex: 1;
          word-break: break-word;
        }
        .problem-row {
          margin-top: auto;
          padding-top: 2mm;
          border-top: 1px solid #e5e7eb;
        }
        .problem-label {
          font-size: 6.5px;
          color: #6b7280;
          font-weight: 700;
          margin-bottom: 1mm;
        }
        .problem-value {
          font-size: 6.5px;
          color: #111827;
          line-height: 1.4;
          max-height: 12mm;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
        }
        @media print { 
          .no-print { display: none; }
          body { margin: 0; padding: 5mm; }
        }
      </style>
    </head>
    <body>
      <div class="sticker-container">
        <div class="header">
          <div class="company-name">${settings.companyName || settings.branchName || 'FixZone'}</div>
          <div class="request-number">${requestNumber}</div>
        </div>
        <div class="content">
          <div class="row">
            <span class="label">العميل:</span>
            <span class="value">${repair.customerName || '—'}</span>
          </div>
          <div class="row">
            <span class="label">رقم الموبايل:</span>
            <span class="value">${repair.customerPhone || '—'}</span>
          </div>
          <div class="row">
            <span class="label">أمر الشغل:</span>
            <span class="value">${requestNumber}</span>
          </div>
          <div class="row">
            <span class="label">المعالج:</span>
            <span class="value">${repair.cpu || '—'}</span>
          </div>
          <div class="row">
            <span class="label">الذاكرة (RAM):</span>
            <span class="value">${repair.ram || '—'}</span>
          </div>
          <div class="row">
            <span class="label">التخزين (HARD):</span>
            <span class="value">${repair.storage || '—'}</span>
          </div>
          <div class="problem-row">
            <div class="problem-label">المشكلة:</div>
            <div class="problem-value">${problem}</div>
          </div>
        </div>
        <div class="no-print" style="text-align:center; margin-top:2mm; padding-top:2mm; border-top:1px solid #e5e7eb;">
          <button onclick="window.print()" style="padding:2px 4px; font-size:6px; border:1px solid #111827; border-radius:3px; background:#111827; color:#fff; cursor:pointer;">طباعة</button>
        </div>
      </div>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
  } catch (err) {
    console.error('Error printing sticker:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
