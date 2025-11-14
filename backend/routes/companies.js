const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/companies - جلب جميع الشركات
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, status } = req.query;
    const page = parseInt(req.query.page || '0', 10);
    const pageSize = Math.min(parseInt(req.query.pageSize || '20', 10), 100);
    
    let query = `
      SELECT 
        c.id, c.name, c.email, c.phone, c.address, c.taxNumber, c.customFields,
        c.createdAt, c.updatedAt,
        COUNT(cust.id) as customersCount
      FROM Company c
      LEFT JOIN Customer cust ON c.id = cust.companyId AND cust.deletedAt IS NULL
      WHERE c.deletedAt IS NULL
    `;
    
    const params = [];
    
    // إضافة فلتر البحث
    if (search) {
      query += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // إضافة فلتر الحالة
    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }
    
    query += ` GROUP BY c.id ORDER BY c.createdAt DESC`;
    
    if (!page) {
      const [companiesRows] = await db.execute(query, params);
      // تحويل MySQL objects إلى JSON objects عادية
      const formattedCompanies = companiesRows.map(company => ({
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        taxNumber: company.taxNumber,
        customFields: company.customFields,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        customersCount: company.customersCount
      }));
      return res.json(formattedCompanies);
    }

    // pagination
    const offsetVal = (page - 1) * pageSize;
    const paginatedQuery = `${query} LIMIT ? OFFSET ?`;
    const [companiesRows] = await db.execute(paginatedQuery, [...params, pageSize, offsetVal]);

    // تحويل MySQL objects إلى JSON objects عادية
    const formattedCompanies = companiesRows.map(company => ({
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      taxNumber: company.taxNumber,
      customFields: company.customFields,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      customersCount: company.customersCount
    }));

    // total count
    const [countRows] = await db.execute(
      `SELECT COUNT(*) as cnt FROM Company c ${search || status ? 'WHERE' : ''}
       ${[search ? '(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)' : null, status ? 'c.status = ?' : null].filter(Boolean).join(' AND ')}`,
      (search ? [`%${search}%`,`%${search}%`,`%${search}%`] : []).concat(status ? [status] : [])
    );

    res.json({ data: formattedCompanies, pagination: { page, pageSize, total: countRows?.[0]?.cnt || 0 } });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في جلب بيانات الشركات',
      details: error.message 
    });
  }
});

// GET /api/companies/:id - جلب شركة واحدة
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        c.id, c.name, c.email, c.phone, c.address, c.website, 
        c.taxNumber, c.customFields,
        c.createdAt, c.updatedAt,
        COUNT(cust.id) as customersCount
      FROM Company c
      LEFT JOIN Customer cust ON c.id = cust.companyId AND cust.deletedAt IS NULL
      WHERE c.id = ? AND c.deletedAt IS NULL
      GROUP BY c.id
    `;
    
    const [companiesRows] = await db.execute(query, [id]);
    
    if (companiesRows.length === 0) {
      return res.status(404).json({ error: 'الشركة غير موجودة' });
    }
    
    // تحويل MySQL object إلى JSON object عادي
    const company = companiesRows[0];
    const formattedCompany = {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      taxNumber: company.taxNumber,
      customFields: company.customFields,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      customersCount: company.customersCount
    };
    
    res.json(formattedCompany);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في جلب بيانات الشركة',
      details: error.message 
    });
  }
});

// POST /api/companies - إنشاء شركة جديدة
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      website,
      description,
      status = 'active'
    } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!name || !phone) {
      return res.status(400).json({ 
        error: 'اسم الشركة ورقم الهاتف مطلوبان' 
      });
    }
    
    // التحقق من عدم وجود شركة بنفس الاسم
    const [existingCompanyRows] = await db.execute(
      'SELECT id FROM Company WHERE name = ? AND deletedAt IS NULL',
      [name]
    );
    
    if (existingCompanyRows.length > 0) {
      return res.status(400).json({ 
        error: 'يوجد شركة بنفس هذا الاسم بالفعل' 
      });
    }
    
    const query = `
      INSERT INTO Company (
        name, email, phone, address, website, 
 description, status, taxNumber, customFields, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const [result] = await db.execute(query, [
      name, email, phone, address, website,
 description, status, req.body.taxNumber || null, 
      JSON.stringify(req.body.customFields || {})
    ]);
    
    // جلب الشركة المنشأة
    const [newCompanyRows] = await db.execute(
      'SELECT id, name, email, phone, address, taxNumber, customFields, createdAt, updatedAt FROM Company WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newCompanyRows[0]);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في إنشاء الشركة',
      details: error.message 
    });
  }
});

// PUT /api/companies/:id - تحديث شركة
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      website,
      description,
      status
    } = req.body;
    
    // التحقق من وجود الشركة
    const [existingCompanyRows] = await db.execute(
      'SELECT id FROM Company WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (existingCompanyRows.length === 0) {
      return res.status(404).json({ error: 'الشركة غير موجودة' });
    }
    
    // التحقق من البيانات المطلوبة
    if (!name || !phone) {
      return res.status(400).json({ 
        error: 'اسم الشركة ورقم الهاتف مطلوبان' 
      });
    }
    
    const query = `
      UPDATE Company SET 
        name = ?, email = ?, phone = ?, address = ?, 
        status = ?, taxNumber = ?, customFields = ?, updatedAt = NOW()
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    await db.execute(query, [
      name, email, phone, address, website,
 description, status, req.body.taxNumber || null,
      JSON.stringify(req.body.customFields || {}), id
    ]);
    
    // جلب الشركة المحدثة
    const [updatedCompanyRows] = await db.execute(
      'SELECT id, name, email, phone, address, taxNumber, customFields, createdAt, updatedAt FROM Company WHERE id = ?',
      [id]
    );
    
    res.json(updatedCompanyRows[0]);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في تحديث الشركة',
      details: error.message 
    });
  }
});

// DELETE /api/companies/:id - حذف شركة (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // إضافة خيار force للحذف الإجباري
    
    // التحقق من وجود الشركة
    const [existingCompanyRows] = await db.execute(
      'SELECT id, name FROM Company WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (existingCompanyRows.length === 0) {
      return res.status(404).json({ error: 'الشركة غير موجودة' });
    }
    
    // التحقق من وجود عملاء نشطين مرتبطين بالشركة
    const [activeCustomersRows] = await db.execute(
      'SELECT id, firstName, lastName FROM Customer WHERE companyId = ? AND deletedAt IS NULL',
      [id]
    );
    
    // إذا كان هناك عملاء نشطون وليس force delete
    if (activeCustomersRows.length > 0 && force !== 'true') {
      console.log(`Company ${id} has ${activeCustomersRows.length} active customers:`, 
        activeCustomersRows.map(c => `${c.firstName} ${c.lastName} (ID: ${c.id})`).join(', '));
      
      return res.status(400).json({ 
        error: 'لا يمكن حذف الشركة لأنها مرتبطة بعملاء نشطين',
        customersCount: activeCustomersRows.length,
        customers: activeCustomersRows.map(c => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`
        })),
        message: `يوجد ${activeCustomersRows.length} عميل نشط مرتبط بهذه الشركة. يمكنك:\n1. حذف العملاء أولاً\n2. نقل العملاء لشركة أخرى\n3. إلغاء ربط العملاء بالشركة`
      });
    }
    
    // إذا كان force delete، إلغاء ربط العملاء بالشركة أولاً
    if (activeCustomersRows.length > 0 && force === 'true') {
      await db.execute(
        'UPDATE Customer SET companyId = NULL WHERE companyId = ?',
        [id]
      );
      console.log(`Unlinked ${activeCustomersRows.length} customers from company ${id}`);
    }
    
    // Soft delete للشركة
    await db.execute(
      'UPDATE Company SET deletedAt = NOW() WHERE id = ?',
      [id]
    );
    
    res.json({ 
      message: 'تم حذف الشركة بنجاح',
      unlinkedCustomers: activeCustomersRows.length
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في حذف الشركة',
      details: error.message 
    });
  }
});

// GET /api/companies/:id/customers - جلب عملاء شركة معينة
router.get('/:id/customers', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // التحقق من وجود الشركة
    const [companyRows] = await db.execute(
      'SELECT id FROM Company WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (companyRows.length === 0) {
      return res.status(404).json({ error: 'الشركة غير موجودة' });
    }
    
    const [customersRows] = await db.execute(
      'SELECT * FROM Customer WHERE companyId = ? AND deletedAt IS NULL ORDER BY createdAt DESC',
      [id]
    );
    
    res.json(customersRows);
  } catch (error) {
    console.error('Error fetching company customers:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في جلب عملاء الشركة',
      details: error.message 
    });
  }
});

module.exports = router;