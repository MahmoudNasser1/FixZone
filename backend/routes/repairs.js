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

// دالة merge عميقة للكائنات المتداخلة
function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key]) && !Array.isArray(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

router.put('/print-settings', authMiddleware, async (req, res) => {
  try {
    // قراءة الإعدادات الحالية
    const current = JSON.parse(await fs.promises.readFile(PRINT_SETTINGS_PATH, 'utf-8'));
    
    // دمج الإعدادات الجديدة مع الحالية (merge عميق)
    const merged = deepMerge(current, req.body);
    
    // حفظ الإعدادات المحدثة
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
    waiting_parts: 'WAITING_PARTS',
    'waiting-parts': 'WAITING_PARTS', // دعم الشرطة أيضاً
    ready_for_pickup: 'READY_FOR_PICKUP',
    'ready-for-pickup': 'READY_FOR_PICKUP', // دعم الشرطة أيضاً
    on_hold: 'ON_HOLD',
    'on-hold': 'ON_HOLD', // دعم الشرطة أيضاً - تم تصحيحه من WAITING_PARTS إلى ON_HOLD
    completed: 'DELIVERED',
    cancelled: 'REJECTED'
  };
  // إذا كانت القيمة بالفعل من قيم قاعدة البيانات، أعدها كما هي
  const dbValues = new Set([
    'RECEIVED', 'INSPECTION', 'AWAITING_APPROVAL', 'UNDER_REPAIR', 'WAITING_PARTS', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'ON_HOLD'
  ]);
  if (dbValues.has(frontStatus)) return frontStatus;
  const result = map[s] || map[frontStatus] || 'RECEIVED';
  // Debug logging (يمكن إزالته لاحقاً)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[mapFrontendStatusToDb] Input: "${frontStatus}" -> Output: "${result}" (normalized: "${s}")`);
  }
  return result;
}

// Get all repair requests with statistics
// Get all repair requests with improved pagination and filters
router.get('/', authMiddleware, validate(repairSchemas.getRepairs, 'query'), async (req, res) => {
  try {
    // Log incoming query for debugging (only in production for troubleshooting)
    if (process.env.NODE_ENV === 'production') {
      console.log('[REPAIRS API] Incoming query params:', JSON.stringify(req.query));
    }

    const {
      customerId,
      status,
      priority,
      page,
      limit,
      pageSize, // Support both 'limit' and 'pageSize' for backward compatibility
      search,
      q, // Support both 'search' and 'q' for backward compatibility
      searchField // نوع البحث المحدد (nameOrPhone, customerName, customerPhone, requestNumber, etc.)
    } = req.query;

    // Use 'search' if provided, otherwise fall back to 'q'
    const searchTerm = (search || q || '').trim();

    // Parse pagination with STRONG fallbacks - handle undefined, null, NaN, empty strings
    // This ensures it works in both dev and production environments
    const pageNum = Math.max(1, Number(page) || 1);
    const limitValue = limit || pageSize || 10; // Support both parameter names
    const parsedLimit = Math.min(100, Math.max(1, Number(limitValue) || 10));
    const offset = Math.max(0, (pageNum - 1) * parsedLimit);

    // Final validation - ensure we have valid numbers (not NaN)
    if (isNaN(pageNum) || isNaN(parsedLimit) || isNaN(offset)) {
      console.error('[REPAIRS API] Invalid pagination values:', { pageNum, parsedLimit, offset, query: req.query });
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
        error: 'PAGINATION_ERROR'
      });
    }

    // Log parsed values in production for debugging
    if (process.env.NODE_ENV === 'production') {
      console.log('[REPAIRS API] Parsed pagination:', { pageNum, parsedLimit, offset });
    }

    // Build WHERE conditions
    let whereConditions = ['rr.deletedAt IS NULL'];
    let queryParams = [];

    // Search filter - دعم البحث في جميع الحقول مع إمكانية تحديد نوع البحث
    // عند وجود بحث، نتجاهل فلاتر customerId و status و priority لأن البحث شامل
    const hasSearch = searchTerm && searchTerm.trim();
    
    if (!hasSearch) {
      // Customer filter - فقط بدون بحث
    if (customerId) {
      const safeCustomerId = parseInt(customerId);
      if (!isNaN(safeCustomerId) && safeCustomerId > 0) {
        whereConditions.push('rr.customerId = ?');
        queryParams.push(safeCustomerId);
      } else {
        console.warn('⚠️ Invalid customerId:', customerId);
      }
    }

      // Status filter - support both frontend and database statuses - فقط بدون بحث
    if (status) {
      const dbStatus = mapFrontendStatusToDb(status);
      whereConditions.push('rr.status = ?');
      queryParams.push(dbStatus || status);
    }

      // Priority filter - فقط بدون بحث
    if (priority) {
      whereConditions.push('rr.priority = ?');
      queryParams.push(priority.toUpperCase());
    }
    } else {
      // Search active - ignoring customerId, status, priority filters
    }

    // Search filter - دعم البحث في جميع الحقول مع إمكانية تحديد نوع البحث
    if (hasSearch) {
      const searchPattern = `%${searchTerm.trim()}%`;
      const searchValue = searchTerm.trim();
      
      // Log للتصحيح
      // Search term: searchTerm, searchField: searchField
      
      // تحديد الحقول التي يجب البحث فيها حسب searchField
      if (searchField) {
        // البحث في حقل محدد
        switch (searchField) {
          case 'customerName':
            whereConditions.push('c.name LIKE ?');
            queryParams.push(searchPattern);
            break;
          case 'customerPhone':
            whereConditions.push('c.phone LIKE ?');
            queryParams.push(searchPattern);
            break;
          case 'nameOrPhone':
            whereConditions.push('(c.name LIKE ? OR c.phone LIKE ?)');
            queryParams.push(searchPattern, searchPattern);
            break;
          case 'requestNumber':
            // البحث في رقم الطلب - دعم البحث بالـ ID مباشرة أو بالرقم الكامل
            // إذا كان الرقم عبارة عن أرقام فقط، نبحث في ID مباشرة
            const isNumericSearch = /^\d+$/.test(searchValue);
            // requestNumber search - isNumeric: isNumericSearch
            if (isNumericSearch) {
              const numericId = parseInt(searchValue, 10);
              // Searching for ID: numericId
              
              // البحث في ID مباشرة فقط - هذا هو الأكثر دقة
              // مثلاً: البحث عن "88" يجد فقط ID = 88 (وليس 188 أو 880)
              // مثلاً: البحث عن "1460" يجد فقط ID = 1460 (وليس 11460 أو 14600)
              whereConditions.push('rr.id = ?');
              queryParams.push(numericId);
              
              // Added exact ID search condition
            } else {
              // إذا كان الرقم يحتوي على حروف (مثلاً: "REP-20241120-850")، نبحث في التنسيق الكامل
              whereConditions.push('CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) LIKE ?');
              queryParams.push(searchPattern);
              // Added search condition for full format pattern
            }
            break;
          case 'problemDescription':
            // البحث في reportedProblem فقط (العمود الفعلي في قاعدة البيانات)
            whereConditions.push('rr.reportedProblem LIKE ?');
            queryParams.push(searchPattern);
            break;
          case 'deviceType':
            whereConditions.push('d.deviceType LIKE ?');
            queryParams.push(searchPattern);
            break;
          case 'deviceBrand':
            whereConditions.push('COALESCE(vo.label, d.brand) LIKE ?');
            queryParams.push(searchPattern);
            break;
          case 'deviceModel':
            whereConditions.push('d.model LIKE ?');
            queryParams.push(searchPattern);
            break;
          case 'all':
          default:
            // البحث في جميع الحقول - بما في ذلك البحث في رقم الطلب
            const isNumericAll = /^\d+$/.test(searchValue);
            if (isNumericAll) {
              const numericIdAll = parseInt(searchValue, 10);
              // إذا كان البحث أرقام فقط، نبحث أيضاً في ID ورقم الطلب الكامل
      whereConditions.push(`(
                c.name LIKE ? OR 
                c.phone LIKE ? OR
        rr.reportedProblem LIKE ? OR 
        d.deviceType LIKE ? OR 
        COALESCE(vo.label, d.brand) LIKE ? OR 
        d.model LIKE ? OR
                rr.id = ? OR
                CAST(rr.id AS CHAR) LIKE ? OR
                CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) LIKE ?
              )`);
              queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, numericIdAll, searchPattern, searchPattern);
            } else {
              // إذا كان البحث يحتوي على حروف، نبحث في جميع الحقول بدون ID
              whereConditions.push(`(
                c.name LIKE ? OR 
                c.phone LIKE ? OR
                rr.reportedProblem LIKE ? OR 
                d.deviceType LIKE ? OR 
                COALESCE(vo.label, d.brand) LIKE ? OR 
                d.model LIKE ? OR
                CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) LIKE ?
              )`);
              queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
            }
            break;
        }
      } else {
        // بدون تحديد searchField، نبحث في جميع الحقول (سلوك افتراضي)
        const isNumericDefault = /^\d+$/.test(searchValue);
        if (isNumericDefault) {
          const numericIdDefault = parseInt(searchValue, 10);
          // إذا كان البحث أرقام فقط، نبحث أيضاً في ID ورقم الطلب الكامل
          whereConditions.push(`(
            c.name LIKE ? OR 
            c.phone LIKE ? OR
            rr.reportedProblem LIKE ? OR 
            d.deviceType LIKE ? OR 
            COALESCE(vo.label, d.brand) LIKE ? OR 
            d.model LIKE ? OR
            rr.id = ? OR
            CAST(rr.id AS CHAR) LIKE ? OR
            CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) LIKE ?
          )`);
          queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, numericIdDefault, searchPattern, searchPattern);
        } else {
          // إذا كان البحث يحتوي على حروف، نبحث في جميع الحقول بدون ID
          whereConditions.push(`(
            c.name LIKE ? OR 
            c.phone LIKE ? OR
            rr.reportedProblem LIKE ? OR 
            d.deviceType LIKE ? OR 
            COALESCE(vo.label, d.brand) LIKE ? OR 
            d.model LIKE ? OR
            CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) LIKE ?
          )`);
          queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }
      }
    }

    // Build main query with pagination
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
      LIMIT ? OFFSET ?
    `;

    // Final validation - ensure limit and offset are valid integers (CRITICAL: Must be integers, not strings!)
    // Use parseInt() to explicitly convert to integer for MariaDB strict mode
    const finalLimit = parseInt(parsedLimit, 10);
    const finalOffset = parseInt(offset, 10);

    // Extra safety check - if somehow we still have invalid values, use defaults
    // عند البحث، نسمح بـ limit أكبر (حتى 5000) للبحث في جميع الطلبات
    const maxLimit = searchTerm && searchTerm.trim() ? 5000 : 100;
    if (isNaN(finalLimit) || finalLimit < 1 || finalLimit > maxLimit) {
      console.error('[REPAIRS API] Invalid finalLimit:', finalLimit, '(max allowed:', maxLimit + ')');
      // إذا كان البحث، نستخدم limit كبير، وإلا نستخدم 10
      const defaultLimit = searchTerm && searchTerm.trim() ? Math.min(5000, maxLimit) : 10;
      queryParams.push(parseInt(defaultLimit, 10), parseInt(0, 10));
    } else if (isNaN(finalOffset) || finalOffset < 0) {
      console.error('[REPAIRS API] Invalid finalOffset:', finalOffset);
      queryParams.push(finalLimit, parseInt(0, 10));
    } else {
      // CRITICAL: Ensure these are integers, not strings or floats
      queryParams.push(finalLimit, finalOffset);
    }

    // Log final query params in production
    if (process.env.NODE_ENV === 'production') {
      console.log('[REPAIRS API] Final SQL params (last 2 are limit/offset):',
        queryParams.slice(-2).map((p, i) => `${i === 0 ? 'LIMIT' : 'OFFSET'}: ${p} (type: ${typeof p})`));
    }

    // CRITICAL: Use db.query instead of db.execute for queries with LIMIT/OFFSET
    // db.execute uses prepared statements which cause issues with LIMIT/OFFSET in MariaDB strict mode
    // db.query interpolates values directly and works perfectly with LIMIT/OFFSET
    
    // Log للتصحيح
    if (searchTerm && searchTerm.trim()) {
      // Query built with filters and search
    }
    
    const [rows] = await db.query(query, queryParams);
    
    // Log للتصحيح
    if (searchTerm && searchTerm.trim()) {
      // Found rows.length results
      if (rows.length > 0) {
        rows.slice(0, 3).forEach((row, idx) => {
          const reqNum = `REP-${new Date(row.createdAt).getFullYear()}${String(new Date(row.createdAt).getMonth() + 1).padStart(2, '0')}${String(new Date(row.createdAt).getDate()).padStart(2, '0')}-${String(row.id).padStart(3, '0')}`;
          console.log(`  [${idx + 1}] ID: ${row.id}, RequestNumber: ${reqNum}, Customer: ${row.customerName || 'N/A'}`);
        });
      } else {
        // No results found
      }
    }

    //Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      LEFT JOIN VariableOption vo ON d.brandId = vo.id
      WHERE ${whereConditions.join(' AND ')}
    `;

    // Remove limit and offset params for count query
    const countParams = queryParams.slice(0, -2);

    // Log count query params in production
    if (process.env.NODE_ENV === 'production') {
      console.log('[REPAIRS API] Count query params:', countParams.length, 'params');
    }

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
      problemDescription: row.reportedProblem || row.problemDescription || 'لا توجد تفاصيل',
      status: getStatusMapping(row.status),
      priority: row.priority || 'MEDIUM',
      estimatedCost: parseFloat(row.estimatedCost) || 0,
      actualCost: row.actualCost ? parseFloat(row.actualCost) : null,
      expectedDeliveryDate: row.expectedDeliveryDate || null,
      estimatedCompletionDate: row.expectedDeliveryDate || null,
      assignedTechnician: row.technicianId || null,
      notes: row.customerNotes || row.technicianReport || null,
      accessories: [], // Accessories are stored in RepairRequestAccessory table, fetch separately if needed
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
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit),
          totalItems: total
        }
      }
    });
  } catch (err) {
    console.error('❌ [ERROR] Error fetching repair requests:', err);
    console.error('❌ [ERROR] Error stack:', err.stack);
    console.error('❌ [ERROR] Error code:', err.code);
    console.error('❌ [ERROR] SQL Message:', err.sqlMessage);
    console.error('❌ [ERROR] req.user:', req.user);

    res.status(500).json({
      success: false,
      message: 'حصل خطأ في السيرفر',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      sqlError: process.env.NODE_ENV === 'development' ? err.sqlMessage : undefined
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
    'WAITING_PARTS': 'waiting-parts',
    'READY_FOR_PICKUP': 'ready-for-pickup',
    'READY_FOR_DELIVERY': 'completed',
    'DELIVERED': 'completed',
    'REJECTED': 'cancelled',
    'ON_HOLD': 'on-hold'
  };
  return statusMap[dbStatus] || 'pending';
}

// Bulk update repair status
router.patch('/bulk-status', authMiddleware, async (req, res) => {
  const { repairIds, status } = req.body;

  if (!Array.isArray(repairIds) || repairIds.length === 0) {
    return res.status(400).json({ error: 'Repair IDs array is required' });
  }

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const dbStatus = mapFrontendStatusToDb(status);

    // Get old statuses before update
    const placeholders = repairIds.map(() => '?').join(',');
    const [oldStatuses] = await connection.execute(
      `SELECT id, status FROM RepairRequest WHERE id IN (${placeholders}) AND deletedAt IS NULL`,
      repairIds
    );

    // Create placeholders for the IN clause
    const query = `
      UPDATE RepairRequest 
      SET status = ?, updatedAt = NOW() 
      WHERE id IN (${placeholders}) AND deletedAt IS NULL
    `;

    const [result] = await connection.execute(query, [dbStatus, ...repairIds]);

    await connection.commit();

    // Trigger automation notifications (async, don't wait)
    const automationService = require('../services/automation.service');
    oldStatuses.forEach(repair => {
      if (repair.status !== dbStatus) {
        automationService.onRepairStatusChange(
          repair.id,
          repair.status,
          dbStatus,
          req.user?.id
        ).catch(err => console.error(`Error in automation for repair ${repair.id}:`, err));
      }
    });

    res.json({
      success: true,
      message: 'Repairs updated successfully',
      updatedCount: result.affectedRows
    });

  } catch (err) {
    await connection.rollback();
    console.error('Error in bulk status update:', err);
    res.status(500).json({ error: 'Server Error during bulk update' });
  } finally {
    connection.release();
  }
});

// Get most common device specifications for quick actions
// MUST be before /:id route to avoid matching conflicts
router.get('/device-specs/common', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    // Get most common CPU values
    // Use db.query instead of db.execute for LIMIT - prepared statements have issues with LIMIT in MariaDB
    const [cpuResults] = await db.query(`
      SELECT cpu as value, COUNT(*) as count
      FROM Device
      WHERE cpu IS NOT NULL AND cpu != '' AND deletedAt IS NULL
      GROUP BY cpu
      ORDER BY count DESC
      LIMIT ${parseInt(limit)}
    `);
    
    // Get most common GPU values
    const [gpuResults] = await db.query(`
      SELECT gpu as value, COUNT(*) as count
      FROM Device
      WHERE gpu IS NOT NULL AND gpu != '' AND deletedAt IS NULL
      GROUP BY gpu
      ORDER BY count DESC
      LIMIT ${parseInt(limit)}
    `);
    
    // Get most common RAM values
    const [ramResults] = await db.query(`
      SELECT ram as value, COUNT(*) as count
      FROM Device
      WHERE ram IS NOT NULL AND ram != '' AND deletedAt IS NULL
      GROUP BY ram
      ORDER BY count DESC
      LIMIT ${parseInt(limit)}
    `);
    
    // Get most common Storage values
    const [storageResults] = await db.query(`
      SELECT storage as value, COUNT(*) as count
      FROM Device
      WHERE storage IS NOT NULL AND storage != '' AND deletedAt IS NULL
      GROUP BY storage
      ORDER BY count DESC
      LIMIT ${parseInt(limit)}
    `);
    
    res.json({
      success: true,
      data: {
        cpu: cpuResults.map(r => r.value),
        gpu: gpuResults.map(r => r.value),
        ram: ramResults.map(r => r.value),
        storage: storageResults.map(r => r.value)
      }
    });
  } catch (error) {
    console.error('Error fetching common device specs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch common device specifications'
    });
  }
});

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

    // Debug: Check what's in the database
    console.log('🔍 [GET /:id] Repair ID:', id);
    console.log('🔍 [GET /:id] repair.customFields raw from DB:', repair.customFields);
    console.log('🔍 [GET /:id] repair.customFields type:', typeof repair.customFields);
    console.log('🔍 [GET /:id] repair.estimatedCost:', repair.estimatedCost);

    // جلب الملحقات المرتبطة بالطلب
    const [accRows] = await db.execute(`
      SELECT rra.accessoryOptionId as id, vo.label
      FROM RepairRequestAccessory rra
      LEFT JOIN VariableOption vo ON rra.accessoryOptionId = vo.id
      WHERE rra.repairRequestId = ?
    `, [id]);

    // Parse customFields
    let parsedCustomFields = {};
    try {
      if (repair.customFields) {
        if (typeof repair.customFields === 'string') {
          parsedCustomFields = JSON.parse(repair.customFields);
        } else if (typeof repair.customFields === 'object') {
          parsedCustomFields = repair.customFields;
        }
      }
      console.log('🔍 [GET /:id] Parsed customFields:', parsedCustomFields);
    } catch (e) {
      console.error('❌ [GET /:id] Error parsing customFields:', e);
      parsedCustomFields = {};
    }

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
      customFields: parsedCustomFields,
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
  console.log('🔍 [POST /] Received request body:', {
    estimatedCostMin: req.body.estimatedCostMin,
    estimatedCostMax: req.body.estimatedCostMax,
    minType: typeof req.body.estimatedCostMin,
    maxType: typeof req.body.estimatedCostMax,
    minUndefined: req.body.estimatedCostMin === undefined,
    maxUndefined: req.body.estimatedCostMax === undefined
  });
  
  const {
    customerId, customerName, customerPhone, customerEmail,
    deviceType, deviceBrand, brandId, deviceModel, serialNumber,
    devicePassword,
    cpu, gpu, ram, storage,
    accessories,
    problemDescription, reportedProblem, priority, estimatedCost, notes, status, expectedDeliveryDate,
    companyId, // Include companyId from request body
    estimatedCostMin, estimatedCostMax // Include estimated cost range
  } = req.body;
  
  console.log('🔍 [POST /] Extracted values:', {
    estimatedCostMin,
    estimatedCostMax,
    minType: typeof estimatedCostMin,
    maxType: typeof estimatedCostMax
  });
  
  // Use problemDescription or reportedProblem (support both for backwards compatibility)
  const finalProblemDescription = String(problemDescription || reportedProblem || '').trim();
  
  // Validate that we have a problem description (at least one of problemDescription or reportedProblem must be provided)
  if (!finalProblemDescription || finalProblemDescription.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'خطأ في البيانات المدخلة',
      errors: [{
        field: problemDescription ? 'problemDescription' : 'reportedProblem',
        message: 'وصف المشكلة مطلوب ويجب أن يكون على الأقل 10 أحرف'
      }]
    });
  }
  
  console.log('✅ Final problem description length:', finalProblemDescription.length);

  // Debug logging
  console.log('Received repair data:', {
    customerId,
    customerName,
    customerPhone,
    customerEmail,
    companyId, // Log companyId to debug
    estimatedCost,
    expectedDeliveryDate,
    deviceType,
    problemDescription: finalProblemDescription,
    accessories
  });
  console.log('Accessories type:', typeof accessories, 'Is array:', Array.isArray(accessories), 'Value:', accessories);
  console.log('CompanyId received:', companyId, 'Type:', typeof companyId);

  // Get database connection for transaction
  let connection;

  try {
    connection = await db.getConnection();
    
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
        // Update customer's company if companyId is provided and valid
        if (companyId != null && companyId !== '' && !isNaN(parseInt(companyId))) {
          const finalCompanyId = parseInt(companyId);
          if (finalCompanyId > 0) {
          console.log('🟡 Updating existing customer with companyId:', finalCompanyId, 'Type:', typeof finalCompanyId, 'for customer:', actualCustomerId);
          await connection.execute(
            'UPDATE Customer SET companyId = ? WHERE id = ?',
            [finalCompanyId, actualCustomerId]
          );
          console.log('✅ Successfully linked company to existing customer');

          // Verify the update
          const [verifyCustomer] = await connection.execute(
            'SELECT id, name, phone, companyId FROM Customer WHERE id = ?',
            [actualCustomerId]
          );
          if (verifyCustomer.length > 0) {
            console.log('✅ Verification - Customer updated with companyId:', verifyCustomer[0].companyId);
            }
          }
        }
      } else {
        // إنشاء عميل جديد مع companyId إذا كان موجوداً
        console.log('🔵 Creating new customer with companyId:', companyId, 'Type:', typeof companyId);
        let finalCompanyId = null;
        if (companyId != null && companyId !== '' && !isNaN(parseInt(companyId))) {
          const parsedCompanyId = parseInt(companyId);
          if (parsedCompanyId > 0) {
            finalCompanyId = parsedCompanyId;
          }
        }
        console.log('🔵 Final companyId for INSERT:', finalCompanyId);
        const [customerResult] = await connection.execute(
          'INSERT INTO Customer (name, phone, email, companyId) VALUES (?, ?, ?, ?)',
          [customerName, customerPhone, customerEmail || null, finalCompanyId]
        );
        actualCustomerId = customerResult.insertId;
        console.log('✅ Created new customer:', actualCustomerId, 'with companyId:', finalCompanyId);

        // Verify the companyId was saved correctly
        const [verifyCustomer] = await connection.execute(
          'SELECT id, name, phone, companyId FROM Customer WHERE id = ?',
          [actualCustomerId]
        );
        if (verifyCustomer.length > 0) {
          console.log('✅ Verification - Customer saved with companyId:', verifyCustomer[0].companyId);
        }
      }
    } else if (companyId != null && companyId !== '' && !isNaN(parseInt(companyId))) {
      // If customer exists and companyId is provided and valid, update customer's company
      const finalCompanyId = parseInt(companyId);
      if (finalCompanyId > 0) {
      console.log('🟢 Updating existing customerId:', actualCustomerId, 'with companyId:', finalCompanyId, 'Type:', typeof finalCompanyId);
      await connection.execute(
        'UPDATE Customer SET companyId = ? WHERE id = ?',
        [finalCompanyId, actualCustomerId]
      );
      console.log('✅ Successfully linked company to existing customer');

      // Verify the update
      const [verifyCustomer] = await connection.execute(
        'SELECT id, name, phone, companyId FROM Customer WHERE id = ?',
        [actualCustomerId]
      );
      if (verifyCustomer.length > 0) {
        console.log('✅ Verification - Customer updated with companyId:', verifyCustomer[0].companyId);
        }
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
    
    // التحقق من أن actualCustomerId موجود
    if (!actualCustomerId) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }
    
    // توليد توكن تتبع عام للعميل
    const crypto = require('crypto');
    const trackingToken = crypto.randomBytes(24).toString('hex');
    
    // التحقق من وجود branchId = 1
    let branchIdToUse = 1;
    try {
      const [branchCheck] = await connection.execute(
        'SELECT id FROM Branch WHERE id = ? AND deletedAt IS NULL',
        [branchIdToUse]
      );
      if (branchCheck.length === 0) {
        console.warn('⚠️ Branch 1 does not exist, using NULL for branchId');
        branchIdToUse = null;
      }
    } catch (branchError) {
      console.warn('⚠️ Error checking branch, using NULL:', branchError.message);
      branchIdToUse = null;
    }
    
    // Use estimatedCost if provided, otherwise 0 (no average calculation)
    const finalEstimatedCost = estimatedCost !== undefined && estimatedCost !== null ? parseFloat(estimatedCost) : 0;

    const insertQuery = `
      INSERT INTO RepairRequest (
        deviceId, reportedProblem, status, trackingToken, customerId, branchId, technicianId, estimatedCost, expectedDeliveryDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // إعداد القيم للإدخال
    const insertValues = [
      deviceId || null,
      finalProblemDescription || null,
      repairStatus || 'RECEIVED',
      trackingToken || null,
      actualCustomerId,
      branchIdToUse,
      null, // technicianId
      finalEstimatedCost,
      expectedDeliveryDate || null
    ];

    console.log('🔍 Inserting repair with values:', {
      deviceId: deviceId || null,
      problemDescription: finalProblemDescription ? `${finalProblemDescription.substring(0, 50)}...` : null,
      problemDescriptionLength: finalProblemDescription?.length || 0,
      repairStatus,
      trackingToken,
      actualCustomerId,
      branchId: branchIdToUse,
      estimatedCost: estimatedCost || 0,
      expectedDeliveryDate: expectedDeliveryDate || null,
      insertValuesCount: insertValues.length
    });

    const [result] = await connection.execute(insertQuery, insertValues);

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

    // حفظ نطاق التكلفة المقدرة في customFields
    console.log('🔍 [POST /] Saving estimated cost range:', {
      estimatedCostMin,
      estimatedCostMax,
      minType: typeof estimatedCostMin,
      maxType: typeof estimatedCostMax,
      minUndefined: estimatedCostMin === undefined,
      maxUndefined: estimatedCostMax === undefined
    });
    
    // Save estimated cost range to customFields
    console.log('🔍 [POST /] Processing estimated cost range for saving:', {
      estimatedCostMin,
      estimatedCostMax,
      minType: typeof estimatedCostMin,
      maxType: typeof estimatedCostMax,
      minIsNumber: typeof estimatedCostMin === 'number',
      maxIsNumber: typeof estimatedCostMax === 'number'
    });
    
    // Update customFields with estimated cost range if provided (matching PATCH /:id/details logic)
    console.log('🔍 [POST /] Updating customFields:', {
      estimatedCostMin,
      estimatedCostMax,
      minType: typeof estimatedCostMin,
      maxType: typeof estimatedCostMax,
      minUndefined: estimatedCostMin === undefined,
      maxUndefined: estimatedCostMax === undefined
    });
    
    if (estimatedCostMin !== undefined || estimatedCostMax !== undefined) {
      const customFields = {};
      
      // Update with new range values (store directly, matching PATCH logic)
      if (estimatedCostMin !== undefined) {
        customFields.estimatedCostMin = estimatedCostMin !== null ? parseFloat(estimatedCostMin) : null;
      }
      if (estimatedCostMax !== undefined) {
        customFields.estimatedCostMax = estimatedCostMax !== null ? parseFloat(estimatedCostMax) : null;
      }
      
      console.log('🔍 [POST /] Prepared customFields object:', customFields);
      const customFieldsJson = JSON.stringify(customFields);
      console.log('🔍 [POST /] Saving customFields JSON:', customFieldsJson);
      
      // Save customFields (always save, even if values are null, to match PATCH behavior)
      await connection.execute(
        'UPDATE RepairRequest SET customFields = ? WHERE id = ?',
        [customFieldsJson, result.insertId]
      );
      console.log('✅ [POST /] Estimated cost range saved in customFields:', customFields);
      
      // Verify it was saved
      const [verifyRows] = await connection.execute(
        'SELECT customFields FROM RepairRequest WHERE id = ?',
        [result.insertId]
      );
      if (verifyRows.length > 0) {
        console.log('✅ [POST /] Verification - customFields in DB:', verifyRows[0].customFields);
      }
    } else {
      console.log('⚠️ [POST /] estimatedCostMin and estimatedCostMax are both undefined, skipping customFields update');
    }

    // Commit transaction
    await connection.commit();
    connection.release();

    // Trigger automation notification for new repair (RECEIVED status)
    const repairId = result.insertId;
    const automationService = require('../services/automation.service');
    automationService.onRepairStatusChange(
      repairId,
      null, // No old status for new repair
      repairStatus || 'RECEIVED', // New status (should be RECEIVED)
      req.user?.id || null
    ).catch(err => console.error(`Error in automation for new repair ${repairId}:`, err));

    // إرجاع البيانات المُنشأة مع تفاصيل كاملة (استخدام db.execute بعد إغلاق connection)
    const [newRepairData] = await db.execute(`
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

    const newRepair = {
      id: result.insertId,
      requestNumber: `REP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(result.insertId).padStart(3, '0')}`,
      customerName: newRepairData[0]?.customerName || customerName,
      customerPhone: newRepairData[0]?.customerPhone || customerPhone,
      customerEmail: newRepairData[0]?.customerEmail || customerEmail,
      deviceType: newRepairData[0]?.deviceType || deviceType,
      deviceBrand: newRepairData[0]?.deviceBrand || deviceBrand,
      deviceModel: newRepairData[0]?.deviceModel || deviceModel,
      problemDescription: finalProblemDescription,
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
    if (connection && connection.beginTransaction) {
      try {
      await connection.rollback();
      } catch (rollbackErr) {
        console.error('❌ Error during rollback:', rollbackErr);
      }
      try {
      connection.release();
      } catch (releaseErr) {
        console.error('❌ Error releasing connection:', releaseErr);
      }
    }
    
    // Log error details comprehensively
    console.error('❌ ========== ERROR CREATING REPAIR REQUEST ==========');
    console.error('❌ Error message:', err.message);
    console.error('❌ Error code:', err.code);
    console.error('❌ SQL State:', err.sqlState);
    console.error('❌ SQL Message:', err.sqlMessage);
    console.error('❌ Error stack:', err.stack);
    if (err.errno) {
      console.error('❌ Error number:', err.errno);
    }
    if (err.sql) {
      console.error('❌ SQL Query:', err.sql);
    }
    console.error('❌ ====================================================');
    
    // Return detailed error in development, generic in production
    const errorResponse = {
      success: false,
      error: 'Server Error',
      message: err.message || 'An error occurred while creating the repair request'
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        code: err.code,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        stack: err.stack
      };
    }
    
    res.status(500).json(errorResponse);
  }
});

// Update a repair request
router.put('/:id', authMiddleware, validate(repairSchemas.getRepairById, 'params'), validate(repairSchemas.updateRepair), async (req, res) => {
  const { id } = req.params;
  let { deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields } = req.body;
  try {
    // Get old status before update
    const [oldRepair] = await db.execute('SELECT status FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [id]);
    if (oldRepair.length === 0) {
      return res.status(404).json({ success: false, error: 'Repair request not found or already deleted' });
    }
    const oldStatus = oldRepair[0].status;
    
    status = mapFrontendStatusToDb(status);
    const [result] = await db.execute('UPDATE RepairRequest SET deviceId = ?, reportedProblem = ?, technicianReport = ?, status = ?, customerId = ?, branchId = ?, technicianId = ?, quotationId = ?, invoiceId = ?, deviceBatchId = ?, attachments = ?, customFields = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, JSON.stringify(attachments), JSON.stringify(customFields), id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Repair request not found or already deleted' });
    }
    
    // Trigger automation notification if status changed
    if (oldStatus !== status) {
      const automationService = require('../services/automation.service');
      automationService.onRepairStatusChange(
        parseInt(id),
        oldStatus,
        status,
        req.user?.id || null
      ).catch(err => console.error(`Error in automation for repair ${id}:`, err));
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

  console.log(`[UPDATE STATUS] Request for repair ${id}:`, { originalStatus: status, notes });

  // Get database connection for transaction
  const connection = await db.getConnection();

  try {
    // Start transaction
    await connection.beginTransaction();

    // دعم التحويل من صيغة الواجهة إلى صيغة قاعدة البيانات
    const originalStatus = status;
    status = mapFrontendStatusToDb(status);
    console.log(`[UPDATE STATUS] Mapped status: "${originalStatus}" -> "${status}"`);
    
    // Validate that status is not null
    if (!status) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, error: 'Invalid status value', details: `Status "${originalStatus}" could not be mapped to a valid database status` });
    }
    
    const [beforeRows] = await connection.execute('SELECT status FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [id]);
    if (!beforeRows || beforeRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, error: 'Repair request not found or already deleted' });
    }
    const fromStatus = beforeRows[0].status || null;
    console.log(`[UPDATE STATUS] Updating from "${fromStatus}" to "${status}" for repair ${id}`);
    const [result] = await connection.execute('UPDATE RepairRequest SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [status, id]);
    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, error: 'Repair request not found or already deleted' });
    }
    const changedById = (req.user && req.user.id) ? req.user.id : null;
    // Ensure notes is null instead of undefined
    const notesValue = (notes !== undefined && notes !== null) ? String(notes) : null;
    await connection.execute(
      'INSERT INTO StatusUpdateLog (repairRequestId, fromStatus, toStatus, notes, changedById) VALUES (?, ?, ?, ?, ?)',
      [id, fromStatus, status, notesValue, changedById]
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
              // 🔧 Fix: Use unitSellingPrice from PartsUsed first, then fallback to InventoryItem sellingPrice
              const unitPrice = part.unitSellingPrice !== null && part.unitSellingPrice !== undefined 
                ? Number(part.unitSellingPrice) 
                : (part.sellingPrice ? Number(part.sellingPrice) : 0);
              const quantity = part.quantity || 1;
              const totalPrice = part.totalPrice !== null && part.totalPrice !== undefined
                ? Number(part.totalPrice)
                : (quantity * unitPrice);
              
              console.log('📦 Creating invoice item from part:', {
                partId: part.id,
                partName: part.name,
                unitSellingPrice: part.unitSellingPrice,
                itemSellingPrice: part.sellingPrice,
                finalUnitPrice: unitPrice,
                quantity,
                totalPrice
              });

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

    // Trigger automation notification (async, don't wait) - AFTER commit
    if (fromStatus !== status) {
      console.log(`[REPAIR ROUTE] Triggering automation: repairId=${id}, fromStatus=${fromStatus}, toStatus=${status}`);
      const automationService = require('../services/automation.service');
      automationService.onRepairStatusChange(
        parseInt(id),
        fromStatus,
        status,
        changedById
      ).catch(err => {
        console.error(`[REPAIR ROUTE] ❌ Error in automation for repair ${id}:`, err);
        console.error(`[REPAIR ROUTE] Error stack:`, err.stack);
      });
    } else {
      console.log(`[REPAIR ROUTE] Status unchanged (${fromStatus} -> ${status}), skipping automation`);
    }

    // أعِد الصيغة الأمريكية للواجهة للتوحيد
    const uiMap = {
      'RECEIVED': 'pending',
      'INSPECTION': 'pending',
      'AWAITING_APPROVAL': 'pending',
      'UNDER_REPAIR': 'in-progress',
      'WAITING_PARTS': 'waiting-parts',
      'READY_FOR_PICKUP': 'ready-for-pickup',
      'READY_FOR_DELIVERY': 'completed',
      'DELIVERED': 'completed',
      'REJECTED': 'cancelled',
      'ON_HOLD': 'on-hold'
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
    console.error('❌ Error updating repair status:', err);
    console.error('❌ Error stack:', err.stack);
    console.error('❌ Error code:', err.code);
    console.error('❌ SQL Message:', err.sqlMessage);
    console.error('❌ Status value:', status);
    console.error('❌ Original status from request:', req.body.status);
    res.status(500).json({ 
      success: false, 
      error: 'Server Error', 
      details: err.message,
      sqlMessage: err.sqlMessage,
      code: err.code
    });
  }
});

// Update repair details (estimatedCost, actualCost, priority, expectedDeliveryDate, notes, accessories)
router.patch('/:id/details', authMiddleware, validate(repairSchemas.getRepairById, 'params'), validate(repairSchemas.updateDetails), async (req, res) => {
  const { id } = req.params;
  const { estimatedCost, estimatedCostMin, estimatedCostMax, actualCost, priority, expectedDeliveryDate, notes, accessories } = req.body;

  console.log('🔍 [PATCH /:id/details] Received request body:', {
    id,
    estimatedCost,
    estimatedCostMin,
    estimatedCostMax,
    actualCost,
    priority,
    expectedDeliveryDate,
    notes,
    accessories: accessories ? 'present' : 'not present'
  });

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

    if (updates.length === 0 && estimatedCostMin === undefined && estimatedCostMax === undefined) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE RepairRequest SET ${updates.join(', ')} WHERE id = ? AND deletedAt IS NULL`;

    const [result] = await db.execute(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Repair request not found or already deleted' });
    }

    // Update customFields with estimated cost range if provided (no average calculation)
    console.log('🔍 [PATCH /:id/details] Updating customFields:', {
      estimatedCostMin,
      estimatedCostMax,
      minType: typeof estimatedCostMin,
      maxType: typeof estimatedCostMax,
      minUndefined: estimatedCostMin === undefined,
      maxUndefined: estimatedCostMax === undefined
    });
    
    if (estimatedCostMin !== undefined || estimatedCostMax !== undefined) {
      // Get current customFields
      const [currentRows] = await db.execute('SELECT customFields FROM RepairRequest WHERE id = ?', [id]);
      let customFields = {};
      try {
        if (currentRows[0]?.customFields) {
          customFields = typeof currentRows[0].customFields === 'string' 
            ? JSON.parse(currentRows[0].customFields) 
            : (currentRows[0].customFields || {});
        }
        console.log('🔍 [PATCH /:id/details] Current customFields from DB:', customFields);
      } catch (e) {
        console.error('❌ [PATCH /:id/details] Error parsing current customFields:', e);
        customFields = {};
      }

      // Update with new range values (store directly, no average)
      if (estimatedCostMin !== undefined) {
        customFields.estimatedCostMin = estimatedCostMin !== null ? parseFloat(estimatedCostMin) : null;
      }
      if (estimatedCostMax !== undefined) {
        customFields.estimatedCostMax = estimatedCostMax !== null ? parseFloat(estimatedCostMax) : null;
      }

      console.log('🔍 [PATCH /:id/details] Updated customFields object:', customFields);
      const customFieldsJson = JSON.stringify(customFields);
      console.log('🔍 [PATCH /:id/details] Saving customFields JSON:', customFieldsJson);

      // Save updated customFields
      await db.execute(
        'UPDATE RepairRequest SET customFields = ? WHERE id = ?',
        [customFieldsJson, id]
      );
      
      console.log('✅ [PATCH /:id/details] customFields saved successfully');
      
      // Verify it was saved
      const [verifyRows] = await db.execute(
        'SELECT customFields FROM RepairRequest WHERE id = ?',
        [id]
      );
      if (verifyRows.length > 0) {
        console.log('✅ [PATCH /:id/details] Verification - customFields in DB:', verifyRows[0].customFields);
      }
    } else {
      console.log('⚠️ [PATCH /:id/details] estimatedCostMin and estimatedCostMax are both undefined, skipping customFields update');
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
      `SELECT sul.id, sul.fromStatus, sul.toStatus, sul.notes, sul.changedById, sul.createdAt, 
       u.name as userName
       FROM StatusUpdateLog sul
       LEFT JOIN User u ON sul.changedById = u.id
       WHERE sul.repairRequestId = ? ORDER BY sul.createdAt DESC`,
      [id]
    );
    const [auditLogs] = await db.execute(
      `SELECT al.id, al.action, al.actionType, al.details, al.userId, al.createdAt,
       u.name as userName
       FROM AuditLog al
       LEFT JOIN User u ON al.userId = u.id
       WHERE al.entityType = 'RepairRequest' AND al.entityId = ? ORDER BY al.createdAt DESC`,
      [id]
    );

    const timeline = [];
    for (const s of statusLogs) {
      timeline.push({
        id: `status-${s.id}`,
        type: 'status_change',
        content: s.notes || `${s.fromStatus || ''} → ${s.toStatus || ''}`,
        author: s.userName || (s.changedById ? `مستخدم #${s.changedById}` : 'System'),
        createdAt: s.createdAt
      });
    }
    for (const a of auditLogs) {
      timeline.push({
        id: `audit-${a.id}`,
        type: a.actionType || 'note',
        content: a.details || a.action,
        author: a.userName || (a.userId ? `مستخدم #${a.userId}` : 'System'),
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

    // Extract estimated cost range from customFields (no average - direct range display)
    let estimatedCostRange = '';
    try {
      const customFields = typeof repair.customFields === 'string' 
        ? JSON.parse(repair.customFields) 
        : (repair.customFields || {});
      const minCost = customFields.estimatedCostMin;
      const maxCost = customFields.estimatedCostMax;
      if (minCost !== undefined && maxCost !== undefined && minCost !== null && maxCost !== null) {
        estimatedCostRange = `من ${minCost.toFixed(2)} إلى ${maxCost.toFixed(2)} ج.م`;
      }
    } catch (e) {
      // If parsing fails, leave empty
      estimatedCostRange = '';
    }

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
      customerName: repair.customerName || '',
      estimatedCostRange: estimatedCostRange || 'لم يتم تحديدها'
    };
    
    // Add estimated cost range to terms if not already included
    let termsText = settings.terms || '';
    if (estimatedCostRange && !termsText.includes('estimatedCostRange') && !termsText.includes('التكلفة المقدرة')) {
      termsText += `\n\nالتكلفة المقدرة للإصلاح: {{estimatedCostRange}}`;
    }
    
    const termsRendered = renderTemplate(termsText, termsVars)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // إنشاء رابط التتبع - يجب أن يكون الرابط الصحيح للواجهة الأمامية
    const { getFrontendUrl } = require('../utils/frontendUrl');
    const frontendUrl = getFrontendUrl(req);
    const trackUrl = `${frontendUrl}/track?trackingToken=${repair.trackingToken || repair.id}`;

    // Generate QR Code server-side
    let qrCodeDataUrl = '';
    try {
      const QRCode = require('qrcode');
      // استخدام حجم أكبر وجودة أعلى لضمان سهولة المسح
      const qrSize = settings.qrSize || 80; // استخدام الإعداد من printSettings أو 80 كقيمة افتراضية
      qrCodeDataUrl = await QRCode.toDataURL(trackUrl, {
        width: Math.min(Math.max(qrSize, 60), 150), // بين 60 و 150 بكسل
        margin: 2, // زيادة الهامش لسهولة المسح
        color: {
          dark: '#111827',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H' // مستوى تصحيح أعلى لضمان المسح حتى مع التلف البسيط
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
          width: ${settings.qrSize || 80}px !important;
          height: ${settings.qrSize || 80}px !important;
          max-width: 100%;
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
              <div style="background: #fff; padding: 6px; border: 2px solid #3b82f6; border-radius: 8px; display: inline-block; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);">
                <img src="${qrCodeDataUrl}" alt="QR Code" style="display: block; width: ${settings.qrSize || 80}px; height: ${settings.qrSize || 80}px; max-width: 100%;" />
              </div>
              <div class="qr-code-label" style="margin-top: 6px; font-weight: 700; color: #3b82f6; font-size: 9px;">📱 تتبع حالة الجهاز</div>
              <div style="font-size: 8px; color: #6b7280; margin-top: 2px;">امسح الكود لمتابعة الطلب</div>
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
    // جلب invoiceId من الفاتورة المرتبطة بطلب الإصلاح
    const [invoiceRows] = await db.execute(`
      SELECT id 
      FROM Invoice 
      WHERE repairRequestId = ? AND deletedAt IS NULL 
      LIMIT 1
    `, [id]);
    
    if (invoiceRows && invoiceRows.length > 0) {
      const invoiceId = invoiceRows[0].id;
      // إعادة التوجيه إلى route الفواتير الموحد
      // نستخدم relative URL للتوافق مع أي base URL
      return res.redirect(`/api/invoices/${invoiceId}/print`);
    }
    
    // إذا لم توجد فاتورة مرتبطة، نعرض رسالة خطأ
    return res.status(404).send(`
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>فاتورة غير موجودة</title>
          <style>
            body { font-family: 'Tajawal', Arial, sans-serif; text-align: center; padding: 50px; direction: rtl; }
            h1 { color: #dc2626; }
            p { color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>فاتورة غير موجودة</h1>
          <p>لم يتم العثور على فاتورة مرتبطة بطلب الإصلاح رقم ${id}</p>
          <p>يرجى إنشاء فاتورة أولاً من قسم الفواتير</p>
        </body>
      </html>
    `);
    
    // استخدام إعدادات الفاتورة أو الإعدادات العامة كبديل
    const getSetting = (key, defaultValue) => {
      // للقيم المتداخلة مثل colors.primary أو financial.showTax
      if (key.includes('.')) {
        const parts = key.split('.');
        let value = invoiceSettings;
        let found = true;
        
        // البحث في invoiceSettings
        for (let i = 0; i < parts.length; i++) {
          if (value && typeof value === 'object' && value[parts[i]] !== undefined) {
            value = value[parts[i]];
          } else {
            found = false;
            break;
          }
        }
        
        if (found && value !== undefined) {
          // للقيم boolean، نتحقق من false أيضاً
          if (typeof value === 'boolean') {
            return value;
          }
          // للقيم الأخرى، نتحقق من null و ''
          if (value !== null && value !== '') {
            return value;
          }
        }
        
        // البحث في settings العامة
        value = settings;
        found = true;
        for (let i = 0; i < parts.length; i++) {
          if (value && typeof value === 'object' && value[parts[i]] !== undefined) {
            value = value[parts[i]];
          } else {
            found = false;
            break;
          }
        }
        
        if (found && value !== undefined) {
          if (typeof value === 'boolean') {
            return value;
          }
          if (value !== null && value !== '') {
            return value;
          }
        }
        
        return defaultValue;
      }
      // للقيم العادية
      if (invoiceSettings[key] !== undefined) {
        // للقيم boolean، نتحقق من false أيضاً
        if (typeof invoiceSettings[key] === 'boolean') {
          return invoiceSettings[key];
        }
        // للقيم الأخرى، نتحقق من null و ''
        if (invoiceSettings[key] !== null && invoiceSettings[key] !== '') {
          return invoiceSettings[key];
        }
      }
      if (settings[key] !== undefined) {
        if (typeof settings[key] === 'boolean') {
          return settings[key];
        }
        if (settings[key] !== null && settings[key] !== '') {
          return settings[key];
        }
      }
      return defaultValue;
    };
    
    // Debug: طباعة الإعدادات للتحقق
    console.log('Invoice Settings:', JSON.stringify(invoiceSettings, null, 2));
    console.log('financial.showTax:', getSetting('financial.showTax', true));
    console.log('financial.showShipping:', getSetting('financial.showShipping', true));
    
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

    // جلب بيانات الفاتورة
    let invoice = { taxAmount: 0, shippingAmount: 0, totalAmount: 0 };
    
    try {
      // محاولة جلب جميع الأعمدة المتاحة
      const [invoiceRows] = await db.execute(`
        SELECT taxAmount, totalAmount
        FROM Invoice
        WHERE repairRequestId = ? AND deletedAt IS NULL
        LIMIT 1
      `, [id]);
      
      if (invoiceRows && invoiceRows.length > 0) {
        invoice.taxAmount = Number(invoiceRows[0].taxAmount) || 0;
        invoice.totalAmount = Number(invoiceRows[0].totalAmount) || 0;
        
        // محاولة جلب shippingAmount إذا كان موجوداً في قاعدة البيانات
        try {
          const [shippingCheck] = await db.execute(`
            SELECT shippingAmount
            FROM Invoice
            WHERE repairRequestId = ? AND deletedAt IS NULL
            LIMIT 1
          `, [id]);
          if (shippingCheck && shippingCheck.length > 0 && shippingCheck[0].shippingAmount !== undefined && shippingCheck[0].shippingAmount !== null) {
            invoice.shippingAmount = Number(shippingCheck[0].shippingAmount) || 0;
          }
        } catch (shippingError) {
          // العمود غير موجود، نستخدم 0
          invoice.shippingAmount = 0;
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      // في حالة الخطأ، نستخدم القيم الافتراضية
    }

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
    // 🔧 Fix: Use totalPrice from InvoiceItem instead of calculating quantity * unitPrice
    // This ensures consistency with the actual stored prices (including custom prices)
    let subtotal = 0;
    invoiceItems.forEach(item => {
      // Use totalPrice if available, otherwise calculate from quantity * unitPrice
      const itemTotal = (item.totalPrice !== null && item.totalPrice !== undefined)
        ? Number(item.totalPrice)
        : ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0));
      subtotal += itemTotal;
    });
    
    // حساب الضريبة: إذا كانت موجودة في الفاتورة نستخدمها، وإلا نحسبها من العناصر (15%)
    let taxAmount = Number(invoice.taxAmount) || 0;
    if (taxAmount === 0 && subtotal > 0) {
      // حساب الضريبة من مجموع العناصر (15%)
      taxAmount = subtotal * 0.15;
    }
    
    // استخدام قيمة الشحن من الفاتورة
    const shippingAmount = Number(invoice.shippingAmount) || 0;
    
    // Debug: طباعة القيم للتحقق
    console.log('Invoice values:', {
      taxAmount: invoice.taxAmount,
      shippingAmount: invoice.shippingAmount,
      calculatedTax: taxAmount,
      subtotal: subtotal
    });
    
    // حساب الإجمالي النهائي بناءً على الإعدادات
    const showTax = getSetting('financial.showTax', true);
    const showShipping = getSetting('financial.showShipping', true);
    const total = subtotal + (showTax ? taxAmount : 0) + (showShipping ? shippingAmount : 0);

    // ترجمة حالة الطلب (سيرفر سايد)
    const statusTextMap = {
      'RECEIVED': 'تم الاستلام',
      'INSPECTION': 'قيد الفحص',
      'UNDER_REPAIR': 'قيد الإصلاح',
      'WAITING_PARTS': 'بانتظار قطع غيار',
      'READY_FOR_PICKUP': 'جاهز للاستلام',
      'READY_FOR_DELIVERY': 'جاهز للتسليم',
      'DELIVERED': 'تم التسليم',
      'REJECTED': 'مرفوض',
      'ON_HOLD': 'معلق'
    };
    const statusText = statusTextMap[repair.status] || repair.status;

    // حساب requestNumber بنفس طريقة print receipt
    const reqDate = new Date(repair.createdAt);
    const requestNumber = repair.requestNumber || `REP-${reqDate.getFullYear()}${String(reqDate.getMonth() + 1).padStart(2, '0')}${String(reqDate.getDate()).padStart(2, '0')}-${String(repair.id).padStart(3, '0')}`;

    // إنشاء رابط التتبع للفاتورة
    const { getFrontendUrl } = require('../utils/frontendUrl');
    const frontendUrl = getFrontendUrl(req);
    const trackUrl = `${frontendUrl}/track/${repair.trackingToken || repair.id}`;
    
    // تنسيق التاريخ حسب الإعدادات
    const dateDisplayMode = getSetting('dateDisplay', 'both');
    const invoiceDate = new Date();
    const dates = formatDates(invoiceDate, dateDisplayMode);
    const formattedDate = dateDisplayMode === 'both' && dates.secondary 
      ? `${dates.primary}<br><small style="color:#6b7280;">${dates.secondary}</small>`
      : dates.primary;

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
          size: ${getSetting('paperSize', 'A4')};
          margin: ${getSetting('margins', {}).top || 20}mm ${getSetting('margins', {}).right || 20}mm ${getSetting('margins', {}).bottom || 20}mm ${getSetting('margins', {}).left || 20}mm;
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { 
          font-family: 'Tajawal','Cairo', 'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; 
          font-size:${getSetting('fontSize', 14)}px; 
          line-height:${getSetting('lineHeight', 1.6)}; 
          color:${getSetting('colors', {}).primary || '#1f2937'}; 
          background:#fff; 
        }
        .container { 
          max-width: ${getSetting('paperSize', 'A4') === 'A4' ? '210mm' : getSetting('paperSize', 'A4') === 'A5' ? '148mm' : '216mm'};
          min-height: ${getSetting('paperSize', 'A4') === 'A4' ? '297mm' : getSetting('paperSize', 'A4') === 'A5' ? '210mm' : '279mm'};
          margin: 0 auto;
          padding: ${getSetting('margins', {}).top || 20}mm ${getSetting('margins', {}).right || 20}mm ${getSetting('margins', {}).bottom || 20}mm ${getSetting('margins', {}).left || 20}mm;
          background: #fff;
        }
        .header { 
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: ${getSetting('spacing', {}).section || 25}px;
          padding-bottom: ${getSetting('spacing', {}).section || 25}px;
          border-bottom: 3px solid ${getSetting('colors', {}).primary || '#3b82f6'};
        }
        .header-left {
          flex: 1;
        }
        .logo { 
          font-size:${getSetting('titleFontSize', 28)}px; 
          font-weight:700; 
          color:${getSetting('colors', {}).primary || '#3b82f6'}; 
          margin-bottom:10px; 
        }
        .company-info { 
          font-size:${getSetting('fontSize', 14) - 1}px; 
          color:${getSetting('colors', {}).secondary || '#6b7280'};
          line-height: 1.8;
        }
        .header-right {
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: ${getSetting('spacing', {}).item || 15}px;
        }
        .invoice-number-box {
          background: linear-gradient(135deg, ${getSetting('colors', {}).primary || '#3b82f6'} 0%, ${getSetting('colors', {}).primary || '#3b82f6'}dd 100%);
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
          font-size: ${getSetting('titleFontSize', 20)}px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .qr-code-container {
          text-align: center;
          width: ${Math.min(getSetting('qrCodeSize', 80), 100)}px;
          height: auto;
          flex-shrink: 0;
        }
        .qr-code-label {
          font-size: 9px;
          color: ${getSetting('colors', {}).secondary || '#6b7280'};
          margin-top: 4px;
          line-height: 1.2;
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
          font-size: ${getSetting('sectionTitleFontSize', 16)}px;
          font-weight:700; 
          color:${getSetting('colors', {}).primary || '#111827'}; 
          margin-bottom:${getSetting('spacing', {}).item || 12}px; 
          padding-bottom:8px;
          border-bottom: 2px solid ${getSetting('colors', {}).primary || '#3b82f6'};
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
          background: ${getSetting('tableStyle', 'bordered') === 'bordered' 
            ? `linear-gradient(135deg, ${getSetting('colors', {}).primary || '#3b82f6'} 0%, ${getSetting('colors', {}).primary || '#3b82f6'}dd 100%)`
            : getSetting('colors', {}).headerBg || '#f9fafb'};
          color: ${getSetting('tableStyle', 'bordered') === 'bordered' ? '#fff' : getSetting('colors', {}).primary || '#111827'};
          font-weight:600;
          font-size: ${getSetting('tableFontSize', 13)}px;
        }
        .table tbody tr:hover {
          background: ${getSetting('colors', {}).alternateRow || '#f9fafb'};
        }
        .table tbody tr:nth-child(even) {
          background: ${getSetting('tableStyle', 'bordered') === 'striped' ? (getSetting('colors', {}).alternateRow || '#fafafa') : 'transparent'};
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
          font-size:${getSetting('sectionTitleFontSize', 18)}px; 
          border-top:3px solid ${getSetting('colors', {}).primary || '#3b82f6'};
          background: ${getSetting('colors', {}).alternateRow || '#f9fafb'};
        }
        .total-row td {
          color: ${getSetting('colors', {}).primary || '#111827'};
          font-size: ${getSetting('sectionTitleFontSize', 18)}px;
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
        ${getSetting('watermark', {}).enabled ? `
        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-45deg); font-size:48px; color:${getSetting('colors', {}).primary || '#000'}; opacity:${getSetting('watermark', {}).opacity || 0.1}; pointer-events:none; white-space:nowrap; z-index:1;">
          ${getSetting('watermark', {}).text || 'مسودة'}
        </div>
        ` : ''}
        <div class="header">
          <div class="header-left">
            ${getSetting('showLogo', false) && getSetting('logoUrl', '') ? `
            <div style="text-align:${getSetting('logoPosition', 'left') === 'center' ? 'center' : getSetting('logoPosition', 'left') === 'right' ? 'right' : 'left'}; margin-bottom:10px;">
              <img src="${getSetting('logoUrl', '')}" alt="Logo" style="height:${getSetting('logoHeight', 50)}px; max-width:100%; object-fit:contain;" />
            </div>
            ` : ''}
            ${!getSetting('showLogo', false) || !getSetting('logoUrl', '') ? `
            <div class="logo">${getSetting('showCompanyInfo', true) ? (settings.companyName || 'FixZone') : getSetting('title', 'فاتورة')}</div>
            ` : ''}
            ${getSetting('showCompanyInfo', true) ? `
            <div class="company-info">
              ${settings.address || invoiceSettings.address || 'العنوان غير محدد'}<br>
              ${settings.phone || invoiceSettings.phone ? `هاتف: ${settings.phone || invoiceSettings.phone}` : ''} ${settings.email || invoiceSettings.email ? `| بريد إلكتروني: ${settings.email || invoiceSettings.email}` : ''}
            </div>
            ` : ''}
          </div>
          <div class="header-right">
            ${getSetting('showInvoiceNumber', true) ? `
            <div class="invoice-number-box">
              <div class="invoice-number-label">رقم الفاتورة</div>
              <div class="invoice-number-value">INV-${requestNumber}</div>
            </div>
            ` : ''}
            ${getSetting('showQrCode', false) ? `
            <div class="qr-code-container" style="position:relative; width:${Math.min(getSetting('qrCodeSize', 80), 100)}px; height:${Math.min(getSetting('qrCodeSize', 80), 100)}px;">
              <canvas id="qrCanvas" width="${Math.min(getSetting('qrCodeSize', 80), 100)}" height="${Math.min(getSetting('qrCodeSize', 80), 100)}" style="border:1px solid ${getSetting('colors', {}).border || '#e5e7eb'}; border-radius:8px; padding:4px; max-width:100%; height:auto;"></canvas>
              <div class="qr-code-label" style="font-size:9px;">تتبع</div>
            </div>
            ` : ''}
          </div>
        </div>
        
        ${getSetting('showHeader', true) && getSetting('headerText', '') ? `
        <div style="text-align:center; margin-bottom:${getSetting('spacing', {}).section || 25}px; font-size:${getSetting('headerFontSize', 24)}px; font-weight:700; color:${getSetting('colors', {}).primary || '#111827'};">
          ${getSetting('headerText', 'فاتورة')}
        </div>
        ` : ''}

        <div class="invoice-info">
          ${getSetting('showInvoiceNumber', true) || getSetting('showInvoiceDate', true) ? `
          <div class="invoice-details">
            ${getSetting('showHeader', true) ? `<div class="section-title">تفاصيل الفاتورة</div>` : ''}
            ${getSetting('showInvoiceNumber', true) ? `<div class="info-row"><span class="label">رقم طلب الإصلاح:</span><span class="value">${requestNumber}</span></div>` : ''}
            ${getSetting('showInvoiceDate', true) ? `<div class="info-row"><span class="label">تاريخ الإصدار:</span><span class="value">${formattedDate}</span></div>` : ''}
            ${getSetting('showDueDate', true) ? `<div class="info-row"><span class="label">تاريخ الاستحقاق:</span><span class="value">${formatDates(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), dateDisplayMode).primary}</span></div>` : ''}
            <div class="info-row"><span class="label">حالة الطلب:</span><span class="value">${statusText}</span></div>
          </div>
          ` : ''}
          ${getSetting('showCustomerInfo', true) ? `
          <div class="customer-details">
            <div class="section-title">بيانات العميل</div>
            <div class="info-row"><span class="label">الاسم:</span><span class="value">${repair.customerName || 'غير محدد'}</span></div>
            <div class="info-row"><span class="label">الهاتف:</span><span class="value">${repair.customerPhone || 'غير محدد'}</span></div>
            ${repair.customerEmail ? `<div class="info-row"><span class="label">البريد:</span><span class="value">${repair.customerEmail}</span></div>` : ''}
            ${repair.customerAddress ? `<div class="info-row"><span class="label">العنوان:</span><span class="value">${repair.customerAddress}</span></div>` : ''}
          </div>
          ` : ''}
        </div>

        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: ${getSetting('spacing', {}).section || 20}px; border: 1px solid ${getSetting('colors', {}).border || '#e5e7eb'};">
          <div class="section-title" style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid ${getSetting('colors', {}).primary || '#3b82f6'};">تفاصيل الجهاز</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
            <div><span class="label">نوع الجهاز:</span> <strong>${repair.deviceType || 'غير محدد'}</strong></div>
            <div><span class="label">الماركة:</span> <strong>${repair.deviceBrand || 'غير محدد'}</strong></div>
            <div><span class="label">الموديل:</span> <strong>${repair.deviceModel || 'غير محدد'}</strong></div>
          </div>
        </div>

        ${getSetting('showItemsTable', true) ? `
        <div class="section-title" style="margin-top: 10px;">التكاليف والخدمات</div>
        <table class="table">
          <thead>
            <tr>
              ${getSetting('showItemDescription', true) ? '<th>الوصف</th>' : ''}
              ${getSetting('showItemQuantity', true) ? '<th class="number">الكمية</th>' : ''}
              ${getSetting('showItemPrice', true) ? '<th class="number">سعر الوحدة</th>' : ''}
              ${getSetting('showItemDiscount', true) ? '<th class="number">الخصم</th>' : ''}
              ${getSetting('showItemTax', true) ? '<th class="number">الضريبة</th>' : ''}
              ${getSetting('showItemTotal', true) ? '<th class="number">الإجمالي</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${invoiceItems.map(item => `
              <tr>
                ${getSetting('showItemDescription', true) ? `<td>${item.itemName || item.serviceName || item.description || 'عنصر غير محدد'}</td>` : ''}
                ${getSetting('showItemQuantity', true) ? `<td class="number">${Number(item.quantity) || 1}</td>` : ''}
                ${getSetting('showItemPrice', true) ? `<td class="number">${(Number(item.unitPrice) || 0).toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>` : ''}
                ${getSetting('showItemDiscount', true) ? `<td class="number">${item.discountAmount ? (Number(item.discountAmount) || 0).toFixed(getSetting('numberFormat', {}).decimalPlaces || 2) : '-'}</td>` : ''}
                ${getSetting('showItemTax', true) ? `<td class="number">${((Number(item.unitPrice) || 0) * 0.15).toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>` : ''}
                ${getSetting('showItemTotal', true) ? `<td class="number">${(((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0))).toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>` : ''}
              </tr>
            `).join('')}
            ${invoiceItems.length === 0 ? `<tr><td colspan="${[getSetting('showItemDescription', true), getSetting('showItemQuantity', true), getSetting('showItemPrice', true), getSetting('showItemDiscount', true), getSetting('showItemTax', true), getSetting('showItemTotal', true)].filter(Boolean).length}" style="text-align:center; color:#6b7280;">لا توجد عناصر في الفاتورة</td></tr>` : ''}
          </tbody>
        </table>
        ` : ''}

        <div class="totals">
          <table class="totals-table">
            ${getSetting('showSubtotal', true) ? `
            <tr>
              <td>المجموع الفرعي:</td>
              <td class="number">${subtotal.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
            </tr>
            ` : ''}
            ${getSetting('showDiscount', true) ? `
            <tr>
              <td>الخصم:</td>
              <td class="number">-${(0).toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
            </tr>
            ` : ''}
            ${getSetting('financial.showTax', true) ? `
            <tr>
              <td>الضريبة:</td>
              <td class="number">${taxAmount.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
            </tr>
            ` : ''}
            ${getSetting('financial.showShipping', true) ? `
            <tr>
              <td>الشحن:</td>
              <td class="number">${shippingAmount.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
            </tr>
            ` : ''}
            ${getSetting('showTotal', true) ? `
            <tr class="total-row">
              <td>الإجمالي:</td>
              <td class="number">${total.toFixed(getSetting('numberFormat', {}).decimalPlaces || 2)} ${getSetting('currency', {}).showSymbol ? (getSetting('currency', {}).symbolPosition === 'before' ? 'ج.م ' : '') : ''}${getSetting('currency', {}).showSymbol && getSetting('currency', {}).symbolPosition === 'after' ? ' ج.م' : ''}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${getSetting('showPaymentMethod', false) || getSetting('showPaymentStatus', false) ? `
        <div style="margin-top:${getSetting('spacing', {}).section || 20}px; margin-bottom:${getSetting('spacing', {}).section || 20}px; padding:15px; background:#f9fafb; border-radius:8px; border:1px solid ${getSetting('colors', {}).border || '#e5e7eb'};">
          ${getSetting('showPaymentMethod', false) ? `
          <div style="margin-bottom:${getSetting('spacing', {}).item || 10}px; display:flex; justify-content:space-between;">
            <span style="font-weight:600; color:${getSetting('colors', {}).secondary || '#6b7280'};">طريقة الدفع:</span>
            <span style="font-weight:600; color:${getSetting('colors', {}).primary || '#111827'};">نقد</span>
            </div>
          ` : ''}
          ${getSetting('showPaymentStatus', false) ? `
          <div style="display:flex; justify-content:space-between;">
            <span style="font-weight:600; color:${getSetting('colors', {}).secondary || '#6b7280'};">حالة الدفع:</span>
            <span style="font-weight:600; color:${getSetting('colors', {}).primary || '#111827'};">مدفوع</span>
          </div>
          ` : ''}
          </div>
        ` : ''}

        ${getSetting('showNotes', false) && getSetting('notesLabel', '') ? `
        <div style="margin-top:${getSetting('spacing', {}).section || 20}px; margin-bottom:${getSetting('spacing', {}).section || 20}px;">
          <div class="section-title">${getSetting('notesLabel', 'ملاحظات')}</div>
          <div style="background:#f9fafb; padding:12px; border-radius:6px; color:${getSetting('colors', {}).secondary || '#6b7280'};">
            شكراً لتعاملكم معنا. يرجى مراجعة الفاتورة والتأكد من صحة جميع البيانات.
          </div>
        </div>
        ` : ''}

        ${getSetting('showTerms', false) && getSetting('termsText', '') ? `
        <div style="margin-top:${getSetting('spacing', {}).section || 20}px; margin-bottom:${getSetting('spacing', {}).section || 20}px;">
          <div class="section-title">${getSetting('termsLabel', 'الشروط والأحكام')}</div>
          <div style="background:#f9fafb; padding:12px; border-radius:6px; color:${getSetting('colors', {}).secondary || '#6b7280'}; font-size:${getSetting('fontSize', 14) - 1}px; line-height:1.6;">
            ${getSetting('termsText', '')}
          </div>
        </div>
        ` : ''}

        ${getSetting('showFooter', true) ? `
        <div class="footer">
          <strong>شكراً لثقتكم بنا | ${settings.companyName || 'FixZone'}</strong>
          ${getSetting('footerText', '') ? `<br>${getSetting('footerText', '')}` : ''}
          ${getSetting('showQrCode', false) ? `<br>يمكنك تتبع حالة الجهاز من خلال رمز QR أعلاه` : ''}
        </div>
        ` : ''}

        <div class="no-print" style="text-align:center; margin-top:30px;">
          <button onclick="window.print()" style="padding:12px 30px; border:none; border-radius:8px; background:linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color:#fff; cursor:pointer; font-size:14px; font-weight:600; box-shadow: 0 2px 8px rgba(59,130,246,0.3);">🖨️ طباعة الفاتورة</button>
        </div>
      </div>
      ${getSetting('showQrCode', false) ? `
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
      <script>
        (function(){
          try {
            var canvas = document.getElementById('qrCanvas');
            if (canvas && window.QRCode) {
              var qrSize = Math.min(${getSetting('qrCodeSize', 80)}, 100);
              QRCode.toCanvas(canvas, '${trackUrl}', { 
                width: qrSize, 
                margin: 1,
                color: {
                  dark: '${getSetting('colors', {}).primary || '#111827'}',
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
        d.devicePassword,
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
    const dateText = dates.primary || '—';
    const customerName = repair.customerName || '—';
    const customerPhone = repair.customerPhone || '—';
    const deviceType = repair.deviceType || '—';
    const deviceModel = repair.deviceModel || '—';
    const serialNumber = repair.serialNumber || '—';
    const specs = {
      cpu: repair.cpu || '—',
      ram: repair.ram || '—',
      storage: repair.storage || '—'
    };
    const simpleRequestId = String(repair.id || '').padStart(4, '0');
    const html = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>استيكر - ${requestNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700&family=Cairo:wght@400;600&display=swap" rel="stylesheet" />
      <style>
        @page { 
          size: 40mm 58mm portrait;
          margin: 0;
        }
        html, body {
          width: 40mm;
          height: 58mm;
          margin: 0;
          padding: 0;
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
          font-size: 9px;
          background: #fff;
        }
        .sticker-container {
          width: 100%;
          height: 100%;
          border: 2px solid #111827;
          padding: 1mm 1mm 1.2mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #fff;
        }
        .sticker-header {
          text-align: center;
          border-bottom: 1px solid #111827;
          padding-bottom: 0.6mm;
          margin-bottom: 0.6mm;
        }
        .request-number {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 7.5px;
          color: #111827;
          padding: 0.2mm 0;
          margin-bottom: 0.4mm;
          border-bottom: 1px solid #e5e7eb;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
        }
        .meta-label {
          font-weight: 600;
          color: #6b7280;
          letter-spacing: 0.2px;
          font-size: 6.5px;
        }
        .meta-value {
          font-weight: 700;
          letter-spacing: 0.4px;
          font-size: 8px;
        }
        .info-list {
          display: flex;
          flex-direction: column;
          gap: 0.6mm;
          flex: 1;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1mm;
          padding: 0.2mm 0;
        }
        .info-row .label {
          font-size: 6.5px;
          color: #6b7280;
          font-weight: 600;
          text-align: right;
          flex: 0 0 44%;
          letter-spacing: 0.3px;
        }
        .info-row .value {
          font-size: 9.5px;
          font-weight: 700;
          color: #111827;
          text-align: left;
          flex: 1;
          word-break: break-word;
        }
        .caps-line {
          font-size: 9.2px;
          color: #111827;
          font-weight: 700;
          margin-top: 1.4mm;
          letter-spacing: 0.3px;
          display: flex;
          flex-direction: column;
          gap: 0.2mm;
        }
        .caps-label {
          font-size: 6.3px;
          color: #6b7280;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .caps-value {
          font-size: 9.6px;
          color: #111827;
          letter-spacing: 0.3px;
        }
        .problem-card {
          border-top: 1px solid #111827;
          padding-top: 1.2mm;
          margin-top: 1.4mm;
        }
        .problem-label {
          font-size: 6px;
          color: #6b7280;
          font-weight: 700;
          margin-bottom: 0.6mm;
          letter-spacing: 0.4px;
        }
        .problem-value {
          font-size: 8.6px;
          color: #111827;
          line-height: 1.5;
          max-height: 24mm;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 8;
          -webkit-box-orient: vertical;
        }
        @media print { 
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="sticker-container">
        <div class="sticker-header">
          <div class="request-number">${requestNumber}</div>
        </div>
        <div class="meta-row">
          <div class="meta-item">
            <span class="meta-label">رقم الطلب</span>
            <span class="meta-value">${simpleRequestId}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">التاريخ</span>
            <span class="meta-value">${dateText}</span>
          </div>
          </div>
        <div class="info-list">
          <div class="info-row">
            <span class="label">العميل</span>
            <span class="value">${customerName}</span>
          </div>
          <div class="info-row">
            <span class="label">رقم الموبايل</span>
            <span class="value">${customerPhone}</span>
          </div>
          <div class="info-row">
            <span class="label">النوع</span>
            <span class="value">${deviceType}</span>
          </div>
          <div class="info-row">
            <span class="label">الموديل</span>
            <span class="value">${deviceModel}</span>
          </div>
          <div class="info-row">
            <span class="label">السيريال</span>
            <span class="value">${serialNumber}</span>
          </div>
        </div>
        <div class="caps-line">
          <span class="caps-label">الإمكانيات</span>
          <span class="caps-value">CPU: ${specs.cpu} , RAM: ${specs.ram} , Storige: ${specs.storage}</span>
        </div>
        <div class="problem-card">
          <div class="problem-label">المشكلة</div>
          <div class="problem-value">${problem}</div>
        </div>
        <div class="no-print" style="text-align:center; margin-top:1.5mm;">
          <button onclick="window.print()" style="padding:2px 5px; font-size:6px; border:1px solid #111827; border-radius:3px; background:#111827; color:#fff; cursor:pointer;">طباعة</button>
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
