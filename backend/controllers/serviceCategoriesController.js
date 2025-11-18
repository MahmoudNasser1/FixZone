const db = require('../db');

/**
 * Get all service categories
 */
const getServiceCategories = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    let whereClause = 'deletedAt IS NULL';
    const params = [];
    
    if (isActive !== undefined) {
      const active = ['1', 'true', 'TRUE', 'yes'].includes(String(isActive));
      whereClause += ' AND isActive = ?';
      params.push(active ? 1 : 0);
    }
    
    const sql = `
      SELECT *
      FROM ServiceCategory
      WHERE ${whereClause}
      ORDER BY sortOrder ASC, name ASC
    `;
    
    const [rows] = await db.query(sql, params);
    
    res.json({
      success: true,
      categories: rows
    });
    
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Get service category by ID
 */
const getServiceCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT *
      FROM ServiceCategory
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [rows] = await db.query(sql, [id]);
    
    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'الفئة غير موجودة'
      });
    }
    
    res.json({
      success: true,
      category: rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching service category:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Create a new service category
 */
const createServiceCategory = async (req, res) => {
  try {
    const { name, description, icon, color, sortOrder, isActive = true } = req.body;
    
    // Check for duplicate category name
    const [existing] = await db.query(
      'SELECT id FROM ServiceCategory WHERE name = ? AND deletedAt IS NULL',
      [name]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Category name already exists',
        message: 'اسم الفئة موجود مسبقاً'
      });
    }
    
    const sql = `
      INSERT INTO ServiceCategory (name, description, icon, color, sortOrder, isActive)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(sql, [name, description, icon, color, sortOrder || 0, isActive]);
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'تم إنشاء الفئة بنجاح',
      category: {
        id: result.insertId,
        name,
        description,
        icon,
        color,
        sortOrder: sortOrder || 0,
        isActive
      }
    });
    
  } catch (error) {
    console.error('Error creating service category:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Category name already exists',
        message: 'اسم الفئة موجود مسبقاً'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Update a service category
 */
const updateServiceCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, sortOrder, isActive } = req.body;
    
    // Check if category exists
    const [existingCategory] = await db.query(
      'SELECT name FROM ServiceCategory WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (!existingCategory.length) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'الفئة غير موجودة'
      });
    }
    
    // If name is being updated, check for duplicate
    if (name && name !== existingCategory[0].name) {
      const [duplicate] = await db.query(
        'SELECT id FROM ServiceCategory WHERE name = ? AND id != ? AND deletedAt IS NULL',
        [name, id]
      );
      
      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Category name already exists',
          message: 'اسم الفئة موجود مسبقاً'
        });
      }
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description || null);
    }
    
    if (icon !== undefined) {
      updateFields.push('icon = ?');
      updateValues.push(icon || null);
    }
    
    if (color !== undefined) {
      updateFields.push('color = ?');
      updateValues.push(color || null);
    }
    
    if (sortOrder !== undefined) {
      updateFields.push('sortOrder = ?');
      updateValues.push(sortOrder || 0);
    }
    
    if (isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(isActive);
    }
    
    // Always update updatedAt
    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    const sql = `
      UPDATE ServiceCategory
      SET ${updateFields.join(', ')}
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [result] = await db.query(sql, updateValues);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'الفئة غير موجودة'
      });
    }
    
    res.json({
      success: true,
      message: 'تم تحديث الفئة بنجاح'
    });
    
  } catch (error) {
    console.error('Error updating service category:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Category name already exists',
        message: 'اسم الفئة موجود مسبقاً'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Delete a service category (soft delete)
 */
const deleteServiceCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category is being used by any services
    const [services] = await db.query(
      'SELECT COUNT(*) as count FROM Service WHERE category = (SELECT name FROM ServiceCategory WHERE id = ?) AND deletedAt IS NULL',
      [id]
    );
    
    if (services[0].count > 0) {
      return res.status(409).json({
        success: false,
        error: 'Category is in use',
        message: `لا يمكن حذف الفئة لأنها مستخدمة في ${services[0].count} خدمة`
      });
    }
    
    const sql = `
      UPDATE ServiceCategory
      SET deletedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [result] = await db.query(sql, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'الفئة غير موجودة'
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف الفئة بنجاح'
    });
    
  } catch (error) {
    console.error('Error deleting service category:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Get category statistics
 */
const getCategoryStats = async (req, res) => {
  try {
    const sql = `
      SELECT 
        sc.id,
        sc.name,
        COUNT(s.id) as serviceCount,
        COALESCE(SUM(s.basePrice), 0) as totalPrice,
        COALESCE(AVG(s.basePrice), 0) as avgPrice
      FROM ServiceCategory sc
      LEFT JOIN Service s ON s.category = sc.name AND s.deletedAt IS NULL
      WHERE sc.deletedAt IS NULL AND sc.isActive = 1
      GROUP BY sc.id, sc.name
      ORDER BY sc.sortOrder ASC, sc.name ASC
    `;
    
    const [rows] = await db.query(sql);
    
    res.json({
      success: true,
      stats: rows
    });
    
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

module.exports = {
  getServiceCategories,
  getServiceCategoryById,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  getCategoryStats
};


