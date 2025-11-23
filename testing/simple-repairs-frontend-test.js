const axios = require('axios');

class SimpleRepairsFrontendTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.apiUrl = 'http://localhost:4000/api';
    this.cookies = null;
    this.results = [];
  }

  async login() {
    try {
      console.log('🔐 تسجيل الدخول...');
      const response = await axios.post(`${this.apiUrl}/auth/login`, {
        loginIdentifier: 'admin@fixzone.com',
        password: 'admin123'
      }, {
        withCredentials: true
      });
      
      this.cookies = response.headers['set-cookie'];
      console.log('✅ تم تسجيل الدخول بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل تسجيل الدخول:', error.message);
      return false;
    }
  }

  async testFrontendPages() {
    console.log('📋 اختبار صفحات الواجهة الأمامية...');
    
    const pages = [
      { url: '/repairs', name: 'صفحة طلبات الإصلاح' },
      { url: '/repairs/new', name: 'صفحة إنشاء طلب إصلاح' },
      { url: '/customers', name: 'صفحة العملاء' },
      { url: '/invoices', name: 'صفحة الفواتير' },
      { url: '/dashboard', name: 'لوحة التحكم' }
    ];

    for (const page of pages) {
      try {
        const response = await axios.get(`${this.baseUrl}${page.url}`, {
          timeout: 10000,
          validateStatus: (status) => status < 500
        });
        
        const success = response.status === 200;
        console.log(`${success ? '✅' : '❌'} ${page.name}: ${response.status}`);
        this.results.push({ test: page.name, success, status: response.status });
      } catch (error) {
        console.log(`❌ ${page.name}: خطأ - ${error.message}`);
        this.results.push({ test: page.name, success: false, error: error.message });
      }
    }
  }

  async testAPIEndpoints() {
    console.log('🔌 اختبار نقاط API...');
    
    const endpoints = [
      { url: '/repairs', method: 'GET', name: 'جلب طلبات الإصلاح' },
      { url: '/customers', method: 'GET', name: 'جلب العملاء' },
      { url: '/invoices', method: 'GET', name: 'جلب الفواتير' },
      { url: '/users', method: 'GET', name: 'جلب المستخدمين' },
      { url: '/companies', method: 'GET', name: 'جلب الشركات' }
    ];

    for (const endpoint of endpoints) {
      try {
        const config = {
          method: endpoint.method,
          url: `${this.apiUrl}${endpoint.url}`,
          headers: this.cookies ? { Cookie: this.cookies.join('; ') } : {},
          timeout: 10000
        };
        
        const response = await axios(config);
        const success = response.status === 200;
        console.log(`${success ? '✅' : '❌'} ${endpoint.name}: ${response.status}`);
        this.results.push({ test: endpoint.name, success, status: response.status });
      } catch (error) {
        console.log(`❌ ${endpoint.name}: خطأ - ${error.message}`);
        this.results.push({ test: endpoint.name, success: false, error: error.message });
      }
    }
  }

  async testRepairWorkflow() {
    console.log('🔄 اختبار سير العمل الكامل...');
    
    try {
      // 1. إنشاء عميل جديد
      const customerResponse = await axios.post(`${this.apiUrl}/customers`, {
        name: 'محمد أحمد للاختبار',
        phone: '0123456789',
        email: 'test@example.com'
      }, {
        headers: this.cookies ? { Cookie: this.cookies.join('; ') } : {}
      });
      
      if (customerResponse.status === 201) {
        console.log('✅ تم إنشاء عميل جديد');
        
        // 2. إنشاء طلب إصلاح
        const repairResponse = await axios.post(`${this.apiUrl}/repairs`, {
          customerId: customerResponse.data.customer.id,
          reportedProblem: 'مشكلة في الشاشة - اختبار'
        }, {
          headers: this.cookies ? { Cookie: this.cookies.join('; ') } : {}
        });
        
        if (repairResponse.status === 201) {
          console.log('✅ تم إنشاء طلب إصلاح');
          
          // 3. تحديث حالة الطلب
          const updateResponse = await axios.put(`${this.apiUrl}/repairs/${repairResponse.data.data.id}`, {
            status: 'UNDER_REPAIR'
          }, {
            headers: this.cookies ? { Cookie: this.cookies.join('; ') } : {}
          });
          
          if (updateResponse.status === 200) {
            console.log('✅ تم تحديث حالة الطلب');
            
            // 4. إنشاء فاتورة
            const invoiceResponse = await axios.post(`${this.apiUrl}/invoices`, {
              totalAmount: 500,
              amountPaid: 0,
              status: 'draft',
              currency: 'EGP'
            }, {
              headers: this.cookies ? { Cookie: this.cookies.join('; ') } : {}
            });
            
            if (invoiceResponse.status === 201) {
              console.log('✅ تم إنشاء فاتورة');
              this.results.push({ test: 'سير العمل الكامل', success: true });
              return;
            }
          }
        }
      }
      
      this.results.push({ test: 'سير العمل الكامل', success: false });
    } catch (error) {
      console.error('❌ فشل سير العمل:', error.message);
      this.results.push({ test: 'سير العمل الكامل', success: false, error: error.message });
    }
  }

  async testPerformance() {
    console.log('⚡ اختبار الأداء...');
    
    const startTime = Date.now();
    
    try {
      await Promise.all([
        axios.get(`${this.apiUrl}/repairs`, {
          headers: this.cookies ? { Cookie: this.cookies.join('; ') } : {}
        }),
        axios.get(`${this.apiUrl}/customers`, {
          headers: this.cookies ? { Cookie: this.cookies.join('; ') } : {}
        }),
        axios.get(`${this.apiUrl}/invoices`, {
          headers: this.cookies ? { Cookie: this.cookies.join('; ') } : {}
        })
      ]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ تم تحميل 3 APIs في ${duration}ms`);
      this.results.push({ test: 'اختبار الأداء', success: true, duration });
    } catch (error) {
      console.error('❌ فشل اختبار الأداء:', error.message);
      this.results.push({ test: 'اختبار الأداء', success: false, error: error.message });
    }
  }

  async runAllTests() {
    console.log('🚀 بدء اختبار موديول الإصلاحات...');
    
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ فشل تسجيل الدخول، إيقاف الاختبارات');
      return;
    }
    
    await this.testFrontendPages();
    await this.testAPIEndpoints();
    await this.testRepairWorkflow();
    await this.testPerformance();
    
    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 تقرير اختبار موديول الإصلاحات');
    console.log('='.repeat(50));
    
    let passed = 0;
    let total = this.results.length;
    
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      if (result.success) passed++;
    });
    
    const successRate = ((passed / total) * 100).toFixed(1);
    console.log(`\n📈 معدل النجاح: ${successRate}%`);
    console.log(`✅ نجح: ${passed}`);
    console.log(`❌ فشل: ${total - passed}`);
    
    // حفظ التقرير
    const report = {
      timestamp: new Date().toISOString(),
      module: 'Repairs Module Comprehensive Test',
      successRate: parseFloat(successRate),
      total: total,
      passed: passed,
      failed: total - passed,
      results: this.results
    };
    
    require('fs').writeFileSync(
      `REPAIRS_COMPREHENSIVE_TEST_${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 تم حفظ التقرير في ملف JSON');
  }
}

// تشغيل الاختبارات
const tester = new SimpleRepairsFrontendTester();
tester.runAllTests().catch(console.error);
