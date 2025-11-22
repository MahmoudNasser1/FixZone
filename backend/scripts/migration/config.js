/**
 * تكوين الاتصال بقواعد البيانات للاستيراد
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

// اتصال قاعدة البيانات القديمة
const oldDbConfig = {
  host: process.env.OLD_DB_HOST || 'localhost',
  user: process.env.OLD_DB_USER || 'root',
  password: process.env.OLD_DB_PASSWORD || '',
  database: process.env.OLD_DB_NAME || 'u539485933_maintain',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// اتصال قاعدة البيانات الجديدة
const newDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fixzone',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// إنشاء pools للاتصال
let oldPool = null;
let newPool = null;

/**
 * الحصول على connection pool للقاعدة القديمة
 */
async function getOldDb() {
  if (!oldPool) {
    oldPool = mysql.createPool(oldDbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات القديمة');
  }
  return oldPool;
}

/**
 * الحصول على connection pool للقاعدة الجديدة
 */
async function getNewDb() {
  if (!newPool) {
    newPool = mysql.createPool(newDbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات الجديدة');
  }
  return newPool;
}

/**
 * إغلاق جميع الاتصالات
 */
async function closeAllConnections() {
  if (oldPool) {
    await oldPool.end();
    console.log('✅ تم إغلاق الاتصال بقاعدة البيانات القديمة');
  }
  if (newPool) {
    await newPool.end();
    console.log('✅ تم إغلاق الاتصال بقاعدة البيانات الجديدة');
  }
}

// إعدادات الاستيراد
const importConfig = {
  batchSize: 100, // عدد السجلات في كل دفعة
  defaultUserId: 1, // المستخدم الافتراضي
  defaultBranchId: 1, // الفرع الافتراضي
  skipDeletedRecords: true, // تخطي السجلات المحذوفة
  logErrors: true, // تسجيل الأخطاء
  outputDir: __dirname + '/output',
  logsDir: __dirname + '/logs',
  mappingsDir: __dirname + '/mappings'
};

/**
 * حفظ mapping إلى ملف JSON
 */
async function saveMapping(filename, data) {
  const fs = require('fs').promises;
  const path = require('path');
  const filepath = path.join(importConfig.mappingsDir, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ تم حفظ الـ mapping: ${filename}`);
}

/**
 * قراءة mapping من ملف JSON
 */
async function loadMapping(filename) {
  const fs = require('fs').promises;
  const path = require('path');
  const filepath = path.join(importConfig.mappingsDir, filename);
  try {
    const data = await fs.readFile(filepath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.warn(`⚠️ لم يتم العثور على ملف الـ mapping: ${filename}`);
    return null;
  }
}

/**
 * حفظ log
 */
async function saveLog(filename, data) {
  const fs = require('fs').promises;
  const path = require('path');
  const filepath = path.join(importConfig.logsDir, filename);
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}\n\n`;
  await fs.appendFile(filepath, logEntry, 'utf8');
}

/**
 * تنظيف رقم الهاتف
 */
function cleanPhoneNumber(phone) {
  if (!phone) return null;
  
  // إزالة جميع الأحرف غير الرقمية ماعدا +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // إزالة المسافات والأحرف الخاصة
  cleaned = cleaned.trim();
  
  // إذا كان الرقم فارغاً أو يحتوي على أحرف فقط
  if (!cleaned || cleaned === '.') {
    return null;
  }
  
  return cleaned;
}

/**
 * تقسيم الاسم الكامل إلى firstName و lastName
 */
function splitFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: 'Unknown', lastName: 'Customer' };
  }
  
  const parts = fullName.trim().split(/\s+/);
  
  if (parts.length === 0) {
    return { firstName: 'Unknown', lastName: 'Customer' };
  } else if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  } else {
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  }
}

/**
 * تحويل حالة الفاتورة من القديم للجديد
 */
function convertInvoiceStatus(paid, total) {
  if (!total || total <= 0) return 'unpaid';
  if (!paid || paid <= 0) return 'unpaid';
  if (paid >= total) return 'paid';
  return 'partial';
}

/**
 * تحويل حالة طلب الإصلاح
 */
function convertRepairStatus(oldStatusId, statusMapping) {
  // Default status mapping - سيتم تحديثه بناء على قراءة جدول status
  const defaultMapping = {
    '1': 'RECEIVED',        // جديد
    '2': 'INSPECTION',      // قيد الفحص
    '3': 'UNDER_REPAIR',    // قيد الإصلاح
    '4': 'WAITING_PARTS',   // بانتظار القطع
    '5': 'ON_HOLD',         // معلق
    '6': 'READY_FOR_DELIVERY', // جاهز للتسليم
    '7': 'DELIVERED',       // تم التسليم
    '8': 'REJECTED'         // ملغي
  };
  
  const mapping = statusMapping || defaultMapping;
  return mapping[oldStatusId] || 'RECEIVED';
}

/**
 * عرض إحصائيات
 */
function displayStats(title, stats) {
  console.log('\n' + '='.repeat(60));
  console.log(`📊 ${title}`);
  console.log('='.repeat(60));
  
  Object.entries(stats).forEach(([key, value]) => {
    const label = key.padEnd(30, ' ');
    console.log(`${label}: ${value}`);
  });
  
  console.log('='.repeat(60) + '\n');
}

module.exports = {
  getOldDb,
  getNewDb,
  closeAllConnections,
  importConfig,
  saveMapping,
  loadMapping,
  saveLog,
  cleanPhoneNumber,
  splitFullName,
  convertInvoiceStatus,
  convertRepairStatus,
  displayStats
};


