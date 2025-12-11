/**
 * سكريبت لإنشاء مهام للطلبات القديمة التي تم تعيينها للفنيين
 * هذا السكريبت ينشئ مهام تلقائياً للطلبات التي لديها technicianId لكن لا توجد لها مهام في جدول Tasks
 */

const db = require('../db');

async function createTasksForAssignedRepairs() {
  try {
    console.log('🔍 البحث عن طلبات الإصلاح المخصصة للفنيين بدون مهام...\n');

    // جلب جميع طلبات الإصلاح التي لديها technicianId لكن لا توجد لها مهام
    const [repairs] = await db.query(`
      SELECT 
        r.id as repairId,
        r.technicianId,
        r.deviceId,
        r.reportedProblem,
        r.createdAt
      FROM RepairRequest r
      WHERE r.technicianId IS NOT NULL
        AND r.deletedAt IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM Tasks t 
          WHERE t.repairId = r.id 
            AND t.technicianId = r.technicianId 
            AND t.deletedAt IS NULL
        )
      ORDER BY r.createdAt DESC
    `);

    console.log(`✅ تم العثور على ${repairs.length} طلب إصلاح بدون مهام\n`);

    if (repairs.length === 0) {
      console.log('✅ جميع طلبات الإصلاح لديها مهام بالفعل');
      process.exit(0);
    }

    let created = 0;
    let skipped = 0;

    for (const repair of repairs) {
      try {
        // التحقق من أن الفني موجود
        const [technician] = await db.query(
          'SELECT id, name FROM User WHERE id = ? AND deletedAt IS NULL',
          [repair.technicianId]
        );

        if (technician.length === 0) {
          console.log(`⚠️  تخطي طلب الإصلاح #${repair.repairId}: الفني غير موجود (ID: ${repair.technicianId})`);
          skipped++;
          continue;
        }

        // إنشاء المهمة
        const taskTitle = `إصلاح #${repair.repairId}`;
        const taskDescription = repair.reportedProblem || 'مهمة إصلاح';

        const [result] = await db.query(`
          INSERT INTO Tasks (
            technicianId, title, description, taskType, repairId, deviceId,
            priority, status, category, tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          repair.technicianId,
          taskTitle,
          taskDescription,
          'repair',
          repair.repairId,
          repair.deviceId || null,
          'medium',
          'todo',
          null,
          null
        ]);

        console.log(`✅ تم إنشاء مهمة #${result.insertId} لطلب الإصلاح #${repair.repairId} (الفني: ${technician[0].name})`);
        created++;
      } catch (error) {
        console.error(`❌ خطأ في إنشاء مهمة لطلب الإصلاح #${repair.repairId}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n📊 الملخص:`);
    console.log(`   ✅ تم إنشاء: ${created} مهمة`);
    console.log(`   ⚠️  تم التخطي: ${skipped} طلب`);
    console.log(`   📋 إجمالي: ${repairs.length} طلب`);

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ عام:', error);
    process.exit(1);
  }
}

// تشغيل السكريبت
createTasksForAssignedRepairs();

