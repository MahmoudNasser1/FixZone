const puppeteer = require('puppeteer');

class RepairsFrontendTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    console.log('🚀 بدء اختبار الواجهة الأمامية لموديول الإصلاحات...');
    this.browser = await puppeteer.launch({ 
      headless: false, 
      defaultViewport: null,
      args: ['--start-maximized']
    });
    this.page = await this.browser.newPage();
    
    // تسجيل الدخول أولاً
    await this.login();
  }

  async login() {
    console.log('🔐 تسجيل الدخول...');
    await this.page.goto('http://localhost:3000/login');
    
    await this.page.waitForSelector('input[name="loginIdentifier"]');
    await this.page.type('input[name="loginIdentifier"]', 'admin@fixzone.com');
    await this.page.type('input[name="password"]', 'admin123');
    await this.page.click('button[type="submit"]');
    
    await this.page.waitForNavigation();
    console.log('✅ تم تسجيل الدخول بنجاح');
  }

  async testRepairsPage() {
    console.log('📋 اختبار صفحة طلبات الإصلاح...');
    
    await this.page.goto('http://localhost:3000/repairs');
    await this.page.waitForSelector('[data-testid="repairs-page"]', { timeout: 10000 });
    
    // فحص وجود العناصر الأساسية
    const elements = await this.page.evaluate(() => {
      return {
        hasTable: !!document.querySelector('table'),
        hasSearchBox: !!document.querySelector('input[placeholder*="بحث"]'),
        hasAddButton: !!document.querySelector('button:has-text("إضافة")'),
        hasFilters: !!document.querySelector('[data-testid="filters"]'),
        repairCount: document.querySelectorAll('tbody tr').length
      };
    });
    
    console.log('📊 نتائج فحص صفحة الإصلاحات:', elements);
    this.results.push({ test: 'صفحة الإصلاحات', ...elements });
  }

  async testCreateRepair() {
    console.log('➕ اختبار إنشاء طلب إصلاح جديد...');
    
    await this.page.goto('http://localhost:3000/repairs/new');
    await this.page.waitForSelector('[data-testid="new-repair-form"]', { timeout: 10000 });
    
    // ملء النموذج
    await this.page.type('input[name="customerName"]', 'أحمد محمد');
    await this.page.type('input[name="customerPhone"]', '0123456789');
    await this.page.type('textarea[name="problemDescription"]', 'مشكلة في الشاشة - لا تعمل بشكل صحيح');
    
    // إرسال النموذج
    await this.page.click('button[type="submit"]');
    
    // انتظار النجاح
    await this.page.waitForSelector('.notification-success', { timeout: 5000 });
    
    const success = await this.page.evaluate(() => {
      return !!document.querySelector('.notification-success');
    });
    
    console.log('✅ إنشاء طلب الإصلاح:', success ? 'نجح' : 'فشل');
    this.results.push({ test: 'إنشاء طلب إصلاح', success });
  }

  async testRepairDetails() {
    console.log('👁️ اختبار صفحة تفاصيل الإصلاح...');
    
    await this.page.goto('http://localhost:3000/repairs');
    await this.page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // النقر على أول طلب إصلاح
    await this.page.click('table tbody tr:first-child td:first-child a');
    await this.page.waitForNavigation();
    
    // فحص وجود تفاصيل الإصلاح
    const details = await this.page.evaluate(() => {
      return {
        hasCustomerInfo: !!document.querySelector('[data-testid="customer-info"]'),
        hasProblemDescription: !!document.querySelector('[data-testid="problem-description"]'),
        hasStatusBadge: !!document.querySelector('[data-testid="status-badge"]'),
        hasUpdateButton: !!document.querySelector('button:has-text("تحديث")')
      };
    });
    
    console.log('📊 نتائج تفاصيل الإصلاح:', details);
    this.results.push({ test: 'تفاصيل الإصلاح', ...details });
  }

  async testRepairFilters() {
    console.log('🔍 اختبار فلاتر الإصلاحات...');
    
    await this.page.goto('http://localhost:3000/repairs');
    await this.page.waitForSelector('[data-testid="filters"]', { timeout: 10000 });
    
    // اختبار فلتر الحالة
    await this.page.click('[data-testid="status-filter"]');
    await this.page.click('[data-testid="status-RECEIVED"]');
    
    // انتظار تحديث النتائج
    await this.page.waitForTimeout(1000);
    
    const filteredResults = await this.page.evaluate(() => {
      const statusBadges = document.querySelectorAll('[data-testid="status-badge"]');
      return Array.from(statusBadges).map(badge => badge.textContent.trim());
    });
    
    console.log('📊 نتائج الفلترة:', filteredResults);
    this.results.push({ test: 'فلترة الإصلاحات', filteredResults });
  }

  async testRepairSearch() {
    console.log('🔎 اختبار البحث في الإصلاحات...');
    
    await this.page.goto('http://localhost:3000/repairs');
    await this.page.waitForSelector('input[placeholder*="بحث"]', { timeout: 10000 });
    
    // البحث عن كلمة "شاشة"
    await this.page.type('input[placeholder*="بحث"]', 'شاشة');
    await this.page.keyboard.press('Enter');
    
    // انتظار النتائج
    await this.page.waitForTimeout(1000);
    
    const searchResults = await this.page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length;
    });
    
    console.log('📊 نتائج البحث:', searchResults);
    this.results.push({ test: 'البحث في الإصلاحات', resultsCount: searchResults });
  }

  async testRepairWorkflow() {
    console.log('🔄 اختبار سير العمل الكامل...');
    
    // 1. إنشاء طلب إصلاح جديد
    await this.page.goto('http://localhost:3000/repairs/new');
    await this.page.waitForSelector('[data-testid="new-repair-form"]');
    
    await this.page.type('input[name="customerName"]', 'محمد علي');
    await this.page.type('input[name="customerPhone"]', '0111111111');
    await this.page.type('textarea[name="problemDescription"]', 'مشكلة في البطارية');
    await this.page.click('button[type="submit"]');
    
    await this.page.waitForSelector('.notification-success');
    
    // 2. العودة لقائمة الإصلاحات والبحث عن الطلب الجديد
    await this.page.goto('http://localhost:3000/repairs');
    await this.page.type('input[placeholder*="بحث"]', 'محمد علي');
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
    
    // 3. فتح تفاصيل الطلب وتحديث حالته
    await this.page.click('table tbody tr:first-child td:first-child a');
    await this.page.waitForNavigation();
    
    // 4. تحديث الحالة
    await this.page.click('button:has-text("تحديث الحالة")');
    await this.page.select('select[name="status"]', 'UNDER_REPAIR');
    await this.page.click('button[type="submit"]');
    
    const workflowSuccess = await this.page.evaluate(() => {
      return !!document.querySelector('.notification-success');
    });
    
    console.log('✅ سير العمل الكامل:', workflowSuccess ? 'نجح' : 'فشل');
    this.results.push({ test: 'سير العمل الكامل', success: workflowSuccess });
  }

  async testConsoleErrors() {
    console.log('🚨 فحص أخطاء الكونسول...');
    
    const errors = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // تصفح صفحات مختلفة
    await this.page.goto('http://localhost:3000/repairs');
    await this.page.waitForTimeout(2000);
    
    await this.page.goto('http://localhost:3000/repairs/new');
    await this.page.waitForTimeout(2000);
    
    console.log('📊 أخطاء الكونسول:', errors.length);
    this.results.push({ test: 'أخطاء الكونسول', errorCount: errors.length, errors });
  }

  async runAllTests() {
    try {
      await this.init();
      
      await this.testRepairsPage();
      await this.testCreateRepair();
      await this.testRepairDetails();
      await this.testRepairFilters();
      await this.testRepairSearch();
      await this.testRepairWorkflow();
      await this.testConsoleErrors();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ خطأ في الاختبار:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  generateReport() {
    console.log('\n📊 تقرير اختبار الواجهة الأمامية لموديول الإصلاحات');
    console.log('='.repeat(60));
    
    let passed = 0;
    let total = this.results.length;
    
    this.results.forEach(result => {
      const status = result.success !== false ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      if (result.success !== false) passed++;
    });
    
    const successRate = ((passed / total) * 100).toFixed(1);
    console.log(`\n📈 معدل النجاح: ${successRate}%`);
    console.log(`✅ نجح: ${passed}`);
    console.log(`❌ فشل: ${total - passed}`);
    
    // حفظ التقرير
    const report = {
      timestamp: new Date().toISOString(),
      module: 'Repairs Frontend',
      successRate: parseFloat(successRate),
      total: total,
      passed: passed,
      failed: total - passed,
      results: this.results
    };
    
    require('fs').writeFileSync(
      `REPAIRS_FRONTEND_TEST_REPORT_${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 تم حفظ التقرير في ملف JSON');
  }
}

// تشغيل الاختبارات
const tester = new RepairsFrontendTester();
tester.runAllTests().catch(console.error);
