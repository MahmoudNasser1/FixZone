/**
 * استيراد العملاء من النظام القديم
 * clients → Customer
 */

const {
  getOldDb,
  getNewDb,
  closeAllConnections,
  importConfig,
  saveMapping,
  saveLog,
  cleanPhoneNumber,
  splitFullName,
  displayStats
} = require('./config');

/**
 * استيراد العملاء
 */
async function importCustomers() {
  console.log('\n🚀 بدء استيراد العملاء...\n');
  
  const startTime = Date.now();
  const stats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    duplicates: 0
  };
  
  const customerMapping = {}; // { old_client_id: new_customer_id }
  const failedRecords = [];
  
  try {
    const oldDb = await getOldDb();
    const newDb = await getNewDb();
    
    // قراءة العملاء من النظام القديم
    console.log('📖 قراءة العملاء من النظام القديم...');
    
    const [oldCustomers] = await oldDb.query(`
      SELECT 
        id,
        location_id,
        name,
        mobile,
        address,
        price_type,
        credit_limit,
        open_balance,
        id_number,
        note,
        branche_id,
        deleted_at,
        created_at,
        updated_at
      FROM clients
      ${importConfig.skipDeletedRecords ? 'WHERE deleted_at IS NULL' : ''}
      ORDER BY id ASC
    `);
    
    console.log(`✅ تم قراءة ${oldCustomers.length} عميل من النظام القديم\n`);
    stats.total = oldCustomers.length;
    
    // معالجة العملاء على دفعات
    const batchSize = importConfig.batchSize;
    
    for (let i = 0; i < oldCustomers.length; i += batchSize) {
      const batch = oldCustomers.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(oldCustomers.length / batchSize);
      
      console.log(`📦 معالجة الدفعة ${batchNum}/${totalBatches} (${batch.length} عميل)...`);
      
      for (const oldCustomer of batch) {
        try {
          // تنظيف البيانات
          const phoneNumber = cleanPhoneNumber(oldCustomer.mobile);
          
          // تخطي العملاء بدون رقم هاتف صالح
          if (!phoneNumber) {
            console.warn(`⚠️ تخطي العميل ${oldCustomer.id}: رقم هاتف غير صالح`);
            stats.skipped++;
            failedRecords.push({
              oldId: oldCustomer.id,
              name: oldCustomer.name,
              reason: 'رقم هاتف غير صالح'
            });
            continue;
          }
          
          // التحقق من وجود عميل بنفس رقم الهاتف
          const [existing] = await newDb.query(
            'SELECT id FROM Customer WHERE phone = ? AND deletedAt IS NULL LIMIT 1',
            [phoneNumber]
          );
          
          if (existing.length > 0) {
            console.log(`ℹ️ عميل موجود مسبقاً: ${oldCustomer.name} (${phoneNumber})`);
            customerMapping[oldCustomer.id] = existing[0].id;
            stats.duplicates++;
            continue;
          }
          
          // تقسيم الاسم
          const { firstName, lastName } = splitFullName(oldCustomer.name);
          
          // إعداد customFields
          const customFields = {
            oldClientId: oldCustomer.id,
            oldBranchId: oldCustomer.branche_id,
            locationId: oldCustomer.location_id,
            priceType: oldCustomer.price_type,
            creditLimit: oldCustomer.credit_limit,
            openBalance: oldCustomer.open_balance,
            idNumber: oldCustomer.id_number,
            importNote: oldCustomer.note,
            importedFrom: 'old_system',
            importDate: new Date().toISOString()
          };
          
          // إدراج العميل الجديد
          const [result] = await newDb.query(`
            INSERT INTO Customer (
              name,
              phone,
              email,
              address,
              customFields,
              createdAt,
              updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            oldCustomer.name, // استخدام الاسم الكامل في حقل name
            phoneNumber,
            null, // لا يوجد email في النظام القديم
            oldCustomer.address,
            JSON.stringify(customFields),
            oldCustomer.created_at,
            oldCustomer.updated_at
          ]);
          
          const newCustomerId = result.insertId;
          customerMapping[oldCustomer.id] = newCustomerId;
          stats.success++;
          
          if (stats.success % 50 === 0) {
            console.log(`  ✅ تم استيراد ${stats.success} عميل...`);
          }
          
        } catch (error) {
          console.error(`❌ خطأ في استيراد العميل ${oldCustomer.id}:`, error.message);
          stats.failed++;
          
          failedRecords.push({
            oldId: oldCustomer.id,
            name: oldCustomer.name,
            phone: oldCustomer.mobile,
            error: error.message
          });
          
          await saveLog('import-customers-errors.log', {
            oldCustomer,
            error: error.message,
            stack: error.stack
          });
        }
      }
      
      console.log(`  ✅ اكتملت الدفعة ${batchNum}/${totalBatches}\n`);
    }
    
    // حفظ الـ mapping
    console.log('💾 حفظ mapping العملاء...');
    await saveMapping('customer-mapping.json', customerMapping);
    
    // حفظ السجلات الفاشلة
    if (failedRecords.length > 0) {
      console.log('💾 حفظ السجلات الفاشلة...');
      await saveLog('import-customers-failed.json', JSON.stringify(failedRecords, null, 2));
    }
    
    // عرض الإحصائيات
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    displayStats('نتائج استيراد العملاء', {
      'إجمالي العملاء': stats.total,
      'تم الاستيراد بنجاح': stats.success,
      'مكررات (تم تخطيها)': stats.duplicates,
      'فشل الاستيراد': stats.failed,
      'تم التخطي (بيانات غير صالحة)': stats.skipped,
      'الوقت المستغرق': `${duration} ثانية`
    });
    
    return {
      success: true,
      stats,
      mapping: customerMapping
    };
    
  } catch (error) {
    console.error('❌ خطأ عام في استيراد العملاء:', error);
    await saveLog('import-customers-critical.log', {
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
  importCustomers()
    .then(async (result) => {
      if (result.success) {
        console.log('✅ اكتمل استيراد العملاء بنجاح!\n');
      } else {
        console.error('❌ فشل استيراد العملاء!\n');
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

module.exports = { importCustomers };

