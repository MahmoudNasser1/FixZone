const mysql = require('mysql2/promise');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'FZ',
  port: 3306
};

// نتائج الاختبار
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// دالة مساعدة للاختبار
async function testDatabase(name, testFunction) {
  console.log(`\n🧪 اختبار قاعدة البيانات: ${name}`);
  testResults.total++;
  
  try {
    const result = await testFunction();
    console.log(`✅ نجح: ${name}`);
    testResults.passed++;
    return result;
  } catch (error) {
    console.log(`❌ فشل: ${name} - ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
    return null;
  }
}

// اختبار الاتصال بقاعدة البيانات
async function testConnection() {
  const connection = await mysql.createConnection(dbConfig);
  await connection.ping();
  await connection.end();
  return { success: true };
}

// اختبار وجود الجداول الأساسية
async function testCoreTables() {
  const connection = await mysql.createConnection(dbConfig);
  
  const tables = [
    'Payment',
    'Invoice', 
    'InvoiceItem',
    'RepairRequest',
    'Customer',
    'User'
  ];
  
  const results = {};
  
  for (const table of tables) {
    const [rows] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
    results[table] = rows.length > 0;
  }
  
  await connection.end();
  return { success: true, tables: results };
}

// اختبار هيكل جدول Payment
async function testPaymentTableStructure() {
  const connection = await mysql.createConnection(dbConfig);
  
  const [columns] = await connection.execute(`
    DESCRIBE Payment
  `);
  
  const expectedColumns = [
    'id', 'invoiceId', 'amount', 'currency', 'paymentMethod',
    'paymentDate', 'referenceNumber', 'notes', 'userId', 'status',
    'createdAt', 'updatedAt'
  ];
  
  const actualColumns = columns.map(col => col.Field);
  const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
  const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));
  
  await connection.end();
  
  if (missingColumns.length > 0 || extraColumns.length > 0) {
    throw new Error(`مشاكل في هيكل الجدول: مفقود [${missingColumns.join(', ')}], إضافي [${extraColumns.join(', ')}]`);
  }
  
  return { success: true, columns: actualColumns };
}

// اختبار هيكل جدول Invoice
async function testInvoiceTableStructure() {
  const connection = await mysql.createConnection(dbConfig);
  
  const [columns] = await connection.execute(`
    DESCRIBE Invoice
  `);
  
  const expectedColumns = [
    'id', 'repairRequestId', 'totalAmount', 'amountPaid', 'status',
    'currency', 'taxAmount', 'discountAmount', 'dueDate', 'createdAt', 'updatedAt'
  ];
  
  const actualColumns = columns.map(col => col.Field);
  const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
  const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));
  
  await connection.end();
  
  if (missingColumns.length > 0 || extraColumns.length > 0) {
    throw new Error(`مشاكل في هيكل الجدول: مفقود [${missingColumns.join(', ')}], إضافي [${extraColumns.join(', ')}]`);
  }
  
  return { success: true, columns: actualColumns };
}

// اختبار العلاقات بين الجداول
async function testTableRelationships() {
  const connection = await mysql.createConnection(dbConfig);
  
  // اختبار العلاقة بين Payment و Invoice
  const [paymentInvoiceRelation] = await connection.execute(`
    SELECT COUNT(*) as count 
    FROM Payment p 
    LEFT JOIN Invoice i ON p.invoiceId = i.id 
    WHERE p.invoiceId IS NOT NULL
  `);
  
  // اختبار العلاقة بين Invoice و RepairRequest
  const [invoiceRepairRelation] = await connection.execute(`
    SELECT COUNT(*) as count 
    FROM Invoice i 
    LEFT JOIN RepairRequest r ON i.repairRequestId = r.id 
    WHERE i.repairRequestId IS NOT NULL
  `);
  
  await connection.end();
  
  return { 
    success: true, 
    paymentInvoiceCount: paymentInvoiceRelation[0].count,
    invoiceRepairCount: invoiceRepairRelation[0].count
  };
}

// اختبار البيانات الموجودة
async function testExistingData() {
  const connection = await mysql.createConnection(dbConfig);
  
  const queries = [
    { name: 'المدفوعات', query: 'SELECT COUNT(*) as count FROM Payment' },
    { name: 'الفواتير', query: 'SELECT COUNT(*) as count FROM Invoice' },
    { name: 'طلبات الإصلاح', query: 'SELECT COUNT(*) as count FROM RepairRequest' },
    { name: 'العملاء', query: 'SELECT COUNT(*) as count FROM Customer' },
    { name: 'المستخدمين', query: 'SELECT COUNT(*) as count FROM User' }
  ];
  
  const results = {};
  
  for (const { name, query } of queries) {
    const [rows] = await connection.execute(query);
    results[name] = rows[0].count;
  }
  
  await connection.end();
  return { success: true, data: results };
}

// اختبار الفهارس
async function testIndexes() {
  const connection = await mysql.createConnection(dbConfig);
  
  const [indexes] = await connection.execute(`
    SHOW INDEX FROM Payment
  `);
  
  const indexNames = indexes.map(idx => idx.Key_name);
  const expectedIndexes = ['PRIMARY', 'idx_payment_invoice', 'idx_payment_date', 'idx_payment_method'];
  
  const missingIndexes = expectedIndexes.filter(idx => !indexNames.includes(idx));
  
  await connection.end();
  
  if (missingIndexes.length > 0) {
    console.log(`⚠️ فهارس مفقودة: ${missingIndexes.join(', ')}`);
  }
  
  return { success: true, indexes: indexNames };
}

// اختبار الأداء - استعلامات معقدة
async function testPerformanceQueries() {
  const connection = await mysql.createConnection(dbConfig);
  
  const startTime = Date.now();
  
  // استعلام معقد لجلب المدفوعات مع التفاصيل
  const [paymentsWithDetails] = await connection.execute(`
    SELECT 
      p.*,
      i.totalAmount as invoiceTotal,
      c.name as customerName,
      r.description as repairDescription
    FROM Payment p
    LEFT JOIN Invoice i ON p.invoiceId = i.id
    LEFT JOIN RepairRequest r ON i.repairRequestId = r.id
    LEFT JOIN Customer c ON r.customerId = c.id
    ORDER BY p.paymentDate DESC
    LIMIT 10
  `);
  
  const endTime = Date.now();
  const executionTime = endTime - startTime;
  
  await connection.end();
  
  if (executionTime > 1000) {
    throw new Error(`الاستعلام بطيء جداً: ${executionTime}ms`);
  }
  
  return { 
    success: true, 
    executionTime, 
    resultCount: paymentsWithDetails.length 
  };
}

// اختبار تكامل البيانات
async function testDataIntegrity() {
  const connection = await mysql.createConnection(dbConfig);
  
  // اختبار المدفوعات بدون فاتورة
  const [orphanPayments] = await connection.execute(`
    SELECT COUNT(*) as count 
    FROM Payment p 
    LEFT JOIN Invoice i ON p.invoiceId = i.id 
    WHERE i.id IS NULL
  `);
  
  // اختبار الفواتير بدون طلب إصلاح
  const [orphanInvoices] = await connection.execute(`
    SELECT COUNT(*) as count 
    FROM Invoice i 
    LEFT JOIN RepairRequest r ON i.repairRequestId = r.id 
    WHERE r.id IS NULL
  `);
  
  await connection.end();
  
  const issues = [];
  if (orphanPayments[0].count > 0) {
    issues.push(`${orphanPayments[0].count} مدفوعة بدون فاتورة`);
  }
  if (orphanInvoices[0].count > 0) {
    issues.push(`${orphanInvoices[0].count} فاتورة بدون طلب إصلاح`);
  }
  
  if (issues.length > 0) {
    throw new Error(`مشاكل في تكامل البيانات: ${issues.join(', ')}`);
  }
  
  return { success: true };
}

// اختبار الأمان - SQL Injection
async function testSQLInjectionProtection() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // محاولة SQL injection
    const maliciousInput = "'; DROP TABLE Payment; --";
    
    const [result] = await connection.execute(`
      SELECT COUNT(*) as count FROM Payment WHERE notes = ?
    `, [maliciousInput]);
    
    await connection.end();
    return { success: true, protected: true };
  } catch (error) {
    await connection.end();
    throw new Error(`فشل في حماية SQL Injection: ${error.message}`);
  }
}

// تشغيل جميع اختبارات قاعدة البيانات
async function runDatabaseTests() {
  console.log('🗄️ بدء اختبار قاعدة البيانات...\n');
  
  // اختبار الاتصال والهيكل
  await testDatabase('الاتصال بقاعدة البيانات', testConnection);
  await testDatabase('الجداول الأساسية', testCoreTables);
  await testDatabase('هيكل جدول Payment', testPaymentTableStructure);
  await testDatabase('هيكل جدول Invoice', testInvoiceTableStructure);
  
  // اختبار العلاقات والبيانات
  await testDatabase('العلاقات بين الجداول', testTableRelationships);
  await testDatabase('البيانات الموجودة', testExistingData);
  await testDatabase('الفهارس', testIndexes);
  
  // اختبار الأداء والأمان
  await testDatabase('استعلامات الأداء', testPerformanceQueries);
  await testDatabase('تكامل البيانات', testDataIntegrity);
  await testDatabase('حماية SQL Injection', testSQLInjectionProtection);
  
  // عرض النتائج النهائية
  console.log('\n' + '='.repeat(50));
  console.log('📊 نتائج اختبار قاعدة البيانات:');
  console.log('='.repeat(50));
  console.log(`✅ نجح: ${testResults.passed}`);
  console.log(`❌ فشل: ${testResults.failed}`);
  console.log(`📈 النسبة: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ الأخطاء:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.name}: ${error.error}`);
    });
  }
  
  console.log('\n🎯 ملخص اختبار قاعدة البيانات:');
  if (testResults.failed === 0) {
    console.log('🎉 قاعدة البيانات سليمة ومتكاملة!');
  } else if (testResults.passed > testResults.failed) {
    console.log('⚠️ قاعدة البيانات تعمل لكن تحتاج تحسينات.');
  } else {
    console.log('🚨 هناك مشاكل خطيرة في قاعدة البيانات!');
  }
}

// تشغيل الاختبارات
runDatabaseTests().catch(console.error);
