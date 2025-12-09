// backend/scripts/test-all-templates.js
// Script لاختبار جميع القوالب

require('dotenv').config({ path: '../../.env' });
const templateService = require('../services/template.service');
const settingsRepository = require('../repositories/settingsRepository');

const TEST_VARIABLES = {
  // متغيرات الفواتير
  invoice: {
    customerName: 'أحمد محمد',
    invoiceId: '1234',
    totalAmount: '1500.00 EGP',
    amountPaid: '500.00 EGP',
    remainingAmount: '1000.00 EGP',
    currency: 'EGP',
    dueDate: '2025-01-15',
    invoiceLink: 'http://localhost:3000/invoices/1234',
    status: 'غير مدفوعة'
  },
  // متغيرات طلبات الإصلاح
  repair: {
    customerName: 'أحمد محمد',
    repairNumber: 'REP-20250112-001',
    deviceInfo: 'HP EliteBook 840',
    problem: 'الشاشة لا تعمل',
    diagnosis: 'تم اكتشاف عطل في الشاشة',
    estimatedCost: '800.00 EGP',
    trackingUrl: 'http://localhost:3000/track/abc123',
    location: 'مول البستان التجاري - الدور الأرضي - باب اللوق - القاهرة',
    status: 'قيد الإصلاح',
    rejectionReason: 'عدم توفر قطع الغيار',
    holdReason: 'بانتظار موافقة العميل'
  },
  // متغيرات العروض السعرية
  quotation: {
    customerName: 'أحمد محمد',
    quotationId: '5678',
    repairNumber: 'REP-20250112-001',
    totalAmount: '1200.00 EGP',
    currency: 'EGP',
    validUntil: '2025-02-12',
    quotationLink: 'http://localhost:3000/quotations/5678',
    trackingUrl: 'http://localhost:3000/track/abc123'
  }
};

async function testAllTemplates() {
  console.log('🧪 اختبار جميع القوالب\n');
  console.log('========================================\n');

  try {
    // اختبار قوالب الفواتير
    console.log('📄 قوالب الفواتير:');
    console.log('----------------------------------------');
    try {
      const template = await templateService.loadTemplate('defaultMessage', 'invoice');
      const rendered = templateService.render(template, TEST_VARIABLES.invoice);
      console.log('✅ defaultMessage:');
      console.log(rendered.substring(0, 100) + '...\n');
    } catch (error) {
      console.log('❌ defaultMessage:', error.message);
    }

    // اختبار قوالب طلبات الإصلاح
    console.log('🔧 قوالب طلبات الإصلاح:');
    console.log('----------------------------------------');
    
    const repairTemplates = [
      'repairReceivedMessage',
      'diagnosisCompleteMessage',
      'awaitingApprovalMessage',
      'underRepairMessage',
      'waitingPartsMessage',
      'repairCompletedMessage',
      'readyPickupMessage',
      'deliveredMessage',
      'completedMessage',
      'rejectedMessage',
      'onHoldMessage'
    ];

    for (const templateName of repairTemplates) {
      try {
        const template = await templateService.loadTemplate(templateName, 'repair');
        const rendered = templateService.render(template, TEST_VARIABLES.repair);
        console.log(`✅ ${templateName}:`);
        console.log(rendered.substring(0, 100) + '...\n');
      } catch (error) {
        console.log(`❌ ${templateName}:`, error.message);
      }
    }

    // اختبار قوالب العروض السعرية
    console.log('💰 قوالب العروض السعرية:');
    console.log('----------------------------------------');
    
    const quotationTemplates = [
      'quotation_default',
      'quotation_approved'
    ];

    for (const templateName of quotationTemplates) {
      try {
        const template = await templateService.loadTemplate(templateName, 'quotation');
        const rendered = templateService.render(template, TEST_VARIABLES.quotation);
        console.log(`✅ ${templateName}:`);
        console.log(rendered.substring(0, 100) + '...\n');
      } catch (error) {
        console.log(`❌ ${templateName}:`, error.message);
      }
    }

    // اختبار قوالب تذكيرات الدفع
    console.log('💳 قوالب تذكيرات الدفع:');
    console.log('----------------------------------------');
    
    const paymentTemplates = [
      'payment_overdue_reminder',
      'payment_before_due_reminder'
    ];

    for (const templateName of paymentTemplates) {
      try {
        const template = await templateService.loadTemplate(templateName);
        const rendered = templateService.render(template, TEST_VARIABLES.invoice);
        console.log(`✅ ${templateName}:`);
        console.log(rendered.substring(0, 100) + '...\n');
      } catch (error) {
        console.log(`❌ ${templateName}:`, error.message);
      }
    }

    console.log('========================================');
    console.log('✅ انتهى اختبار القوالب');
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
    process.exit(1);
  }
}

testAllTemplates();





