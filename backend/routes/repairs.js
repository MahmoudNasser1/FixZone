// إصلاح ترتيب الاستيراد والتعريفات
const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');

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

router.put('/print-settings', async (req, res) => {
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
          status: 'in_progress',
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
          problemDescription: 'لوحة المفاتيح لا تعمل وبعض الأزرار عالقة',
          status: 'cancelled',
          priority: 'medium',
          estimatedCost: 250.00,
          createdAt: new Date('2024-12-01T09:30:00'),
          updatedAt: new Date('2024-12-01T14:45:00')
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
    'UNDER_REPAIR': 'in_progress',
    'READY_FOR_DELIVERY': 'completed',
    'DELIVERED': 'completed',
    'REJECTED': 'cancelled',
    'WAITING_PARTS': 'in_progress'
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
        d.deviceType,
        COALESCE(vo.label, d.brand) as deviceBrand,
        d.brandId,
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
router.post('/', async (req, res) => {
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
    const repairStatus = status || 'RECEIVED';
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
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields } = req.body;
  if (!deviceId || !reportedProblem || !customerId || !branchId) {
    return res.status(400).send('Device ID, reported problem, customer ID, and branch ID are required');
  }
  try {
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
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM RepairRequest WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Repair request not found');
    }
    res.json({ message: 'Repair request deleted successfully' });
  } catch (err) {
    console.error(`Error deleting repair request with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Rotate tracking token for a single repair request
router.post('/:id/rotate-token', async (req, res) => {
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
router.post('/rotate-tokens', async (_req, res) => {
  try {
    const [upd] = await db.query("UPDATE RepairRequest SET trackingToken = LOWER(REPLACE(UUID(), '-', ''))");
    res.json({ message: 'All tracking tokens rotated', affectedRows: upd.affectedRows || 0 });
  } catch (err) {
    console.error('Error rotating all tracking tokens:', err);
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
          <div class="muted">${requestNumber}</div>
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

        ${settings.showQr !== false ? `
        <div class="section">
          <div class="label">تتبّع حالة الجهاز</div>
          <div class="row" style="align-items:center;">
            <div class="col" style="flex:0 0 ${settings.qrSize || 180}px;">
              <canvas id="qrCanvas" width="${settings.qrSize || 180}" height="${settings.qrSize || 180}" style="border:1px solid #e5e7eb; border-radius:6px;"></canvas>
            </div>
            <div class="col">
              <div class="label">رابط المتابعة</div>
              <div class="value"><a href="${trackUrl}" target="_blank" rel="noopener">${trackUrl}</a></div>
              <div class="muted">يمكن للعميل مسح QR لفتح رابط المتابعة مباشرة</div>
            </div>
          </div>
        </div>
        ` : ''}

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
              QRCode.toCanvas(canvas, '${trackUrl}', { width: ${settings.qrSize || 180}, margin: 1 }, function (error) { if (error) console.error(error); });
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

module.exports = router;
