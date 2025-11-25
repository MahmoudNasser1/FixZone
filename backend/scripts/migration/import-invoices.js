/**
 * استيراد الفواتير وعناصرها من النظام القديم
 * invoices → Invoice + InvoiceItem
 */

const {
  getOldDb,
  getNewDb,
  closeAllConnections,
  importConfig,
  saveMapping,
  loadMapping,
  saveLog,
  convertInvoiceStatus,
  displayStats
} = require('./config');

/**
 * استيراد الفواتير
 */
async function importInvoices() {
  console.log('\n🚀 بدء استيراد الفواتير...\n');
  
  const startTime = Date.now();
  const stats = {
    totalInvoices: 0,
    invoicesCreated: 0,
    invoiceItemsCreated: 0,
    paymentsCreated: 0,
    failed: 0,
    skipped: 0
  };
  
  const invoiceMapping = {}; // { old_invoice_id: new_invoice_id }
  const failedRecords = [];
  
  try {
    const oldDb = await getOldDb();
    const newDb = await getNewDb();
    
    // تحميل mappings
    console.log('📖 تحميل mappings...');
    const repairMapping = await loadMapping('repair-request-mapping.json');
    const serviceMapping = await loadMapping('service-mapping.json');
    
    if (!repairMapping) {
      throw new Error('يجب استيراد طلبات الإصلاح أولاً!');
    }
    
    // قراءة الفواتير من النظام القديم
    console.log('📖 قراءة الفواتير من النظام القديم...');
    
    const [oldInvoices] = await oldDb.query(`
      SELECT 
        id,
        payment,
        date,
        total,
        tax,
        paid,
        due,
        discount,
        note,
        review_note,
        review_status,
        created_at,
        updated_at
      FROM invoices
      ORDER BY id ASC
    `);
    
    console.log(`✅ تم قراءة ${oldInvoices.length} فاتورة من النظام القديم\n`);
    stats.totalInvoices = oldInvoices.length;
    
    // معالجة الفواتير على دفعات
    const batchSize = importConfig.batchSize;
    
    for (let i = 0; i < oldInvoices.length; i += batchSize) {
      const batch = oldInvoices.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(oldInvoices.length / batchSize);
      
      console.log(`📦 معالجة الدفعة ${batchNum}/${totalBatches} (${batch.length} فاتورة)...`);
      
      for (const oldInvoice of batch) {
        try {
          // التحقق من وجود طلب الإصلاح
          const repairRequestId = repairMapping[oldInvoice.id];
          if (!repairRequestId) {
            console.warn(`⚠️ تخطي الفاتورة ${oldInvoice.id}: طلب الإصلاح غير موجود`);
            stats.skipped++;
            continue;
          }
          
          // حساب حالة الفاتورة
          const invoiceStatus = convertInvoiceStatus(oldInvoice.paid, oldInvoice.total);
          
          // إعداد customFields
          const customFields = {
            oldInvoiceId: oldInvoice.id,
            paymentMethod: oldInvoice.payment,
            discount: oldInvoice.discount || 0,
            due: oldInvoice.due || 0,
            reviewNote: oldInvoice.review_note,
            reviewStatus: oldInvoice.review_status,
            importedFrom: 'old_system'
          };
          
          // إنشاء الفاتورة
          const [invoiceResult] = await newDb.query(`
            INSERT INTO Invoice (
              totalAmount,
              amountPaid,
              status,
              repairRequestId,
              currency,
              taxAmount,
              customFields,
              createdAt,
              updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            oldInvoice.total || 0,
            oldInvoice.paid || 0,
            invoiceStatus,
            repairRequestId,
            'EGP',
            oldInvoice.tax || 0,
            JSON.stringify(customFields),
            oldInvoice.date || oldInvoice.created_at,
            oldInvoice.updated_at
          ]);
          
          const newInvoiceId = invoiceResult.insertId;
          invoiceMapping[oldInvoice.id] = newInvoiceId;
          stats.invoicesCreated++;
          
          // === إنشاء عناصر الفاتورة من الخدمات ===
          const [services] = await oldDb.query(
            'SELECT title, price, user_id FROM invoice_services WHERE invoice_id = ?',
            [oldInvoice.id]
          );
          
          for (const service of services) {
            const serviceId = serviceMapping ? serviceMapping[service.title] : null;
            const price = service.price || 0;
            
            await newDb.query(`
              INSERT INTO InvoiceItem (
                quantity,
                unitPrice,
                totalPrice,
                invoiceId,
                serviceId,
                description,
                itemType
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              1, // quantity
              price,
              price,
              newInvoiceId,
              serviceId,
              service.title,
              'service'
            ]);
            
            stats.invoiceItemsCreated++;
          }
          
          // === إنشاء سجل الدفع إذا كان هناك مبلغ مدفوع ===
          if (oldInvoice.paid && oldInvoice.paid > 0) {
            await newDb.query(`
              INSERT INTO Payment (
                amount,
                paymentMethod,
                invoiceId,
                userId,
                currency,
                createdAt,
                updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              oldInvoice.paid,
              oldInvoice.payment || 'cash',
              newInvoiceId,
              importConfig.defaultUserId,
              'EGP',
              oldInvoice.date || oldInvoice.created_at,
              oldInvoice.updated_at
            ]);
            
            stats.paymentsCreated++;
          }
          
          // تحديث repairRequestId في Invoice (ربط ثنائي)
          await newDb.query(
            'UPDATE RepairRequest SET invoiceId = ? WHERE id = ?',
            [newInvoiceId, repairRequestId]
          );
          
          if (stats.invoicesCreated % 50 === 0) {
            console.log(`  ✅ تم استيراد ${stats.invoicesCreated} فاتورة...`);
          }
          
        } catch (error) {
          console.error(`❌ خطأ في استيراد الفاتورة ${oldInvoice.id}:`, error.message);
          stats.failed++;
          
          failedRecords.push({
            invoiceId: oldInvoice.id,
            error: error.message
          });
          
          await saveLog('import-invoices-errors.log', {
            oldInvoice,
            error: error.message,
            stack: error.stack
          });
        }
      }
      
      console.log(`  ✅ اكتملت الدفعة ${batchNum}/${totalBatches}\n`);
    }
    
    // حفظ الـ mapping
    console.log('💾 حفظ mapping الفواتير...');
    await saveMapping('invoice-mapping.json', invoiceMapping);
    
    // حفظ السجلات الفاشلة
    if (failedRecords.length > 0) {
      console.log('💾 حفظ السجلات الفاشلة...');
      await saveLog('import-invoices-failed.json', JSON.stringify(failedRecords, null, 2));
    }
    
    // عرض الإحصائيات
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // حساب إحصائيات إضافية
    const [statusCounts] = await newDb.query(`
      SELECT status, COUNT(*) as count
      FROM Invoice
      WHERE deletedAt IS NULL
      GROUP BY status
    `);
    
    displayStats('نتائج استيراد الفواتير', {
      'إجمالي الفواتير': stats.totalInvoices,
      'فواتير تم إنشاؤها': stats.invoicesCreated,
      'عناصر فاتورة تم إنشاؤها': stats.invoiceItemsCreated,
      'سجلات دفع تم إنشاؤها': stats.paymentsCreated,
      'فشل الاستيراد': stats.failed,
      'تم التخطي': stats.skipped,
      'الوقت المستغرق': `${duration} ثانية`
    });
    
    // عرض توزيع حالات الفواتير
    console.log('📊 توزيع حالات الفواتير:\n');
    statusCounts.forEach(item => {
      const statusLabel = {
        'paid': 'مدفوعة بالكامل',
        'partial': 'مدفوعة جزئياً',
        'unpaid': 'غير مدفوعة'
      }[item.status] || item.status;
      
      console.log(`  ${statusLabel}: ${item.count} فاتورة`);
    });
    console.log('');
    
    return {
      success: true,
      stats,
      mapping: invoiceMapping
    };
    
  } catch (error) {
    console.error('❌ خطأ عام في استيراد الفواتير:', error);
    await saveLog('import-invoices-critical.log', {
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: error.message,
      stats
    };
  }
}

// تشغيل السكربت مباشرة
if (require.main === module) {
  importInvoices()
    .then(async (result) => {
      if (result.success) {
        console.log('✅ اكتمل استيراد الفواتير بنجاح!\n');
      } else {
        console.error('❌ فشل استيراد الفواتير!\n');
        process.exit(1);
      }
      
      await closeAllConnections();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('❌ خطأ فادح:', error);
      await closeAllConnections();
      process.exit(1);
    });
}

module.exports = { importInvoices };




