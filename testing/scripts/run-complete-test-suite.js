const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// إعدادات الاختبار
const TEST_CONFIG = {
  backendUrl: 'http://localhost:4000',
  frontendUrl: 'http://localhost:3000',
  database: 'FZ',
  timeout: 30000 // 30 ثانية
};

// نتائج الاختبار الشاملة
const comprehensiveResults = {
  backend: { passed: 0, failed: 0, total: 0, errors: [] },
  database: { passed: 0, failed: 0, total: 0, errors: [] },
  e2e: { passed: 0, failed: 0, total: 0, errors: [] },
  overall: { passed: 0, failed: 0, total: 0 }
};

// دالة مساعدة لتشغيل الاختبارات
function runTest(testName, testFile, category) {
  return new Promise((resolve) => {
    console.log(`\n🚀 تشغيل ${testName}...`);
    
    const startTime = Date.now();
    
    exec(`node ${testFile}`, (error, stdout, stderr) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️ مدة التنفيذ: ${duration}ms`);
      
      if (error) {
        console.log(`❌ فشل ${testName}: ${error.message}`);
        comprehensiveResults[category].failed++;
        comprehensiveResults[category].errors.push({
          test: testName,
          error: error.message,
          duration
        });
      } else {
        console.log(`✅ نجح ${testName}`);
        comprehensiveResults[category].passed++;
      }
      
      comprehensiveResults[category].total++;
      comprehensiveResults.overall.total++;
      
      if (!error) {
        comprehensiveResults.overall.passed++;
      } else {
        comprehensiveResults.overall.failed++;
      }
      
      resolve();
    });
  });
}

// دالة للتحقق من حالة الخوادم
async function checkServerStatus() {
  console.log('🔍 التحقق من حالة الخوادم...');
  
  const servers = [
    { name: 'Backend Server', url: TEST_CONFIG.backendUrl, port: 4000 },
    { name: 'Frontend Server', url: TEST_CONFIG.frontendUrl, port: 3000 }
  ];
  
  for (const server of servers) {
    try {
      const response = await fetch(`${server.url}/health`);
      if (response.ok) {
        console.log(`✅ ${server.name} يعمل بشكل صحيح`);
      } else {
        console.log(`⚠️ ${server.name} يعمل لكن مع مشاكل`);
      }
    } catch (error) {
      console.log(`❌ ${server.name} غير متاح: ${error.message}`);
      console.log(`   يرجى التأكد من تشغيل الخادم على المنفذ ${server.port}`);
    }
  }
}

// دالة لإنشاء تقرير HTML
function generateHTMLReport() {
  const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير اختبار نظام المدفوعات</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #3B82F6; }
        .header h1 { color: #1F2937; margin: 0; font-size: 2.5rem; }
        .header p { color: #6B7280; margin: 10px 0 0 0; font-size: 1.1rem; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; font-size: 1.5rem; }
        .summary-card .number { font-size: 2.5rem; font-weight: bold; margin: 10px 0; }
        .category { margin-bottom: 30px; }
        .category h2 { color: #1F2937; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; }
        .test-item { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; margin-bottom: 10px; }
        .test-item.passed { border-left: 4px solid #10B981; }
        .test-item.failed { border-left: 4px solid #EF4444; }
        .test-item h4 { margin: 0 0 5px 0; color: #1F2937; }
        .test-item .status { font-weight: bold; }
        .test-item.passed .status { color: #10B981; }
        .test-item.failed .status { color: #EF4444; }
        .error-details { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; padding: 10px; margin-top: 10px; font-family: monospace; font-size: 0.9rem; color: #DC2626; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; }
        .timestamp { background: #F3F4F6; padding: 10px; border-radius: 6px; margin-bottom: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 تقرير اختبار نظام المدفوعات</h1>
            <p>FixZone ERP - نظام إدارة المدفوعات المتقدم</p>
        </div>
        
        <div class="timestamp">
            <strong>تاريخ الاختبار:</strong> ${new Date().toLocaleString('ar-EG')}
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>إجمالي الاختبارات</h3>
                <div class="number">${comprehensiveResults.overall.total}</div>
                <p>اختبار شامل</p>
            </div>
            <div class="summary-card">
                <h3>نجح</h3>
                <div class="number" style="color: #10B981;">${comprehensiveResults.overall.passed}</div>
                <p>اختبار ناجح</p>
            </div>
            <div class="summary-card">
                <h3>فشل</h3>
                <div class="number" style="color: #EF4444;">${comprehensiveResults.overall.failed}</div>
                <p>اختبار فاشل</p>
            </div>
            <div class="summary-card">
                <h3>نسبة النجاح</h3>
                <div class="number" style="color: #3B82F6;">
                    ${Math.round((comprehensiveResults.overall.passed / comprehensiveResults.overall.total) * 100)}%
                </div>
                <p>معدل النجاح</p>
            </div>
        </div>
        
        <div class="category">
            <h2>🔧 اختبارات الباك اند (APIs)</h2>
            <p>اختبار جميع APIs والوظائف الخلفية</p>
            ${comprehensiveResults.backend.errors.map(error => `
                <div class="test-item ${error.error ? 'failed' : 'passed'}">
                    <h4>${error.test}</h4>
                    <div class="status">${error.error ? 'فشل' : 'نجح'}</div>
                    ${error.error ? `<div class="error-details">${error.error}</div>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="category">
            <h2>🗄️ اختبارات قاعدة البيانات</h2>
            <p>اختبار الهيكل والعلاقات وتكامل البيانات</p>
            ${comprehensiveResults.database.errors.map(error => `
                <div class="test-item ${error.error ? 'failed' : 'passed'}">
                    <h4>${error.test}</h4>
                    <div class="status">${error.error ? 'فشل' : 'نجح'}</div>
                    ${error.error ? `<div class="error-details">${error.error}</div>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="category">
            <h2>🌐 اختبارات E2E (واجهة المستخدم)</h2>
            <p>اختبار تجربة المستخدم والوظائف المتكاملة</p>
            ${comprehensiveResults.e2e.errors.map(error => `
                <div class="test-item ${error.error ? 'failed' : 'passed'}">
                    <h4>${error.test}</h4>
                    <div class="status">${error.error ? 'فشل' : 'نجح'}</div>
                    ${error.error ? `<div class="error-details">${error.error}</div>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>تم إنشاء هذا التقرير تلقائياً بواسطة نظام اختبار FixZone ERP</p>
            <p>الإصدار: 1.0.0 | تاريخ الإصدار: ديسمبر 2024</p>
        </div>
    </div>
</body>
</html>`;

  fs.writeFileSync('test-report.html', htmlContent, 'utf8');
  console.log('\n📄 تم إنشاء تقرير HTML: test-report.html');
}

// دالة رئيسية لتشغيل جميع الاختبارات
async function runCompleteTestSuite() {
  console.log('🎯 بدء اختبار شامل لنظام المدفوعات...\n');
  console.log('='.repeat(60));
  console.log('🚀 FixZone ERP - نظام إدارة المدفوعات المتقدم');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    // التحقق من حالة الخوادم
    await checkServerStatus();
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 بدء تشغيل الاختبارات...');
    console.log('='.repeat(60));
    
    // تشغيل اختبارات الباك اند
    console.log('\n🔧 اختبارات الباك اند (APIs)...');
    await runTest('اختبار APIs الباك اند', 'test-backend-apis.js', 'backend');
    
    // تشغيل اختبارات قاعدة البيانات
    console.log('\n🗄️ اختبارات قاعدة البيانات...');
    await runTest('اختبار قاعدة البيانات', 'test-database-integration.js', 'database');
    
    // تشغيل اختبارات E2E
    console.log('\n🌐 اختبارات E2E (واجهة المستخدم)...');
    await runTest('اختبار E2E مع Playwright', 'test-e2e-playwright.js', 'e2e');
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    // عرض النتائج النهائية
    console.log('\n' + '='.repeat(60));
    console.log('📊 النتائج النهائية للاختبار الشامل');
    console.log('='.repeat(60));
    
    console.log(`\n🔧 الباك اند (APIs):`);
    console.log(`   ✅ نجح: ${comprehensiveResults.backend.passed}`);
    console.log(`   ❌ فشل: ${comprehensiveResults.backend.failed}`);
    console.log(`   📈 النسبة: ${Math.round((comprehensiveResults.backend.passed / comprehensiveResults.backend.total) * 100)}%`);
    
    console.log(`\n🗄️ قاعدة البيانات:`);
    console.log(`   ✅ نجح: ${comprehensiveResults.database.passed}`);
    console.log(`   ❌ فشل: ${comprehensiveResults.database.failed}`);
    console.log(`   📈 النسبة: ${Math.round((comprehensiveResults.database.passed / comprehensiveResults.database.total) * 100)}%`);
    
    console.log(`\n🌐 E2E (واجهة المستخدم):`);
    console.log(`   ✅ نجح: ${comprehensiveResults.e2e.passed}`);
    console.log(`   ❌ فشل: ${comprehensiveResults.e2e.failed}`);
    console.log(`   📈 النسبة: ${Math.round((comprehensiveResults.e2e.passed / comprehensiveResults.e2e.total) * 100)}%`);
    
    console.log(`\n🎯 الإجمالي:`);
    console.log(`   ✅ نجح: ${comprehensiveResults.overall.passed}`);
    console.log(`   ❌ فشل: ${comprehensiveResults.overall.failed}`);
    console.log(`   📈 النسبة: ${Math.round((comprehensiveResults.overall.passed / comprehensiveResults.overall.total) * 100)}%`);
    console.log(`   ⏱️ المدة الإجمالية: ${Math.round(totalDuration / 1000)} ثانية`);
    
    // إنشاء تقرير HTML
    generateHTMLReport();
    
    // التوصيات النهائية
    console.log('\n' + '='.repeat(60));
    console.log('🎯 التوصيات النهائية:');
    console.log('='.repeat(60));
    
    if (comprehensiveResults.overall.failed === 0) {
      console.log('🎉 مبروك! جميع الاختبارات نجحت.');
      console.log('✅ النظام جاهز للإنتاج والاستخدام.');
      console.log('🚀 يمكنك نشر النظام بثقة.');
    } else if (comprehensiveResults.overall.passed > comprehensiveResults.overall.failed) {
      console.log('⚠️ معظم الاختبارات نجحت، لكن هناك بعض المشاكل.');
      console.log('🔧 يرجى إصلاح المشاكل المتبقية قبل النشر.');
      console.log('📋 راجع التقرير المفصل للمشاكل.');
    } else {
      console.log('🚨 هناك مشاكل كبيرة في النظام!');
      console.log('🛠️ يرجى إصلاح جميع المشاكل قبل النشر.');
      console.log('📞 قد تحتاج مساعدة من المطورين.');
    }
    
    console.log('\n📄 تم إنشاء تقرير مفصل في: test-report.html');
    console.log('🎯 شكراً لاستخدام نظام اختبار FixZone ERP!');
    
  } catch (error) {
    console.error('❌ خطأ في تشغيل الاختبارات:', error.message);
    process.exit(1);
  }
}

// تشغيل الاختبارات الشاملة
runCompleteTestSuite();
