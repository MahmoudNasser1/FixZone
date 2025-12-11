/**
 * Create technician tables directly
 */

const db = require('../db');

async function createTables() {
  try {
    console.log('🚀 بدء إنشاء الجداول...\n');

    // 1. TimeTracking
    console.log('📄 إنشاء TimeTracking...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS TimeTracking (
        id INT PRIMARY KEY AUTO_INCREMENT,
        technicianId INT NOT NULL COMMENT 'الفني',
        repairId INT NULL COMMENT 'الإصلاح المرتبط',
        taskId INT NULL COMMENT 'المهمة المرتبطة',
        startTime TIMESTAMP NOT NULL COMMENT 'وقت البدء',
        endTime TIMESTAMP NULL COMMENT 'وقت الإيقاف',
        duration INT DEFAULT 0 COMMENT 'المدة بالثواني',
        status ENUM('running', 'paused', 'stopped', 'completed') DEFAULT 'running' COMMENT 'حالة التتبع',
        adjustedDuration INT NULL COMMENT 'الوقت المعدل بالثواني',
        adjustmentReason TEXT COMMENT 'سبب التعديل',
        adjustedBy INT NULL COMMENT 'من قام بالتعديل',
        adjustedAt TIMESTAMP NULL COMMENT 'تاريخ التعديل',
        notes TEXT COMMENT 'ملاحظات',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (repairId) REFERENCES RepairRequest(id) ON DELETE SET NULL,
        INDEX idx_technicianId (technicianId),
        INDEX idx_repairId (repairId),
        INDEX idx_taskId (taskId),
        INDEX idx_status (status),
        INDEX idx_startTime (startTime)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ TimeTracking تم إنشاؤه\n');

    // 2. Tasks
    console.log('📄 إنشاء Tasks...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS Tasks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        technicianId INT NOT NULL COMMENT 'الفني',
        title VARCHAR(255) NOT NULL COMMENT 'عنوان المهمة',
        description TEXT COMMENT 'وصف المهمة',
        taskType ENUM('repair', 'general', 'recurring') DEFAULT 'general' COMMENT 'نوع المهمة',
        repairId INT NULL COMMENT 'الإصلاح المرتبط',
        deviceId INT NULL COMMENT 'الجهاز المرتبط',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT 'الأولوية',
        status ENUM('todo', 'in_progress', 'review', 'done', 'cancelled') DEFAULT 'todo' COMMENT 'الحالة',
        category VARCHAR(100) COMMENT 'الفئة',
        dueDate DATE NULL COMMENT 'التاريخ المستهدف',
        dueTime TIME NULL COMMENT 'الوقت المستهدف',
        estimatedDuration INT COMMENT 'المدة المتوقعة بالدقائق',
        actualDuration INT COMMENT 'المدة الفعلية بالدقائق',
        completedAt TIMESTAMP NULL COMMENT 'تاريخ الإنجاز',
        tags JSON COMMENT 'العلامات',
        attachments JSON COMMENT 'المرفقات',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deletedAt TIMESTAMP NULL COMMENT 'للحذف الناعم',
        FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (repairId) REFERENCES RepairRequest(id) ON DELETE SET NULL,
        FOREIGN KEY (deviceId) REFERENCES Device(id) ON DELETE SET NULL,
        INDEX idx_technicianId (technicianId),
        INDEX idx_repairId (repairId),
        INDEX idx_deviceId (deviceId),
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_dueDate (dueDate),
        INDEX idx_taskType (taskType),
        INDEX idx_deletedAt (deletedAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tasks تم إنشاؤه\n');

    // 3. Notes
    console.log('📄 إنشاء Notes...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS Notes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        technicianId INT NOT NULL COMMENT 'الفني',
        noteType ENUM('general', 'device', 'task') NOT NULL COMMENT 'نوع الملاحظة',
        deviceId INT NULL COMMENT 'الجهاز المرتبط',
        repairId INT NULL COMMENT 'الإصلاح المرتبط',
        taskId INT NULL COMMENT 'المهمة المرتبطة',
        title VARCHAR(255) COMMENT 'عنوان الملاحظة',
        content TEXT NOT NULL COMMENT 'محتوى الملاحظة',
        category VARCHAR(50) COMMENT 'الفئة',
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium' COMMENT 'الأولوية',
        tags JSON COMMENT 'العلامات',
        isPrivate BOOLEAN DEFAULT false COMMENT 'خاص أو عام',
        reminderDate DATE NULL COMMENT 'تاريخ التذكير',
        reminderTime TIME NULL COMMENT 'وقت التذكير',
        reminderSent BOOLEAN DEFAULT false COMMENT 'تم إرسال التذكير',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deletedAt TIMESTAMP NULL COMMENT 'للحذف الناعم',
        FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (deviceId) REFERENCES Device(id) ON DELETE SET NULL,
        FOREIGN KEY (repairId) REFERENCES RepairRequest(id) ON DELETE SET NULL,
        FOREIGN KEY (taskId) REFERENCES Tasks(id) ON DELETE SET NULL,
        INDEX idx_technicianId (technicianId),
        INDEX idx_noteType (noteType),
        INDEX idx_deviceId (deviceId),
        INDEX idx_repairId (repairId),
        INDEX idx_taskId (taskId),
        INDEX idx_reminderDate (reminderDate),
        INDEX idx_deletedAt (deletedAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Notes تم إنشاؤه\n');

    // 4. TechnicianReports
    console.log('📄 إنشاء TechnicianReports...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS TechnicianReports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        technicianId INT NOT NULL COMMENT 'الفني',
        repairId INT NOT NULL COMMENT 'الإصلاح',
        reportType ENUM('quick', 'detailed') DEFAULT 'quick' COMMENT 'نوع التقرير',
        problemDescription TEXT COMMENT 'وصف المشكلة',
        solutionApplied TEXT COMMENT 'الحل المطبق',
        partsUsed JSON COMMENT 'الأجزاء المستخدمة',
        timeSpent INT COMMENT 'الوقت المستغرق بالدقائق',
        images JSON COMMENT 'روابط الصور',
        additionalNotes TEXT COMMENT 'ملاحظات إضافية',
        status ENUM('draft', 'submitted', 'approved') DEFAULT 'draft' COMMENT 'حالة التقرير',
        submittedAt TIMESTAMP NULL COMMENT 'تاريخ التقديم',
        approvedBy INT NULL COMMENT 'من وافق على التقرير',
        approvedAt TIMESTAMP NULL COMMENT 'تاريخ الموافقة',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (technicianId) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (repairId) REFERENCES RepairRequest(id) ON DELETE CASCADE,
        FOREIGN KEY (approvedBy) REFERENCES User(id) ON DELETE SET NULL,
        INDEX idx_technicianId (technicianId),
        INDEX idx_repairId (repairId),
        INDEX idx_status (status),
        INDEX idx_reportType (reportType)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ TechnicianReports تم إنشاؤه\n');

    // التحقق النهائي
    console.log('🔍 التحقق النهائي...\n');
    const [tables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('TimeTracking', 'Tasks', 'Notes', 'TechnicianReports')
      ORDER BY table_name
    `);

    const requiredTables = ['TimeTracking', 'Tasks', 'Notes', 'TechnicianReports'];
    const existingTableNames = tables.map(t => t.table_name);
    
    requiredTables.forEach(tableName => {
      if (existingTableNames.includes(tableName)) {
        console.log(`  ✅ ${tableName} موجود`);
      } else {
        console.log(`  ❌ ${tableName} غير موجود`);
      }
    });

    if (existingTableNames.length === requiredTables.length) {
      console.log('\n✅ تم إنشاء جميع الجداول بنجاح!');
      process.exit(0);
    } else {
      console.log('\n❌ بعض الجداول لم يتم إنشاؤها');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTables();

