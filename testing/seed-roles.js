#!/usr/bin/env node

const db = require('../backend/db');

async function seedRoles() {
  try {
    console.log('🌱 إضافة الأدوار إلى قاعدة البيانات...');
    
    // إضافة الأدوار الأساسية
    const roles = [
      { name: 'Admin', permissions: JSON.stringify({ all: true }) },
      { name: 'Manager', permissions: JSON.stringify({ users: true, reports: true }) },
      { name: 'Technician', permissions: JSON.stringify({ repairs: true }) },
      { name: 'User', permissions: JSON.stringify({ view: true }) }
    ];
    
    for (const role of roles) {
      try {
        await db.query(
          'INSERT INTO Role (name, permissions) VALUES (?, ?) ON DUPLICATE KEY UPDATE permissions = VALUES(permissions)',
          [role.name, role.permissions]
        );
        console.log(`✅ تم إضافة/تحديث الدور: ${role.name}`);
      } catch (error) {
        console.log(`⚠️ خطأ في إضافة الدور ${role.name}:`, error.message);
      }
    }
    
    // عرض جميع الأدوار
    const [allRoles] = await db.query('SELECT * FROM Role WHERE deletedAt IS NULL');
    console.log('\n📋 الأدوار الموجودة:');
    allRoles.forEach(role => {
      console.log(`- ${role.id}: ${role.name}`);
    });
    
    console.log('\n🎉 تم إنهاء إضافة الأدوار بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إضافة الأدوار:', error);
  } finally {
    process.exit(0);
  }
}

seedRoles();

