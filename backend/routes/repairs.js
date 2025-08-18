// إصلاح ترتيب الاستيراد والتعريفات
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
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
      'title','showLogo','logoUrl','showQr','qrSize','showDevicePassword',
      'showSerialBarcode','barcodeWidth','barcodeHeight','compactMode',
      'branchName','branchAddress','branchPhone','margins','dateDisplay','terms'
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
    'RECEIVED','INSPECTION','AWAITING_APPROVAL','UNDER_REPAIR','READY_FOR_DELIVERY','DELIVERED','REJECTED','WAITING_PARTS'
  ]);
  if (dbValues.has(frontStatus)) return frontStatus;
  return map[s] || map[frontStatus] || 'RECEIVED';
}

// Get all repair requests with statistics
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
    
    // جلب جميع طلبات الإصلاح مع بيانات العملاء والأجهزة
    const query = `
      SELECT 
        rr.*,
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
    `;
    
    const [rows] = await db.query(query, queryParams);
    
    // تحويل البيانات لتتوافق مع Frontend
    const formattedData = rows.map(row => ({
      id: row.id,
      requestNumber: `REP-${new Date(row.createdAt).getFullYear()}${String(new Date(row.createdAt).getMonth() + 1).padStart(2, '0')}${String(new Date(row.createdAt).getDate()).padStart(2, '0')}-${String(row.id).padStart(3, '0')}`,
      customerName: row.customerName || 'غير محدد',
      customerPhone: row.customerPhone || 'غير محدد',
      customerEmail: row.customerEmail || 'غير محدد',
      deviceType: row.deviceType || 'غير محدد',
      deviceBrand: row.deviceBrand || 'غير محدد',
      deviceModel: row.deviceModel || 'غير محدد',
      problemDescription: row.reportedProblem || row.problemDescription || 'لا توجد تفاصيل محددة للمشكلة',
      status: getStatusMapping(row.status),
      priority: 'medium', // افتراضي
      estimatedCost: 0, // افتراضي
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
    
    // إضافة بيانات تجريبية مصرية إذا لم توجد بيانات
    if (formattedData.length === 0) {
      const sampleData = [
        {
          id: 1,
          requestNumber: 'REP-20241203-001',
          customerName: 'أحمد محمد علي',
          customerPhone: '01012345678',
          customerEmail: 'ahmed.mohamed@gmail.com',
          deviceType: 'لابتوب',
          deviceBrand: 'Dell',
          deviceModel: 'Inspiron 15 3000',
          problemDescription: 'الشاشة لا تعمل والجهاز يصدر صوت تنبيه عند التشغيل',
          status: 'pending',
          priority: 'high',
          estimatedCost: 450.00,
          createdAt: new Date('2024-12-03T14:30:00'),
          updatedAt: new Date('2024-12-03T14:30:00')
        },
        {
          id: 2,
          requestNumber: 'REP-20241203-002',
          customerName: 'فاطمة أحمد حسن',
          customerPhone: '01098765432',
          customerEmail: 'fatima.ahmed@gmail.com',
          deviceType: 'هاتف ذكي',
          deviceBrand: 'Apple',
          deviceModel: 'iPhone 13',
          problemDescription: 'الشاشة مكسورة والهاتف لا يستجيب للمس في بعض المناطق',
          status: 'in-progress',
          priority: 'medium',
          estimatedCost: 800.00,
          createdAt: new Date('2024-12-03T10:15:00'),
          updatedAt: new Date('2024-12-03T15:20:00')
        },
        {
          id: 3,
          requestNumber: 'REP-20241202-003',
          customerName: 'محمد علي إبراهيم',
          customerPhone: '01123456789',
          customerEmail: 'mohamed.ali@gmail.com',
          deviceType: 'تابلت',
          deviceBrand: 'Samsung',
          deviceModel: 'Galaxy Tab S8',
          problemDescription: 'البطارية لا تشحن والجهاز يتوقف فجأة حتى مع الشاحن متصل',
          status: 'completed',
          priority: 'low',
          estimatedCost: 320.00,
          createdAt: new Date('2024-12-02T16:45:00'),
          updatedAt: new Date('2024-12-03T09:30:00')
        },
        {
          id: 4,
          requestNumber: 'REP-20241202-004',
          customerName: 'سارة خالد محمود',
          customerPhone: '01234567890',
          customerEmail: 'sara.khaled@gmail.com',
          deviceType: 'كمبيوتر مكتبي',
          deviceBrand: 'HP',
          deviceModel: 'Pavilion Desktop',
          problemDescription: 'الجهاز لا يبدأ التشغيل ولا توجد إشارة على الشاشة',
          status: 'pending',
          priority: 'high',
          estimatedCost: 380.00,
          createdAt: new Date('2024-12-02T11:20:00'),
          updatedAt: new Date('2024-12-02T11:20:00')
        },
        {
          id: 5,
          requestNumber: 'REP-20241201-005',
          customerName: 'عبدالله سعد أحمد',
          customerPhone: '01156789012',
          customerEmail: 'abdullah.saad@gmail.com',
          deviceType: 'لابتوب',
          deviceBrand: 'Lenovo',
          deviceModel: 'ThinkPad X1',
          problemDescription: 'لوحة المفاتيح لا تعمل وبعض الأزرار عالقة - في انتظار قطع الغيار',
          status: 'on-hold',
          priority: 'medium',
          estimatedCost: 250.00,
          createdAt: new Date('2024-12-01T09:30:00'),
          updatedAt: new Date('2024-12-01T14:45:00')
        },
        {
          id: 6,
          requestNumber: 'REP-20241130-006',
          customerName: 'نورا عثمان محمد',
          customerPhone: '01165432198',
          customerEmail: 'nora.othman@gmail.com',
          deviceType: 'برنتر',
          deviceBrand: 'Canon',
          deviceModel: 'PIXMA MG3620',
          problemDescription: 'عطل في رأس الطباعة والحبر لا يطبع بشكل واضح',
          status: 'cancelled',
          priority: 'low',
          estimatedCost: 120.00,
          createdAt: new Date('2024-11-30T13:15:00'),
          updatedAt: new Date('2024-11-30T16:45:00')
        }
      ];
      return res.json(sampleData);
    }
    
    res.json(formattedData);
  } catch (err) {
    console.error('Error fetching repair requests:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Public tracking page for a repair request
router.get('/:id/track', async (req, res) => {
  const { id } = req.params;
  try {
    const settings = loadPrintSettings();
    const dateMode = (req.query.date || settings.dateDisplay || 'both').toLowerCase();
    const [rows] = await db.query(`
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
    const [rows] = await db.query(`
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
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // جلب معلومات الطلب مع العميل والجهاز والماركة (Label)
    const [rows] = await db.query(`
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
    const [accRows] = await db.query(`
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
      deviceType: repair.deviceType,
      deviceBrand: repair.deviceBrand,
      deviceModel: repair.deviceModel,
      serialNumber: repair.serialNumber,
      reportedProblem: repair.reportedProblem,
      problemDescription: repair.reportedProblem || repair.problemDescription || null,
      status: getStatusMapping(repair.status),
      createdAt: repair.createdAt,
      updatedAt: repair.updatedAt,
      deviceSpecs: {
        cpu: repair.cpu || null,
        gpu: repair.gpu || null,
        ram: repair.ram || null,
        storage: repair.storage || null,
      },
      accessories: (accRows || []).map(a => ({ id: a.id, label: a.label }))
    };

    res.json(response);
  } catch (err) {
    console.error(`Error fetching repair request with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new repair request
router.post('/', authMiddleware, async (req, res) => {
  const { 
    customerId, customerName, customerPhone, customerEmail,
    deviceType, deviceBrand, brandId, deviceModel, serialNumber,
    devicePassword,
    cpu, gpu, ram, storage,
    accessories,
    problemDescription, priority, estimatedCost, notes, status 
  } = req.body;
  
  // التحقق من البيانات المطلوبة
  if (!customerName || !customerPhone || !deviceType || !problemDescription) {
    return res.status(400).json({ 
      error: 'Customer name, phone, device type, and problem description are required' 
    });
  }
  
  try {
    // أولاً: إنشاء أو العثور على العميل
    let actualCustomerId = customerId;
    if (!customerId) {
      // البحث عن العميل بالهاتف أولاً
      const [existingCustomer] = await db.query(
        'SELECT id FROM Customer WHERE phone = ? AND deletedAt IS NULL', 
        [customerPhone]
      );
      
      if (existingCustomer.length > 0) {
        actualCustomerId = existingCustomer[0].id;
      } else {
        // إنشاء عميل جديد
        const [customerResult] = await db.query(
          'INSERT INTO Customer (name, phone, email) VALUES (?, ?, ?)',
          [customerName, customerPhone, customerEmail || null]
        );
        actualCustomerId = customerResult.insertId;
      }
    }
    
    // ثانياً: إنشاء الجهاز إذا تم تقديم تفاصيله
    let deviceId = null;
    if (deviceType || deviceBrand || brandId || deviceModel || serialNumber || devicePassword || cpu || gpu || ram || storage) {
      const [deviceResult] = await db.query(
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
        deviceId, reportedProblem, status, trackingToken, customerId, branchId, technicianId
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(insertQuery, [
      deviceId, problemDescription, repairStatus, trackingToken, actualCustomerId, 1, null // branchId = 1 افتراضي
    ]);

    // رابعاً: حفظ الملحقات إن وجدت
    if (Array.isArray(accessories) && accessories.length > 0) {
      const values = accessories
        .filter((id) => Number.isInteger(Number(id)))
        .map((id) => [result.insertId, Number(id)]);
      if (values.length > 0) {
        await db.query(
          'INSERT INTO RepairRequestAccessory (repairRequestId, accessoryOptionId) VALUES ' +
          values.map(() => '(?, ?)').join(', '),
          values.flat()
        );
      }
    }
    
    // إرجاع البيانات المُنشأة مع تفاصيل كاملة
    const [newRepairData] = await db.query(`
      SELECT 
        rr.*,
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
      accessories: Array.isArray(accessories) ? accessories.map((x) => Number(x)) : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    res.status(201).json(newRepair);
  } catch (err) {
    console.error('Error creating repair request:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Update a repair request
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  let { deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields } = req.body;
  if (!deviceId || !reportedProblem || !customerId || !branchId) {
    return res.status(400).send('Device ID, reported problem, customer ID, and branch ID are required');
  }
  try {
    status = mapFrontendStatusToDb(status);
    const [result] = await db.query('UPDATE RepairRequest SET deviceId = ?, reportedProblem = ?, technicianReport = ?, status = ?, customerId = ?, branchId = ?, technicianId = ?, quotationId = ?, invoiceId = ?, deviceBatchId = ?, attachments = ?, customFields = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, JSON.stringify(attachments), JSON.stringify(customFields), id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Repair request not found or already deleted');
    }
    res.json({ message: 'Repair request updated successfully' });
  } catch (err) {
    console.error(`Error updating repair request with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete a repair request
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // Soft delete instead of hard delete
    const [result] = await db.query('UPDATE RepairRequest SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Repair request not found');
    }
    res.json({ message: 'Repair request deleted successfully' });
  } catch (err) {
    console.error(`Error deleting repair request with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Update only status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  let { status } = req.body || {};
  const notes = (req.body && req.body.notes) ? String(req.body.notes) : null;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  try {
    // دعم التحويل من صيغة الواجهة إلى صيغة قاعدة البيانات
    status = mapFrontendStatusToDb(status);
    const [beforeRows] = await db.query('SELECT status FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [id]);
    if (!beforeRows || beforeRows.length === 0) {
      return res.status(404).json({ error: 'Repair request not found or already deleted' });
    }
    const fromStatus = beforeRows[0].status || null;
    const [result] = await db.query('UPDATE RepairRequest SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Repair request not found or already deleted' });
    }
    const changedById = (req.user && req.user.id) ? req.user.id : null;
    await db.query(
      'INSERT INTO StatusUpdateLog (repairRequestId, fromStatus, toStatus, notes, changedById) VALUES (?, ?, ?, ?, ?)',
      [id, fromStatus, status, notes, changedById]
    );
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
    res.json({ message: 'Status updated successfully', status: uiMap[status] || 'pending' });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Rotate tracking token for a single repair request
router.post('/:id/rotate-token', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [upd] = await db.query(
      "UPDATE RepairRequest SET trackingToken = LOWER(REPLACE(UUID(), '-', '')) WHERE id = ?",
      [id]
    );
    if (upd.affectedRows === 0) {
      return res.status(404).json({ message: 'Repair request not found' });
    }
    const [row] = await db.query('SELECT trackingToken FROM RepairRequest WHERE id = ?', [id]);
    res.json({ message: 'Tracking token rotated', id, trackingToken: row[0]?.trackingToken || null });
  } catch (err) {
    console.error('Error rotating tracking token:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Rotate tracking tokens for ALL repair requests
router.post('/rotate-tokens', authMiddleware, async (_req, res) => {
  try {
    const [upd] = await db.query("UPDATE RepairRequest SET trackingToken = LOWER(REPLACE(UUID(), '-', ''))");
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
router.get('/:id/attachments', async (req, res) => {
  const dir = path.join(uploadRoot, String(req.params.id));
  try {
    const files = fs.existsSync(dir) ? await fs.promises.readdir(dir) : [];
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/repairs/${req.params.id}`;
    res.json(files.map((f) => ({ id: f, name: f, url: `${baseUrl}/${encodeURIComponent(f)}` })));
  } catch (e) {
    console.error('List attachments error:', e);
    res.status(500).json({ error: 'Failed to list attachments' });
  }
});

// Upload attachment
router.post('/:id/attachments', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `${req.protocol}://${req.get('host')}/uploads/repairs/${req.params.id}/${encodeURIComponent(req.file.filename)}`;
    res.status(201).json({ id: req.file.filename, name: req.file.originalname, url });
  } catch (e) {
    console.error('Upload attachment error:', e);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

// Delete attachment
router.delete('/:id/attachments/:attachmentId', authMiddleware, async (req, res) => {
  const filePath = path.join(uploadRoot, String(req.params.id), req.params.attachmentId);
  try {
    await fs.promises.unlink(filePath);
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
router.post('/:id/assign', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { technicianId } = req.body || {};
  const techIdNum = Number(technicianId);
  if (!techIdNum || Number.isNaN(techIdNum)) {
    return res.status(400).json({ error: 'Valid technicianId is required' });
  }
  try {
    // Ensure repair exists
    const [repRows] = await db.query('SELECT id FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [id]);
    if (!repRows || repRows.length === 0) {
      return res.status(404).json({ error: 'Repair request not found' });
    }

    // Ensure technician exists (optionally check role)
    const [userRows] = await db.query('SELECT u.id, u.name, r.name AS roleName FROM User u LEFT JOIN Role r ON u.roleId = r.id WHERE u.id = ? AND u.deletedAt IS NULL', [techIdNum]);
    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    await db.query('UPDATE RepairRequest SET technicianId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [techIdNum, id]);

    // Audit
    const changedById = (req.user && req.user.id) ? req.user.id : null;
    await db.query(
      'INSERT INTO AuditLog (action, actionType, details, entityType, entityId, userId) VALUES (?, ?, ?, ?, ?, ?)',
      ['assign_technician', 'UPDATE', JSON.stringify({ technicianId: techIdNum }), 'RepairRequest', id, changedById]
    );

    res.json({ message: 'Technician assigned successfully', technician: { id: userRows[0].id, name: userRows[0].name } });
  } catch (e) {
    console.error('Error assigning technician:', e);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Print receipt (HTML) for a repair request including devicePassword
router.get('/:id/print/receipt', async (req, res) => {
  const { id } = req.params;
  try {
    const settings = loadPrintSettings();
    const dateMode = (req.query.date || settings.dateDisplay || 'both').toLowerCase();
    const [rows] = await db.query(`
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
    const [accRows] = await db.query(`
      SELECT vo.label
      FROM RepairRequestAccessory rra
      LEFT JOIN VariableOption vo ON rra.accessoryOptionId = vo.id
      WHERE rra.repairRequestId = ?
    `, [id]);

    const accessories = (accRows || []).map(a => a.label).filter(Boolean);
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
    const trackUrl = `${req.protocol}://${req.get('host')}/api/repairs/track/${repair.trackingToken}`;

    const html = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${settings.title || 'إيصال استلام'} - ${requestNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700&family=Cairo:wght@400;600&display=swap" rel="stylesheet" />
      <style>
        body { font-family: 'Tajawal','Cairo', Arial, sans-serif; direction: rtl; color:#111827; font-size: ${settings.compactMode ? '12px' : '14px'}; }
        .container { max-width: 760px; margin: 0 auto; padding: ${padTop}px ${padRight}px ${padBottom}px ${padLeft}px; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; }
        .title { font-size: 18px; font-weight: bold; display:flex; align-items:center; gap:8px; }
        .muted { color:#6b7280; font-size:12px; }
        .section { border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin:12px 0; }
        .row { display:flex; gap:16px; flex-wrap:wrap; }
        .col { flex:1 1 240px; }
        .label { font-size:12px; color:#6b7280; }
        .value { font-size:14px; font-weight:600; }
        .accessories { list-style: disc; padding-inline-start: 18px; }
        .prewrap { white-space: pre-wrap; line-height: 1.7; }
        .footer { text-align:center; margin-top:16px; font-size:12px; color:#6b7280; }
        .barcode { display:flex; align-items:center; gap:8px; }
        .branch { font-size:12px; color:#374151; }
        @media print { .no-print { display:none; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <div class="title">
              ${settings.showLogo && settings.logoUrl ? `<img src="${settings.logoUrl}" alt="logo" style="height:28px;"/>` : ''}
              <span>${settings.title || 'إيصال استلام'}</span>
            </div>
            ${(settings.branchName || settings.branchAddress || settings.branchPhone) ? `<div class="branch">${[settings.branchName, settings.branchAddress, settings.branchPhone].filter(Boolean).join(' — ')}</div>` : ''}
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="muted">${requestNumber}</div>
            ${settings.showQr !== false ? `<canvas id="qrCanvas" width="80" height="80" style="border:1px solid #e5e7eb; border-radius:6px;"></canvas>` : ''}
          </div>
        </div>

        <div class="section">
          <div class="row">
            <div class="col"><div class="label">العميل</div><div class="value">${repair.customerName || '—'}</div></div>
            <div class="col"><div class="label">رقم الهاتف</div><div class="value">${repair.customerPhone || '—'}</div></div>
            <div class="col"><div class="label">التاريخ</div><div class="value">${dates.primary || '—'}${dates.secondary ? ` — ${dates.secondary}` : ''}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="row">
            <div class="col"><div class="label">نوع الجهاز</div><div class="value">${repair.deviceType || '—'}</div></div>
            <div class="col"><div class="label">الماركة</div><div class="value">${repair.deviceBrand || '—'}</div></div>
            <div class="col"><div class="label">الموديل</div><div class="value">${repair.deviceModel || '—'}</div></div>
            <div class="col"><div class="label">الرقم التسلسلي</div><div class="value">${repair.serialNumber || '—'}</div></div>
            ${(settings.showSerialBarcode !== false && repair.serialNumber) ? `<div class=\"col barcode\" style=\"flex:0 0 160px;\"><svg id=\"snBarcode\"></svg></div>` : ''}
            ${repair.devicePassword ? (settings.showDevicePassword === true ? `<div class=\"col\"><div class=\"label\">كلمة مرور الجهاز</div><div class=\"value\">${repair.devicePassword}</div></div>` : `<div class=\"col\"><div class=\"label\">كلمة مرور الجهاز</div><div class=\"value\">تم إدخال كلمة سر على النظام (لا تُعرض لأسباب أمنية)</div></div>`) : ''}
          </div>
        </div>

        <div class="section">
          <div class="label">مواصفات الجهاز</div>
          <div class="row">
            <div class="col"><div class="label">المعالج (CPU)</div><div class="value">${repair.cpu || '—'}</div></div>
            <div class="col"><div class="label">كرت الشاشة (GPU)</div><div class="value">${repair.gpu || '—'}</div></div>
            <div class="col"><div class="label">الذاكرة (RAM)</div><div class="value">${repair.ram || '—'}</div></div>
            <div class="col"><div class="label">التخزين (Storage)</div><div class="value">${repair.storage || '—'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="label">وصف المشكلة</div>
          <div class="value">${repair.reportedProblem || repair.problemDescription || '—'}</div>
        </div>

        <div class="section">
          <div class="label">المتعلقات المستلمة من العميل</div>
          ${accessories.length ? `<ul class="accessories">${accessories.map(a => `<li>${a}</li>`).join('')}</ul>` : '<div class="muted">لا توجد</div>'}
        </div>

        ${settings.terms ? `<div class="section"><div class="label">الشروط والأحكام</div><div class="prewrap">${termsRendered}</div></div>` : ''}



        <div class="footer muted">يرجى الاحتفاظ بهذا الإيصال لمراجعة الطلب</div>
        <div class="no-print" style="text-align:center; margin-top:12px;">
          <button onclick="window.print()" style="padding:8px 12px; border:1px solid #e5e7eb; border-radius:6px; background:#111827; color:#fff;">طباعة</button>
        </div>
      </div>
      ${settings.showQr !== false ? `
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
      <script>
        (function(){
          try {
            var canvas = document.getElementById('qrCanvas');
            if (canvas && window.QRCode) {
              QRCode.toCanvas(canvas, '${trackUrl}', { width: 80, margin: 1 }, function (error) { if (error) console.error(error); });
            }
          } catch (e) { console.error(e); }
        })();
      </script>
      ` : ''}

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
router.get('/:id/print/inspection', async (req, res) => {
  const { id } = req.params;
  try {
    const settings = loadPrintSettings();
    const dateMode = (req.query.date || settings.dateDisplay || 'both').toLowerCase();
    const [rows] = await db.query(`
      SELECT ir.*, it.name as inspectionTypeName,
             rr.id as repairId, rr.createdAt as repairCreatedAt,
             c.name as customerName, c.phone as customerPhone,
             d.deviceType, COALESCE(vo.label, d.brand) as deviceBrand, d.model as deviceModel, d.serialNumber
      FROM InspectionReport ir
      LEFT JOIN InspectionType it ON ir.inspectionTypeId = it.id
      LEFT JOIN RepairRequest rr ON ir.repairRequestId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE ir.repairRequestId = ?
      ORDER BY ir.reportDate DESC LIMIT 1
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).send('لا يوجد تقرير فحص لهذا الطلب');
    }

    const rep = rows[0];
    const [components] = await db.query(`
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
          <div class="label">نتيجة الفحص</div>
          <div class="value" style="white-space:pre-wrap">${rep.result || rep.summary || '—'}</div>
        </div>

        <div class="section">
          <div class="label">تفاصيل المكونات</div>
          ${components && components.length ? `
          <table>
            <thead>
              <tr><th>المكون</th><th>الحالة</th><th>الأولوية</th><th>ملاحظات</th></tr>
            </thead>
            <tbody>
            ${components.map(c => `<tr><td>${c.name||''}</td><td>${c.status||''}</td><td>${c.priority||''}</td><td>${c.notes||''}</td></tr>`).join('')}
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
router.get('/:id/print/invoice', async (req, res) => {
  const { id } = req.params;
  try {
    const settings = loadPrintSettings();
    const [repairRows] = await db.query(`
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
    // الربط يتم عبر PartsUsed -> InventoryItem (لا توجد أعمدة inventoryItemId/serviceId في InvoiceItem)
    const [invoiceItems] = await db.query(`
      SELECT ii.*, invItem.name AS itemName, invItem.sku
      FROM InvoiceItem ii
      LEFT JOIN Invoice inv ON ii.invoiceId = inv.id
      LEFT JOIN PartsUsed pu ON ii.partsUsedId = pu.id
      LEFT JOIN InventoryItem invItem ON pu.inventoryItemId = invItem.id
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

    const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة - ${repair.requestNumber}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; font-size:14px; line-height:1.4; color:#1f2937; background:#fff; }
        .container { max-width:800px; margin:0 auto; padding:20px; }
        .header { text-align:center; margin-bottom:24px; border-bottom:2px solid #3b82f6; padding-bottom:16px; }
        .logo { font-size:24px; font-weight:bold; color:#3b82f6; margin-bottom:8px; }
        .company-info { font-size:12px; color:#6b7280; }
        .invoice-info { display:flex; justify-content:space-between; margin-bottom:24px; }
        .invoice-details, .customer-details { flex:1; }
        .invoice-details { margin-left:20px; }
        .section-title { font-weight:bold; color:#374151; margin-bottom:8px; border-bottom:1px solid #e5e7eb; padding-bottom:4px; }
        .info-row { margin-bottom:4px; }
        .label { font-weight:500; color:#6b7280; }
        .table { width:100%; border-collapse:collapse; margin:20px 0; }
        .table th, .table td { padding:12px 8px; text-align:right; border-bottom:1px solid #e5e7eb; }
        .table th { background:#f9fafb; font-weight:600; color:#374151; }
        .table .number { text-align:center; font-family:monospace; }
        .totals { margin-top:20px; }
        .totals-table { width:300px; margin-right:auto; }
        .totals-table td { padding:8px 12px; }
        .total-row { font-weight:bold; font-size:16px; border-top:2px solid #374151; }
        .footer { text-align:center; margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280; }
        @media print { .no-print { display:none; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">${settings.companyName || 'FixZone'}</div>
          <div class="company-info">
            ${settings.address || 'العنوان غير محدد'}<br>
            هاتف: ${settings.phone || 'غير محدد'} | بريد إلكتروني: ${settings.email || 'غير محدد'}
          </div>
        </div>

        <div class="invoice-info">
          <div class="invoice-details">
            <div class="section-title">تفاصيل الفاتورة</div>
            <div class="info-row"><span class="label">رقم الفاتورة:</span> INV-${repair.requestNumber}</div>
            <div class="info-row"><span class="label">رقم طلب الإصلاح:</span> ${repair.requestNumber}</div>
            <div class="info-row"><span class="label">تاريخ الإصدار:</span> ${new Date().toLocaleDateString('ar-SA')}</div>
            <div class="info-row"><span class="label">حالة الطلب:</span> ${statusText}</div>
          </div>
          <div class="customer-details">
            <div class="section-title">بيانات العميل</div>
            <div class="info-row"><span class="label">الاسم:</span> ${repair.customerName || 'غير محدد'}</div>
            <div class="info-row"><span class="label">الهاتف:</span> ${repair.customerPhone || 'غير محدد'}</div>
            ${repair.customerEmail ? `<div class="info-row"><span class="label">البريد:</span> ${repair.customerEmail}</div>` : ''}
            ${repair.customerAddress ? `<div class="info-row"><span class="label">العنوان:</span> ${repair.customerAddress}</div>` : ''}
          </div>
        </div>

        <div class="section-title">تفاصيل الجهاز</div>
        <table class="table">
          <tr>
            <td><strong>نوع الجهاز:</strong> ${repair.deviceType || 'غير محدد'}</td>
            <td><strong>الماركة:</strong> ${repair.deviceBrand || 'غير محدد'}</td>
            <td><strong>الموديل:</strong> ${repair.deviceModel || 'غير محدد'}</td>
          </tr>
        </table>

        <div class="section-title">عناصر الفاتورة</div>
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
          شكراً لثقتكم بنا | ${settings.companyName || 'FixZone'}<br>
          هذه فاتورة رسمية صادرة بتاريخ ${new Date().toLocaleDateString('ar-SA')}
        </div>

        <div class="no-print" style="text-align:center; margin-top:20px;">
          <button onclick="window.print()" style="padding:10px 20px; border:1px solid #e5e7eb; border-radius:6px; background:#3b82f6; color:#fff; cursor:pointer;">طباعة الفاتورة</button>
        </div>
      </div>

      
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
  } catch (err) {
    console.error('Error printing invoice:', err);
    res.status(500).send('Server Error');
  }
});

// Print delivery form
router.get('/:id/print/delivery', async (req, res) => {
  const { id } = req.params;
  try {
    const settings = loadPrintSettings();
    const dateMode = (req.query.date || settings.dateDisplay || 'both').toLowerCase();
    const [rows] = await db.query(`
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

module.exports = router;
