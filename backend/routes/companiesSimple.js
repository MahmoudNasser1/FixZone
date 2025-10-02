const express = require('express');
const router = express.Router();
const db = require('../db');

// Simplified Companies Route - Basic functionality only
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const page = parseInt(req.query.page || '0', 10);
    const pageSize = Math.min(parseInt(req.query.pageSize || '20', 10), 100);
    
    let query = `
      SELECT 
        c.id, c.name, c.email, c.phone, c.address, c.industry, c.website, c.description,
        c.contactPerson, c.taxNumber, c.notes, c.isActive,
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
      query += ` AND c.isActive = ?`;
      params.push(status === 'active' ? 1 : 0);
    }
    
    query += ` GROUP BY c.id ORDER BY c.createdAt DESC`;
    
    if (!page) {
      const [companiesRows] = await db.query(query, params);
      // تحويل MySQL objects إلى JSON objects عادية
      const formattedCompanies = companiesRows.map(company => ({
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        industry: company.industry,
        website: company.website,
        description: company.description,
        contactPerson: company.contactPerson,
        taxNumber: company.taxNumber,
        notes: company.notes,
        isActive: company.isActive,
        status: company.isActive ? 'active' : 'inactive',
        customersCount: company.customersCount,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      }));
      
      res.json(formattedCompanies);
    } else {
      // Pagination logic
      const offset = page * pageSize;
      query += ` LIMIT ? OFFSET ?`;
      params.push(pageSize, offset);
      
      const [companiesRows] = await db.query(query, params);
      
      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM Company c
        LEFT JOIN Customer cust ON c.id = cust.companyId AND cust.deletedAt IS NULL
        WHERE c.deletedAt IS NULL
      `;
      
      const countParams = [];
      if (search) {
        countQuery += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (status) {
        countQuery += ` AND c.isActive = ?`;
        countParams.push(status === 'active' ? 1 : 0);
      }
      
      const [countResult] = await db.query(countQuery, countParams);
      const total = countResult[0].total;
      
      const formattedCompanies = companiesRows.map(company => ({
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        industry: company.industry,
        website: company.website,
        description: company.description,
        contactPerson: company.contactPerson,
        taxNumber: company.taxNumber,
        notes: company.notes,
        isActive: company.isActive,
        status: company.isActive ? 'active' : 'inactive',
        customersCount: company.customersCount,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      }));
      
      res.json({
        companies: formattedCompanies,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    }
    
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ 
      error: 'Server Error',
      details: error.message 
    });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        c.id, c.name, c.email, c.phone, c.address, c.industry, c.website, c.description,
        c.contactPerson, c.taxNumber, c.notes, c.isActive,
        c.createdAt, c.updatedAt,
        COUNT(cust.id) as customersCount
      FROM Company c
      LEFT JOIN Customer cust ON c.id = cust.companyId AND cust.deletedAt IS NULL
      WHERE c.id = ? AND c.deletedAt IS NULL
      GROUP BY c.id
    `;
    
    const [rows] = await db.query(query, [id]);
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const company = rows[0];
    const formattedCompany = {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      industry: company.industry,
      website: company.website,
      description: company.description,
      contactPerson: company.contactPerson,
      taxNumber: company.taxNumber,
      notes: company.notes,
      isActive: company.isActive,
      status: company.isActive ? 'active' : 'inactive',
      customersCount: company.customersCount,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    };
    
    res.json(formattedCompany);
    
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ 
      error: 'Server Error',
      details: error.message 
    });
  }
});

// POST /api/companies - إنشاء شركة جديدة
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      industry,
      website,
      description,
      contactPerson,
      taxNumber,
      notes,
      isActive = true
    } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!name || !phone) {
      return res.status(400).json({ 
        error: 'اسم الشركة ورقم الهاتف مطلوبان' 
      });
    }
    
    // التحقق من عدم وجود شركة بنفس الاسم
    const [existingCompanyRows] = await db.query(
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
        name, email, phone, address, industry, website, description,
        contactPerson, taxNumber, notes, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const [result] = await db.query(query, [
      name, 
      email || null, 
      phone, 
      address || null,
      industry || null,
      website || null,
      description || null,
      contactPerson || null,
      taxNumber || null, 
      notes || null,
      isActive ? 1 : 0
    ]);
    
    // جلب الشركة المنشأة
    const [newCompanyRows] = await db.query(
      'SELECT id, name, email, phone, address, industry, website, description, contactPerson, taxNumber, notes, isActive, createdAt, updatedAt FROM Company WHERE id = ?',
      [result.insertId]
    );
    
    const newCompany = newCompanyRows[0];
    res.status(201).json({
      ...newCompany,
      status: newCompany.isActive ? 'active' : 'inactive'
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في إنشاء الشركة',
      details: error.message 
    });
  }
});

// PUT /api/companies/:id - تحديث شركة
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      industry,
      website,
      description,
      contactPerson,
      taxNumber,
      notes,
      isActive
    } = req.body;
    
    // التحقق من وجود الشركة
    const [existingCompanyRows] = await db.query(
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
    
    // التحقق من عدم وجود شركة أخرى بنفس الاسم
    const [duplicateRows] = await db.query(
      'SELECT id FROM Company WHERE name = ? AND id != ? AND deletedAt IS NULL',
      [name, id]
    );
    
    if (duplicateRows.length > 0) {
      return res.status(400).json({ 
        error: 'يوجد شركة أخرى بنفس هذا الاسم' 
      });
    }
    
    const query = `
      UPDATE Company SET 
        name = ?, email = ?, phone = ?, address = ?, industry = ?, website = ?, description = ?,
        contactPerson = ?, taxNumber = ?, notes = ?,
        isActive = ?, updatedAt = NOW()
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    await db.query(query, [
      name, 
      email || null, 
      phone, 
      address || null,
      industry || null,
      website || null,
      description || null,
      contactPerson || null, 
      taxNumber || null, 
      notes || null,
      isActive ? 1 : 0,
      id
    ]);
    
    // جلب الشركة المحدثة
    const [updatedCompanyRows] = await db.query(
      'SELECT id, name, email, phone, address, industry, website, description, contactPerson, taxNumber, notes, isActive, createdAt, updatedAt FROM Company WHERE id = ?',
      [id]
    );
    
    const updatedCompany = updatedCompanyRows[0];
    res.json({
      ...updatedCompany,
      status: updatedCompany.isActive ? 'active' : 'inactive'
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في تحديث الشركة',
      details: error.message 
    });
  }
});

// DELETE /api/companies/:id - حذف شركة (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // إضافة خيار force للحذف الإجباري
    
    // التحقق من وجود الشركة
    const [existingCompanyRows] = await db.query(
      'SELECT id, name FROM Company WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (existingCompanyRows.length === 0) {
      return res.status(404).json({ error: 'الشركة غير موجودة' });
    }
    
    // التحقق من وجود عملاء نشطين مرتبطين بالشركة
    const [activeCustomersRows] = await db.query(
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
      await db.query(
        'UPDATE Customer SET companyId = NULL WHERE companyId = ?',
        [id]
      );
      console.log(`Unlinked ${activeCustomersRows.length} customers from company ${id}`);
    }
    
    // Soft delete للشركة
    await db.query(
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
router.get('/:id/customers', async (req, res) => {
  try {
    const { id } = req.params;
    
    // التحقق من وجود الشركة
    const [companyRows] = await db.query(
      'SELECT id, name FROM Company WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (companyRows.length === 0) {
      return res.status(404).json({ error: 'الشركة غير موجودة' });
    }
    
    // جلب العملاء المرتبطين بالشركة
    const [customersRows] = await db.query(
      `SELECT 
        id, firstName, lastName, email, phone, address, 
        createdAt, updatedAt
       FROM Customer 
       WHERE companyId = ? AND deletedAt IS NULL 
       ORDER BY createdAt DESC`,
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
