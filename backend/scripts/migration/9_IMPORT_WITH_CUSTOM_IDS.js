#!/usr/bin/env node
/**
 * استيراد مع IDs مخصصة
 * - 6 طلبات للاختبار (IDs: 1-6) من ref_num < 1414
 * - الطلبات الفعلية تبدأ من ID 1400 (ref_num >= 1414)
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

console.log('🚀 بدء الاستيراد مع IDs مخصصة...\n');

async function main() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات\n');
    
    // قراءة البيانات
    const clientsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_data/clients.json'), 'utf8'));
    const invoicesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_data/invoices.json'), 'utf8'));
    
    const csv1Content = fs.readFileSync(path.join(__dirname, '../../../IN/الفواتير المنتهيه.csv'), 'utf8');
    const csv2Content = fs.readFileSync(path.join(__dirname, '../../../IN/الفواتير الغير مقفوله.csv'), 'utf8');
    
    // CSV parsing
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
    
    const csv1Lines = csv1Content.split('\n').slice(3).filter(line => line.trim());
    const csv2Lines = csv2Content.split('\n').slice(3).filter(line => line.trim());
    const allCSVLines = [...csv1Lines, ...csv2Lines];
    
    // خريطة الربط
    const activeClients = clientsData.rows.filter(c => !c.deleted_at);
    const clientsByName = new Map();
    activeClients.forEach(c => {
      if (c.name) {
        const normalized = c.name.trim().toLowerCase()
          .replace(/\s+/g, ' ')
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
    allCSVLines.forEach((line) => {
      const fields = parseCSVLine(line);
      if (fields.length < 8) return;
      
      const invoiceId = fields[1].trim();
      const customerName = fields[7].trim();
      if (!invoiceId || !customerName) return;
      
      const normalized = customerName.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/أ|إ|آ/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي');
      
      const matches = clientsByName.get(normalized) || [];
      if (matches.length > 0) {
        invoiceToClientMap.set(invoiceId, matches[0].id);
      }
    });
    
    console.log(`📊 خريطة الربط: ${invoiceToClientMap.size} فاتورة\n`);
    
    // العميل العام
    const GENERAL_CUSTOMER_ID = 999999;
    try {
      await connection.execute(
        'INSERT INTO `Customer` (`id`, `name`, `createdAt`, `updatedAt`) VALUES (?, ?, NOW(), NOW())',
        [GENERAL_CUSTOMER_ID, 'عملاء النظام القديم (غير مرتبطين)']
      );
      console.log('✅ العميل العام\n');
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') console.error('⚠️  العميل العام:', err.message);
    }
    
    // معالجة التواريخ
    function fixDate(val) {
      if (!val) return new Date();
      const d = new Date(val);
      if (isNaN(d.getTime())) return new Date('2024-01-01');
      return d;
    }
    
    async function insertDeviceAndRepair(invoice, deviceId) {
      let clientId = invoiceToClientMap.get(String(invoice.id));
      if (!clientId) clientId = GENERAL_CUSTOMER_ID;
      
      let specs = { CPU: null, GPU: null, RAM: null, Storage: null };
      if (invoice.specifcations) {
        try { specs = JSON.parse(invoice.specifcations); } catch (e) {}
      }
      
      // Device
      try {
        await connection.execute(
          'INSERT INTO `Device` (`id`, `customerId`, `deviceType`, `brand`, `model`, `cpu`, `gpu`, `ram`, `storage`, `serialNumber`, `customFields`, `createdAt`, `updatedAt`, `deletedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            deviceId,
            clientId,
            invoice.device_type || 'Laptop',
            invoice.brand || null,
            invoice.device_model || null,
            specs.CPU || null,
            specs.GPU || null,
            specs.RAM || null,
            specs.Storage || null,
            invoice.device_sn || null,
            JSON.stringify({ old_invoice_id: invoice.id, ref_num: invoice.ref_num, imported_at: new Date().toISOString() }),
            fixDate(invoice.created_at),
            fixDate(invoice.updated_at),
            null
          ]
        );
      } catch (err) {
        return false;
      }
      
      // RepairRequest
      try {
        await connection.execute(
          'INSERT INTO `RepairRequest` (`id`, `deviceId`, `customerId`, `branchId`, `status`, `reportedProblem`, `technicianReport`, `trackingToken`, `diagnosticNotes`, `internalNotes`, `customerNotes`, `estimatedCost`, `actualCost`, `notes`, `customFields`, `createdAt`, `updatedAt`, `deletedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            deviceId,
            deviceId,
            clientId,
            1,
            invoice.status_id == '6' ? 'DELIVERED' : invoice.status_id == '7' ? 'REJECTED' : 'RECEIVED',
            invoice.problem_description || 'غير محدد',
            invoice.examination || null,
            crypto.randomBytes(16).toString('hex'),
            invoice.review_note || null,
            invoice.note || null,
            invoice.accessories || null,
            parseFloat(invoice.expected_cost || invoice.total || 0) || 0,
            parseFloat(invoice.paid || invoice.total || 0) || 0,
            `رقم الفاتورة: ${invoice.ref_num || invoice.id}`,
            JSON.stringify({ old_invoice_id: invoice.id, ref_num: invoice.ref_num, linked_via_csv: !!invoiceToClientMap.get(String(invoice.id)), imported_at: new Date().toISOString() }),
            fixDate(invoice.created_at),
            fixDate(invoice.updated_at),
            null
          ]
        );
        return true;
      } catch (err) {
        return false;
      }
    }
    
    // 1. طلبات الاختبار (6 طلبات من ref_num < 1414)
    console.log('🧪 استيراد 6 طلبات للاختبار (IDs: 1-6)...');
    const testInvoices = invoicesData.rows.filter(inv => !inv.deleted_at && parseInt(inv.ref_num) < 1414 && inv.ref_num).slice(0, 6);
    
    let testAdded = 0;
    for (let i = 0; i < testInvoices.length; i++) {
      const success = await insertDeviceAndRepair(testInvoices[i], i + 1);
      if (success) testAdded++;
    }
    console.log(`   ✅ تم إضافة ${testAdded} طلب اختبار\n`);
    
    // 2. الطلبات الفعلية (تبدأ من ID 1400)
    console.log('🔧 استيراد الطلبات الفعلية (IDs من 1400)...');
    const realInvoices = invoicesData.rows.filter(inv => !inv.deleted_at && parseInt(inv.ref_num) >= 1414);
    console.log(`   📋 ${realInvoices.length} طلب\n`);
    
    let realAdded = 0;
    const START_ID = 1400;
    for (let i = 0; i < realInvoices.length; i++) {
      const success = await insertDeviceAndRepair(realInvoices[i], START_ID + i);
      if (success) realAdded++;
      
      if ((i + 1) % 50 === 0) {
        process.stdout.write(`\r   ${realAdded} طلب...`);
      }
    }
    console.log(`\n   ✅ تم إضافة ${realAdded} طلب فعلي\n`);
    
    // التحقق
    const [results] = await connection.execute(`
      SELECT 'العملاء' as name, COUNT(*) as count FROM Customer WHERE deletedAt IS NULL
      UNION ALL SELECT 'الأجهزة', COUNT(*) FROM Device WHERE deletedAt IS NULL
      UNION ALL SELECT 'طلبات الإصلاح', COUNT(*) FROM RepairRequest WHERE deletedAt IS NULL
    `);
    
    console.log('═'.repeat(60));
    console.log('🎉 النتيجة النهائية');
    console.log('═'.repeat(60));
    results.forEach(r => console.log(`   ${r.name}: ${r.count}`));
    console.log('═'.repeat(60));
    
    // نطاق IDs
    const [ranges] = await connection.execute(`
      SELECT 'اختبار' as type, MIN(id) as min_id, MAX(id) as max_id, COUNT(*) as count 
      FROM RepairRequest WHERE id < 100
      UNION ALL
      SELECT 'فعلي', MIN(id), MAX(id), COUNT(*) 
      FROM RepairRequest WHERE id >= 1400
    `);
    
    console.log('\n📊 نطاق IDs:');
    ranges.forEach(r => {
      console.log(`   ${r.type}: ${r.min_id} - ${r.max_id} (${r.count} طلب)`);
    });
    console.log('');
    
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) await connection.end();
  }
}

main();

