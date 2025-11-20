#!/usr/bin/env node
/**
 * استيراد كامل للفواتير مع الربط بالعملاء من ملفات CSV
 * Full Import of Invoices with Customer Linking from CSV Files
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 بدء الاستيراد الكامل مع الربط من CSV...\n');
console.log('═'.repeat(60));

/**
 * تحليل سطر CSV
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
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
 * إنشاء tracking token
 */
function generateTrackingToken() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * تحويل التاريخ
 */
function toMySQLDateTime(dateString) {
  if (!dateString) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // تاريخ غير صالح - استخدم التاريخ الحالي
      return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch (e) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
}

/**
 * تحويل حالة النظام القديم
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

try {
  console.log('\n📂 قراءة الملفات...\n');
  
  // قراءة بيانات العملاء والفواتير
  const clientsData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'extracted_data/clients.json'), 'utf8'
  ));
  const invoicesData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'extracted_data/invoices.json'), 'utf8'
  ));
  
  console.log(`   ✅ العملاء: ${clientsData.rowCount}`);
  console.log(`   ✅ الفواتير من SQL: ${invoicesData.rowCount}`);
  
  // قراءة ملفات CSV
  const csv1Content = fs.readFileSync(
    path.join(__dirname, '../../../IN/الفواتير المنتهيه.csv'), 'utf8'
  );
  const csv2Content = fs.readFileSync(
    path.join(__dirname, '../../../IN/الفواتير الغير مقفوله.csv'), 'utf8'
  );
  
  const csv1Lines = csv1Content.split('\n').filter(line => line.trim()).slice(3);
  const csv2Lines = csv2Content.split('\n').filter(line => line.trim()).slice(3);
  
  console.log(`   ✅ CSV الفواتير المنتهية: ${csv1Lines.length}`);
  console.log(`   ✅ CSV الفواتير الغير مقفولة: ${csv2Lines.length}`);
  
  // دمج ملفات CSV
  const allCSVLines = [...csv1Lines, ...csv2Lines];
  console.log(`   📊 إجمالي CSV: ${allCSVLines.length}\n`);
  
  // إنشاء خريطة للعملاء
  const clientsByName = new Map();
  const activeClients = clientsData.rows.filter(c => !c.deleted_at);
  
  activeClients.forEach(client => {
    if (client.name) {
      const normalizedName = client.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/أ|إ|آ/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي');
      
      if (!clientsByName.has(normalizedName)) {
        clientsByName.set(normalizedName, []);
      }
      clientsByName.get(normalizedName).push(client);
    }
  });
  
  console.log('🗂️  خريطة العملاء جاهزة');
  console.log(`   أسماء فريدة: ${clientsByName.size}\n`);
  
  // إنشاء خريطة ربط من CSV
  console.log('🔗 إنشاء خريطة الربط من CSV...\n');
  
  const invoiceToClientMap = new Map();
  const stats = {
    success: 0,
    multiple: 0,
    noMatch: 0,
    invalid: 0
  };
  
  allCSVLines.forEach((line, index) => {
    const fields = parseCSVLine(line);
    
    if (fields.length < 8) {
      stats.invalid++;
      return;
    }
    
    const invoiceId = fields[1].trim();
    const customerName = fields[7].trim();
    
    if (!invoiceId || !customerName) {
      stats.invalid++;
      return;
    }
    
    const normalizedCustomerName = customerName
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/أ|إ|آ/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');
    
    const matchedClients = clientsByName.get(normalizedCustomerName) || [];
    
    if (matchedClients.length === 1) {
      invoiceToClientMap.set(invoiceId, matchedClients[0].id);
      stats.success++;
    } else if (matchedClients.length > 1) {
      // اختيار الأول
      invoiceToClientMap.set(invoiceId, matchedClients[0].id);
      stats.multiple++;
    } else {
      stats.noMatch++;
    }
  });
  
  console.log('📊 نتائج الربط:');
  console.log(`   ✅ ربط مباشر: ${stats.success}`);
  console.log(`   ⚠️  تطابقات متعددة (تم اختيار الأول): ${stats.multiple}`);
  console.log(`   ❌ بدون تطابق: ${stats.noMatch}`);
  console.log(`   ⚠️  سجلات غير صالحة: ${stats.invalid}\n`);
  
  // إنشاء عميل عام للفواتير غير المرتبطة
  console.log('👥 إنشاء عميل عام...\n');
  
  const GENERAL_CUSTOMER_ID = 999999;
  const generalCustomerSQL = `-- إنشاء عميل عام للفواتير غير المرتبطة
INSERT INTO \`Customer\` (\`id\`, \`name\`, \`phone\`, \`email\`, \`address\`, \`notes\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`)
VALUES (${GENERAL_CUSTOMER_ID}, 'عملاء النظام القديم (غير مرتبطين)', NULL, NULL, NULL, 'عميل عام تم إنشاؤه لربط الفواتير التي لم يتم العثور على عملائها في ملف CSV', NOW(), NOW(), NULL);

`;
  
  // الآن نبدأ تحويل الفواتير
  console.log('🔄 بدء تحويل الفواتير...\n');
  
  const devices = [];
  const repairs = [];
  const activeInvoices = invoicesData.rows.filter(inv => !inv.deleted_at);
  
  let deviceId = 1;
  let linkedCount = 0;
  let generalCount = 0;
  
  activeInvoices.forEach(invoice => {
    // محاولة الحصول على client_id من الخريطة
    let clientId = invoiceToClientMap.get(String(invoice.id));
    
    if (!clientId) {
      clientId = GENERAL_CUSTOMER_ID;
      generalCount++;
    } else {
      linkedCount++;
    }
    
    // إنشاء Device
    let deviceSpecs = {
      cpu: null,
      gpu: null,
      ram: null,
      storage: null,
      old_invoice_id: invoice.id,
      imported_at: new Date().toISOString()
    };
    
    // محاولة استخراج المواصفات من الحقل specifications
    if (invoice.specifcations) {
      try {
        const parsed = JSON.parse(invoice.specifcations);
        deviceSpecs.cpu = parsed.CPU || null;
        deviceSpecs.gpu = parsed.GPU || null;
        deviceSpecs.ram = parsed.RAM || null;
        deviceSpecs.storage = parsed.Storage || null;
      } catch (e) {
        // تجاهل خطأ JSON - سنستخدم القيم الافتراضية
      }
    }
    
    const device = {
      id: deviceId,
      customerId: clientId,
      serialNumber: invoice.device_sn || null,
      brand: invoice.brand || null,
      model: invoice.device_model || null,
      deviceType: invoice.device_type || 'Laptop',
      specs: JSON.stringify(deviceSpecs),
      createdAt: toMySQLDateTime(invoice.created_at),
      updatedAt: toMySQLDateTime(invoice.updated_at),
      deletedAt: null
    };
    
    devices.push(device);
    
    // إنشاء RepairRequest
    const trackingToken = generateTrackingToken();
    const requestNumber = invoice.ref_num ? `REP-${String(invoice.ref_num).padStart(6, '0')}` : `REP-${String(invoice.id).padStart(6, '0')}`;
    
    const repair = {
      customerId: clientId,
      deviceId: deviceId,
      branchId: invoice.branche_id || 1,
      status: mapStatus(invoice.status_id),
      problemDescription: invoice.problem_description || 'غير محدد',
      notes: invoice.note || null,
      accessories: invoice.accessories || null,
      estimatedCost: invoice.expected_cost || invoice.total || 0,
      finalCost: invoice.paid || invoice.total || 0,
      trackingToken: trackingToken,
      requestNumber: requestNumber,
      receivedAt: toMySQLDateTime(invoice.entery_at || invoice.created_at),
      inspectionNotes: invoice.examination || null,
      technicalNotes: invoice.review_note || null,
      customFields: JSON.stringify({
        old_invoice_id: invoice.id,
        old_client_id: invoice.client_id,
        payment_status: invoice.paid >= invoice.total ? 'paid' : 'pending',
        payment_type: invoice.payment,
        linked_via_csv: !!invoiceToClientMap.get(String(invoice.id)),
        imported_at: new Date().toISOString()
      }),
      createdAt: toMySQLDateTime(invoice.created_at),
      updatedAt: toMySQLDateTime(invoice.updated_at),
      deletedAt: null
    };
    
    repairs.push(repair);
    deviceId++;
  });
  
  console.log(`✅ تم تحويل ${devices.length} جهاز و ${repairs.length} طلب إصلاح`);
  console.log(`   مرتبط بعملاء: ${linkedCount}`);
  console.log(`   مرتبط بالعميل العام: ${generalCount}\n`);
  
  // إنشاء ملفات SQL
  console.log('💾 إنشاء ملفات SQL...\n');
  
  const OUTPUT_DIR = path.join(__dirname, 'import_sql');
  
  // ملف العميل العام
  const generalCustomerFile = path.join(OUTPUT_DIR, '8_import_general_customer.sql');
  fs.writeFileSync(generalCustomerFile, generalCustomerSQL, 'utf8');
  console.log(`   ✅ ${generalCustomerFile}`);
  
  // ملف الأجهزة
  let devicesSql = `-- استيراد الأجهزة مع الربط من CSV
-- Total: ${devices.length} devices
-- Linked via CSV: ${linkedCount}
-- Linked to general customer: ${generalCount}

INSERT INTO \`Device\` (\`customerId\`, \`serialNumber\`, \`brand\`, \`model\`, \`deviceType\`, \`specs\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`) VALUES\n`;
  
  const deviceValues = devices.map(d => 
    `(${escapeSql(d.customerId)}, ${escapeSql(d.serialNumber)}, ${escapeSql(d.brand)}, ${escapeSql(d.model)}, ${escapeSql(d.deviceType)}, ${escapeSql(d.specs)}, ${escapeSql(d.createdAt)}, ${escapeSql(d.updatedAt)}, ${escapeSql(d.deletedAt)})`
  );
  
  devicesSql += deviceValues.join(',\n');
  devicesSql += ';\n';
  
  const devicesFile = path.join(OUTPUT_DIR, '9_import_devices_with_csv.sql');
  fs.writeFileSync(devicesFile, devicesSql, 'utf8');
  console.log(`   ✅ ${devicesFile}`);
  
  // ملف طلبات الإصلاح
  let repairsSql = `-- استيراد طلبات الإصلاح مع الربط من CSV
-- Total: ${repairs.length} repair requests
-- Linked via CSV: ${linkedCount}
-- Linked to general customer: ${generalCount}

INSERT INTO \`RepairRequest\` (\`customerId\`, \`deviceId\`, \`branchId\`, \`status\`, \`problemDescription\`, \`notes\`, \`accessories\`, \`estimatedCost\`, \`finalCost\`, \`trackingToken\`, \`requestNumber\`, \`receivedAt\`, \`inspectionNotes\`, \`technicalNotes\`, \`customFields\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`) VALUES\n`;
  
  const repairValues = repairs.map(r => 
    `(${escapeSql(r.customerId)}, ${escapeSql(r.deviceId)}, ${escapeSql(r.branchId)}, ${escapeSql(r.status)}, ${escapeSql(r.problemDescription)}, ${escapeSql(r.notes)}, ${escapeSql(r.accessories)}, ${escapeSql(r.estimatedCost)}, ${escapeSql(r.finalCost)}, ${escapeSql(r.trackingToken)}, ${escapeSql(r.requestNumber)}, ${escapeSql(r.receivedAt)}, ${escapeSql(r.inspectionNotes)}, ${escapeSql(r.technicalNotes)}, ${escapeSql(r.customFields)}, ${escapeSql(r.createdAt)}, ${escapeSql(r.updatedAt)}, ${escapeSql(r.deletedAt)})`
  );
  
  repairsSql += repairValues.join(',\n');
  repairsSql += ';\n';
  
  const repairsFile = path.join(OUTPUT_DIR, '10_import_repairs_with_csv.sql');
  fs.writeFileSync(repairsFile, repairsSql, 'utf8');
  console.log(`   ✅ ${repairsFile}\n`);
  
  // تقرير نهائي
  console.log('═'.repeat(60));
  console.log('🎉 اكتمل التحويل بنجاح!\n');
  console.log('📊 الإحصائيات النهائية:');
  console.log(`   العملاء المستوردين: ${activeClients.length + 1} (+ عميل عام)`);
  console.log(`   الأجهزة: ${devices.length}`);
  console.log(`   طلبات الإصلاح: ${repairs.length}`);
  console.log(`   ✅ مرتبط بعملاء من CSV: ${linkedCount} (${((linkedCount/repairs.length)*100).toFixed(1)}%)`);
  console.log(`   ⚠️  مرتبط بالعميل العام: ${generalCount} (${((generalCount/repairs.length)*100).toFixed(1)}%)\n`);
  console.log('📁 الملفات المحفوظة في: ' + OUTPUT_DIR);
  console.log('═'.repeat(60));
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  console.error(error.stack);
  process.exit(1);
}

