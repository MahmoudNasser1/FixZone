# الربط مع الموديولات الأخرى - بورتال العملاء

## 1. نظرة عامة

هذا المستند يغطي كيفية ربط بورتال العملاء مع جميع الموديولات الأخرى في النظام، بما في ذلك Repairs، Invoices، Inventory، Branches، Notifications، و Analytics.

## 2. ربط مع نظام الإصلاحات (Repairs System)

### 2.1 البيانات المشتركة

#### Customer → Repairs
- عرض طلبات الإصلاح الخاصة بالعميل
- متابعة حالة طلب الإصلاح
- إضافة تعليقات على طلب الإصلاح
- طلب تحديث حالة طلب الإصلاح
- عرض Timeline لطلب الإصلاح
- عرض المرفقات والصور

#### Repairs → Customer
- إرسال إشعارات عند تغيير الحالة
- إرسال إشعارات عند إضافة تعليق من الفني
- إرسال إشعارات عند اكتمال الإصلاح
- تحديث بيانات الجهاز تلقائياً

### 2.2 API Integration

**الملف**: `backend/services/customer/repairService.js`

```javascript
const repairSystemService = require('../../services/repairs/repairService');

class CustomerRepairService {
  async getRepairs(customerId, options) {
    // Call Repairs System API
    return await repairSystemService.getCustomerRepairs(customerId, options);
  }
  
  async getRepairDetails(customerId, repairId) {
    // Verify ownership
    const repair = await repairSystemService.getById(repairId);
    if (repair.customerId !== customerId) {
      throw new Error('Unauthorized');
    }
    
    // Get full details
    return await repairSystemService.getFullDetails(repairId);
  }
  
  async addComment(customerId, repairId, comment) {
    // Add comment through Repairs System
    return await repairSystemService.addComment(repairId, {
      userId: customerId,
      userType: 'customer',
      comment,
      type: 'customer_comment'
    });
  }
  
  async requestUpdate(customerId, repairId, message) {
    // Create notification for technicians
    await notificationService.create({
      type: 'repair_update_request',
      userId: repair.assignedTechnicianId,
      title: 'طلب تحديث من العميل',
      message: `العميل يطلب تحديث حالة طلب الإصلاح #${repairId}`,
      relatedId: repairId,
      relatedType: 'repair',
      metadata: {
        customerId,
        message
      }
    });
  }
}
```

### 2.3 Real-time Updates

**الملف**: `backend/services/websocket/customerWebSocket.js`

```javascript
// Listen to repair status changes
repairSystemService.on('repair_status_changed', (data) => {
  // Notify customer via WebSocket
  customerWebSocketService.notifyCustomer(data.customerId, {
    type: 'repair_updated',
    repairId: data.repairId,
    status: data.status,
    message: `تم تحديث حالة طلب الإصلاح #${data.repairId}`
  });
  
  // Create notification
  notificationService.create({
    userId: data.customerUserId,
    type: 'repair_status_changed',
    title: 'تحديث حالة طلب الإصلاح',
    message: `تم تحديث حالة طلب الإصلاح #${data.repairId} إلى ${data.status}`,
    relatedId: data.repairId,
    relatedType: 'repair'
  });
});
```

### 2.4 Database Queries

```sql
-- Get customer repairs with full details
SELECT 
  rr.*,
  d.name as deviceName,
  d.model as deviceModel,
  t.name as technicianName,
  b.name as branchName
FROM RepairRequest rr
LEFT JOIN Device d ON rr.deviceId = d.id
LEFT JOIN User t ON rr.assignedTechnicianId = t.id
LEFT JOIN Branch b ON rr.branchId = b.id
WHERE rr.customerId = ? 
  AND rr.deletedAt IS NULL
ORDER BY rr.createdAt DESC;

-- Get repair timeline
SELECT 
  rt.*,
  u.name as createdByName
FROM RepairTimeline rt
LEFT JOIN User u ON rt.createdBy = u.id
WHERE rt.repairId = ?
ORDER BY rt.createdAt ASC;
```

## 3. ربط مع نظام الفواتير (Invoices System)

### 3.1 البيانات المشتركة

#### Customer → Invoices
- عرض جميع الفواتير
- عرض تفاصيل الفاتورة
- دفع الفاتورة إلكترونياً
- تحميل الفاتورة كـ PDF
- عرض سجل المدفوعات

#### Invoices → Customer
- إرسال إشعارات عند إنشاء فاتورة جديدة
- إرسال إشعارات عند استحقاق الفاتورة
- إرسال إشعارات عند استلام الدفع
- تحديث رصيد العميل تلقائياً

### 3.2 API Integration

**الملف**: `backend/services/customer/invoiceService.js`

```javascript
const invoiceSystemService = require('../../services/invoices/invoiceService');
const paymentService = require('../../services/payments/paymentService');

class CustomerInvoiceService {
  async getInvoices(customerId, options) {
    return await invoiceSystemService.getCustomerInvoices(customerId, options);
  }
  
  async getInvoiceDetails(customerId, invoiceId) {
    const invoice = await invoiceSystemService.getById(invoiceId);
    
    // Verify ownership
    if (invoice.customerId !== customerId) {
      throw new Error('Unauthorized');
    }
    
    // Get full details including items and payments
    return await invoiceSystemService.getFullDetails(invoiceId);
  }
  
  async downloadPDF(customerId, invoiceId) {
    const invoice = await this.getInvoiceDetails(customerId, invoiceId);
    return await invoiceSystemService.generatePDF(invoiceId);
  }
  
  async payInvoice(customerId, invoiceId, paymentData) {
    const invoice = await this.getInvoiceDetails(customerId, invoiceId);
    
    // Process payment
    const payment = await paymentService.processPayment({
      invoiceId,
      customerId,
      amount: paymentData.amount,
      method: paymentData.paymentMethod,
      gateway: paymentData.paymentGateway,
      cardToken: paymentData.cardToken
    });
    
    // Update invoice
    await invoiceSystemService.recordPayment(invoiceId, {
      paymentId: payment.id,
      amount: payment.amount,
      method: payment.method
    });
    
    // Create notification
    await notificationService.create({
      userId: customerId,
      type: 'payment_received',
      title: 'تم استلام الدفع',
      message: `تم استلام دفعة بقيمة ${payment.amount} جنيه للفاتورة #${invoice.invoiceNumber}`,
      relatedId: invoiceId,
      relatedType: 'invoice'
    });
    
    return payment;
  }
}
```

### 3.3 Payment Gateway Integration

**الملف**: `backend/services/payments/paymentGatewayService.js`

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paymob = require('./paymobService');

class PaymentGatewayService {
  async processPayment(paymentData) {
    switch (paymentData.gateway) {
      case 'stripe':
        return await this.processStripePayment(paymentData);
      case 'paymob':
        return await this.processPaymobPayment(paymentData);
      default:
        throw new Error('Invalid payment gateway');
    }
  }
  
  async processStripePayment(paymentData) {
    const charge = await stripe.charges.create({
      amount: paymentData.amount * 100, // Convert to cents
      currency: 'egp',
      source: paymentData.cardToken,
      description: `Payment for Invoice #${paymentData.invoiceId}`
    });
    
    return {
      transactionId: charge.id,
      status: charge.status === 'succeeded' ? 'completed' : 'failed',
      amount: paymentData.amount,
      gateway: 'stripe'
    };
  }
  
  async processPaymobPayment(paymentData) {
    // Paymob integration
    return await paymob.processPayment(paymentData);
  }
}
```

## 4. ربط مع نظام المخزون (Inventory System)

### 4.1 البيانات المشتركة

#### Customer → Inventory
- عرض قطع الغيار المستخدمة في الإصلاح
- عرض أسعار القطع
- طلب قطع غيار (اختياري)

#### Inventory → Customer
- تحديث التكلفة التقديرية عند تغيير أسعار القطع
- إشعار عند نفاد القطعة

### 4.2 API Integration

**الملف**: `backend/services/customer/inventoryService.js`

```javascript
const inventorySystemService = require('../../services/inventory/inventoryService');

class CustomerInventoryService {
  async getRepairParts(repairId) {
    // Get parts used in repair
    return await inventorySystemService.getRepairParts(repairId);
  }
  
  async getPartPrices(partIds) {
    // Get current prices for parts
    return await inventorySystemService.getPrices(partIds);
  }
}
```

## 5. ربط مع نظام الفروع (Branches System)

### 5.1 البيانات المشتركة

#### Customer → Branches
- عرض معلومات الفرع
- عرض أوقات العمل
- عرض العنوان والموقع
- حجز موعد (اختياري)

#### Branches → Customer
- إشعارات من الفرع
- تحديثات الفرع

### 5.2 API Integration

**الملف**: `backend/services/customer/branchService.js`

```javascript
const branchSystemService = require('../../services/branches/branchService');

class CustomerBranchService {
  async getBranchInfo(branchId) {
    return await branchSystemService.getById(branchId);
  }
  
  async getBranchWorkingHours(branchId) {
    return await branchSystemService.getWorkingHours(branchId);
  }
  
  async getBranchLocation(branchId) {
    const branch = await branchSystemService.getById(branchId);
    return {
      address: branch.address,
      latitude: branch.latitude,
      longitude: branch.longitude,
      mapUrl: `https://maps.google.com/?q=${branch.latitude},${branch.longitude}`
    };
  }
  
  async bookAppointment(customerId, branchId, appointmentData) {
    return await branchSystemService.createAppointment({
      customerId,
      branchId,
      ...appointmentData
    });
  }
}
```

## 6. ربط مع نظام الإشعارات (Notifications System)

### 6.1 البيانات المشتركة

#### Customer → Notifications
- عرض جميع الإشعارات
- تحديد كمقروء/غير مقروء
- حذف الإشعارات
- إعدادات الإشعارات

#### Notifications → Customer
- إشعارات من جميع الموديولات
- Real-time Notifications
- Email Notifications
- SMS Notifications (اختياري)

### 6.2 API Integration

**الملف**: `backend/services/customer/notificationService.js`

```javascript
const notificationSystemService = require('../../services/notifications/notificationService');

class CustomerNotificationService {
  async getNotifications(customerUserId, options) {
    return await notificationSystemService.getUserNotifications(customerUserId, options);
  }
  
  async markAsRead(customerUserId, notificationId) {
    return await notificationSystemService.markAsRead(notificationId, customerUserId);
  }
  
  async markAllAsRead(customerUserId) {
    return await notificationSystemService.markAllAsRead(customerUserId);
  }
  
  async deleteNotification(customerUserId, notificationId) {
    return await notificationSystemService.delete(notificationId, customerUserId);
  }
  
  async getUnreadCount(customerUserId) {
    return await notificationSystemService.getUnreadCount(customerUserId);
  }
}
```

### 6.3 Real-time Notifications

**الملف**: `backend/services/websocket/notificationWebSocket.js`

```javascript
// Listen to notification events
notificationSystemService.on('notification_created', (data) => {
  // Send to customer via WebSocket
  customerWebSocketService.sendNotification(data.userId, {
    id: data.id,
    title: data.title,
    message: data.message,
    type: data.type,
    isRead: false,
    createdAt: data.createdAt
  });
});
```

## 7. ربط مع نظام التقارير (Analytics System)

### 7.1 البيانات المشتركة

#### Customer → Analytics
- إحصائيات العميل
- تاريخ الإصلاحات
- تاريخ المدفوعات
- تحليل الأجهزة

#### Analytics → Customer
- تقارير دورية (اختياري)
- توصيات (اختياري)

### 7.2 API Integration

**الملف**: `backend/services/customer/analyticsService.js`

```javascript
const analyticsSystemService = require('../../services/analytics/analyticsService');

class CustomerAnalyticsService {
  async getCustomerStats(customerId) {
    return await analyticsSystemService.getCustomerStats(customerId);
  }
  
  async getRepairHistory(customerId, dateRange) {
    return await analyticsSystemService.getCustomerRepairHistory(customerId, dateRange);
  }
  
  async getPaymentHistory(customerId, dateRange) {
    return await analyticsSystemService.getCustomerPaymentHistory(customerId, dateRange);
  }
  
  async getDeviceAnalysis(customerId) {
    return await analyticsSystemService.getCustomerDeviceAnalysis(customerId);
  }
}
```

## 8. Integration Patterns

### 8.1 Service Layer Pattern

```javascript
// Customer Service calls other system services
class CustomerService {
  constructor() {
    this.repairService = require('../repairs/repairService');
    this.invoiceService = require('../invoices/invoiceService');
    this.notificationService = require('../notifications/notificationService');
  }
  
  async getDashboardData(customerId) {
    const [repairs, invoices, notifications] = await Promise.all([
      this.repairService.getCustomerRepairs(customerId),
      this.invoiceService.getCustomerInvoices(customerId),
      this.notificationService.getUnreadCount(customerUserId)
    ]);
    
    return {
      repairs,
      invoices,
      unreadNotifications: notifications
    };
  }
}
```

### 8.2 Event-Driven Pattern

```javascript
// Use events for loose coupling
const EventEmitter = require('events');
const eventBus = new EventEmitter();

// In Repairs System
eventBus.emit('repair_status_changed', {
  repairId: 123,
  customerId: 456,
  status: 'completed'
});

// In Customer Portal
eventBus.on('repair_status_changed', async (data) => {
  await notificationService.create({
    userId: data.customerUserId,
    type: 'repair_status_changed',
    title: 'تحديث حالة طلب الإصلاح',
    message: `تم تحديث حالة طلب الإصلاح #${data.repairId}`,
    relatedId: data.repairId,
    relatedType: 'repair'
  });
});
```

### 8.3 API Gateway Pattern

```javascript
// Central API gateway for all customer requests
class CustomerAPIGateway {
  async getRepairs(customerId, options) {
    return await this.repairService.getCustomerRepairs(customerId, options);
  }
  
  async getInvoices(customerId, options) {
    return await this.invoiceService.getCustomerInvoices(customerId, options);
  }
  
  async getDashboardData(customerId) {
    // Aggregate data from multiple services
    return await Promise.all([
      this.getRepairs(customerId),
      this.getInvoices(customerId),
      this.getNotifications(customerId)
    ]);
  }
}
```

## 9. Data Synchronization

### 9.1 Real-time Sync

```javascript
// WebSocket for real-time updates
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('subscribe_customer', (customerId) => {
    socket.join(`customer:${customerId}`);
  });
  
  // When repair status changes
  eventBus.on('repair_status_changed', (data) => {
    io.to(`customer:${data.customerId}`).emit('repair_updated', {
      repairId: data.repairId,
      status: data.status
    });
  });
});
```

### 9.2 Cache Synchronization

```javascript
// Invalidate cache when data changes
eventBus.on('repair_status_changed', async (data) => {
  await cacheService.invalidate(`customer:repairs:${data.customerId}`);
  await cacheService.invalidate(`customer:dashboard:${data.customerId}`);
});
```

## 10. Error Handling

### 10.1 Service Unavailable

```javascript
// Handle service failures gracefully
async function getRepairsWithFallback(customerId) {
  try {
    return await repairService.getCustomerRepairs(customerId);
  } catch (error) {
    if (error.code === 'SERVICE_UNAVAILABLE') {
      // Return cached data
      return await cacheService.get(`customer:repairs:${customerId}`);
    }
    throw error;
  }
}
```

### 10.2 Retry Logic

```javascript
// Retry failed requests
async function retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

## 11. Testing Integration

### 11.1 Integration Tests

```javascript
describe('Customer-Repairs Integration', () => {
  test('Customer can view their repairs', async () => {
    const customer = await createTestCustomer();
    const repair = await createTestRepair(customer.id);
    
    const response = await request(app)
      .get(`/api/customer/repairs`)
      .set('Authorization', `Bearer ${customerToken}`);
    
    expect(response.body.data).toContainEqual(
      expect.objectContaining({ id: repair.id })
    );
  });
});
```

### 11.2 Mock Services

```javascript
// Mock external services for testing
jest.mock('../../services/repairs/repairService', () => ({
  getCustomerRepairs: jest.fn(),
  getById: jest.fn()
}));
```

## 12. Checklist

### 12.1 Repairs Integration
- [ ] عرض طلبات الإصلاح
- [ ] تفاصيل طلب الإصلاح
- [ ] إضافة تعليقات
- [ ] Timeline
- [ ] Real-time Updates
- [ ] Notifications

### 12.2 Invoices Integration
- [ ] عرض الفواتير
- [ ] تفاصيل الفاتورة
- [ ] الدفع الإلكتروني
- [ ] تحميل PDF
- [ ] سجل المدفوعات
- [ ] Notifications

### 12.3 Inventory Integration
- [ ] عرض قطع الغيار
- [ ] الأسعار
- [ ] طلب قطع غيار (اختياري)

### 12.4 Branches Integration
- [ ] معلومات الفرع
- [ ] أوقات العمل
- [ ] الموقع
- [ ] حجز موعد (اختياري)

### 12.5 Notifications Integration
- [ ] عرض الإشعارات
- [ ] Real-time Notifications
- [ ] Email Notifications
- [ ] SMS Notifications (اختياري)

### 12.6 Analytics Integration
- [ ] إحصائيات العميل
- [ ] تاريخ الإصلاحات
- [ ] تاريخ المدفوعات
- [ ] تحليل الأجهزة

---

**الملف التالي**: [خطة الأمان](./06_SECURITY_PLAN.md)


