#!/usr/bin/env node
/**
 * الاستيراد النهائي الكامل مع IDs صريحة
 * Final Complete Import with Explicit IDs
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 بدء الاستيراد النهائي الكامل...\n');

// ... نفس الدوال المساعدة ...
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
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
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return `'${String(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

function generateTrackingToken() {
  return crypto.randomBytes(16).toString('hex');
}

function toMySQLDateTime(dateString) {
  if (!dateString) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return new Date().toISOString().slice(0, 19).replace('T', ' ');
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch (e) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
}

function mapStatus(oldStatusId) {
  const statusMap = {
    '1': 'RECEIVED', '2': 'INSPECTION', '3': 'AWAITING_APPROVAL',
    '4': 'UNDER_REPAIR', '5': 'READY_FOR_DELIVERY', '6': 'DELIVERED',
    '7': 'REJECTED', '8': 'WAITING_PARTS', '9': 'ON_HOLD'
  };
  return statusMap[String(oldStatusId)] || 'RECEIVED';
}

try {
  console.log('📂 قراءة الملفات...\n');
  
  const clientsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_data/clients.json'), 'utf8'));
  const invoicesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_data/invoices.json'), 'utf8'));
  
  const csv1Content = fs.readFileSync(path.join(__dirname, '../../../IN/الفواتير المنتهيه.csv'), 'utf8');
  const csv2Content = fs.readFileSync(path.join(__dirname, '../../../IN/الفواتير الغير مقفوله.csv'), 'utf8');
  
  const csv1Lines = csv1Content.split('\n').slice(3).filter(line => line.trim());
  const csv2Lines = csv2Content.split('\n').slice(3).filter(line => line.trim());
  const allCSVLines = [...csv1Lines, ...csv2Lines];
  
  console.log(`   ✅ العملاء: ${clientsData.rowCount}`);
  console.log(`   ✅ الفواتير: ${invoicesData.rowCount}`);
  console.log(`   ✅ CSV: ${allCSVLines.length}\\n`);
  
  // 1. استيراد العملاء مع IDs صريحة
  console.log('👥 استيراد العملاء مع IDs الأصلية...\\n');
  
  const activeClients = clientsData.rows.filter(c => !c.deleted_at);
  let customersSql = `-- العملاء (${activeClients.length})\n\n`;
  customersSql += 'INSERT INTO `Customer` (`id`, `name`, `phone`, `email`, `address`, `customFields`, `createdAt`, `updatedAt`, `deletedAt`) VALUES\n';
  
  const customerValues = activeClients.map(c => 
    `(${c.id}, ${escapeSql(c.name)}, ${escapeSql(c.phone)}, ${escapeSql(c.email)}, ${escapeSql(c.address)}, ${escapeSql(JSON.stringify({old_system_id: c.id, imported_at: new Date().toISOString()}))}, ${escapeSql(toMySQLDateTime(c.created_at))}, ${escapeSql(toMySQLDateTime(c.updated_at))}, ${escapeSql(c.deleted_at)})`
  );
  
  customersSql += customerValues.join(',\n') + ';\n';
  
  const OUTPUT_DIR = path.join(__dirname, 'import_sql');
  fs.writeFileSync(path.join(OUTPUT_DIR, '14_customers_with_ids.sql'), customersSql, 'utf8');
  console.log('   ✅ 14_customers_with_ids.sql\\n');
  
  // 2. خريطة الربط من CSV
  console.log('🔗 إنشاء خريطة الربط...\\n');
  
  const clientsByName = new Map();
  activeClients.forEach(c => {
    if (c.name) {
      const normalized = c.name.trim().toLowerCase()
        .replace(/\\s+/g, ' ')
        .replace(/أ|إ|آ/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي');
      if (!clientsByName.has(normalized)) {
        clientsByName.set(normalized, []);
      }
      clientsByName.get(normalized).push(c);
    }
  });
  
  const invoiceToClientMap = new Map();
  const stats = { success: 0, multiple: 0, noMatch: 0 };
  
  allCSVLines.forEach((line) => {
    const fields = parseCSVLine(line);
    if (fields.length < 8) return;
    
    const invoiceId = fields[1].trim();
    const customerName = fields[7].trim();
    if (!invoiceId || !customerName) return;
    
    const normalized = customerName.toLowerCase()
      .replace(/\\s+/g, ' ')
      .replace(/أ|إ|آ/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');
    
    const matches = clientsByName.get(normalized) || [];
    
    if (matches.length > 0) {
      invoiceToClientMap.set(invoiceId, matches[0].id);
      stats[matches.length === 1 ? 'success' : 'multiple']++;
    } else {
      stats.noMatch++;
    }
  });
  
  console.log(`   ✅ ربط: ${stats.success + stats.multiple}`);
  console.log(`   ❌ بدون ربط: ${stats.noMatch}\\n`);
  
  // 3. عميل عام
  const GENERAL_CUSTOMER_ID = 999999;
  const generalCustomerSQL = `-- عميل عام\nINSERT INTO \`Customer\` (\`id\`, \`name\`, \`createdAt\`, \`updatedAt\`) VALUES (${GENERAL_CUSTOMER_ID}, 'عملاء النظام القديم (غير مرتبطين)', NOW(), NOW());\n`;
  
  fs.writeFileSync(path.join(OUTPUT_DIR, '15_general_customer.sql'), generalCustomerSQL, 'utf8');
  console.log('   ✅ 15_general_customer.sql\\n');
  
  // 4. الأجهزة وطلبات الإصلاح
  console.log('🔄 تحويل الأجهزة والطلبات...\\n');
  
  const devices = [];
  const repairs = [];
  const activeInvoices = invoicesData.rows.filter(inv => !inv.deleted_at);
  
  let linkedCount = 0;
  let generalCount = 0;
  
  activeInvoices.forEach((invoice, idx) => {
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
      try { specs = JSON.parse(invoice.specifcations); } catch (e) {}
    }
    
    const deviceId = idx + 1;
    
    // Device
    devices.push({
      id: deviceId,
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
      updatedAt: toMySQLDateTime(invoice.updated_at)
    });
    
    // RepairRequest
    repairs.push({
      id: deviceId,
      deviceId: deviceId,
      customerId: clientId,
      branchId: 1,
      status: mapStatus(invoice.status_id),
      reportedProblem: invoice.problem_description || 'غير محدد',
      technicianReport: invoice.examination || null,
      trackingToken: generateTrackingToken(),
      diagnosticNotes: invoice.review_note || null,
      internalNotes: invoice.note || null,
      customerNotes: invoice.accessories || null,
      estimatedCost: parseFloat(invoice.expected_cost || invoice.total || 0) || 0,
      actualCost: parseFloat(invoice.paid || invoice.total || 0) || 0,
      notes: `رقم الفاتورة: ${invoice.ref_num || invoice.id}`,
      customFields: JSON.stringify({
        old_invoice_id: invoice.id,
        linked_via_csv: !!invoiceToClientMap.get(String(invoice.id)),
        imported_at: new Date().toISOString()
      }),
      createdAt: toMySQLDateTime(invoice.created_at),
      updatedAt: toMySQLDateTime(invoice.updated_at)
    });
  });
  
  console.log(`   ✅ ${devices.length} جهاز و ${repairs.length} طلب`);
  console.log(`   مرتبط: ${linkedCount} | عام: ${generalCount}\\n`);
  
  // حفظ SQL
  let devicesSql = `-- الأجهزة (${devices.length})\n\n`;
  devicesSql += 'INSERT INTO `Device` (`id`, `customerId`, `deviceType`, `brand`, `model`, `cpu`, `gpu`, `ram`, `storage`, `serialNumber`, `customFields`, `createdAt`, `updatedAt`, `deletedAt`) VALUES\n';
  
  const deviceVals = devices.map(d => 
    `(${d.id}, ${escapeSql(d.customerId)}, ${escapeSql(d.deviceType)}, ${escapeSql(d.brand)}, ${escapeSql(d.model)}, ${escapeSql(d.cpu)}, ${escapeSql(d.gpu)}, ${escapeSql(d.ram)}, ${escapeSql(d.storage)}, ${escapeSql(d.serialNumber)}, ${escapeSql(d.customFields)}, ${escapeSql(d.createdAt)}, ${escapeSql(d.updatedAt)}, NULL)`
  );
  
  devicesSql += deviceVals.join(',\n') + ';\n';
  fs.writeFileSync(path.join(OUTPUT_DIR, '16_devices_final.sql'), devicesSql, 'utf8');
  
  let repairsSql = `-- طلبات الإصلاح (${repairs.length})\n\n`;
  repairsSql += 'INSERT INTO `RepairRequest` (`id`, `deviceId`, `customerId`, `branchId`, `status`, `reportedProblem`, `technicianReport`, `trackingToken`, `diagnosticNotes`, `internalNotes`, `customerNotes`, `estimatedCost`, `actualCost`, `notes`, `customFields`, `createdAt`, `updatedAt`, `deletedAt`) VALUES\n';
  
  const repairVals = repairs.map(r => 
    `(${r.id}, ${escapeSql(r.deviceId)}, ${escapeSql(r.customerId)}, ${escapeSql(r.branchId)}, ${escapeSql(r.status)}, ${escapeSql(r.reportedProblem)}, ${escapeSql(r.technicianReport)}, ${escapeSql(r.trackingToken)}, ${escapeSql(r.diagnosticNotes)}, ${escapeSql(r.internalNotes)}, ${escapeSql(r.customerNotes)}, ${escapeSql(r.estimatedCost)}, ${escapeSql(r.actualCost)}, ${escapeSql(r.notes)}, ${escapeSql(r.customFields)}, ${escapeSql(r.createdAt)}, ${escapeSql(r.updatedAt)}, NULL)`
  );
  
  repairsSql += repairVals.join(',\n') + ';\n';
  fs.writeFileSync(path.join(OUTPUT_DIR, '17_repairs_final.sql'), repairsSql, 'utf8');
  
  console.log('💾 تم إنشاء الملفات:');
  console.log('   ✅ 14_customers_with_ids.sql');
  console.log('   ✅ 15_general_customer.sql');
  console.log('   ✅ 16_devices_final.sql');
  console.log('   ✅ 17_repairs_final.sql\\n');
  
  console.log('═'.repeat(60));
  console.log('🎉 اكتمل بنجاح!');
  console.log(`   ${linkedCount} مرتبط (${((linkedCount/repairs.length)*100).toFixed(1)}%)`);
  console.log(`   ${generalCount} عام (${((generalCount/repairs.length)*100).toFixed(1)}%)`);
  console.log('═'.repeat(60));
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  process.exit(1);
}

