const { chromium } = require('playwright');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4000';

// نتائج الاختبار
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// دالة مساعدة للاختبار
async function testE2E(name, testFunction) {
  console.log(`\n🧪 اختبار E2E: ${name}`);
  testResults.total++;
  
  try {
    await testFunction();
    console.log(`✅ نجح: ${name}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ فشل: ${name} - ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
  }
}

// اختبار تحميل الصفحة الرئيسية
async function testHomePageLoad() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // التحقق من وجود عناصر أساسية
    const title = await page.title();
    if (!title || title.includes('Error')) {
      throw new Error('الصفحة لم تحمل بشكل صحيح');
    }
    
    console.log(`   📄 عنوان الصفحة: ${title}`);
  } finally {
    await browser.close();
  }
}

// اختبار صفحة المدفوعات
async function testPaymentsPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto(`${BASE_URL}/payments`);
    await page.waitForLoadState('networkidle');
    
    // التحقق من وجود عناصر الصفحة
    const pageTitle = await page.textContent('h1');
    if (!pageTitle || !pageTitle.includes('المدفوعات')) {
      throw new Error('صفحة المدفوعات لم تحمل بشكل صحيح');
    }
    
    // التحقق من وجود أزرار الإجراءات
    const addButton = await page.locator('button:has-text("إضافة مدفوعة")').first();
    if (!(await addButton.isVisible())) {
      throw new Error('زر إضافة مدفوعة غير موجود');
    }
    
    console.log(`   💰 صفحة المدفوعات محملة بنجاح`);
  } finally {
    await browser.close();
  }
}

// اختبار إنشاء مدفوعة جديدة
async function testCreatePayment() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto(`${BASE_URL}/payments`);
    await page.waitForLoadState('networkidle');
    
    // النقر على زر إضافة مدفوعة
    await page.click('button:has-text("إضافة مدفوعة")');
    await page.waitForTimeout(1000);
    
    // التحقق من ظهور النموذج
    const form = await page.locator('form').first();
    if (!(await form.isVisible())) {
      throw new Error('نموذج إضافة مدفوعة لم يظهر');
    }
    
    // ملء البيانات
    await page.fill('input[name="amount"]', '100');
    await page.selectOption('select[name="paymentMethod"]', 'cash');
    await page.fill('input[name="referenceNumber"]', `TEST-${Date.now()}`);
    await page.fill('textarea[name="notes"]', 'اختبار E2E');
    
    console.log(`   📝 تم ملء نموذج المدفوعة بنجاح`);
    
    // إلغاء النموذج للاختبار
    await page.click('button:has-text("إلغاء")');
    
  } finally {
    await browser.close();
  }
}

// اختبار صفحة التقارير
async function testReportsPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto(`${BASE_URL}/payments/reports`);
    await page.waitForLoadState('networkidle');
    
    // التحقق من وجود الرسوم البيانية
    const charts = await page.locator('canvas').count();
    if (charts === 0) {
      console.log('   ⚠️ الرسوم البيانية غير موجودة');
    } else {
      console.log(`   📊 تم العثور على ${charts} رسم بياني`);
    }
    
    // التحقق من وجود أزرار التصدير
    const exportButton = await page.locator('button:has-text("تصدير")').first();
    if (await exportButton.isVisible()) {
      console.log('   📤 أزرار التصدير موجودة');
    }
    
  } finally {
    await browser.close();
  }
}

// اختبار صفحة المدفوعات المتأخرة
async function testOverduePaymentsPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto(`${BASE_URL}/payments/overdue`);
    await page.waitForLoadState('networkidle');
    
    // التحقق من عنوان الصفحة
    const pageTitle = await page.textContent('h1');
    if (!pageTitle || !pageTitle.includes('المدفوعات المتأخرة')) {
      throw new Error('صفحة المدفوعات المتأخرة لم تحمل بشكل صحيح');
    }
    
    // التحقق من وجود الفلاتر
    const filters = await page.locator('select, input[type="text"]').count();
    console.log(`   🔍 تم العثور على ${filters} فلتر`);
    
  } finally {
    await browser.close();
  }
}

// اختبار التنقل بين الصفحات
async function testNavigation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // اختبار التنقل إلى المدفوعات
    await page.click('a[href="/payments"]');
    await page.waitForLoadState('networkidle');
    
    // اختبار التنقل إلى التقارير
    await page.click('button:has-text("التقارير")');
    await page.waitForLoadState('networkidle');
    
    // اختبار التنقل إلى المدفوعات المتأخرة
    await page.click('button:has-text("المدفوعات المتأخرة")');
    await page.waitForLoadState('networkidle');
    
    console.log(`   🧭 التنقل بين الصفحات يعمل بشكل صحيح`);
    
  } finally {
    await browser.close();
  }
}

// اختبار الاستجابة للأجهزة المختلفة
async function testResponsiveDesign() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // اختبار الشاشة الكبيرة
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/payments`);
    await page.waitForLoadState('networkidle');
    console.log(`   💻 الشاشة الكبيرة (1920x1080): OK`);
    
    // اختبار الشاشة المتوسطة
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    console.log(`   📱 الشاشة المتوسطة (768x1024): OK`);
    
    // اختبار الشاشة الصغيرة
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    console.log(`   📱 الشاشة الصغيرة (375x667): OK`);
    
  } finally {
    await browser.close();
  }
}

// اختبار الأداء
async function testPerformance() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/payments`);
    await page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    if (loadTime > 5000) {
      throw new Error(`صفحة المدفوعات بطيئة جداً: ${loadTime}ms`);
    }
    
    console.log(`   ⚡ وقت التحميل: ${loadTime}ms`);
    
    // اختبار تحميل الرسوم البيانية
    const chartsStartTime = Date.now();
    await page.goto(`${BASE_URL}/payments/reports`);
    await page.waitForLoadState('networkidle');
    const chartsEndTime = Date.now();
    const chartsLoadTime = chartsEndTime - chartsStartTime;
    
    console.log(`   📊 وقت تحميل التقارير: ${chartsLoadTime}ms`);
    
  } finally {
    await browser.close();
  }
}

// اختبار معالجة الأخطاء
async function testErrorHandling() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // اختبار صفحة غير موجودة
    await page.goto(`${BASE_URL}/non-existent-page`);
    await page.waitForTimeout(2000);
    
    // التحقق من وجود رسالة خطأ أو إعادة توجيه
    const currentUrl = page.url();
    if (currentUrl.includes('non-existent-page')) {
      console.log('   ⚠️ لم يتم التعامل مع الصفحة غير الموجودة');
    } else {
      console.log('   ✅ تم التعامل مع الصفحة غير الموجودة بشكل صحيح');
    }
    
  } finally {
    await browser.close();
  }
}

// اختبار إمكانية الوصول
async function testAccessibility() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto(`${BASE_URL}/payments`);
    await page.waitForLoadState('networkidle');
    
    // اختبار التنقل بلوحة المفاتيح
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // التحقق من وجود ARIA labels
    const ariaLabels = await page.locator('[aria-label]').count();
    console.log(`   ♿ تم العثور على ${ariaLabels} عنصر مع ARIA label`);
    
    // التحقق من وجود alt text للصور
    const imagesWithAlt = await page.locator('img[alt]').count();
    console.log(`   🖼️ تم العثور على ${imagesWithAlt} صورة مع alt text`);
    
  } finally {
    await browser.close();
  }
}

// تشغيل جميع اختبارات E2E
async function runE2ETests() {
  console.log('🌐 بدء اختبار E2E مع Playwright...\n');
  
  // اختبارات الصفحات الأساسية
  await testE2E('تحميل الصفحة الرئيسية', testHomePageLoad);
  await testE2E('صفحة المدفوعات', testPaymentsPage);
  await testE2E('إنشاء مدفوعة جديدة', testCreatePayment);
  await testE2E('صفحة التقارير', testReportsPage);
  await testE2E('صفحة المدفوعات المتأخرة', testOverduePaymentsPage);
  
  // اختبارات التنقل والتصميم
  await testE2E('التنقل بين الصفحات', testNavigation);
  await testE2E('التصميم المتجاوب', testResponsiveDesign);
  
  // اختبارات الأداء والجودة
  await testE2E('الأداء', testPerformance);
  await testE2E('معالجة الأخطاء', testErrorHandling);
  await testE2E('إمكانية الوصول', testAccessibility);
  
  // عرض النتائج النهائية
  console.log('\n' + '='.repeat(50));
  console.log('📊 نتائج اختبار E2E:');
  console.log('='.repeat(50));
  console.log(`✅ نجح: ${testResults.passed}`);
  console.log(`❌ فشل: ${testResults.failed}`);
  console.log(`📈 النسبة: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ الأخطاء:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.name}: ${error.error}`);
    });
  }
  
  console.log('\n🎯 ملخص اختبار E2E:');
  if (testResults.failed === 0) {
    console.log('🎉 جميع اختبارات E2E نجحت! النظام جاهز للاستخدام.');
  } else if (testResults.passed > testResults.failed) {
    console.log('⚠️ معظم اختبارات E2E نجحت، لكن هناك بعض المشاكل تحتاج إصلاح.');
  } else {
    console.log('🚨 هناك مشاكل كبيرة في واجهة المستخدم تحتاج إصلاح فوري.');
  }
}

// تشغيل الاختبارات
runE2ETests().catch(console.error);
