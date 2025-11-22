/**
 * استيراد الأجهزة وطلبات الإصلاح من النظام القديم
 * invoices → Device + RepairRequest
 */

const {
  getOldDb,
  getNewDb,
  closeAllConnections,
  importConfig,
  saveMapping,
  loadMapping,
  saveLog,
  convertRepairStatus,
  displayStats
} = require('./config');

/**
 * قراءة mapping حالات الإصلاح من النظام القديم
 */
async function loadStatusMapping() {
  const oldDb = await getOldDb();
  
  const [statuses] = await oldDb.query('SELECT id, name FROM status ORDER BY id');
  
  const mapping = {};
  statuses.forEach(status => {
    const name = status.name.toLowerCase();
    
    // تحويل الحالات العربية إلى الحالات الإنجليزية
    if (name.includes('جديد') || name.includes('مستلم') || name.includes('received')) {
      mapping[status.id] = 'RECEIVED';
    } else if (name.includes('فحص') || name.includes('inspection')) {
      mapping[status.id] = 'INSPECTION';
    } else if (name.includes('إصلاح') || name.includes('جاري') || name.includes('repair')) {
      mapping[status.id] = 'UNDER_REPAIR';
    } else if (name.includes('جاهز') || name.includes('ready')) {
      mapping[status.id] = 'READY_FOR_DELIVERY';
    } else if (name.includes('تسليم') || name.includes('delivered')) {
      mapping[status.id] = 'DELIVERED';
    } else if (name.includes('ملغ') || name.includes('rejected') || name.includes('cancelled')) {
      mapping[status.id] = 'REJECTED';
    } else if (name.includes('قطع') || name.includes('parts') || name.includes('waiting')) {
      mapping[status.id] = 'WAITING_PARTS';
    } else if (name.includes('معلق') || name.includes('hold')) {
      mapping[status.id] = 'ON_HOLD';
    } else {
      mapping[status.id] = 'RECEIVED'; // Default
    }
  });
  
  console.log('📋 Mapping حالات الإصلاح:');
  statuses.forEach(status => {
    console.log(`  ${status.id}. ${status.name} → ${mapping[status.id]}`);
  });
  console.log('');
  
  return mapping;
}

/**
 * استيراد الأجهزة وطلبات الإصلاح
 */
async function importRepairs() {
  console.log('\n🚀 بدء استيراد الأجهزة وطلبات الإصلاح...\n');
  
  const startTime = Date.now();
  const stats = {
    totalInvoices: 0,
    devicesCreated: 0,
    devicesExisting: 0,
    repairsCreated: 0,
    servicesLinked: 0,
    failed: 0,
    skipped: 0
  };
  
  const deviceMapping = {}; // { old_invoice_id: new_device_id }
  const repairMapping = {}; // { old_invoice_id: new_repair_request_id }
  const failedRecords = [];
  
  try {
    const oldDb = await getOldDb();
    const newDb = await getNewDb();
    
    // تحميل mappings
    console.log('📖 تحميل mappings...');
    const customerMapping = await loadMapping('customer-mapping.json');
    const serviceMapping = await loadMapping('service-mapping.json');
    const statusMapping = await loadStatusMapping();
    
    if (!customerMapping) {
      throw new Error('يجب استيراد العملاء أولاً!');
    }
    
    if (!serviceMapping) {
      console.warn('⚠️ لم يتم العثور على service mapping. سيتم تخطي ربط الخدمات.');
    }
    
    // قراءة الفواتير من النظام القديم
    console.log('📖 قراءة الفواتير من النظام القديم...');
    
    const [oldInvoices] = await oldDb.query(`
      SELECT 
        id,
        payment,
        device_type,
        brand,
        device_model,
        device_sn,
        purchase_date,
        problem_description,
        accessories,
        specifcations,
        examination,
        date,
        entery_at,
        exit_at,
        client_id,
        total,
        tax,
        review_note,
        review_status,
        review_required,
        paid,
        due,
        discount,
        note,
        branche_id,
        creator_id,
        created_at,
        updated_at,
        type_id,
        status_id,
        problem_type,
        ref_num,
        expected_cost,
        device_problems,
        price_type
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
      
      for (const invoice of batch) {
        try {
          // التحقق من وجود العميل
          const newCustomerId = customerMapping[invoice.client_id];
          if (!newCustomerId) {
            console.warn(`⚠️ تخطي الفاتورة ${invoice.id}: العميل ${invoice.client_id} غير موجود`);
            stats.skipped++;
            continue;
          }
          
          // === إنشاء/الحصول على الجهاز ===
          let deviceId = null;
          
          // التحقق من وجود جهاز بنفس SN للعميل
          if (invoice.device_sn && invoice.device_sn.trim() !== '') {
            const [existingDevice] = await newDb.query(
              'SELECT id FROM Device WHERE customerId = ? AND serialNumber = ? AND deletedAt IS NULL LIMIT 1',
              [newCustomerId, invoice.device_sn]
            );
            
            if (existingDevice.length > 0) {
              deviceId = existingDevice[0].id;
              stats.devicesExisting++;
            }
          }
          
          // إنشاء جهاز جديد إذا لم يكن موجوداً
          if (!deviceId) {
            const deviceCustomFields = {
              oldInvoiceId: invoice.id,
              accessories: invoice.accessories ? JSON.parse(invoice.accessories) : null,
              specifications: invoice.specifcations || null,
              purchaseDate: invoice.purchase_date,
              importedFrom: 'old_system'
            };
            
            const [deviceResult] = await newDb.query(`
              INSERT INTO Device (
                customerId,
                deviceType,
                brand,
                model,
                serialNumber,
                customFields,
                createdAt,
                updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              newCustomerId,
              invoice.device_type || 'Unknown',
              invoice.brand || 'Unknown',
              invoice.device_model || 'Unknown',
              invoice.device_sn || null,
              JSON.stringify(deviceCustomFields),
              invoice.created_at,
              invoice.updated_at
            ]);
            
            deviceId = deviceResult.insertId;
            stats.devicesCreated++;
          }
          
          deviceMapping[invoice.id] = deviceId;
          
          // === إنشاء طلب الإصلاح ===
          
          // تحويل الحالة
          const status = convertRepairStatus(invoice.status_id, statusMapping);
          
          // إعداد customFields
          const repairCustomFields = {
            oldInvoiceId: invoice.id,
            oldBranchId: invoice.branche_id,
            oldCreatorId: invoice.creator_id,
            oldTypeId: invoice.type_id,
            oldStatusId: invoice.status_id,
            refNumber: invoice.ref_num,
            expectedCost: invoice.expected_cost,
            deviceProblems: invoice.device_problems ? JSON.parse(invoice.device_problems) : null,
            examination: invoice.examination ? JSON.parse(invoice.examination) : null,
            exitAt: invoice.exit_at,
            priceType: invoice.price_type,
            reviewNote: invoice.review_note,
            reviewStatus: invoice.review_status,
            reviewRequired: invoice.review_required,
            problemType: invoice.problem_type,
            importedFrom: 'old_system'
          };
          
          // معالجة technicianReport
          let technicianReport = null;
          if (invoice.examination) {
            try {
              const exam = JSON.parse(invoice.examination);
              technicianReport = JSON.stringify(exam, null, 2);
            } catch (e) {
              technicianReport = invoice.examination;
            }
          }
          
          const [repairResult] = await newDb.query(`
            INSERT INTO RepairRequest (
              deviceId,
              reportedProblem,
              technicianReport,
              status,
              customerId,
              branchId,
              customFields,
              notes,
              createdAt,
              updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            deviceId,
            invoice.problem_description || 'لا يوجد وصف للمشكلة',
            technicianReport,
            status,
            newCustomerId,
            importConfig.defaultBranchId, // استخدام الفرع الافتراضي
            JSON.stringify(repairCustomFields),
            invoice.note,
            invoice.entery_at || invoice.created_at,
            invoice.updated_at
          ]);
          
          const repairRequestId = repairResult.insertId;
          repairMapping[invoice.id] = repairRequestId;
          stats.repairsCreated++;
          
          // === ربط الخدمات (إذا كان متاحاً) ===
          if (serviceMapping) {
            const [services] = await oldDb.query(
              'SELECT title, price, user_id FROM invoice_services WHERE invoice_id = ?',
              [invoice.id]
            );
            
            for (const service of services) {
              const serviceId = serviceMapping[service.title];
              if (serviceId) {
                await newDb.query(`
                  INSERT INTO RepairRequestService (
                    repairRequestId,
                    serviceId,
                    technicianId,
                    price,
                    notes
                  ) VALUES (?, ?, ?, ?, ?)
                `, [
                  repairRequestId,
                  serviceId,
                  service.user_id || importConfig.defaultUserId,
                  service.price || 0,
                  null
                ]);
                
                stats.servicesLinked++;
              }
            }
          }
          
          if (stats.repairsCreated % 50 === 0) {
            console.log(`  ✅ تم استيراد ${stats.repairsCreated} طلب إصلاح...`);
          }
          
        } catch (error) {
          console.error(`❌ خطأ في استيراد الفاتورة ${invoice.id}:`, error.message);
          stats.failed++;
          
          failedRecords.push({
            invoiceId: invoice.id,
            clientId: invoice.client_id,
            error: error.message
          });
          
          await saveLog('import-repairs-errors.log', {
            invoice,
            error: error.message,
            stack: error.stack
          });
        }
      }
      
      console.log(`  ✅ اكتملت الدفعة ${batchNum}/${totalBatches}\n`);
    }
    
    // حفظ الـ mappings
    console.log('💾 حفظ mappings...');
    await saveMapping('device-mapping.json', deviceMapping);
    await saveMapping('repair-request-mapping.json', repairMapping);
    
    // حفظ السجلات الفاشلة
    if (failedRecords.length > 0) {
      console.log('💾 حفظ السجلات الفاشلة...');
      await saveLog('import-repairs-failed.json', JSON.stringify(failedRecords, null, 2));
    }
    
    // عرض الإحصائيات
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    displayStats('نتائج استيراد الأجهزة وطلبات الإصلاح', {
      'إجمالي الفواتير': stats.totalInvoices,
      'أجهزة تم إنشاؤها': stats.devicesCreated,
      'أجهزة موجودة مسبقاً': stats.devicesExisting,
      'طلبات إصلاح تم إنشاؤها': stats.repairsCreated,
      'خدمات تم ربطها': stats.servicesLinked,
      'فشل الاستيراد': stats.failed,
      'تم التخطي': stats.skipped,
      'الوقت المستغرق': `${duration} ثانية`
    });
    
    return {
      success: true,
      stats,
      deviceMapping,
      repairMapping
    };
    
  } catch (error) {
    console.error('❌ خطأ عام في استيراد الأجهزة وطلبات الإصلاح:', error);
    await saveLog('import-repairs-critical.log', {
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
  importRepairs()
    .then(async (result) => {
      if (result.success) {
        console.log('✅ اكتمل استيراد الأجهزة وطلبات الإصلاح بنجاح!\n');
      } else {
        console.error('❌ فشل استيراد الأجهزة وطلبات الإصلاح!\n');
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

module.exports = { importRepairs };


