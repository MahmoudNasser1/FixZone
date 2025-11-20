#!/usr/bin/env node
/**
 * استيراد كامل للفواتير مع الربط - محسّن للSchema الفعلي
 * Full Import - Fixed for Actual Schema
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 بدء الاستيراد الكامل (محسّن للSchema)...\n');
console.log('═'.repeat(60));

// ... نفس الدوال المساعدة ...
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

function generateTrackingToken() {
  return crypto.randomBytes(16).toString('hex');
}

function toMySQLDateTime(dateString) {
  if (!dateString) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch (e) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
}

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
  
  const clientsData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'extracted_data/clients.json'), 'utf8'
  ));
  const invoicesData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'extracted_data/invoices.json'), 'utf8'
  ));
  
  const csv1Content = fs.readFileSync(
    path.join(__dirname, '../../../IN/الفواتير المنتهيه.csv'), 'utf8'
  );
  const csv2Content = fs.readFileSync(
    path.join(__dirname, '../../../IN/الفواتير الغير مقفوله.csv'), 'utf8'
  );
  
  const csv1Lines = csv1Content.split('\n').filter(line => line.trim()).slice(3);
  const csv2Lines = csv2Content.split('\n').filter(line => line.trim()).slice(3);
  const allCSVLines = [...csv1Lines, ...csv2Lines];
  
  console.log(`   ✅ العملاء: ${clientsData.rowCount}`);
  console.log(`   ✅ الفواتير: ${invoicesData.rowCount}`);
  console.log(`   ✅ CSV: ${allCSVLines.length}\n`);
  
  // خريطة العملاء
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
  
  console.log('🔗 إنشاء خريطة الربط...\n');
  
  const invoiceToClientMap = new Map();
  const stats = { success: 0, multiple: 0, noMatch: 0 };
  
  allCSVLines.forEach((line) => {
    const fields = parseCSVLine(line);
    if (fields.length < 8) return;
    
    const invoiceId = fields[1].trim();
    const customerName = fields[7].trim();
    if (!invoiceId || !customerName) return;
    
    const normalizedName = customerName
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/أ|إ|آ/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');
    
    const matches = clientsByName.get(normalizedName) || [];
    
    if (matches.length > 0) {
      invoiceToClientMap.set(invoiceId, matches[0].id);
      stats[matches.length === 1 ? 'success' : 'multiple']++;
    } else {
      stats.noMatch++;
    }
  });
  
  console.log(`   ✅ ربط: ${stats.success + stats.multiple}`);
  console.log(`   ❌ بدون ربط: ${stats.noMatch}\n`);
  
  // عميل عام
  const GENERAL_CUSTOMER_ID = 999999;
  const generalCustomerSQL = `-- عميل عام
INSERT INTO \`Customer\` (\`id\`, \`name\`, \`phone\`, \`email\`, \`address\`, \`createdAt\`, \`updatedAt\`, \`deletedAt\`)
VALUES (${GENERAL_CUSTOMER_ID}, 'عملاء النظام القديم (غير مرتبطين)', NULL, NULL, NULL, NOW(), NOW(), NULL);

`;
  
  console.log('🔄 تحويل البيانات...\n');
  
  const devices = [];
  const repairs = [];
  const activeInvoices = invoicesData.rows.filter(inv => !inv.deleted_at);
  
  let deviceId = 1;
  let linkedCount = 0;
  let generalCount = 0;
  
  activeInvoices.forEach(invoice => {
    let clientId = invoiceToClientMap.get(String(invoice.id));
    
    if (!clientId) {
      clientId = GENERAL_CUSTOMER_ID;
      generalCount++;
    } else {
      linkedCount++;
    }
    
    // استخراج المواصفات
    let specs = { CPU: null, GPU: null, RAM: null, Storage: null };
    if (invoice.specifcations) {
      try {
        specs = JSON.parse(invoice.specifcations);
      } catch (e) {}
    }
    
    // Device - متوافق مع Schema
    const device = {
      customerId: clientId,
      deviceType: invoice.device_type || 'Laptop',
      brand: invoice.brand || null,
      model: invoice.device_model || null,
      cpu: specs.CPU || null,
      gpu: specs.GPU || null,
      ram: specs.RAM || null,
      storage: specs.Storage || null,
      serialNumber: invoice.device_sn || null,
      customFields: JSON.stringify({
        old_invoice_id: invoice.id,
        imported_at: new Date().toISOString()
      }),
      createdAt: toMySQLDateTime(invoice.created_at),
      updatedAt: toMySQLDateTime(invoice.updated_at),
      deletedAt: null
    };
    
    devices.push(device);
    
    // RepairRequest - متوافق مع Schema
    // استخدام branchId = 1 (الفرع الرئيسي) فقط
    const repair = {
      deviceId: deviceId,
      customerId: clientId,
      branchId: 1, // جميع الطلبات للفرع الرئيسي
      status: mapStatus(invoice.status_id),
      reportedProblem: invoice.problem_description || 'غير محدد',
      technicianReport: invoice.examination || null,
      trackingToken: generateTrackingToken(),
      diagnosticNotes: invoice.review_note || null,
      internalNotes: invoice.note || null,
      customerNotes: invoice.accessories || null,
      estimatedCost: parseFloat(invoice.expected_cost || invoice.total || 0) || 0,
      actualCost: parseFloat(invoice.paid || invoice.total || 0) || 0,
      notes: `رقم الفاتورة القديم: ${invoice.ref_num || invoice.id}`,
      customFields: JSON.stringify({
        old_invoice_id: invoice.id,
        old_ref_num: invoice.ref_num,
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
  
  console.log(`✅ تم: ${devices.length} جهاز و ${repairs.length} طلب`);
  console.log(`   مرتبط: ${linkedCount} | عام: ${generalCount}\n`);
  
  // إنشاء SQL
  console.log('💾 إنشاء ملفات SQL...\n');
  
  const OUTPUT_DIR = path.join(__dirname, 'import_sql');
  
  // 1. العميل العام
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '11_customer_general.sql'),
    generalCustomerSQL,
    'utf8'
  );
  
  // 2. الأجهزة
  let devicesSql = `-- Devices (${devices.length})\n\n`;
  devicesSql += 'INSERT INTO `Device` (`customerId`, `deviceType`, `brand`, `model`, `cpu`, `gpu`, `ram`, `storage`, `serialNumber`, `customFields`, `createdAt`, `updatedAt`, `deletedAt`) VALUES\n';
  
  const deviceValues = devices.map(d => 
    `(${escapeSql(d.customerId)}, ${escapeSql(d.deviceType)}, ${escapeSql(d.brand)}, ${escapeSql(d.model)}, ${escapeSql(d.cpu)}, ${escapeSql(d.gpu)}, ${escapeSql(d.ram)}, ${escapeSql(d.storage)}, ${escapeSql(d.serialNumber)}, ${escapeSql(d.customFields)}, ${escapeSql(d.createdAt)}, ${escapeSql(d.updatedAt)}, ${escapeSql(d.deletedAt)})`
  );
  
  devicesSql += deviceValues.join(',\n') + ';\n';
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '12_devices_final.sql'),
    devicesSql,
    'utf8'
  );
  
  // 3. طلبات الإصلاح
  let repairsSql = `-- RepairRequests (${repairs.length})\n\n`;
  repairsSql += 'INSERT INTO `RepairRequest` (`deviceId`, `customerId`, `branchId`, `status`, `reportedProblem`, `technicianReport`, `trackingToken`, `diagnosticNotes`, `internalNotes`, `customerNotes`, `estimatedCost`, `actualCost`, `notes`, `customFields`, `createdAt`, `updatedAt`, `deletedAt`) VALUES\n';
  
  const repairValues = repairs.map(r => 
    `(${escapeSql(r.deviceId)}, ${escapeSql(r.customerId)}, ${escapeSql(r.branchId)}, ${escapeSql(r.status)}, ${escapeSql(r.reportedProblem)}, ${escapeSql(r.technicianReport)}, ${escapeSql(r.trackingToken)}, ${escapeSql(r.diagnosticNotes)}, ${escapeSql(r.internalNotes)}, ${escapeSql(r.customerNotes)}, ${escapeSql(r.estimatedCost)}, ${escapeSql(r.actualCost)}, ${escapeSql(r.notes)}, ${escapeSql(r.customFields)}, ${escapeSql(r.createdAt)}, ${escapeSql(r.updatedAt)}, ${escapeSql(r.deletedAt)})`
  );
  
  repairsSql += repairValues.join(',\n') + ';\n';
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '13_repairs_final.sql'),
    repairsSql,
    'utf8'
  );
  
  console.log('   ✅ 11_customer_general.sql');
  console.log('   ✅ 12_devices_final.sql');
  console.log('   ✅ 13_repairs_final.sql\n');
  
  console.log('═'.repeat(60));
  console.log('🎉 اكتمل!');
  console.log(`   ${linkedCount} مرتبط (${((linkedCount/repairs.length)*100).toFixed(1)}%)`);
  console.log(`   ${generalCount} عام (${((generalCount/repairs.length)*100).toFixed(1)}%)`);
  console.log('═'.repeat(60));
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
}

