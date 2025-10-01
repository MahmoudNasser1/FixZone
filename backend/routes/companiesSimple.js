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
        c.id, c.name, c.email, c.phone, c.address, c.contactPerson,
        c.taxNumber, c.notes, c.isActive,
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
        c.id, c.name, c.email, c.phone, c.address, c.contactPerson,
        c.taxNumber, c.notes, c.isActive,
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

module.exports = router;
