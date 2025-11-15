const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'FZ', // Fixed to match backend/db.js
  multipleStatements: true
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/03_ROLES_PERMISSIONS_ENHANCEMENT.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons but preserve multi-line statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} statements to execute\n`);

    let step = 0;
    
    // Execute Step 1: Add columns to Role table
    console.log('Step 1: Adding columns to Role table...');
    try {
      await connection.execute(`
        ALTER TABLE \`Role\` 
        ADD COLUMN \`description\` TEXT NULL AFTER \`name\`,
        ADD COLUMN \`isSystem\` BOOLEAN DEFAULT FALSE AFTER \`parentRoleId\`,
        ADD COLUMN \`isActive\` BOOLEAN DEFAULT TRUE AFTER \`isSystem\`
      `);
      console.log('✅ Step 1 completed: Added description, isSystem, isActive columns\n');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Step 1: Columns already exist, skipping...\n');
      } else {
        throw err;
      }
    }

    // Execute Step 2: Update existing roles descriptions
    console.log('Step 2: Updating existing roles descriptions...');
    await connection.execute(`
      UPDATE \`Role\` SET \`description\` = 'مدير النظام - صلاحيات كاملة' 
      WHERE \`id\` = 1 AND \`name\` = 'Admin'
    `);
    await connection.execute(`
      UPDATE \`Role\` SET \`description\` = 'مدير الفرع - إدارة الفرع والتقارير' 
      WHERE \`id\` = 2 AND \`name\` = 'Manager'
    `);
    await connection.execute(`
      UPDATE \`Role\` SET \`description\` = 'فني الإصلاح - إدارة الإصلاحات والمخزون' 
      WHERE \`id\` = 3 AND \`name\` = 'Technician'
    `);
    await connection.execute(`
      UPDATE \`Role\` SET \`description\` = 'موظف الاستقبال - إضافة عملاء وطلبات إصلاح' 
      WHERE \`id\` = 4 AND \`name\` = 'User'
    `);
    console.log('✅ Step 2 completed: Updated role descriptions\n');

    // Execute Step 3: Set system roles
    console.log('Step 3: Setting system roles flag...');
    await connection.execute(`
      UPDATE \`Role\` SET \`isSystem\` = TRUE WHERE \`id\` IN (1, 2, 3, 4)
    `);
    console.log('✅ Step 3 completed: Set system roles\n');

    // Execute Step 4: Add Customer Role
    console.log('Step 4: Adding Customer Role...');
    try {
      await connection.execute(`
        INSERT INTO \`Role\` (\`name\`, \`description\`, \`permissions\`, \`parentRoleId\`, \`isSystem\`, \`isActive\`) 
        VALUES (
          'Customer',
          'العميل - يرى بياناته فقط (أجهزته، فواتيره، طلبات إصلاحه)',
          JSON_OBJECT(
            'repairs.view_own', true,
            'repairs.track', true,
            'invoices.view_own', true,
            'devices.view_own', true,
            'payments.view_own', true
          ),
          NULL,
          TRUE,
          TRUE
        )
      `);
      console.log('✅ Step 4 completed: Added Customer Role\n');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('⚠️  Step 4: Customer Role already exists, updating...');
        await connection.execute(`
          UPDATE \`Role\` SET 
            \`description\` = 'العميل - يرى بياناته فقط (أجهزته، فواتيره، طلبات إصلاحه)',
            \`permissions\` = JSON_OBJECT(
              'repairs.view_own', true,
              'repairs.track', true,
              'invoices.view_own', true,
              'devices.view_own', true,
              'payments.view_own', true
            ),
            \`isSystem\` = TRUE,
            \`isActive\` = TRUE
          WHERE \`name\` = 'Customer'
        `);
        console.log('✅ Step 4 completed: Updated Customer Role\n');
      } else {
        throw err;
      }
    }

    // Execute Step 5: Add customerId to User table
    console.log('Step 5: Adding customerId to User table...');
    try {
      await connection.execute(`
        ALTER TABLE \`User\` 
        ADD COLUMN \`customerId\` INT NULL AFTER \`roleId\`,
        ADD INDEX \`idx_user_customer\` (\`customerId\`),
        ADD CONSTRAINT \`fk_user_customer\` FOREIGN KEY (\`customerId\`) 
        REFERENCES \`Customer\`(\`id\`) ON DELETE SET NULL
      `);
      console.log('✅ Step 5 completed: Added customerId to User table\n');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Step 5: customerId column already exists, skipping...\n');
      } else {
        throw err;
      }
    }

    // Execute Step 6: Add userId to Customer table
    console.log('Step 6: Adding userId to Customer table...');
    try {
      await connection.execute(`
        ALTER TABLE \`Customer\` 
        ADD COLUMN \`userId\` INT NULL AFTER \`companyId\`,
        ADD INDEX \`idx_customer_user\` (\`userId\`),
        ADD CONSTRAINT \`fk_customer_user\` FOREIGN KEY (\`userId\`) 
        REFERENCES \`User\`(\`id\`) ON DELETE SET NULL
      `);
      console.log('✅ Step 6 completed: Added userId to Customer table\n');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Step 6: userId column already exists, skipping...\n');
      } else {
        throw err;
      }
    }

    // Execute Step 7: Create Permission table
    console.log('Step 7: Creating Permission table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`Permission\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`module\` VARCHAR(50) NOT NULL,
        \`action\` VARCHAR(50) NOT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`description\` TEXT,
        \`category\` VARCHAR(50) DEFAULT 'general',
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`unique_permission\` (\`module\`, \`action\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Step 7 completed: Created Permission table\n');

    // Execute Step 8: Insert permissions
    console.log('Step 8: Inserting permissions...');
    const permissions = [
      ['repairs', 'view', 'عرض الإصلاحات', 'عرض قائمة طلبات الإصلاح', 'repairs'],
      ['repairs', 'view_own', 'عرض إصلاحاته', 'عرض طلبات الإصلاح الخاصة به', 'repairs'],
      ['repairs', 'view_all', 'عرض جميع الإصلاحات', 'عرض جميع طلبات الإصلاح', 'repairs'],
      ['repairs', 'create', 'إنشاء إصلاح', 'إنشاء طلب إصلاح جديد', 'repairs'],
      ['repairs', 'update', 'تعديل إصلاح', 'تعديل طلب إصلاح', 'repairs'],
      ['repairs', 'delete', 'حذف إصلاح', 'حذف طلب إصلاح', 'repairs'],
      ['repairs', 'track', 'تتبع الإصلاح', 'تتبع حالة طلب الإصلاح', 'repairs'],
      ['invoices', 'view', 'عرض الفواتير', 'عرض جميع الفواتير', 'financial'],
      ['invoices', 'view_own', 'عرض فواتيره', 'عرض الفواتير الخاصة به', 'financial'],
      ['invoices', 'view_all', 'عرض جميع الفواتير', 'عرض جميع الفواتير', 'financial'],
      ['invoices', 'create', 'إنشاء فاتورة', 'إنشاء فاتورة جديدة', 'financial'],
      ['invoices', 'update', 'تعديل فاتورة', 'تعديل فاتورة', 'financial'],
      ['invoices', 'delete', 'حذف فاتورة', 'حذف فاتورة', 'financial'],
      ['invoices', 'print', 'طباعة فاتورة', 'طباعة فاتورة', 'financial'],
      ['customers', 'view', 'عرض العملاء', 'عرض قائمة العملاء', 'crm'],
      ['customers', 'view_all', 'عرض جميع العملاء', 'عرض جميع العملاء', 'crm'],
      ['customers', 'create', 'إنشاء عميل', 'إضافة عميل جديد', 'crm'],
      ['customers', 'update', 'تعديل عميل', 'تعديل بيانات العميل', 'crm'],
      ['customers', 'delete', 'حذف عميل', 'حذف عميل', 'crm'],
      ['users', 'view', 'عرض المستخدمين', 'عرض قائمة المستخدمين', 'admin'],
      ['users', 'create', 'إنشاء مستخدم', 'إضافة مستخدم جديد', 'admin'],
      ['users', 'update', 'تعديل مستخدم', 'تعديل بيانات المستخدم', 'admin'],
      ['users', 'delete', 'حذف مستخدم', 'حذف مستخدم', 'admin'],
      ['roles', 'view', 'عرض الأدوار', 'عرض قائمة الأدوار', 'admin'],
      ['roles', 'create', 'إنشاء دور', 'إضافة دور جديد', 'admin'],
      ['roles', 'update', 'تعديل دور', 'تعديل دور', 'admin'],
      ['roles', 'delete', 'حذف دور', 'حذف دور', 'admin'],
      ['inventory', 'view', 'عرض المخزون', 'عرض المخزون', 'inventory'],
      ['inventory', 'create', 'إضافة صنف', 'إضافة صنف جديد للمخزون', 'inventory'],
      ['inventory', 'update', 'تعديل صنف', 'تعديل صنف في المخزون', 'inventory'],
      ['inventory', 'delete', 'حذف صنف', 'حذف صنف من المخزون', 'inventory'],
      ['reports', 'view', 'عرض التقارير', 'عرض التقارير', 'reports'],
      ['reports', 'export', 'تصدير التقارير', 'تصدير التقارير', 'reports'],
      ['devices', 'view', 'عرض الأجهزة', 'عرض الأجهزة', 'devices'],
      ['devices', 'view_own', 'عرض أجهزته', 'عرض الأجهزة الخاصة به', 'devices'],
      ['devices', 'create', 'إضافة جهاز', 'إضافة جهاز جديد', 'devices'],
      ['devices', 'update', 'تعديل جهاز', 'تعديل جهاز', 'devices'],
      ['devices', 'delete', 'حذف جهاز', 'حذف جهاز', 'devices'],
      ['payments', 'view', 'عرض المدفوعات', 'عرض المدفوعات', 'financial'],
      ['payments', 'view_own', 'عرض مدفوعاته', 'عرض المدفوعات الخاصة به', 'financial'],
      ['payments', 'create', 'إضافة دفعة', 'إضافة دفعة جديدة', 'financial'],
      ['payments', 'update', 'تعديل دفعة', 'تعديل دفعة', 'financial'],
      ['companies', 'view', 'عرض الشركات', 'عرض الشركات', 'crm'],
      ['companies', 'create', 'إضافة شركة', 'إضافة شركة جديدة', 'crm'],
      ['companies', 'update', 'تعديل شركة', 'تعديل شركة', 'crm'],
      ['companies', 'delete', 'حذف شركة', 'حذف شركة', 'crm'],
      ['settings', 'view', 'عرض الإعدادات', 'عرض إعدادات النظام', 'admin'],
      ['settings', 'update', 'تعديل الإعدادات', 'تعديل إعدادات النظام', 'admin']
    ];

    for (const [module, action, name, description, category] of permissions) {
      await connection.execute(`
        INSERT INTO \`Permission\` (\`module\`, \`action\`, \`name\`, \`description\`, \`category\`) 
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          \`name\` = VALUES(\`name\`),
          \`description\` = VALUES(\`description\`),
          \`category\` = VALUES(\`category\`)
      `, [module, action, name, description, category]);
    }
    console.log(`✅ Step 8 completed: Inserted ${permissions.length} permissions\n`);

    // Execute Step 9-12: Update role permissions
    console.log('Step 9: Updating Admin permissions...');
    await connection.execute(`
      UPDATE \`Role\` SET \`permissions\` = JSON_OBJECT('all', true) 
      WHERE \`id\` = 1 AND \`name\` = 'Admin'
    `);
    console.log('✅ Step 9 completed: Updated Admin permissions\n');

    console.log('Step 10: Updating Manager permissions...');
    await connection.execute(`
      UPDATE \`Role\` SET \`permissions\` = JSON_OBJECT(
        'repairs.view_all', true,
        'repairs.update', true,
        'invoices.view_all', true,
        'invoices.create', true,
        'invoices.update', true,
        'invoices.print', true,
        'customers.view_all', true,
        'customers.create', true,
        'customers.update', true,
        'users.view', true,
        'users.update', true,
        'reports.view', true,
        'reports.export', true,
        'inventory.view', true,
        'devices.view', true,
        'payments.view', true,
        'payments.create', true
      ) WHERE \`id\` = 2 AND \`name\` = 'Manager'
    `);
    console.log('✅ Step 10 completed: Updated Manager permissions\n');

    console.log('Step 11: Updating Technician permissions...');
    await connection.execute(`
      UPDATE \`Role\` SET \`permissions\` = JSON_OBJECT(
        'repairs.view_all', true,
        'repairs.update', true,
        'inventory.view', true,
        'inventory.update', true,
        'devices.view', true,
        'devices.update', true
      ) WHERE \`id\` = 3 AND \`name\` = 'Technician'
    `);
    console.log('✅ Step 11 completed: Updated Technician permissions\n');

    console.log('Step 12: Updating Receptionist (User) permissions...');
    await connection.execute(`
      UPDATE \`Role\` SET \`permissions\` = JSON_OBJECT(
        'repairs.create', true,
        'repairs.view_all', true,
        'customers.view_all', true,
        'customers.create', true,
        'customers.update', true,
        'devices.view', true,
        'devices.create', true,
        'devices.update', true
      ) WHERE \`id\` = 4 AND \`name\` = 'User'
    `);
    console.log('✅ Step 12 completed: Updated Receptionist permissions\n');

    console.log('🎉 Migration completed successfully!');
    
    // Verify results
    console.log('\n📊 Verification:');
    const [roles] = await connection.execute('SELECT id, name, description, isSystem, isActive FROM Role WHERE deletedAt IS NULL');
    console.log(`✅ Found ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`   - ${role.name} (ID: ${role.id}, System: ${role.isSystem}, Active: ${role.isActive})`);
    });

    const [permissionsCount] = await connection.execute('SELECT COUNT(*) as count FROM Permission');
    console.log(`✅ Found ${permissionsCount[0].count} permissions in Permission table`);

    const [userColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'User' AND COLUMN_NAME = 'customerId'
    `, [dbConfig.database]);
    console.log(`✅ User table has customerId column: ${userColumns.length > 0}`);

    const [customerColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Customer' AND COLUMN_NAME = 'userId'
    `, [dbConfig.database]);
    console.log(`✅ Customer table has userId column: ${customerColumns.length > 0}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run migration
runMigration();

