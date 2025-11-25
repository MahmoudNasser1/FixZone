/**
 * استيراد الخدمات من النظام القديم
 * استخراج الخدمات الفريدة من invoice_services → Service
 */

const {
  getOldDb,
  getNewDb,
  closeAllConnections,
  saveMapping,
  saveLog,
  displayStats
} = require('./config');

/**
 * استيراد الخدمات
 */
async function importServices() {
  console.log('\n🚀 بدء استيراد الخدمات...\n');
  
  const startTime = Date.now();
  const stats = {
    uniqueServices: 0,
    totalServiceRecords: 0,
    imported: 0,
    existing: 0,
    failed: 0
  };
  
  const serviceMapping = {}; // { service_name: service_id }
  const failedRecords = [];
  
  try {
    const oldDb = await getOldDb();
    const newDb = await getNewDb();
    
    // قراءة جميع الخدمات الفريدة مع متوسط الأسعار
    console.log('📖 قراءة الخدمات الفريدة من النظام القديم...');
    
    const [serviceStats] = await oldDb.query(`
      SELECT 
        title AS serviceName,
        COUNT(*) AS usageCount,
        AVG(price) AS avgPrice,
        MIN(price) AS minPrice,
        MAX(price) AS maxPrice,
        MIN(created_at) AS firstUsed
      FROM invoice_services
      WHERE title IS NOT NULL AND title != ''
      GROUP BY title
      ORDER BY usageCount DESC
    `);
    
    console.log(`✅ تم العثور على ${serviceStats.length} خدمة فريدة\n`);
    stats.uniqueServices = serviceStats.length;
    
    // قراءة إجمالي عدد السجلات
    const [totalCount] = await oldDb.query('SELECT COUNT(*) as total FROM invoice_services');
    stats.totalServiceRecords = totalCount[0].total;
    
    // استيراد الخدمات
    for (const service of serviceStats) {
      try {
        const serviceName = service.serviceName.trim();
        
        // تخطي الخدمات الفارغة أو القصيرة جداً
        if (!serviceName || serviceName.length < 2) {
          console.warn(`⚠️ تخطي خدمة غير صالحة: "${serviceName}"`);
          stats.failed++;
          continue;
        }
        
        // التحقق من وجود الخدمة
        const [existing] = await newDb.query(
          'SELECT id FROM Service WHERE name = ? AND deletedAt IS NULL LIMIT 1',
          [serviceName]
        );
        
        let serviceId;
        
        if (existing.length > 0) {
          serviceId = existing[0].id;
          serviceMapping[serviceName] = serviceId;
          stats.existing++;
          console.log(`ℹ️ خدمة موجودة مسبقاً: ${serviceName}`);
        } else {
          // إدراج الخدمة الجديدة
          const basePrice = Math.round(service.avgPrice || 0);
          const description = `استخدمت ${service.usageCount} مرة | السعر (${service.minPrice}-${service.maxPrice})`;
          
          const [result] = await newDb.query(`
            INSERT INTO Service (
              name,
              description,
              basePrice,
              isActive,
              createdAt,
              updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            serviceName,
            description,
            basePrice,
            1, // active
            service.firstUsed,
            new Date()
          ]);
          
          serviceId = result.insertId;
          serviceMapping[serviceName] = serviceId;
          stats.imported++;
          
          console.log(`✅ تم استيراد: ${serviceName} (سعر: ${basePrice} جنيه)`);
        }
        
      } catch (error) {
        console.error(`❌ خطأ في استيراد الخدمة "${service.serviceName}":`, error.message);
        stats.failed++;
        
        failedRecords.push({
          serviceName: service.serviceName,
          usageCount: service.usageCount,
          error: error.message
        });
        
        await saveLog('import-services-errors.log', {
          service,
          error: error.message,
          stack: error.stack
        });
      }
    }
    
    // حفظ الـ mapping
    console.log('\n💾 حفظ mapping الخدمات...');
    await saveMapping('service-mapping.json', serviceMapping);
    
    // حفظ السجلات الفاشلة
    if (failedRecords.length > 0) {
      console.log('💾 حفظ السجلات الفاشلة...');
      await saveLog('import-services-failed.json', JSON.stringify(failedRecords, null, 2));
    }
    
    // عرض الإحصائيات
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    displayStats('نتائج استيراد الخدمات', {
      'إجمالي سجلات الخدمات في النظام القديم': stats.totalServiceRecords,
      'عدد الخدمات الفريدة': stats.uniqueServices,
      'تم الاستيراد بنجاح': stats.imported,
      'موجودة مسبقاً': stats.existing,
      'فشل الاستيراد': stats.failed,
      'الوقت المستغرق': `${duration} ثانية`
    });
    
    // عرض أكثر 10 خدمات استخداماً
    console.log('🏆 أكثر 10 خدمات استخداماً:\n');
    serviceStats.slice(0, 10).forEach((service, index) => {
      const price = Math.round(service.avgPrice || 0);
      console.log(`${index + 1}. ${service.serviceName}`);
      console.log(`   📊 استخدمت ${service.usageCount} مرة | 💰 متوسط السعر: ${price} جنيه\n`);
    });
    
    return {
      success: true,
      stats,
      mapping: serviceMapping
    };
    
  } catch (error) {
    console.error('❌ خطأ عام في استيراد الخدمات:', error);
    await saveLog('import-services-critical.log', {
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
  importServices()
    .then(async (result) => {
      if (result.success) {
        console.log('✅ اكتمل استيراد الخدمات بنجاح!\n');
      } else {
        console.error('❌ فشل استيراد الخدمات!\n');
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

module.exports = { importServices };




