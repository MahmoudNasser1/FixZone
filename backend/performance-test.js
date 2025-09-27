/**
 * ⚡ اختبارات الأداء والضغط - موديول المدفوعات
 * 
 * اختبارات شاملة لأداء النظام تحت الضغط
 * يشمل: اختبارات الضغط، الأداء، والاستقرار
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// إعدادات الاختبار
const PERFORMANCE_CONFIG = {
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
  testUser: {
    email: 'test@fixzone.com',
    password: 'test123456'
  },
  loadTest: {
    concurrentUsers: 50,
    requestsPerUser: 10,
    duration: 60000 // 60 ثانية
  }
};

class PerformanceTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      errors: [],
      throughput: 0
    };
    this.authToken = null;
    this.startTime = null;
    this.endTime = null;
  }

  // تسجيل الدخول
  async authenticate() {
    try {
      const response = await axios.post(`${PERFORMANCE_CONFIG.baseURL}/auth/login`, {
        email: PERFORMANCE_CONFIG.testUser.email,
        password: PERFORMANCE_CONFIG.testUser.password
      });
      
      this.authToken = response.data.token;
      console.log('✅ تم تسجيل الدخول بنجاح');
      return true;
    } catch (error) {
      console.error('❌ فشل في تسجيل الدخول:', error.response?.data || error.message);
      return false;
    }
  }

  // اختبار وقت الاستجابة
  async testResponseTime() {
    console.log('\n⏱️ اختبار وقت الاستجابة...');
    
    const endpoints = [
      { name: 'قائمة المدفوعات', url: '/payments', method: 'GET' },
      { name: 'إنشاء مدفوعة', url: '/payments', method: 'POST', data: this.getMockPaymentData() },
      { name: 'إحصائيات المدفوعات', url: '/payments/stats', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpointResponseTime(endpoint);
    }
  }

  // اختبار وقت استجابة endpoint محدد
  async testEndpointResponseTime(endpoint) {
    const iterations = 10;
    const responseTimes = [];

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now();
        
        const config = {
          method: endpoint.method,
          url: `${PERFORMANCE_CONFIG.baseURL}${endpoint.url}`,
          headers: { Authorization: `Bearer ${this.authToken}` },
          timeout: PERFORMANCE_CONFIG.timeout
        };

        if (endpoint.data) {
          config.data = endpoint.data;
        }

        await axios(config);
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        console.log(`  ${endpoint.name}: ${responseTime.toFixed(2)}ms`);
      } catch (error) {
        console.error(`  ❌ ${endpoint.name}: ${error.message}`);
      }
    }

    if (responseTimes.length > 0) {
      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);
      const minTime = Math.min(...responseTimes);

      console.log(`  📊 ${endpoint.name} - متوسط: ${avgTime.toFixed(2)}ms, أقصى: ${maxTime.toFixed(2)}ms, أدنى: ${minTime.toFixed(2)}ms`);
    }
  }

  // اختبار الضغط
  async testLoad() {
    console.log('\n🔥 اختبار الضغط...');
    
    const { concurrentUsers, requestsPerUser } = PERFORMANCE_CONFIG.loadTest;
    const totalRequests = concurrentUsers * requestsPerUser;
    
    console.log(`📊 إرسال ${totalRequests} طلب من ${concurrentUsers} مستخدم متزامن...`);

    this.startTime = performance.now();
    const promises = [];

    // إنشاء طلبات متزامنة
    for (let user = 0; user < concurrentUsers; user++) {
      for (let request = 0; request < requestsPerUser; request++) {
        promises.push(this.makeRequest(user, request));
      }
    }

    // انتظار جميع الطلبات
    const results = await Promise.allSettled(promises);
    this.endTime = performance.now();

    // تحليل النتائج
    this.analyzeResults(results);
  }

  // إرسال طلب واحد
  async makeRequest(userId, requestId) {
    const startTime = performance.now();
    
    try {
      const response = await axios.get(`${PERFORMANCE_CONFIG.baseURL}/payments`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: PERFORMANCE_CONFIG.timeout
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        success: true,
        responseTime,
        userId,
        requestId,
        status: response.status
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        success: false,
        responseTime,
        userId,
        requestId,
        error: error.message,
        status: error.response?.status || 0
      };
    }
  }

  // تحليل النتائج
  analyzeResults(results) {
    const totalTime = (this.endTime - this.startTime) / 1000; // بالثواني
    const responseTimes = [];
    let successCount = 0;
    let failureCount = 0;

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const data = result.value;
        responseTimes.push(data.responseTime);
        
        if (data.success) {
          successCount++;
        } else {
          failureCount++;
          this.results.errors.push({
            userId: data.userId,
            requestId: data.requestId,
            error: data.error,
            status: data.status
          });
        }
      } else {
        failureCount++;
        this.results.errors.push({
          error: result.reason.message
        });
      }
    });

    // حساب الإحصائيات
    this.results.totalRequests = results.length;
    this.results.successfulRequests = successCount;
    this.results.failedRequests = failureCount;
    this.results.throughput = results.length / totalTime;

    if (responseTimes.length > 0) {
      this.results.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      this.results.maxResponseTime = Math.max(...responseTimes);
      this.results.minResponseTime = Math.min(...responseTimes);
    }

    // عرض النتائج
    this.displayResults(totalTime);
  }

  // عرض النتائج
  displayResults(totalTime) {
    console.log('\n📊 نتائج اختبار الضغط:');
    console.log('=' * 50);
    console.log(`إجمالي الطلبات: ${this.results.totalRequests}`);
    console.log(`الطلبات الناجحة: ${this.results.successfulRequests}`);
    console.log(`الطلبات الفاشلة: ${this.results.failedRequests}`);
    console.log(`معدل النجاح: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`);
    console.log(`الوقت الإجمالي: ${totalTime.toFixed(2)} ثانية`);
    console.log(`الإنتاجية: ${this.results.throughput.toFixed(2)} طلب/ثانية`);
    console.log(`متوسط وقت الاستجابة: ${this.results.averageResponseTime.toFixed(2)}ms`);
    console.log(`أقصى وقت استجابة: ${this.results.maxResponseTime.toFixed(2)}ms`);
    console.log(`أدنى وقت استجابة: ${this.results.minResponseTime.toFixed(2)}ms`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ الأخطاء:');
      this.results.errors.slice(0, 10).forEach((error, index) => {
        console.log(`${index + 1}. ${error.error} (المستخدم: ${error.userId}, الطلب: ${error.requestId})`);
      });
      
      if (this.results.errors.length > 10) {
        console.log(`... و ${this.results.errors.length - 10} خطأ آخر`);
      }
    }
  }

  // اختبار الاستقرار
  async testStability() {
    console.log('\n🔄 اختبار الاستقرار...');
    
    const duration = 300000; // 5 دقائق
    const interval = 1000; // كل ثانية
    const iterations = duration / interval;
    
    console.log(`📊 اختبار الاستقرار لمدة ${duration / 1000} ثانية...`);

    const results = [];
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      try {
        const requestStart = performance.now();
        
        await axios.get(`${PERFORMANCE_CONFIG.baseURL}/payments`, {
          headers: { Authorization: `Bearer ${this.authToken}` },
          timeout: PERFORMANCE_CONFIG.timeout
        });

        const requestEnd = performance.now();
        const responseTime = requestEnd - requestStart;

        results.push({
          iteration: i + 1,
          responseTime,
          success: true,
          timestamp: new Date().toISOString()
        });

        console.log(`  التكرار ${i + 1}/${iterations}: ${responseTime.toFixed(2)}ms`);
      } catch (error) {
        results.push({
          iteration: i + 1,
          responseTime: 0,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        console.log(`  ❌ التكرار ${i + 1}/${iterations}: ${error.message}`);
      }

      // انتظار قبل التكرار التالي
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    const endTime = performance.now();
    const totalTime = (endTime - startTime) / 1000;

    // تحليل نتائج الاستقرار
    this.analyzeStabilityResults(results, totalTime);
  }

  // تحليل نتائج الاستقرار
  analyzeStabilityResults(results, totalTime) {
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    const responseTimes = successfulResults.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);

    console.log('\n📊 نتائج اختبار الاستقرار:');
    console.log('=' * 50);
    console.log(`إجمالي التكرارات: ${results.length}`);
    console.log(`التكرارات الناجحة: ${successfulResults.length}`);
    console.log(`التكرارات الفاشلة: ${failedResults.length}`);
    console.log(`معدل النجاح: ${((successfulResults.length / results.length) * 100).toFixed(2)}%`);
    console.log(`الوقت الإجمالي: ${totalTime.toFixed(2)} ثانية`);
    console.log(`متوسط وقت الاستجابة: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`أقصى وقت استجابة: ${maxResponseTime.toFixed(2)}ms`);
    console.log(`أدنى وقت استجابة: ${minResponseTime.toFixed(2)}ms`);

    // تحليل الاتجاهات
    const firstHalf = results.slice(0, Math.floor(results.length / 2));
    const secondHalf = results.slice(Math.floor(results.length / 2));
    
    const firstHalfAvg = firstHalf.filter(r => r.success).reduce((a, b) => a + b.responseTime, 0) / firstHalf.filter(r => r.success).length;
    const secondHalfAvg = secondHalf.filter(r => r.success).reduce((a, b) => a + b.responseTime, 0) / secondHalf.filter(r => r.success).length;
    
    console.log(`متوسط النصف الأول: ${firstHalfAvg.toFixed(2)}ms`);
    console.log(`متوسط النصف الثاني: ${secondHalfAvg.toFixed(2)}ms`);
    
    if (Math.abs(firstHalfAvg - secondHalfAvg) > avgResponseTime * 0.2) {
      console.log('⚠️ تحذير: تدهور في الأداء مع الوقت');
    } else {
      console.log('✅ الأداء مستقر مع الوقت');
    }
  }

  // اختبار الذاكرة
  async testMemoryUsage() {
    console.log('\n💾 اختبار استخدام الذاكرة...');
    
    const initialMemory = process.memoryUsage();
    console.log(`الذاكرة الأولية: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);

    // إرسال 1000 طلب لاختبار الذاكرة
    const promises = [];
    for (let i = 0; i < 1000; i++) {
      promises.push(this.makeRequest(0, i));
    }

    const results = await Promise.allSettled(promises);
    const finalMemory = process.memoryUsage();
    
    console.log(`الذاكرة النهائية: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`زيادة الذاكرة: ${((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2)} MB`);
    
    if (finalMemory.heapUsed > initialMemory.heapUsed * 2) {
      console.log('⚠️ تحذير: تسريب محتمل في الذاكرة');
    } else {
      console.log('✅ استخدام الذاكرة طبيعي');
    }
  }

  // اختبار التحميل المتدرج
  async testGradualLoad() {
    console.log('\n📈 اختبار التحميل المتدرج...');
    
    const loadLevels = [1, 5, 10, 20, 50, 100];
    const results = [];

    for (const level of loadLevels) {
      console.log(`📊 اختبار مستوى التحميل: ${level} مستخدم متزامن`);
      
      const promises = [];
      for (let i = 0; i < level; i++) {
        promises.push(this.makeRequest(i, 0));
      }

      const startTime = performance.now();
      const levelResults = await Promise.allSettled(promises);
      const endTime = performance.now();
      
      const successfulResults = levelResults.filter(r => r.status === 'fulfilled' && r.value.success);
      const avgResponseTime = successfulResults.reduce((a, b) => a + b.value.responseTime, 0) / successfulResults.length;
      
      results.push({
        loadLevel: level,
        successfulRequests: successfulResults.length,
        totalRequests: level,
        avgResponseTime,
        totalTime: endTime - startTime
      });

      console.log(`  النجاح: ${successfulResults.length}/${level}, متوسط الاستجابة: ${avgResponseTime.toFixed(2)}ms`);
    }

    // تحليل النتائج
    this.analyzeGradualLoadResults(results);
  }

  // تحليل نتائج التحميل المتدرج
  analyzeGradualLoadResults(results) {
    console.log('\n📊 تحليل التحميل المتدرج:');
    console.log('=' * 50);
    
    results.forEach(result => {
      console.log(`مستوى ${result.loadLevel}: ${result.successfulRequests}/${result.totalRequests} نجح في ${result.avgResponseTime.toFixed(2)}ms`);
    });

    // العثور على نقطة الانهيار
    const breakingPoint = results.find(r => r.successfulRequests < r.totalRequests * 0.95);
    if (breakingPoint) {
      console.log(`⚠️ نقطة الانهيار: مستوى ${breakingPoint.loadLevel}`);
    } else {
      console.log('✅ النظام مستقر في جميع مستويات التحميل');
    }
  }

  // الحصول على بيانات مدفوعة وهمية
  getMockPaymentData() {
    return {
      invoiceId: 1,
      amount: Math.floor(Math.random() * 5000) + 100,
      paymentMethod: ['cash', 'card', 'transfer'][Math.floor(Math.random() * 3)],
      paymentDate: new Date().toISOString().split('T')[0],
      notes: `مدفوعة تجريبية ${Date.now()}`
    };
  }

  // تشغيل جميع اختبارات الأداء
  async runAllPerformanceTests() {
    console.log('🚀 بدء اختبارات الأداء والضغط...\n');
    console.log('=' * 50);

    try {
      // تسجيل الدخول
      console.log('🔐 تسجيل الدخول...');
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        console.log('❌ فشل في تسجيل الدخول، توقف الاختبار');
        return;
      }

      // تشغيل الاختبارات
      await this.testResponseTime();
      await this.testLoad();
      await this.testStability();
      await this.testMemoryUsage();
      await this.testGradualLoad();

      console.log('\n🎉 تم إنجاز جميع اختبارات الأداء!');

    } catch (error) {
      console.error('❌ خطأ في تشغيل اختبارات الأداء:', error.message);
    }
  }
}

// تشغيل اختبارات الأداء
async function runPerformanceTests() {
  const tester = new PerformanceTester();
  await tester.runAllPerformanceTests();
}

// تشغيل الاختبارات إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

module.exports = { PerformanceTester, runPerformanceTests };


