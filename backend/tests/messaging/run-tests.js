// backend/tests/messaging/run-tests.js
// Script لتشغيل اختبارات المراسلة

require('dotenv').config();

// استخدام Jest إذا كان متوفراً، وإلا استخدام Node.js بسيط
const isJest = typeof jest !== 'undefined';

if (!isJest) {
  console.log('⚠️  هذا الملف مصمم للعمل مع Jest');
  console.log('📝 لتشغيل الاختبارات، استخدم:');
  console.log('   npm test -- messaging');
  console.log('   أو');
  console.log('   npx jest tests/messaging');
  process.exit(0);
}

// إذا كان Jest متوفراً، سيتم تشغيل الاختبارات تلقائياً
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/messaging/**/*.test.js'],
  collectCoverageFrom: [
    'services/messaging/**/*.js',
    'services/template.service.js',
    'services/whatsapp.service.js',
    'services/email.service.js'
  ]
};

