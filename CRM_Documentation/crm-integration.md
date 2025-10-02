# 🔗 خطة تكامل CRM مع وحدات ERP - FixZone

**التاريخ:** 2 أكتوبر 2025  
**الإصدار:** 1.0  
**الحالة:** تصميم فني جاهز للتطبيق

---

## 📋 نظرة عامة

هذه الوثيقة تشرح بالتفصيل كيفية تكامل وحدة CRM مع جميع وحدات ERP الموجودة في FixZone، مع أمثلة عملية وكود جاهز للتطبيق.

---

## 🗺️ خريطة التكامل الشاملة

```
                         ┌─────────────────┐
                         │   CRM MODULE    │
                         │   (Customer)    │
                         └────────┬────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
            ▼                     ▼                     ▼
   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
   │ Repair Module  │    │Finance Module  │    │Inventory Module│
   │  - Requests    │    │  - Invoices    │    │  - Items       │
   │  - Devices     │    │  - Payments    │    │  - Stock       │
   │  - Services    │    │  - Expenses    │    │  - Orders      │
   └────────┬───────┘    └────────┬───────┘    └────────┬───────┘
            │                     │                     │
            │                     ▼                     │
            │            ┌────────────────┐             │
            │            │Notification    │             │
            └───────────►│    Module      │◄────────────┘
                         │ - WhatsApp     │
                         │ - Email        │
                         │ - SMS          │
                         └────────┬───────┘
                                  │
                                  ▼
                         ┌────────────────┐
                         │Reports Module  │
                         │ - Analytics    │
                         │ - Dashboards   │
                         └────────────────┘
```

---

## 1️⃣ التكامل مع وحدة طلبات الإصلاح (Repair Requests)

### 🎯 الهدف
تحويل كل طلب إصلاح إلى تفاعل عميل مسجل، مع تتبع كامل لرحلة الجهاز والخدمات المقدمة.

### 📊 نقاط التكامل

#### أ) تسجيل تلقائي للتفاعلات

```sql
-- Trigger: إنشاء تفاعل عند إنشاء طلب إصلاح
DELIMITER $$
CREATE TRIGGER after_repair_request_insert
AFTER INSERT ON RepairRequest
FOR EACH ROW
BEGIN
  -- تسجيل التفاعل
  INSERT INTO CustomerInteraction (
    customerId,
    interactionType,
    interactionDirection,
    subject,
    notes,
    relatedTo,
    relatedId,
    userId,
    interactionDate
  ) VALUES (
    NEW.customerId,
    'visit',
    'inbound',
    CONCAT('طلب إصلاح جديد - ', NEW.deviceModel),
    CONCAT('المشكلة: ', NEW.issueDescription),
    'RepairRequest',
    NEW.id,
    NEW.assignedTechnicianId,
    NEW.receivedAt
  );
  
  -- تحديث آخر تفاعل
  UPDATE Customer 
  SET lastInteractionDate = NEW.receivedAt,
      visitCount = visitCount + 1
  WHERE id = NEW.customerId;
END$$

-- Trigger: تسجيل تفاعل عند تحديث الحالة
CREATE TRIGGER after_repair_status_update
AFTER UPDATE ON RepairRequest
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    -- تسجيل التفاعل
    INSERT INTO CustomerInteraction (
      customerId,
      interactionType,
      interactionDirection,
      subject,
      notes,
      outcome,
      relatedTo,
      relatedId
    ) VALUES (
      NEW.customerId,
      CASE 
        WHEN NEW.status = 'completed' THEN 'other'
        WHEN NEW.status = 'delivered' THEN 'call'
        ELSE 'other'
      END,
      'outbound',
      CONCAT('تحديث حالة الطلب #', NEW.id),
      CONCAT('الحالة الجديدة: ', NEW.status),
      CASE 
        WHEN NEW.status = 'completed' THEN 'resolved'
        WHEN NEW.status = 'delivered' THEN 'successful'
        ELSE 'follow_up_needed'
      END,
      'RepairRequest',
      NEW.id
    );
    
    -- إنشاء مهمة متابعة عند الإكمال
    IF NEW.status = 'completed' THEN
      INSERT INTO FollowUpTask (
        customerId,
        title,
        description,
        taskType,
        priority,
        dueDate,
        assignedTo,
        createdBy,
        relatedTo,
        relatedId
      ) VALUES (
        NEW.customerId,
        'طلب تقييم من العميل',
        CONCAT('متابعة رضا العميل عن الطلب #', NEW.id),
        'call',
        'medium',
        DATE_ADD(NEW.completedAt, INTERVAL 1 DAY),
        NEW.assignedTechnicianId,
        NEW.assignedTechnicianId,
        'RepairRequest',
        NEW.id
      );
    END IF;
  END IF;
END$$
DELIMITER ;
```

#### ب) Backend API - دمج بيانات الإصلاح مع CRM

```javascript
// backend/routes/crm/customers.js

// GET /api/crm/customers/:id/repairs - جلب تاريخ الإصلاح الكامل
router.get('/:id/repairs', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [repairs] = await db.query(`
      SELECT 
        rr.id,
        rr.deviceModel,
        rr.deviceBrand,
        rr.deviceType,
        rr.issueDescription,
        rr.status,
        rr.priority,
        rr.estimatedCost,
        rr.actualCost,
        rr.receivedAt,
        rr.completedAt,
        rr.deliveredAt,
        CONCAT(u.firstName, ' ', u.lastName) as technicianName,
        i.finalAmount as invoiceAmount,
        i.status as invoiceStatus,
        GROUP_CONCAT(DISTINCT s.serviceName) as services
      FROM RepairRequest rr
      LEFT JOIN User u ON rr.assignedTechnicianId = u.id
      LEFT JOIN Invoice i ON rr.id = i.repairRequestId
      LEFT JOIN RepairRequestService rrs ON rr.id = rrs.repairRequestId
      LEFT JOIN Service s ON rrs.serviceId = s.id
      WHERE rr.customerId = ? AND rr.deletedAt IS NULL
      GROUP BY rr.id
      ORDER BY rr.receivedAt DESC
    `, [id]);
    
    res.json({
      success: true,
      data: repairs,
      summary: {
        total: repairs.length,
        completed: repairs.filter(r => r.status === 'completed').length,
        pending: repairs.filter(r => r.status === 'pending').length,
        totalSpent: repairs.reduce((sum, r) => sum + (parseFloat(r.actualCost) || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching customer repairs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/crm/repairs/:id/feedback - إضافة تقييم للإصلاح
router.post('/repairs/:id/feedback', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, feedbackType } = req.body;
    
    // جلب معلومات الطلب
    const [repairs] = await db.query(
      'SELECT customerId FROM RepairRequest WHERE id = ?',
      [id]
    );
    
    if (repairs.length === 0) {
      return res.status(404).json({ success: false, message: 'طلب الإصلاح غير موجود' });
    }
    
    const customerId = repairs[0].customerId;
    
    // إدراج التقييم
    const [result] = await db.query(`
      INSERT INTO CustomerFeedback (
        customerId, repairRequestId, rating, feedbackType, comment, source
      ) VALUES (?, ?, ?, ?, ?, 'manual')
    `, [customerId, id, rating, feedbackType || 'service', comment]);
    
    // تحديث تقييم العميل
    const [avgRating] = await db.query(`
      SELECT AVG(rating) as avgRating FROM CustomerFeedback WHERE customerId = ?
    `, [customerId]);
    
    await db.query(
      'UPDATE Customer SET rating = ? WHERE id = ?',
      [avgRating[0].avgRating, customerId]
    );
    
    // إنشاء تفاعل
    await db.query(`
      INSERT INTO CustomerInteraction (
        customerId, interactionType, interactionDirection, subject, notes, relatedTo, relatedId
      ) VALUES (?, 'other', 'inbound', 'تقييم خدمة الإصلاح', ?, 'RepairRequest', ?)
    `, [customerId, `تقييم: ${rating}/5 - ${comment}`, id]);
    
    res.json({ success: true, feedbackId: result.insertId });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### ج) تحليلات متقدمة

```javascript
// GET /api/crm/customers/:id/device-preferences
router.get('/:id/device-preferences', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deviceStats] = await db.query(`
      SELECT 
        deviceBrand,
        deviceType,
        COUNT(*) as repairCount,
        AVG(actualCost) as avgCost,
        SUM(actualCost) as totalCost
      FROM RepairRequest
      WHERE customerId = ? AND deletedAt IS NULL
      GROUP BY deviceBrand, deviceType
      ORDER BY repairCount DESC
    `, [id]);
    
    res.json({ success: true, data: deviceStats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 2️⃣ التكامل مع وحدة الفواتير والمدفوعات (Finance)

### 🎯 الهدف
حساب القيمة مدى الحياة للعميل (CLV)، تتبع سلوك الدفع، وتحليل الربحية.

### 📊 نقاط التكامل

#### أ) تحديث تلقائي للإنفاق

```sql
-- Trigger: تحديث إجمالي الإنفاق عند الدفع
DELIMITER $$
CREATE TRIGGER after_payment_insert
AFTER INSERT ON Payment
FOR EACH ROW
BEGIN
  DECLARE customer_id INT;
  DECLARE invoice_amount DECIMAL(10,2);
  
  -- جلب معلومات الفاتورة والعميل
  SELECT customerId, finalAmount INTO customer_id, invoice_amount
  FROM Invoice
  WHERE id = NEW.invoiceId;
  
  -- تحديث إجمالي الإنفاق
  UPDATE Customer
  SET 
    totalSpent = totalSpent + NEW.amount,
    loyaltyPoints = loyaltyPoints + FLOOR(NEW.amount / 10),
    lastInteractionDate = NOW()
  WHERE id = customer_id;
  
  -- إنشاء تفاعل للدفع
  INSERT INTO CustomerInteraction (
    customerId,
    interactionType,
    interactionDirection,
    subject,
    notes,
    outcome,
    relatedTo,
    relatedId
  ) VALUES (
    customer_id,
    'other',
    'inbound',
    CONCAT('دفع فاتورة #', NEW.invoiceId),
    CONCAT('دفع مبلغ ', NEW.amount, ' ', NEW.currency, ' بطريقة ', NEW.paymentMethod),
    'successful',
    'Payment',
    NEW.id
  );
  
  -- إنشاء مهمة متابعة إذا كانت دفعة كبيرة
  IF NEW.amount >= 5000 THEN
    INSERT INTO FollowUpTask (
      customerId,
      title,
      description,
      taskType,
      priority,
      dueDate,
      createdBy
    ) VALUES (
      customer_id,
      'شكر عميل على دفعة كبيرة',
      CONCAT('مكالمة شكر للعميل على دفع ', NEW.amount, ' جنيه'),
      'call',
      'high',
      DATE_ADD(NOW(), INTERVAL 1 DAY),
      1
    );
  END IF;
END$$

-- Trigger: تنبيه عند تأخر الدفع
CREATE EVENT check_overdue_invoices
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO
BEGIN
  -- إنشاء مهام متابعة للفواتير المتأخرة
  INSERT INTO FollowUpTask (customerId, title, description, taskType, priority, dueDate, createdBy)
  SELECT 
    i.customerId,
    CONCAT('متابعة فاتورة متأخرة #', i.invoiceNumber),
    CONCAT('الفاتورة متأخرة ', DATEDIFF(NOW(), i.dueDate), ' يوم'),
    'call',
    CASE 
      WHEN DATEDIFF(NOW(), i.dueDate) > 30 THEN 'urgent'
      WHEN DATEDIFF(NOW(), i.dueDate) > 14 THEN 'high'
      ELSE 'medium'
    END,
    NOW(),
    1
  FROM Invoice i
  WHERE i.status IN ('sent', 'partially_paid')
    AND i.dueDate < NOW()
    AND NOT EXISTS (
      SELECT 1 FROM FollowUpTask ft 
      WHERE ft.relatedTo = 'Invoice' 
        AND ft.relatedId = i.id 
        AND ft.status != 'completed'
    );
    
  -- تحديث تصنيف العملاء المتأخرين
  UPDATE Customer c
  SET segment = 'at_risk'
  WHERE c.id IN (
    SELECT DISTINCT i.customerId
    FROM Invoice i
    WHERE i.status IN ('sent', 'partially_paid')
      AND i.dueDate < DATE_SUB(NOW(), INTERVAL 30 DAY)
  );
END$$
DELIMITER ;
```

#### ب) Backend API - التحليلات المالية

```javascript
// GET /api/crm/customers/:id/financial-summary
router.get('/:id/financial-summary', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [summary] = await db.query(`
      SELECT 
        -- إجمالي الإنفاق
        COALESCE(SUM(p.amount), 0) as totalPaid,
        -- عدد الفواتير
        COUNT(DISTINCT i.id) as totalInvoices,
        -- الفواتير المدفوعة
        COUNT(DISTINCT CASE WHEN i.status = 'paid' THEN i.id END) as paidInvoices,
        -- الفواتير المتأخرة
        COUNT(DISTINCT CASE WHEN i.status IN ('sent', 'partially_paid') AND i.dueDate < NOW() THEN i.id END) as overdueInvoices,
        -- إجمالي المستحقات
        COALESCE(SUM(CASE WHEN i.status IN ('sent', 'partially_paid') THEN i.finalAmount - COALESCE(paid.total, 0) END), 0) as totalDue,
        -- متوسط الفاتورة
        COALESCE(AVG(i.finalAmount), 0) as avgInvoiceAmount,
        -- متوسط مدة السداد
        COALESCE(AVG(DATEDIFF(p.paymentDate, i.issueDate)), 0) as avgPaymentDays,
        -- طريقة الدفع المفضلة
        (
          SELECT paymentMethod 
          FROM Payment p2
          JOIN Invoice i2 ON p2.invoiceId = i2.id
          WHERE i2.customerId = ?
          GROUP BY paymentMethod
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) as preferredPaymentMethod
      FROM Invoice i
      LEFT JOIN Payment p ON i.id = p.invoiceId
      LEFT JOIN (
        SELECT invoiceId, SUM(amount) as total
        FROM Payment
        GROUP BY invoiceId
      ) paid ON i.id = paid.invoiceId
      WHERE i.customerId = ? AND i.deletedAt IS NULL
    `, [id, id]);
    
    // حساب CLV (Customer Lifetime Value)
    const [clv] = await db.query(`
      SELECT 
        totalPaid,
        visitCount,
        DATEDIFF(NOW(), createdAt) as daysSinceFirstVisit,
        CASE 
          WHEN DATEDIFF(NOW(), createdAt) > 0 
          THEN (totalPaid / DATEDIFF(NOW(), createdAt)) * 365
          ELSE 0
        END as projectedAnnualValue,
        CASE 
          WHEN DATEDIFF(NOW(), createdAt) > 0 
          THEN ((totalPaid / DATEDIFF(NOW(), createdAt)) * 365) * 5
          ELSE 0
        END as estimatedLifetimeValue
      FROM Customer
      WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...summary[0],
        clv: clv[0]
      }
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/crm/customers/:id/payment-history
router.get('/:id/payment-history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [payments] = await db.query(`
      SELECT 
        p.id,
        p.amount,
        p.currency,
        p.paymentMethod,
        p.paymentDate,
        p.referenceNumber,
        i.invoiceNumber,
        i.finalAmount as invoiceAmount,
        rr.id as repairRequestId,
        rr.deviceModel
      FROM Payment p
      JOIN Invoice i ON p.invoiceId = i.id
      LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
      WHERE i.customerId = ?
      ORDER BY p.paymentDate DESC
    `, [id]);
    
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### ج) تحليل الربحية حسب العميل

```javascript
// GET /api/crm/customers/:id/profitability
router.get('/:id/profitability', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [profitability] = await db.query(`
      SELECT 
        -- الإيرادات
        SUM(i.finalAmount) as totalRevenue,
        -- التكاليف (قطع غيار + خدمات)
        SUM(
          COALESCE(parts_cost.total, 0) + 
          COALESCE(services_cost.total, 0)
        ) as totalCost,
        -- الربح
        SUM(i.finalAmount) - SUM(
          COALESCE(parts_cost.total, 0) + 
          COALESCE(services_cost.total, 0)
        ) as totalProfit,
        -- هامش الربح
        ((SUM(i.finalAmount) - SUM(
          COALESCE(parts_cost.total, 0) + 
          COALESCE(services_cost.total, 0)
        )) / SUM(i.finalAmount)) * 100 as profitMargin
      FROM Invoice i
      JOIN RepairRequest rr ON i.repairRequestId = rr.id
      LEFT JOIN (
        SELECT 
          pu.repairRequestId,
          SUM(pu.quantity * inv.purchasePrice) as total
        FROM PartsUsed pu
        JOIN InventoryItem inv ON pu.inventoryItemId = inv.id
        GROUP BY pu.repairRequestId
      ) parts_cost ON rr.id = parts_cost.repairRequestId
      LEFT JOIN (
        SELECT 
          rrs.repairRequestId,
          SUM(rrs.price) as total
        FROM RepairRequestService rrs
        GROUP BY rrs.repairRequestId
      ) services_cost ON rr.id = services_cost.repairRequestId
      WHERE rr.customerId = ? AND rr.deletedAt IS NULL
    `, [id]);
    
    res.json({ success: true, data: profitability[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 3️⃣ التكامل مع وحدة المخزون (Inventory)

### 🎯 الهدف
تتبع تفضيلات العميل لقطع الغيار، وإرسال تنبيهات عند توفر قطعة مطلوبة.

### 📊 نقاط التكامل

#### أ) تتبع تفضيلات القطع

```javascript
// GET /api/crm/customers/:id/parts-preferences
router.get('/:id/parts-preferences', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [parts] = await db.query(`
      SELECT 
        inv.id,
        inv.name,
        inv.sku,
        inv.category,
        COUNT(*) as usageCount,
        SUM(pu.quantity) as totalQuantity,
        MAX(rr.receivedAt) as lastUsedDate
      FROM PartsUsed pu
      JOIN InventoryItem inv ON pu.inventoryItemId = inv.id
      JOIN RepairRequest rr ON pu.repairRequestId = rr.id
      WHERE rr.customerId = ?
      GROUP BY inv.id
      ORDER BY usageCount DESC
    `, [id]);
    
    res.json({ success: true, data: parts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### ب) تنبيهات توفر القطع

```sql
-- Trigger: تنبيه العملاء عند توفر قطعة كانت ناقصة
DELIMITER $$
CREATE TRIGGER after_stock_level_update
AFTER UPDATE ON StockLevel
FOR EACH ROW
BEGIN
  -- إذا زاد المخزون من 0
  IF OLD.currentQuantity = 0 AND NEW.currentQuantity > 0 THEN
    -- جلب العملاء الذين يستخدمون هذه القطعة
    INSERT INTO FollowUpTask (customerId, title, description, taskType, priority, dueDate, createdBy)
    SELECT DISTINCT
      rr.customerId,
      CONCAT('توفر قطعة: ', inv.name),
      CONCAT('القطعة ', inv.name, ' متوفرة الآن في المخزون'),
      'call',
      'medium',
      NOW(),
      1
    FROM PartsUsed pu
    JOIN InventoryItem inv ON pu.inventoryItemId = inv.id
    JOIN RepairRequest rr ON pu.repairRequestId = rr.id
    WHERE inv.id = NEW.inventoryItemId
      AND rr.receivedAt > DATE_SUB(NOW(), INTERVAL 6 MONTH)
      AND rr.customerId IS NOT NULL
    LIMIT 10; -- تحديد 10 عملاء فقط
  END IF;
END$$
DELIMITER ;
```

---

## 4️⃣ التكامل مع وحدة الإشعارات (Notifications)

### 🎯 الهدف
أتمتة كاملة للتواصل مع العملاء عبر جميع القنوات.

### 📊 نقاط التكامل

#### أ) إشعارات تلقائية بعد الأحداث

```javascript
// backend/services/automationService.js

const automationService = {
  // بعد إتمام الإصلاح
  async afterRepairComplete(repairId) {
    const [repair] = await db.query(`
      SELECT rr.*, c.firstName, c.phone, c.email, c.preferredContactMethod
      FROM RepairRequest rr
      JOIN Customer c ON rr.customerId = c.id
      WHERE rr.id = ?
    `, [repairId]);
    
    if (repair.length === 0) return;
    
    const customer = repair[0];
    
    // إرسال إشعار حسب طريقة التواصل المفضلة
    switch (customer.preferredContactMethod) {
      case 'whatsapp':
        await this.sendWhatsAppNotification(customer, {
          type: 'repair_completed',
          repairId,
          deviceModel: customer.deviceModel
        });
        break;
      
      case 'email':
        await this.sendEmailNotification(customer, {
          type: 'repair_completed',
          repairId,
          deviceModel: customer.deviceModel
        });
        break;
      
      case 'sms':
        await this.sendSMSNotification(customer, {
          type: 'repair_completed',
          repairId
        });
        break;
    }
    
    // جدولة طلب تقييم بعد 2 ساعة
    setTimeout(async () => {
      await this.requestFeedback(customer.id, repairId);
    }, 2 * 60 * 60 * 1000);
  },
  
  // طلب تقييم
  async requestFeedback(customerId, repairId) {
    const [customer] = await db.query(
      'SELECT * FROM Customer WHERE id = ?',
      [customerId]
    );
    
    const feedbackLink = `https://fixzone.com/feedback/${repairId}`;
    
    const message = `
      مرحباً ${customer[0].firstName}،
      نشكرك على ثقتك بخدماتنا ✨
      
      نرجو تقييم الخدمة (دقيقة واحدة فقط):
      ${feedbackLink}
      
      رأيك يهمنا 💚
    `;
    
    await this.sendWhatsAppNotification(customer[0], {
      type: 'custom',
      message
    });
    
    // تسجيل التفاعل
    await db.query(`
      INSERT INTO CustomerInteraction (
        customerId, interactionType, interactionDirection, 
        subject, notes, relatedTo, relatedId
      ) VALUES (?, 'whatsapp', 'outbound', 'طلب تقييم', ?, 'RepairRequest', ?)
    `, [customerId, message, repairId]);
  },
  
  // حملة استرجاع العملاء غير النشطين
  async winBackCampaign() {
    const [inactiveCustomers] = await db.query(`
      SELECT c.*
      FROM Customer c
      LEFT JOIN RepairRequest rr ON c.id = rr.customerId
      WHERE c.deletedAt IS NULL
        AND c.segment != 'inactive'
      GROUP BY c.id
      HAVING MAX(rr.receivedAt) < DATE_SUB(NOW(), INTERVAL 90 DAY)
         OR MAX(rr.receivedAt) IS NULL
    `);
    
    for (const customer of inactiveCustomers) {
      const discountCode = this.generateDiscountCode(customer.id);
      
      const message = `
        مرحباً ${customer.firstName}،
        افتقدناك! 😊
        
        خصم خاص لك: ${discountCode}
        ✅ 20% على خدمة الفحص الشامل
        ✅ صالح حتى ${this.getExpiryDate(14)}
        
        احجز الآن: ${this.getBookingLink(customer.id)}
      `;
      
      await this.sendWhatsAppNotification(customer, {
        type: 'custom',
        message
      });
      
      // تحديث التصنيف
      await db.query(
        'UPDATE Customer SET segment = ? WHERE id = ?',
        ['at_risk', customer.id]
      );
    }
  },
  
  // تهنئة بعيد الميلاد
  async birthdayCampaign() {
    const [customers] = await db.query(`
      SELECT * FROM Customer
      WHERE DAY(birthDate) = DAY(NOW())
        AND MONTH(birthDate) = MONTH(NOW())
        AND deletedAt IS NULL
    `);
    
    for (const customer of customers) {
      const discountCode = this.generateDiscountCode(customer.id, 'BIRTHDAY');
      
      const message = `
        🎉 عيد ميلاد سعيد ${customer.firstName}! 🎂
        
        نتمنى لك يوماً مميزاً مليئاً بالفرح 💐
        
        هدية منا: ${discountCode}
        🎁 خصم 15% على أي خدمة
        صالح طوال الشهر
      `;
      
      await this.sendWhatsAppNotification(customer, {
        type: 'custom',
        message
      });
      
      // إضافة نقاط ولاء
      await db.query(
        'UPDATE Customer SET loyaltyPoints = loyaltyPoints + 100 WHERE id = ?',
        [customer.id]
      );
    }
  },
  
  // دوال مساعدة
  generateDiscountCode(customerId, prefix = 'WIN') {
    return `${prefix}${customerId}${Date.now().toString().slice(-6)}`;
  },
  
  getExpiryDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('ar-EG');
  },
  
  getBookingLink(customerId) {
    return `https://fixzone.com/book?ref=${customerId}`;
  },
  
  async sendWhatsAppNotification(customer, data) {
    // تكامل مع API واتساب
    const whatsappAPI = require('./whatsappAPI');
    await whatsappAPI.sendMessage(customer.phone, data.message || this.getTemplate(data.type, data));
    
    // تسجيل في سجل الأنشطة
    await db.query(`
      INSERT INTO activity_log (userId, action, details) 
      VALUES (?, 'whatsapp_sent', ?)
    `, [1, JSON.stringify({ customerId: customer.id, type: data.type })]);
  },
  
  async sendEmailNotification(customer, data) {
    const emailService = require('./emailService');
    await emailService.sendEmail({
      to: customer.email,
      subject: this.getEmailSubject(data.type),
      body: this.getEmailBody(data.type, data)
    });
  },
  
  async sendSMSNotification(customer, data) {
    const smsService = require('./smsService');
    await smsService.sendSMS({
      phone: customer.phone,
      message: this.getSMSMessage(data.type, data)
    });
  },
  
  getTemplate(type, data) {
    const templates = {
      repair_completed: `
        مرحباً،
        تم إكمال إصلاح جهازك ${data.deviceModel} بنجاح ✅
        يمكنك استلامه من الفرع في أي وقت.
        شكراً لثقتك بنا 🌟
      `,
      payment_reminder: `
        مرحباً،
        تذكير ودي: فاتورة #${data.invoiceNumber} مستحقة الدفع.
        المبلغ: ${data.amount} جنيه
        يمكنك الدفع عبر الرابط: ${data.paymentLink}
      `
    };
    return templates[type] || '';
  }
};

// Cron Jobs للأتمتة
const CronJob = require('cron').CronJob;

// كل يوم الساعة 9 صباحاً: فحص العملاء غير النشطين
new CronJob('0 9 * * *', async () => {
  console.log('Running inactive customers check...');
  await automationService.winBackCampaign();
}, null, true, 'Africa/Cairo');

// كل يوم الساعة 8 صباحاً: تهنئة أعياد الميلاد
new CronJob('0 8 * * *', async () => {
  console.log('Running birthday campaign...');
  await automationService.birthdayCampaign();
}, null, true, 'Africa/Cairo');

module.exports = automationService;
```

---

## 5️⃣ التكامل مع وحدة التقارير (Reports)

### 🎯 الهدف
تقارير شاملة تجمع بيانات CRM مع جميع الوحدات الأخرى.

### 📊 التقارير المقترحة

#### أ) تقرير RFM Analysis

```javascript
// GET /api/crm/reports/rfm-analysis
router.get('/reports/rfm-analysis', authMiddleware, async (req, res) => {
  try {
    const [rfm] = await db.query(`
      WITH CustomerMetrics AS (
        SELECT 
          c.id,
          c.firstName,
          c.lastName,
          c.phone,
          c.email,
          -- Recency: آخر تفاعل
          DATEDIFF(NOW(), MAX(rr.receivedAt)) as recency_days,
          CASE 
            WHEN DATEDIFF(NOW(), MAX(rr.receivedAt)) <= 30 THEN 5
            WHEN DATEDIFF(NOW(), MAX(rr.receivedAt)) <= 60 THEN 4
            WHEN DATEDIFF(NOW(), MAX(rr.receivedAt)) <= 90 THEN 3
            WHEN DATEDIFF(NOW(), MAX(rr.receivedAt)) <= 180 THEN 2
            ELSE 1
          END as recency_score,
          -- Frequency: عدد الزيارات
          COUNT(rr.id) as frequency_count,
          CASE 
            WHEN COUNT(rr.id) >= 20 THEN 5
            WHEN COUNT(rr.id) >= 10 THEN 4
            WHEN COUNT(rr.id) >= 5 THEN 3
            WHEN COUNT(rr.id) >= 2 THEN 2
            ELSE 1
          END as frequency_score,
          -- Monetary: إجمالي الإنفاق
          COALESCE(SUM(i.finalAmount), 0) as monetary_value,
          CASE 
            WHEN COALESCE(SUM(i.finalAmount), 0) >= 10000 THEN 5
            WHEN COALESCE(SUM(i.finalAmount), 0) >= 5000 THEN 4
            WHEN COALESCE(SUM(i.finalAmount), 0) >= 2000 THEN 3
            WHEN COALESCE(SUM(i.finalAmount), 0) >= 500 THEN 2
            ELSE 1
          END as monetary_score
        FROM Customer c
        LEFT JOIN RepairRequest rr ON c.id = rr.customerId AND rr.deletedAt IS NULL
        LEFT JOIN Invoice i ON rr.id = i.repairRequestId AND i.deletedAt IS NULL
        WHERE c.deletedAt IS NULL
        GROUP BY c.id
      )
      SELECT 
        *,
        (recency_score + frequency_score + monetary_score) as rfm_score,
        CASE 
          WHEN (recency_score + frequency_score + monetary_score) >= 13 THEN 'Champions'
          WHEN (recency_score + frequency_score + monetary_score) >= 10 THEN 'Loyal Customers'
          WHEN (recency_score + frequency_score + monetary_score) >= 7 THEN 'Potential Loyalists'
          WHEN recency_score >= 4 AND frequency_score <= 2 THEN 'New Customers'
          WHEN recency_score <= 2 AND frequency_score >= 3 THEN 'At Risk'
          WHEN recency_score <= 2 AND frequency_score <= 2 THEN 'Lost'
          ELSE 'Need Attention'
        END as customer_segment
      FROM CustomerMetrics
      ORDER BY rfm_score DESC
    `);
    
    // تجميع حسب الشريحة
    const segmentSummary = rfm.reduce((acc, customer) => {
      const segment = customer.customer_segment;
      if (!acc[segment]) {
        acc[segment] = { count: 0, totalValue: 0 };
      }
      acc[segment].count++;
      acc[segment].totalValue += parseFloat(customer.monetary_value);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: rfm,
      summary: segmentSummary
    });
  } catch (error) {
    console.error('Error in RFM analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### ب) تقرير Customer Lifetime Value (CLV)

```javascript
// GET /api/crm/reports/customer-lifetime-value
router.get('/reports/customer-lifetime-value', authMiddleware, async (req, res) => {
  try {
    const [clv] = await db.query(`
      SELECT 
        c.id,
        CONCAT(c.firstName, ' ', c.lastName) as customerName,
        c.segment,
        c.totalSpent as historicalValue,
        c.visitCount,
        DATEDIFF(NOW(), c.createdAt) as customerAge_days,
        DATEDIFF(NOW(), c.lastInteractionDate) as daysSinceLastVisit,
        -- متوسط قيمة الطلب
        c.totalSpent / NULLIF(c.visitCount, 0) as avgOrderValue,
        -- متوسط الزيارات شهرياً
        (c.visitCount / NULLIF(DATEDIFF(NOW(), c.createdAt), 0)) * 30 as avgVisitsPerMonth,
        -- القيمة السنوية المتوقعة
        CASE 
          WHEN DATEDIFF(NOW(), c.createdAt) > 0
          THEN (c.totalSpent / DATEDIFF(NOW(), c.createdAt)) * 365
          ELSE 0
        END as projectedAnnualValue,
        -- CLV المتوقع (5 سنوات)
        CASE 
          WHEN DATEDIFF(NOW(), c.createdAt) > 0
          THEN ((c.totalSpent / DATEDIFF(NOW(), c.createdAt)) * 365) * 5
          ELSE 0
        END as estimatedCLV,
        -- معدل الاحتفاظ
        CASE 
          WHEN c.lastInteractionDate >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 'Active'
          WHEN c.lastInteractionDate >= DATE_SUB(NOW(), INTERVAL 180 DAY) THEN 'At Risk'
          ELSE 'Churned'
        END as retentionStatus
      FROM Customer c
      WHERE c.deletedAt IS NULL
      ORDER BY estimatedCLV DESC
    `);
    
    // إحصائيات عامة
    const totalCLV = clv.reduce((sum, c) => sum + parseFloat(c.estimatedCLV || 0), 0);
    const avgCLV = totalCLV / clv.length;
    
    res.json({
      success: true,
      data: clv,
      summary: {
        totalCustomers: clv.length,
        totalCLV,
        avgCLV,
        topTier: clv.filter(c => parseFloat(c.estimatedCLV) > avgCLV * 2).length
      }
    });
  } catch (error) {
    console.error('Error in CLV report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### ج) تقرير معدل الاحتفاظ (Retention Rate)

```javascript
// GET /api/crm/reports/retention-rate
router.get('/reports/retention-rate', authMiddleware, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const [retention] = await db.query(`
      WITH MonthlyCustomers AS (
        SELECT 
          DATE_FORMAT(rr.receivedAt, '%Y-%m') as month,
          rr.customerId,
          MIN(DATE_FORMAT(rr2.receivedAt, '%Y-%m')) as firstVisitMonth
        FROM RepairRequest rr
        JOIN RepairRequest rr2 ON rr.customerId = rr2.customerId
        WHERE YEAR(rr.receivedAt) = ?
          AND rr.deletedAt IS NULL
        GROUP BY DATE_FORMAT(rr.receivedAt, '%Y-%m'), rr.customerId
      )
      SELECT 
        month,
        COUNT(DISTINCT customerId) as totalCustomers,
        COUNT(DISTINCT CASE WHEN month = firstVisitMonth THEN customerId END) as newCustomers,
        COUNT(DISTINCT CASE WHEN month != firstVisitMonth THEN customerId END) as returningCustomers,
        (COUNT(DISTINCT CASE WHEN month != firstVisitMonth THEN customerId END) / 
         COUNT(DISTINCT customerId)) * 100 as retentionRate
      FROM MonthlyCustomers
      GROUP BY month
      ORDER BY month
    `, [year]);
    
    res.json({ success: true, data: retention });
  } catch (error) {
    console.error('Error in retention report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 6️⃣ APIs الشاملة المطلوبة

### قائمة كاملة بجميع APIs الجديدة

```javascript
// ============= Customer APIs =============
GET    /api/crm/customers                      // قائمة العملاء مع الفلاتر
GET    /api/crm/customers/:id                  // تفاصيل عميل واحد
PUT    /api/crm/customers/:id                  // تحديث بيانات العميل
GET    /api/crm/customers/:id/timeline         // الخط الزمني الكامل
GET    /api/crm/customers/:id/repairs          // تاريخ الإصلاح
GET    /api/crm/customers/:id/financial-summary // الملخص المالي
GET    /api/crm/customers/:id/profitability    // تحليل الربحية
GET    /api/crm/customers/:id/device-preferences // تفضيلات الأجهزة
GET    /api/crm/customers/:id/parts-preferences  // تفضيلات القطع

// ============= Interaction APIs =============
POST   /api/crm/interactions                   // إنشاء تفاعل جديد
GET    /api/crm/interactions                   // قائمة التفاعلات
GET    /api/crm/customers/:id/interactions     // تفاعلات عميل محدد
PUT    /api/crm/interactions/:id               // تحديث تفاعل
DELETE /api/crm/interactions/:id               // حذف تفاعل

// ============= Note APIs =============
POST   /api/crm/notes                          // إنشاء ملاحظة
GET    /api/crm/customers/:id/notes            // ملاحظات عميل
PUT    /api/crm/notes/:id                      // تحديث ملاحظة
DELETE /api/crm/notes/:id                      // حذف ملاحظة
PUT    /api/crm/notes/:id/pin                  // تثبيت ملاحظة

// ============= Task APIs =============
POST   /api/crm/tasks                          // إنشاء مهمة
GET    /api/crm/tasks                          // قائمة المهام
GET    /api/crm/tasks/:id                      // تفاصيل مهمة
PUT    /api/crm/tasks/:id                      // تحديث مهمة
PUT    /api/crm/tasks/:id/complete             // إكمال مهمة
DELETE /api/crm/tasks/:id                      // حذف مهمة
GET    /api/crm/tasks/overdue                  // المهام المتأخرة
GET    /api/crm/tasks/today                    // مهام اليوم

// ============= Tag APIs =============
GET    /api/crm/tags                           // قائمة الوسوم
POST   /api/crm/tags                           // إنشاء وسم جديد
POST   /api/crm/customers/:id/tags             // إضافة وسم لعميل
DELETE /api/crm/customers/:id/tags/:tagId      // حذف وسم من عميل

// ============= Feedback APIs =============
POST   /api/crm/feedback                       // إنشاء تقييم
GET    /api/crm/customers/:id/feedback         // تقييمات عميل
PUT    /api/crm/feedback/:id/respond           // الرد على تقييم

// ============= Document APIs =============
POST   /api/crm/documents                      // رفع مستند
GET    /api/crm/customers/:id/documents        // مستندات عميل
DELETE /api/crm/documents/:id                  // حذف مستند

// ============= Campaign APIs =============
POST   /api/crm/campaigns                      // إنشاء حملة
GET    /api/crm/campaigns                      // قائمة الحملات
GET    /api/crm/campaigns/:id                  // تفاصيل حملة
PUT    /api/crm/campaigns/:id                  // تحديث حملة
POST   /api/crm/campaigns/:id/send             // إرسال حملة
GET    /api/crm/campaigns/:id/stats            // إحصائيات حملة

// ============= Segment APIs =============
GET    /api/crm/segments                       // قائمة الشرائح
GET    /api/crm/segments/:segment/customers    // عملاء شريحة محددة
POST   /api/crm/segments/recalculate           // إعادة حساب الشرائح

// ============= Report APIs =============
GET    /api/crm/reports/rfm-analysis           // تحليل RFM
GET    /api/crm/reports/customer-lifetime-value // CLV
GET    /api/crm/reports/retention-rate         // معدل الاحتفاظ
GET    /api/crm/reports/churn-prediction       // توقع المغادرة
GET    /api/crm/reports/lead-source            // مصادر العملاء
GET    /api/crm/reports/satisfaction           // رضا العملاء

// ============= Dashboard APIs =============
GET    /api/crm/dashboard/kpis                 // المؤشرات الرئيسية
GET    /api/crm/dashboard/recent-activities    // الأنشطة الأخيرة
GET    /api/crm/dashboard/alerts               // التنبيهات
```

---

## 7️⃣ الأمان والصلاحيات

### نظام التحكم في الوصول

```javascript
// backend/middleware/crmPermissions.js

const crmPermissions = {
  // مصفوفة الصلاحيات حسب الدور
  permissions: {
    'Admin': ['*'], // كل الصلاحيات
    
    'Manager': [
      'crm.customers.view_all',
      'crm.customers.create',
      'crm.customers.update',
      'crm.customers.delete',
      'crm.interactions.view_all',
      'crm.tasks.view_all',
      'crm.tasks.assign',
      'crm.reports.view',
      'crm.reports.export',
      'crm.campaigns.manage'
    ],
    
    'Sales': [
      'crm.customers.view_assigned',
      'crm.customers.create',
      'crm.customers.update',
      'crm.interactions.create',
      'crm.interactions.view_own',
      'crm.tasks.view_assigned',
      'crm.tasks.create',
      'crm.notes.create',
      'crm.feedback.view'
    ],
    
    'Support': [
      'crm.customers.view_assigned',
      'crm.interactions.create',
      'crm.interactions.view_own',
      'crm.tasks.view_assigned',
      'crm.notes.create',
      'crm.feedback.create'
    ],
    
    'Receptionist': [
      'crm.customers.view',
      'crm.customers.create',
      'crm.interactions.create',
      'crm.notes.create'
    ]
  },
  
  // فحص الصلاحية
  hasPermission(userRole, permission) {
    const rolePermissions = this.permissions[userRole] || [];
    return rolePermissions.includes('*') || rolePermissions.includes(permission);
  },
  
  // Middleware للتحقق من الصلاحية
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'غير مصرح' });
      }
      
      const userRole = req.user.role;
      if (!this.hasPermission(userRole, permission)) {
        return res.status(403).json({ message: 'ليس لديك صلاحية لهذا الإجراء' });
      }
      
      next();
    };
  },
  
  // Data Masking حسب الصلاحية
  maskCustomerData(data, userRole) {
    const masked = { ...data };
    
    // إخفاء البيانات المالية
    if (!this.hasPermission(userRole, 'crm.customers.view_financial')) {
      masked.totalSpent = '***';
      masked.creditLimit = '***';
      masked.loyaltyPoints = '***';
    }
    
    // إخفاء بيانات الاتصال الحساسة
    if (!this.hasPermission(userRole, 'crm.customers.view_contact')) {
      masked.phone = this.maskPhone(masked.phone);
      masked.email = this.maskEmail(masked.email);
      masked.address = '***';
    }
    
    return masked;
  },
  
  maskPhone(phone) {
    if (!phone) return '';
    return phone.slice(0, 3) + '****' + phone.slice(-4);
  },
  
  maskEmail(email) {
    if (!email) return '';
    const [name, domain] = email.split('@');
    return name.slice(0, 1) + '***' + '@' + domain;
  }
};

module.exports = crmPermissions;
```

### استخدام في APIs

```javascript
const { requirePermission } = require('../middleware/crmPermissions');

// مثال: API يتطلب صلاحية محددة
router.get('/customers/:id', 
  authMiddleware, 
  requirePermission('crm.customers.view'),
  async (req, res) => {
    // الكود هنا
  }
);

router.delete('/customers/:id', 
  authMiddleware, 
  requirePermission('crm.customers.delete'),
  async (req, res) => {
    // الكود هنا
  }
);
```

---

## 8️⃣ Audit Trail (سجل التدقيق)

### تسجيل جميع العمليات

```javascript
// backend/middleware/auditMiddleware.js

const auditMiddleware = (action) => {
  return async (req, res, next) => {
    // حفظ الاستجابة الأصلية
    const originalSend = res.json;
    
    res.json = function(data) {
      // تسجيل العملية
      if (res.statusCode < 400) { // نجحت العملية
        db.query(`
          INSERT INTO CRMAuditLog (
            userId, action, tableName, recordId, 
            newValues, ipAddress, userAgent
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          req.user?.id || null,
          action,
          req.params.table || 'Customer',
          req.params.id || null,
          JSON.stringify(req.body),
          req.ip,
          req.get('user-agent')
        ]).catch(err => console.error('Audit log error:', err));
      }
      
      // إرسال الاستجابة
      originalSend.call(this, data);
    };
    
    next();
  };
};

// استخدام
router.put('/customers/:id', 
  authMiddleware, 
  auditMiddleware('update_customer'),
  async (req, res) => {
    // الكود هنا
  }
);
```

---

## ✅ الخلاصة

### النقاط الرئيسية للتكامل

1. ✅ **طلبات الإصلاح:** تسجيل تلقائي للتفاعلات + مهام متابعة
2. ✅ **المالية:** حساب CLV + تنبيهات الديون + تحليل الربحية
3. ✅ **المخزون:** تتبع التفضيلات + تنبيهات التوفر
4. ✅ **الإشعارات:** أتمتة كاملة عبر جميع القنوات
5. ✅ **التقارير:** تحليلات متقدمة (RFM, CLV, Retention)
6. ✅ **الأمان:** RBAC + Data Masking + Audit Trail

### الخطوات التالية

1. مراجعة هذه الوثيقة مع فريق التطوير
2. البدء بتطبيق Triggers في قاعدة البيانات
3. تطوير Backend APIs تدريجياً
4. تطبيق نظام الأتمتة
5. اختبار شامل لكل نقطة تكامل
6. تدريب الفريق على استخدام النظام الجديد

---

**وثيقة حية:** هذه الوثيقة قابلة للتحديث بناءً على المتطلبات الجديدة والتغذية الراجعة من الفريق.

**تم إعداد هذه الوثيقة بواسطة:** فريق تطوير FixZone  
**التاريخ:** 2 أكتوبر 2025  
**حالة الوثيقة:** نهائية - جاهزة للتطبيق ✅

