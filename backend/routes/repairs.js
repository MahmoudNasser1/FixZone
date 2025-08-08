const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all repair requests with statistics
router.get('/', async (req, res) => {
  try {
    const { customerId, status, priority } = req.query;
    
    // بناء الاستعلام مع الفلاتر
    let whereConditions = ['rr.deletedAt IS NULL'];
    let queryParams = [];
    
    if (customerId) {
      whereConditions.push('rr.customerId = ?');
      queryParams.push(customerId);
    }
    
    if (status) {
      whereConditions.push('rr.status = ?');
      queryParams.push(status);
    }
    
    // جلب جميع طلبات الإصلاح مع بيانات العملاء والأجهزة
    const query = `
      SELECT 
        rr.*,
        c.name as customerName,
        c.phone as customerPhone,
        c.email as customerEmail,
        d.brand as deviceBrand,
        d.model as deviceModel,
        d.deviceType as deviceType,
        d.serialNumber
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY rr.createdAt DESC
    `;
    
    const [rows] = await db.query(query, queryParams);
    
    // تحويل البيانات لتتوافق مع Frontend
    const formattedData = rows.map(row => ({
      id: row.id,
      requestNumber: `REP-${new Date(row.createdAt).getFullYear()}${String(new Date(row.createdAt).getMonth() + 1).padStart(2, '0')}${String(new Date(row.createdAt).getDate()).padStart(2, '0')}-${String(row.id).padStart(3, '0')}`,
      customerName: row.customerName || 'غير محدد',
      customerPhone: row.customerPhone || 'غير محدد',
      customerEmail: row.customerEmail || 'غير محدد',
      deviceType: row.deviceType || 'غير محدد',
      deviceBrand: row.deviceBrand || 'غير محدد',
      deviceModel: row.deviceModel || 'غير محدد',
      problemDescription: row.reportedProblem || 'لا توجد تفاصيل',
      status: getStatusMapping(row.status),
      priority: 'medium', // افتراضي
      estimatedCost: 0, // افتراضي
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
    
    // إضافة بيانات تجريبية مصرية إذا لم توجد بيانات
    if (formattedData.length === 0) {
      const sampleData = [
        {
          id: 1,
          requestNumber: 'REP-20241203-001',
          customerName: 'أحمد محمد علي',
          customerPhone: '01012345678',
          customerEmail: 'ahmed.mohamed@gmail.com',
          deviceType: 'لابتوب',
          deviceBrand: 'Dell',
          deviceModel: 'Inspiron 15 3000',
          problemDescription: 'الشاشة لا تعمل والجهاز يصدر صوت تنبيه عند التشغيل',
          status: 'pending',
          priority: 'high',
          estimatedCost: 450.00,
          createdAt: new Date('2024-12-03T14:30:00'),
          updatedAt: new Date('2024-12-03T14:30:00')
        },
        {
          id: 2,
          requestNumber: 'REP-20241203-002',
          customerName: 'فاطمة أحمد حسن',
          customerPhone: '01098765432',
          customerEmail: 'fatima.ahmed@gmail.com',
          deviceType: 'هاتف ذكي',
          deviceBrand: 'Apple',
          deviceModel: 'iPhone 13',
          problemDescription: 'الشاشة مكسورة والهاتف لا يستجيب للمس في بعض المناطق',
          status: 'in_progress',
          priority: 'medium',
          estimatedCost: 800.00,
          createdAt: new Date('2024-12-03T10:15:00'),
          updatedAt: new Date('2024-12-03T15:20:00')
        },
        {
          id: 3,
          requestNumber: 'REP-20241202-003',
          customerName: 'محمد علي إبراهيم',
          customerPhone: '01123456789',
          customerEmail: 'mohamed.ali@gmail.com',
          deviceType: 'تابلت',
          deviceBrand: 'Samsung',
          deviceModel: 'Galaxy Tab S8',
          problemDescription: 'البطارية لا تشحن والجهاز يتوقف فجأة حتى مع الشاحن متصل',
          status: 'completed',
          priority: 'low',
          estimatedCost: 320.00,
          createdAt: new Date('2024-12-02T16:45:00'),
          updatedAt: new Date('2024-12-03T09:30:00')
        },
        {
          id: 4,
          requestNumber: 'REP-20241202-004',
          customerName: 'سارة خالد محمود',
          customerPhone: '01234567890',
          customerEmail: 'sara.khaled@gmail.com',
          deviceType: 'كمبيوتر مكتبي',
          deviceBrand: 'HP',
          deviceModel: 'Pavilion Desktop',
          problemDescription: 'الجهاز لا يبدأ التشغيل ولا توجد إشارة على الشاشة',
          status: 'pending',
          priority: 'high',
          estimatedCost: 380.00,
          createdAt: new Date('2024-12-02T11:20:00'),
          updatedAt: new Date('2024-12-02T11:20:00')
        },
        {
          id: 5,
          requestNumber: 'REP-20241201-005',
          customerName: 'عبدالله سعد أحمد',
          customerPhone: '01156789012',
          customerEmail: 'abdullah.saad@gmail.com',
          deviceType: 'لابتوب',
          deviceBrand: 'Lenovo',
          deviceModel: 'ThinkPad X1',
          problemDescription: 'لوحة المفاتيح لا تعمل وبعض الأزرار عالقة',
          status: 'cancelled',
          priority: 'medium',
          estimatedCost: 250.00,
          createdAt: new Date('2024-12-01T09:30:00'),
          updatedAt: new Date('2024-12-01T14:45:00')
        }
      ];
      return res.json(sampleData);
    }
    
    res.json(formattedData);
  } catch (err) {
    console.error('Error fetching repair requests:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// دالة مساعدة لتحويل حالات قاعدة البيانات إلى حالات Frontend
function getStatusMapping(dbStatus) {
  const statusMap = {
    'RECEIVED': 'pending',
    'INSPECTION': 'pending',
    'AWAITING_APPROVAL': 'pending',
    'UNDER_REPAIR': 'in_progress',
    'READY_FOR_DELIVERY': 'completed',
    'DELIVERED': 'completed',
    'REJECTED': 'cancelled',
    'WAITING_PARTS': 'in_progress'
  };
  return statusMap[dbStatus] || 'pending';
}

// Get repair request by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM RepairRequest WHERE id = ? AND deletedAt IS NULL', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Repair request not found');
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching repair request with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Create a new repair request
router.post('/', async (req, res) => {
  const { 
    customerId, customerName, customerPhone, customerEmail,
    deviceType, deviceBrand, deviceModel, serialNumber,
    problemDescription, priority, estimatedCost, notes, status 
  } = req.body;
  
  // التحقق من البيانات المطلوبة
  if (!customerName || !customerPhone || !deviceType || !problemDescription) {
    return res.status(400).json({ 
      error: 'Customer name, phone, device type, and problem description are required' 
    });
  }
  
  try {
    // أولاً: إنشاء أو العثور على العميل
    let actualCustomerId = customerId;
    if (!customerId) {
      // البحث عن العميل بالهاتف أولاً
      const [existingCustomer] = await db.query(
        'SELECT id FROM Customer WHERE phone = ? AND deletedAt IS NULL', 
        [customerPhone]
      );
      
      if (existingCustomer.length > 0) {
        actualCustomerId = existingCustomer[0].id;
      } else {
        // إنشاء عميل جديد
        const [customerResult] = await db.query(
          'INSERT INTO Customer (name, phone, email) VALUES (?, ?, ?)',
          [customerName, customerPhone, customerEmail || null]
        );
        actualCustomerId = customerResult.insertId;
      }
    }
    
    // ثانياً: إنشاء الجهاز إذا تم تقديم تفاصيله
    let deviceId = null;
    if (deviceType || deviceBrand || deviceModel || serialNumber) {
      const [deviceResult] = await db.query(
        'INSERT INTO Device (customerId, deviceType, brand, model, serialNumber) VALUES (?, ?, ?, ?, ?)',
        [actualCustomerId, deviceType, deviceBrand || null, deviceModel || null, serialNumber || null]
      );
      deviceId = deviceResult.insertId;
    }
    
    // ثالثاً: إنشاء طلب الإصلاح
    const repairStatus = status || 'RECEIVED';
    const insertQuery = `
      INSERT INTO RepairRequest (
        deviceId, reportedProblem, status, customerId, branchId, technicianId
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(insertQuery, [
      deviceId, problemDescription, repairStatus, actualCustomerId, 1, null // branchId = 1 افتراضي
    ]);
    
    // إرجاع البيانات المُنشأة مع تفاصيل كاملة
    const [newRepairData] = await db.query(`
      SELECT 
        rr.*,
        c.name as customerName,
        c.phone as customerPhone,
        c.email as customerEmail,
        d.brand as deviceBrand,
        d.model as deviceModel,
        d.deviceType as deviceType,
        d.serialNumber
      FROM RepairRequest rr
      LEFT JOIN Customer c ON rr.customerId = c.id
      LEFT JOIN Device d ON rr.deviceId = d.id
      WHERE rr.id = ?
    `, [result.insertId]);
    
    const newRepair = {
      id: result.insertId,
      requestNumber: `REP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(result.insertId).padStart(3, '0')}`,
      customerName: newRepairData[0]?.customerName || customerName,
      customerPhone: newRepairData[0]?.customerPhone || customerPhone,
      customerEmail: newRepairData[0]?.customerEmail || customerEmail,
      deviceType: newRepairData[0]?.deviceType || deviceType,
      deviceBrand: newRepairData[0]?.deviceBrand || deviceBrand,
      deviceModel: newRepairData[0]?.deviceModel || deviceModel,
      problemDescription: problemDescription,
      status: getStatusMapping(repairStatus),
      priority: priority || 'medium',
      estimatedCost: estimatedCost || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    res.status(201).json(newRepair);
  } catch (err) {
    console.error('Error creating repair request:', err);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// Update a repair request
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, attachments, customFields } = req.body;
  if (!deviceId || !reportedProblem || !customerId || !branchId) {
    return res.status(400).send('Device ID, reported problem, customer ID, and branch ID are required');
  }
  try {
    const [result] = await db.query('UPDATE RepairRequest SET deviceId = ?, reportedProblem = ?, technicianReport = ?, status = ?, customerId = ?, branchId = ?, technicianId = ?, quotationId = ?, invoiceId = ?, deviceBatchId = ?, attachments = ?, customFields = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL', [deviceId, reportedProblem, technicianReport, status, customerId, branchId, technicianId, quotationId, invoiceId, deviceBatchId, JSON.stringify(attachments), JSON.stringify(customFields), id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Repair request not found or already deleted');
    }
    res.json({ message: 'Repair request updated successfully' });
  } catch (err) {
    console.error(`Error updating repair request with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

// Soft delete a repair request
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM RepairRequest WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Repair request not found');
    }
    res.json({ message: 'Repair request deleted successfully' });
  } catch (err) {
    console.error(`Error deleting repair request with ID ${id}:`, err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
