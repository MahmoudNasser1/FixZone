const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Complete repair workflow integration
router.post('/repair-workflow/start', async (req, res) => {
  try {
    const { repairId, technicianId, estimatedCost } = req.body;
    
    // Update repair status to in_progress
    await db.execute(
      'UPDATE RepairRequest SET status = ?, assignedTechnicianId = ?, estimatedCost = ? WHERE id = ?',
      ['in_progress', technicianId, estimatedCost, repairId]
    );
    
    // Create status update log
    await db.execute(
      'INSERT INTO StatusUpdateLog (repairRequestId, status, updatedBy, notes) VALUES (?, ?, ?, ?)',
      [repairId, 'in_progress', technicianId, 'تم بدء عملية الإصلاح']
    );
    
    res.json({
      success: true,
      message: 'تم بدء عملية الإصلاح بنجاح'
    });
  } catch (error) {
    console.error('Error starting repair workflow:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في بدء عملية الإصلاح',
      details: error.message
    });
  }
});

// Complete repair workflow - move to invoicing
router.post('/repair-workflow/complete', async (req, res) => {
  try {
    const { repairId, actualCost, partsUsed, servicesUsed } = req.body;
    
    // Update repair status to completed
    await db.execute(
      'UPDATE RepairRequest SET status = ?, actualCost = ?, completedAt = NOW() WHERE id = ?',
      ['completed', actualCost, repairId]
    );
    
    // Update stock levels for parts used
    for (const part of partsUsed) {
      await db.execute(
        'UPDATE StockLevel SET quantity = quantity - ? WHERE inventoryItemId = ?',
        [part.quantity, part.itemId]
      );
      
      // Create stock movement record
      await db.execute(
        'INSERT INTO StockMovement (type, quantity, inventoryItemId, userId, reason) VALUES (?, ?, ?, ?, ?)',
        ['out', part.quantity, part.itemId, req.body.userId, 'استخدام في إصلاح']
      );
    }
    
    // Create status update log
    await db.execute(
      'INSERT INTO StatusUpdateLog (repairRequestId, status, updatedBy, notes) VALUES (?, ?, ?, ?)',
      [repairId, 'completed', req.body.userId, 'تم إكمال الإصلاح']
    );
    
    res.json({
      success: true,
      message: 'تم إكمال الإصلاح بنجاح',
      data: {
        repairId,
        canCreateInvoice: true
      }
    });
  } catch (error) {
    console.error('Error completing repair workflow:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إكمال الإصلاح',
      details: error.message
    });
  }
});

// Create invoice from completed repair
router.post('/repair-workflow/create-invoice', async (req, res) => {
  try {
    const { repairId, customerId, items, totalAmount, taxAmount } = req.body;
    
    // Get repair details
    const [repairRows] = await db.execute(
      'SELECT * FROM RepairRequest WHERE id = ?',
      [repairId]
    );
    
    if (repairRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'طلب الإصلاح غير موجود'
      });
    }
    
    const repair = repairRows[0];
    
    // Create invoice
    const [invoiceResult] = await db.execute(
      'INSERT INTO Invoice (customerId, repairRequestId, totalAmount, taxAmount, status, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
      [customerId, repairId, totalAmount, taxAmount, 'pending']
    );
    
    const invoiceId = invoiceResult.insertId;
    
    // Add invoice items
    for (const item of items) {
      await db.execute(
        'INSERT INTO InvoiceItem (invoiceId, itemType, itemId, quantity, unitPrice, totalPrice) VALUES (?, ?, ?, ?, ?, ?)',
        [invoiceId, item.type, item.id, item.quantity, item.unitPrice, item.totalPrice]
      );
    }
    
    // Update repair status to invoiced
    await db.execute(
      'UPDATE RepairRequest SET status = ? WHERE id = ?',
      ['invoiced', repairId]
    );
    
    res.json({
      success: true,
      message: 'تم إنشاء الفاتورة بنجاح',
      data: {
        invoiceId,
        repairId,
        canProcessPayment: true
      }
    });
  } catch (error) {
    console.error('Error creating invoice from repair:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الفاتورة',
      details: error.message
    });
  }
});

// Process payment and complete workflow
router.post('/repair-workflow/process-payment', async (req, res) => {
  try {
    const { invoiceId, paymentAmount, paymentMethod, userId } = req.body;
    
    // Get invoice details
    const [invoiceRows] = await db.execute(
      'SELECT * FROM Invoice WHERE id = ?',
      [invoiceId]
    );
    
    if (invoiceRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الفاتورة غير موجودة'
      });
    }
    
    const invoice = invoiceRows[0];
    
    // Create payment record
    await db.execute(
      'INSERT INTO Payment (invoiceId, amount, paymentMethod, paymentDate, userId) VALUES (?, ?, ?, NOW(), ?)',
      [invoiceId, paymentAmount, paymentMethod, userId]
    );
    
    // Calculate remaining amount
    const [paymentRows] = await db.execute(
      'SELECT SUM(amount) as totalPaid FROM Payment WHERE invoiceId = ?',
      [invoiceId]
    );
    
    const totalPaid = paymentRows[0].totalPaid || 0;
    const remainingAmount = invoice.totalAmount - totalPaid;
    
    // Update invoice status
    let newStatus = 'pending';
    if (remainingAmount <= 0) {
      newStatus = 'paid';
    } else {
      newStatus = 'partially_paid';
    }
    
    await db.execute(
      'UPDATE Invoice SET status = ? WHERE id = ?',
      [newStatus, invoiceId]
    );
    
    // If fully paid, update repair status to ready_for_delivery
    if (newStatus === 'paid') {
      await db.execute(
        'UPDATE RepairRequest SET status = ? WHERE id = ?',
        ['ready_for_delivery', invoice.repairRequestId]
      );
      
      // Create status update log
      await db.execute(
        'INSERT INTO StatusUpdateLog (repairRequestId, status, updatedBy, notes) VALUES (?, ?, ?, ?)',
        [invoice.repairRequestId, 'ready_for_delivery', userId, 'تم الدفع - جاهز للتسليم']
      );
    }
    
    res.json({
      success: true,
      message: 'تم معالجة الدفعة بنجاح',
      data: {
        invoiceId,
        totalPaid,
        remainingAmount,
        status: newStatus,
        canDeliver: newStatus === 'paid'
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في معالجة الدفعة',
      details: error.message
    });
  }
});

// Complete delivery and close workflow
router.post('/repair-workflow/complete-delivery', async (req, res) => {
  try {
    const { repairId, deliveredBy, customerSignature, notes } = req.body;
    
    // Update repair status to delivered
    await db.execute(
      'UPDATE RepairRequest SET status = ?, deliveredAt = NOW(), deliveredBy = ? WHERE id = ?',
      ['delivered', deliveredBy, repairId]
    );
    
    // Create delivery record (if you have a delivery table)
    // await db.query(
    //   'INSERT INTO Delivery (repairRequestId, deliveredBy, customerSignature, notes, deliveredAt) VALUES (?, ?, ?, ?, NOW())',
    //   [repairId, deliveredBy, customerSignature, notes]
    // );
    
    // Create status update log
    await db.execute(
      'INSERT INTO StatusUpdateLog (repairRequestId, status, updatedBy, notes) VALUES (?, ?, ?, ?)',
      [repairId, 'delivered', deliveredBy, 'تم تسليم الجهاز للعميل']
    );
    
    res.json({
      success: true,
      message: 'تم تسليم الجهاز بنجاح',
      data: {
        repairId,
        workflowCompleted: true
      }
    });
  } catch (error) {
    console.error('Error completing delivery:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسليم الجهاز',
      details: error.message
    });
  }
});

// Get workflow status for a repair
router.get('/repair-workflow/:repairId/status', async (req, res) => {
  try {
    const { repairId } = req.params;
    
    // Get repair details with related data
    const [repairRows] = await db.execute(`
      SELECT 
        rr.*,
        c.firstName as customerFirstName,
        c.lastName as customerLastName,
        u.firstName as technicianFirstName,
        u.lastName as technicianLastName,
        i.id as invoiceId,
        i.status as invoiceStatus,
        i.totalAmount as invoiceTotal,
        COALESCE(SUM(p.amount), 0) as totalPaid
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN User u ON rr.assignedTechnicianId = u.id
      LEFT JOIN Invoice i ON rr.id = i.repairRequestId
      LEFT JOIN Payment p ON i.id = p.invoiceId
      WHERE rr.id = ?
      GROUP BY rr.id
    `, [repairId]);
    
    if (repairRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'طلب الإصلاح غير موجود'
      });
    }
    
    const repair = repairRows[0];
    const remainingAmount = repair.invoiceTotal - repair.totalPaid;
    
    // Determine workflow status
    let workflowStatus = {
      currentStep: repair.status,
      canStart: repair.status === 'pending',
      canComplete: repair.status === 'in_progress',
      canInvoice: repair.status === 'completed',
      canPay: repair.status === 'invoiced' && remainingAmount > 0,
      canDeliver: repair.status === 'ready_for_delivery',
      isCompleted: repair.status === 'delivered'
    };
    
    res.json({
      success: true,
      data: {
        repair,
        workflowStatus,
        remainingAmount
      }
    });
  } catch (error) {
    console.error('Error getting workflow status:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب حالة سير العمل',
      details: error.message
    });
  }
});

module.exports = router;
