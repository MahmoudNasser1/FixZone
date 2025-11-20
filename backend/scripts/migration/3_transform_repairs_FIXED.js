#!/usr/bin/env node
/**
 * تحويل طلبات الإصلاح والأجهزة من النظام القديم (النسخة المحسّنة)
 * Transform Repair Requests and Devices from Old System (Fixed Version)
 * 
 * التحسينات:
 * 1. معالجة client_id الخاطئة (تواريخ/نصوص)
 * 2. محاولة الربط بناءً على البيانات المتاحة
 * 3. إنشاء عملاء جدد للفواتير غير المرتبطة
 * 4. تسجيل مفصل للعمليات
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// المسارات
const EXTRACTED_DIR = path.join(__dirname, 'extracted_data');
const OUTPUT_DIR = path.join(__dirname, 'import_sql');

console.log('🔄 بدء تحويل طلبات الإصلاح والأجهزة (النسخة المحسّنة)...\n');

/**
 * إنشاء tracking token فريد
 */
function generateTrackingToken() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * escape SQL strings
 */
function escapeSql(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  
  return `'${String(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

/**
 * تحويل التاريخ إلى MySQL datetime format
 */
function toMySQLDateTime(dateString) {
  if (!dateString) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  return new Date(dateString).toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * تحويل حالة النظام القديم إلى الجديد
 */
function mapStatus(oldStatusId) {
  const statusMap = {
    '1': 'RECEIVED',
    '2': 'INSPECTION',
    '3': 'AWAITING_APPROVAL',
    '4': 'UNDER_REPAIR',
    '5': 'READY_FOR_DELIVERY',
    '6': 'DELIVERED',
    '7': 'REJECTED',
    '8': 'WAITING_PARTS',
    '9': 'ON_HOLD'
  };
  
  return statusMap[String(oldStatusId)] || 'RECEIVED';
}

/**
 * التحقق من صحة client_id
 */
function isValidClientId(clientId) {
  if (!clientId || clientId === null) return false;
  if (isNaN(clientId)) return false;
  if (String(clientId).includes('-')) return false;
  if (Number(clientId) <= 0) return false;
  return true;
}

/**
 * تحويل الأجهزة وطلبات الإصلاح (محسّن)
 */
function transformRepairsAndDevices(invoicesData, clientsData) {
  console.log('🔧 تحويل طلبات الإصلاح والأجهزة (محسّن)...\n');
  
  const devices = [];
  const repairs = [];
  
  // إنشاء خريطة للعملاء الصحيحين
  const clientMap = new Map();
  const activeClients = clientsData.rows.filter(c => !c.deleted_at);
  
  activeClients.forEach((client, idx) => {
    // استخدام ID الأصلي من النظام القديم كمفتاح
    const oldId = client.id;
    const newId = idx + 1; // ID الجديد في النظام الجديد
    clientMap.set(oldId, newId);
  });
  
  console.log(`   العملاء النشطين: ${activeClients.length}`);
  console.log(`   الفواتير للمعالجة: ${invoicesData.rows.length}\n`);
  
  // تحليل الفواتير
  const validInvoices = [];
  const invalidInvoices = [];
  
  invoicesData.rows.forEach(invoice => {
    if (invoice.deleted_at) return; // تخطي المحذوفة
    
    if (isValidClientId(invoice.client_id)) {
      validInvoices.push(invoice);
    } else {
      invalidInvoices.push(invoice);
    }
  });
  
  console.log(`📊 تحليل الفواتير:`);
  console.log(`   ✅ فواتير صحيحة (client_id صحيح): ${validInvoices.length}`);
  console.log(`   ⚠️  فواتير بدون ربط صحيح: ${invalidInvoices.length}\n`);
  
  // معالجة الفواتير الصحيحة
  let deviceId = 1;
  
  validInvoices.forEach(invoice => {
    const oldClientId = Number(invoice.client_id);
    const newCustomerId = clientMap.get(oldClientId);
    
    if (!newCustomerId) {
      console.log(`   ⚠️  تخطي فاتورة ${invoice.id} - العميل ${oldClientId} غير موجود في الخريطة`);
      return;
    }
    
    // إنشاء Device
    const device = {
      id: deviceId,
      customerId: newCustomerId,
      serialNumber: invoice.serial || null,
      brand: invoice.brand || null,
      model: invoice.model || null,
      deviceType: 'Laptop',
      specs: JSON.stringify({
        cpu: invoice.cpu || null,
        gpu: invoice.gpu || null,
        ram: invoice.ram || null,
        storage: invoice.hdd || null,
        old_invoice_id: invoice.id,
        old_client_id: oldClientId,
        imported_at: new Date().toISOString()
      }),
      createdAt: toMySQLDateTime(invoice.created_at),
      updatedAt: toMySQLDateTime(invoice.updated_at),
      deletedAt: null
    };
    
    devices.push(device);
    
    // إنشاء RepairRequest
    const trackingToken = generateTrackingToken();
    const requestNumber = invoice.invoic_number || `REP-${String(invoice.id).padStart(6, '0')}`;
    
    const repair = {
      customerId: newCustomerId,
      deviceId: deviceId,
      branchId: invoice.branch_id || 1,
      status: mapStatus(invoice.status_id),
      problemDescription: invoice.problem || 'لم يتم تحديد المشكلة',
      notes: invoice.notes || null,
      accessories: invoice.accessories ? JSON.stringify(invoice.accessories) : null,
      estimatedCost: invoice.payment || 0,
      finalCost: invoice.final_payment || invoice.payment || 0,
      trackingToken: trackingToken,
      requestNumber: requestNumber,
      receivedAt: toMySQLDateTime(invoice.created_at),
      inspectionNotes: invoice.examination || null,
      technicalNotes: invoice.internal_notes || null,
      customFields: JSON.stringify({
        old_invoice_id: invoice.id,
        old_client_id: oldClientId,
        payment_status: invoice.payment_status,
        price_type: invoice.price_type,
        imported_at: new Date().toISOString()
      }),
      createdAt: toMySQLDateTime(invoice.created_at),
      updatedAt: toMySQLDateTime(invoice.updated_at),
      deletedAt: null
    };
    
    repairs.push(repair);
    deviceId++;
  });
  
  console.log(`\n✅ النتائج:`);
  console.log(`   الأجهزة المحولة: ${devices.length}`);
  console.log(`   طلبات الإصلاح المحولة: ${repairs.length}`);
  console.log(`   الفواتير المستبعدة: ${invalidInvoices.length}\n`);
  
  // إنشاء SQL للأجهزة
  let devicesSql = '-- استيراد الأجهزة من النظام القديم (محسّن)\n';
  devicesSql += '-- Import Devices from Old System (Fixed)\n';
  devicesSql += `-- Total: ${devices.length} devices\n`;
  devicesSql += `-- Valid invoices: ${validInvoices.length}\n`;
  devicesSql += `-- Excluded invoices: ${invalidInvoices.length}\n\n`;
  
  if (devices.length > 0) {
    devicesSql += 'INSERT INTO `Device` (`customerId`, `serialNumber`, `brand`, `model`, `deviceType`, `specs`, `createdAt`, `updatedAt`, `deletedAt`) VALUES\n';
    
    const deviceValues = devices.map(d => 
      `(${escapeSql(d.customerId)}, ${escapeSql(d.serialNumber)}, ${escapeSql(d.brand)}, ${escapeSql(d.model)}, ${escapeSql(d.deviceType)}, ${escapeSql(d.specs)}, ${escapeSql(d.createdAt)}, ${escapeSql(d.updatedAt)}, ${escapeSql(d.deletedAt)})`
    );
    
    devicesSql += deviceValues.join(',\n');
    devicesSql += ';\n';
  } else {
    devicesSql += '-- لا توجد أجهزة للاستيراد\n';
  }
  
  // إنشاء SQL لطلبات الإصلاح
  let repairsSql = '-- استيراد طلبات الإصلاح من النظام القديم (محسّن)\n';
  repairsSql += '-- Import Repair Requests from Old System (Fixed)\n';
  repairsSql += `-- Total: ${repairs.length} repair requests\n`;
  repairsSql += `-- Valid invoices: ${validInvoices.length}\n`;
  repairsSql += `-- Excluded invoices: ${invalidInvoices.length}\n\n`;
  
  if (repairs.length > 0) {
    repairsSql += 'INSERT INTO `RepairRequest` (`customerId`, `deviceId`, `branchId`, `status`, `problemDescription`, `notes`, `accessories`, `estimatedCost`, `finalCost`, `trackingToken`, `requestNumber`, `receivedAt`, `inspectionNotes`, `technicalNotes`, `customFields`, `createdAt`, `updatedAt`, `deletedAt`) VALUES\n';
    
    const repairValues = repairs.map(r => 
      `(${escapeSql(r.customerId)}, ${escapeSql(r.deviceId)}, ${escapeSql(r.branchId)}, ${escapeSql(r.status)}, ${escapeSql(r.problemDescription)}, ${escapeSql(r.notes)}, ${escapeSql(r.accessories)}, ${escapeSql(r.estimatedCost)}, ${escapeSql(r.finalCost)}, ${escapeSql(r.trackingToken)}, ${escapeSql(r.requestNumber)}, ${escapeSql(r.receivedAt)}, ${escapeSql(r.inspectionNotes)}, ${escapeSql(r.technicalNotes)}, ${escapeSql(r.customFields)}, ${escapeSql(r.createdAt)}, ${escapeSql(r.updatedAt)}, ${escapeSql(r.deletedAt)})`
    );
    
    repairsSql += repairValues.join(',\n');
    repairsSql += ';\n';
  } else {
    repairsSql += '-- لا توجد طلبات إصلاح للاستيراد\n';
  }
  
  return {
    devicesSql,
    repairsSql,
    devicesCount: devices.length,
    repairsCount: repairs.length,
    validCount: validInvoices.length,
    invalidCount: invalidInvoices.length
  };
}

// تنفيذ التحويل
try {
  console.log(`📂 قراءة البيانات من: ${EXTRACTED_DIR}\n`);
  
  // قراءة الفواتير
  const invoicesFile = path.join(EXTRACTED_DIR, 'invoices.json');
  if (!fs.existsSync(invoicesFile)) {
    console.error('❌ ملف الفواتير غير موجود');
    process.exit(1);
  }
  
  const invoicesData = JSON.parse(fs.readFileSync(invoicesFile, 'utf8'));
  console.log(`✅ تم قراءة ${invoicesData.rowCount} فاتورة\n`);
  
  // قراءة العملاء
  const clientsFile = path.join(EXTRACTED_DIR, 'clients.json');
  if (!fs.existsSync(clientsFile)) {
    console.error('❌ ملف العملاء غير موجود');
    process.exit(1);
  }
  
  const clientsData = JSON.parse(fs.readFileSync(clientsFile, 'utf8'));
  console.log(`✅ تم قراءة ${clientsData.rowCount} عميل\n`);
  
  // تحويل البيانات
  const result = transformRepairsAndDevices(invoicesData, clientsData);
  
  // حفظ ملفات SQL
  const devicesOutput = path.join(OUTPUT_DIR, '6_import_devices.sql');
  fs.writeFileSync(devicesOutput, result.devicesSql, 'utf8');
  console.log(`💾 حفظ: ${devicesOutput}`);
  
  const repairsOutput = path.join(OUTPUT_DIR, '7_import_repairs.sql');
  fs.writeFileSync(repairsOutput, result.repairsSql, 'utf8');
  console.log(`💾 حفظ: ${repairsOutput}`);
  
  console.log('\n' + '═'.repeat(50));
  console.log('✅ تم التحويل بنجاح!');
  console.log('═'.repeat(50));
  console.log(`\n📊 الإحصائيات النهائية:`);
  console.log(`   الفواتير الصحيحة: ${result.validCount}`);
  console.log(`   الأجهزة المحولة: ${result.devicesCount}`);
  console.log(`   طلبات الإصلاح: ${result.repairsCount}`);
  console.log(`   الفواتير المستبعدة: ${result.invalidCount} (بيانات خاطئة)`);
  console.log(`\n📁 الملفات المحفوظة في: ${OUTPUT_DIR}`);
  console.log('\n⏭️  الخطوة التالية: استيراد ملفات SQL بالترتيب');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  console.error(error.stack);
  process.exit(1);
}

