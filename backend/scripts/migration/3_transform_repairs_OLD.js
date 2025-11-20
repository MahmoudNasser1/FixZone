#!/usr/bin/env node
/**
 * تحويل طلبات الإصلاح والأجهزة من النظام القديم
 * Transform Repair Requests and Devices from Old System
 * 
 * هذا السكريبت يقوم بـ:
 * 1. قراءة البيانات المستخرجة (workorders, invoices)
 * 2. إنشاء Device لكل طلب
 * 3. إنشاء RepairRequest مرتبط بـ Device و Customer
 * 4. حفظ ملفات SQL للاستيراد
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// المسارات
const EXTRACTED_DIR = path.join(__dirname, 'extracted_data');
const OUTPUT_DIR = path.join(__dirname, 'import_sql');

console.log('🔄 بدء تحويل طلبات الإصلاح والأجهزة...\n');

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
  // مبني على status table في النظام القديم
  const statusMap = {
    '1': 'RECEIVED',          // Received
    '2': 'INSPECTION',        // Under Inspection  
    '3': 'AWAITING_APPROVAL', // Waiting Customer Approval
    '4': 'UNDER_REPAIR',      // Under Repair
    '5': 'READY_FOR_DELIVERY',// Ready for Delivery
    '6': 'DELIVERED',         // Delivered
    '7': 'REJECTED',          // Cancelled/Rejected
    '8': 'WAITING_PARTS',     // Waiting for Parts
    '9': 'ON_HOLD'            // On Hold
  };
  
  return statusMap[String(oldStatusId)] || 'RECEIVED';
}

/**
 * تحويل الأجهزة وطلبات الإصلاح
 */
function transformRepairsAndDevices(invoicesData, clientsData) {
  console.log('🔧 تحويل طلبات الإصلاح والأجهزة...\n');
  
  const devices = [];
  const repairs = [];
  
  // إنشاء خريطة للعملاء القدامى -> الجدد
  const clientMap = {};
  clientsData.rows.forEach((client, idx) => {
    if (!client.deleted_at) {
      clientMap[client.id] = idx + 1; // نفترض أن IDs الجديدة تبدأ من 1
    }
  });
  
  console.log(`   العملاء في الخريطة: ${Object.keys(clientMap).length}`);
  console.log(`   الفواتير للمعالجة: ${invoicesData.rows.length}\n`);
  
  // معالجة كل فاتورة
  invoicesData.rows.forEach((invoice, idx) => {
    // تخطي الفواتير المحذوفة
    if (invoice.deleted_at) {
      return;
    }
    
    // الحصول على معرف العميل الجديد
    const newCustomerId = clientMap[invoice.client_id];
    if (!newCustomerId) {
      console.log(`   ⚠️  تخطي فاتورة ${invoice.id} - العميل ${invoice.client_id} غير موجود`);
      return;
    }
    
    // إنشاء Device
    const deviceId = idx + 1;
    const device = {
      id: deviceId,
      customerId: newCustomerId,
      serialNumber: invoice.serial || null,
      brand: invoice.brand || null,
      model: invoice.model || null,
      deviceType: 'Laptop', // افتراضي - يمكن تحسينه لاحقاً
      specs: JSON.stringify({
        cpu: invoice.cpu || null,
        gpu: invoice.gpu || null,
        ram: invoice.ram || null,
        storage: invoice.hdd || null,
        old_system_id: invoice.id,
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
        old_client_id: invoice.client_id,
        payment_status: invoice.payment_status,
        price_type: invoice.price_type,
        imported_at: new Date().toISOString()
      }),
      createdAt: toMySQLDateTime(invoice.created_at),
      updatedAt: toMySQLDateTime(invoice.updated_at),
      deletedAt: null
    };
    
    repairs.push(repair);
  });
  
  console.log(`   ✅ تم تحويل ${devices.length} جهاز`);
  console.log(`   ✅ تم تحويل ${repairs.length} طلب إصلاح\n`);
  
  // إنشاء SQL للأجهزة
  let devicesSql = '-- استيراد الأجهزة من النظام القديم\n';
  devicesSql += '-- Import Devices from Old System\n';
  devicesSql += `-- Total: ${devices.length} devices\n\n`;
  
  if (devices.length > 0) {
    devicesSql += 'INSERT INTO `Device` (`customerId`, `serialNumber`, `brand`, `model`, `deviceType`, `specs`, `createdAt`, `updatedAt`, `deletedAt`) VALUES\n';
    
    const deviceValues = devices.map(d => 
      `(${escapeSql(d.customerId)}, ${escapeSql(d.serialNumber)}, ${escapeSql(d.brand)}, ${escapeSql(d.model)}, ${escapeSql(d.deviceType)}, ${escapeSql(d.specs)}, ${escapeSql(d.createdAt)}, ${escapeSql(d.updatedAt)}, ${escapeSql(d.deletedAt)})`
    );
    
    devicesSql += deviceValues.join(',\n');
    devicesSql += ';\n';
  }
  
  // إنشاء SQL لطلبات الإصلاح
  let repairsSql = '-- استيراد طلبات الإصلاح من النظام القديم\n';
  repairsSql += '-- Import Repair Requests from Old System\n';
  repairsSql += `-- Total: ${repairs.length} repair requests\n\n`;
  
  if (repairs.length > 0) {
    repairsSql += 'INSERT INTO `RepairRequest` (`customerId`, `deviceId`, `branchId`, `status`, `problemDescription`, `notes`, `accessories`, `estimatedCost`, `finalCost`, `trackingToken`, `requestNumber`, `receivedAt`, `inspectionNotes`, `technicalNotes`, `customFields`, `createdAt`, `updatedAt`, `deletedAt`) VALUES\n';
    
    const repairValues = repairs.map(r => 
      `(${escapeSql(r.customerId)}, ${escapeSql(r.deviceId)}, ${escapeSql(r.branchId)}, ${escapeSql(r.status)}, ${escapeSql(r.problemDescription)}, ${escapeSql(r.notes)}, ${escapeSql(r.accessories)}, ${escapeSql(r.estimatedCost)}, ${escapeSql(r.finalCost)}, ${escapeSql(r.trackingToken)}, ${escapeSql(r.requestNumber)}, ${escapeSql(r.receivedAt)}, ${escapeSql(r.inspectionNotes)}, ${escapeSql(r.technicalNotes)}, ${escapeSql(r.customFields)}, ${escapeSql(r.createdAt)}, ${escapeSql(r.updatedAt)}, ${escapeSql(r.deletedAt)})`
    );
    
    repairsSql += repairValues.join(',\n');
    repairsSql += ';\n';
  }
  
  return {
    devicesSql,
    repairsSql,
    devicesCount: devices.length,
    repairsCount: repairs.length
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
  console.log(`\n📊 الإحصائيات:`);
  console.log(`   الأجهزة: ${result.devicesCount}`);
  console.log(`   طلبات الإصلاح: ${result.repairsCount}`);
  console.log(`\n📁 الملفات المحفوظة في: ${OUTPUT_DIR}`);
  console.log('\n⏭️  الخطوة التالية: تشغيل ملفات SQL بالترتيب');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  console.error(error.stack);
  process.exit(1);
}

