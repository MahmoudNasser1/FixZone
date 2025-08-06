const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/companies - جلب جميع الشركات
router.get('/', async (req, res) => {
  try {
    const { search, status, limit, offset } = req.query;
    
    let query = `
      SELECT 
        c.*,
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
    
    // إضافة pagination
    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit));
      
      if (offset) {
        query += ` OFFSET ?`;
        params.push(parseInt(offset));
      }
    }
    
    const companies = await db.query(query, params);
    
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في جلب بيانات الشركات',
      details: error.message 
    });
  }
});

// GET /api/companies/:id - جلب شركة واحدة
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        c.*,
        COUNT(cust.id) as customersCount
      FROM Company c
      LEFT JOIN Customer cust ON c.id = cust.companyId AND cust.deletedAt IS NULL
      WHERE c.id = ? AND c.deletedAt IS NULL
      GROUP BY c.id
    `;
    
    const companies = await db.query(query, [id]);
    
    if (companies.length === 0) {
      return res.status(404).json({ error: 'الشركة غير موجودة' });
    }
    
    res.json(companies[0]);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في جلب بيانات الشركة',
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
      website,
      industry,
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
    const existingCompany = await db.query(
      'SELECT id FROM Company WHERE name = ? AND deletedAt IS NULL',
      [name]
    );
    
    if (existingCompany.length > 0) {
      return res.status(400).json({ 
        error: 'يوجد شركة بنفس هذا الاسم بالفعل' 
      });
    }
    
    const query = `
      INSERT INTO Company (
        name, email, phone, address, website, 
        industry, description, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const result = await db.query(query, [
      name, email, phone, address, website,
      industry, description, status
    ]);
    
    // جلب الشركة المنشأة
    const newCompany = await db.query(
      'SELECT * FROM Company WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newCompany[0]);
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
      website,
      industry,
      description,
      status
    } = req.body;
    
    // التحقق من وجود الشركة
    const existingCompany = await db.query(
      'SELECT id FROM Company WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (existingCompany.length === 0) {
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
        website = ?, industry = ?, description = ?, 
        status = ?, updatedAt = NOW()
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    await db.query(query, [
      name, email, phone, address, website,
      industry, description, status, id
    ]);
    
    // جلب الشركة المحدثة
    const updatedCompany = await db.query(
      'SELECT * FROM Company WHERE id = ?',
      [id]
    );
    
    res.json(updatedCompany[0]);
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
    
    // التحقق من وجود الشركة
    const existingCompany = await db.query(
      'SELECT id FROM Company WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (existingCompany.length === 0) {
      return res.status(404).json({ error: 'الشركة غير موجودة' });
    }
    
    // التحقق من وجود عملاء مرتبطين بالشركة
    const linkedCustomers = await db.query(
      'SELECT id FROM Customer WHERE companyId = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (linkedCustomers.length > 0) {
      return res.status(400).json({ 
        error: `لا يمكن حذف الشركة لوجود ${linkedCustomers.length} عملاء مرتبطين بها` 
      });
    }
    
    // Soft delete
    await db.query(
      'UPDATE Company SET deletedAt = NOW() WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'تم حذف الشركة بنجاح' });
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
    const company = await db.query(
      'SELECT id FROM Company WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (company.length === 0) {
      return res.status(404).json({ error: 'الشركة غير موجودة' });
    }
    
    const customers = await db.query(
      'SELECT * FROM Customer WHERE companyId = ? AND deletedAt IS NULL ORDER BY createdAt DESC',
      [id]
    );
    
    res.json(customers);
  } catch (error) {
    console.error('Error fetching company customers:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في جلب عملاء الشركة',
      details: error.message 
    });
  }
});

module.exports = router;
