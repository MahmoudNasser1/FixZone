const db = require('../db');

/**
 * Calculate service price based on pricing rules
 */
const calculateServicePrice = async (serviceId, deviceType = null, brandId = null, brand = null) => {
  try {
    // Get base service price
    const [services] = await db.query(
      'SELECT basePrice FROM Service WHERE id = ? AND deletedAt IS NULL',
      [serviceId]
    );
    
    if (!services.length) {
      throw new Error('Service not found');
    }
    
    const basePrice = parseFloat(services[0].basePrice) || 0;
    
    // Get applicable pricing rules (most specific first)
    let whereClause = 'serviceId = ? AND deletedAt IS NULL AND isActive = 1';
    const params = [serviceId];
    
    // Build query for most specific rule
    const rulesSql = `
      SELECT *
      FROM ServicePricingRule
      WHERE ${whereClause}
      ORDER BY 
        CASE 
          WHEN deviceType = ? AND brandId = ? THEN 1
          WHEN deviceType = ? AND brand IS NOT NULL THEN 2
          WHEN deviceType = ? THEN 3
          WHEN brandId = ? THEN 4
          WHEN brand IS NOT NULL THEN 5
          ELSE 6
        END,
        priority DESC,
        id ASC
      LIMIT 1
    `;
    
    const ruleParams = [
      ...params,
      deviceType || '',
      brandId || 0,
      deviceType || '',
      deviceType || '',
      brandId || 0
    ];
    
    const [rules] = await db.query(rulesSql, ruleParams);
    
    // If no specific rule, return base price
    if (!rules.length) {
      return basePrice;
    }
    
    const rule = rules[0];
    let finalPrice = basePrice;
    
    // Apply pricing rule
    if (rule.pricingType === 'multiplier') {
      finalPrice = basePrice * parseFloat(rule.value);
    } else if (rule.pricingType === 'fixed') {
      finalPrice = parseFloat(rule.value);
    } else if (rule.pricingType === 'percentage') {
      finalPrice = basePrice * (1 + parseFloat(rule.value) / 100);
    }
    
    // Apply min/max constraints
    if (rule.minPrice !== null && finalPrice < parseFloat(rule.minPrice)) {
      finalPrice = parseFloat(rule.minPrice);
    }
    if (rule.maxPrice !== null && finalPrice > parseFloat(rule.maxPrice)) {
      finalPrice = parseFloat(rule.maxPrice);
    }
    
    return parseFloat(finalPrice.toFixed(2));
    
  } catch (error) {
    console.error('Error calculating service price:', error);
    // Return base price as fallback
    const [services] = await db.query(
      'SELECT basePrice FROM Service WHERE id = ? AND deletedAt IS NULL',
      [serviceId]
    );
    return services.length ? parseFloat(services[0].basePrice) || 0 : 0;
  }
};

/**
 * Get all pricing rules for a service
 */
const getServicePricingRules = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { isActive } = req.query;
    
    let whereClause = 'serviceId = ? AND deletedAt IS NULL';
    const params = [serviceId];
    
    if (isActive !== undefined) {
      const active = ['1', 'true', 'TRUE', 'yes'].includes(String(isActive));
      whereClause += ' AND isActive = ?';
      params.push(active ? 1 : 0);
    }
    
    const sql = `
      SELECT *
      FROM ServicePricingRule
      WHERE ${whereClause}
      ORDER BY priority DESC, id ASC
    `;
    
    const [rows] = await db.query(sql, params);
    
    res.json({
      success: true,
      rules: rows
    });
    
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Get pricing rule by ID
 */
const getPricingRuleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT *
      FROM ServicePricingRule
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [rows] = await db.query(sql, [id]);
    
    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found',
        message: 'قاعدة التسعير غير موجودة'
      });
    }
    
    res.json({
      success: true,
      rule: rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Create a new pricing rule
 */
const createPricingRule = async (req, res) => {
  try {
    const {
      serviceId,
      deviceType,
      brandId,
      brand,
      pricingType = 'multiplier',
      value,
      minPrice,
      maxPrice,
      isActive = true,
      priority = 0
    } = req.body;
    
    // Validate service exists
    const [service] = await db.query(
      'SELECT id FROM Service WHERE id = ? AND deletedAt IS NULL',
      [serviceId]
    );
    
    if (!service.length) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
        message: 'الخدمة غير موجودة'
      });
    }
    
    const sql = `
      INSERT INTO ServicePricingRule 
      (serviceId, deviceType, brandId, brand, pricingType, value, minPrice, maxPrice, isActive, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(sql, [
      serviceId,
      deviceType || null,
      brandId || null,
      brand || null,
      pricingType,
      value,
      minPrice || null,
      maxPrice || null,
      isActive,
      priority || 0
    ]);
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'تم إنشاء قاعدة التسعير بنجاح',
      rule: {
        id: result.insertId,
        serviceId,
        deviceType,
        brandId,
        brand,
        pricingType,
        value,
        minPrice,
        maxPrice,
        isActive,
        priority: priority || 0
      }
    });
    
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Update a pricing rule
 */
const updatePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      deviceType,
      brandId,
      brand,
      pricingType,
      value,
      minPrice,
      maxPrice,
      isActive,
      priority
    } = req.body;
    
    // Check if rule exists
    const [existingRule] = await db.query(
      'SELECT serviceId FROM ServicePricingRule WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (!existingRule.length) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found',
        message: 'قاعدة التسعير غير موجودة'
      });
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (deviceType !== undefined) {
      updateFields.push('deviceType = ?');
      updateValues.push(deviceType || null);
    }
    
    if (brandId !== undefined) {
      updateFields.push('brandId = ?');
      updateValues.push(brandId || null);
    }
    
    if (brand !== undefined) {
      updateFields.push('brand = ?');
      updateValues.push(brand || null);
    }
    
    if (pricingType !== undefined) {
      updateFields.push('pricingType = ?');
      updateValues.push(pricingType);
    }
    
    if (value !== undefined) {
      updateFields.push('value = ?');
      updateValues.push(value);
    }
    
    if (minPrice !== undefined) {
      updateFields.push('minPrice = ?');
      updateValues.push(minPrice || null);
    }
    
    if (maxPrice !== undefined) {
      updateFields.push('maxPrice = ?');
      updateValues.push(maxPrice || null);
    }
    
    if (isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(isActive);
    }
    
    if (priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(priority);
    }
    
    // Always update updatedAt
    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    const sql = `
      UPDATE ServicePricingRule
      SET ${updateFields.join(', ')}
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [result] = await db.query(sql, updateValues);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found',
        message: 'قاعدة التسعير غير موجودة'
      });
    }
    
    res.json({
      success: true,
      message: 'تم تحديث قاعدة التسعير بنجاح'
    });
    
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Delete a pricing rule (soft delete)
 */
const deletePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      UPDATE ServicePricingRule
      SET deletedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [result] = await db.query(sql, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found',
        message: 'قاعدة التسعير غير موجودة'
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف قاعدة التسعير بنجاح'
    });
    
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Calculate price endpoint
 */
const calculatePrice = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { deviceType, brandId, brand } = req.query;
    
    const price = await calculateServicePrice(serviceId, deviceType, brandId, brand);
    
    res.json({
      success: true,
      price: price
    });
    
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

module.exports = {
  getServicePricingRules,
  getPricingRuleById,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  calculatePrice,
  calculateServicePrice // Export for use in other modules
};



/**
 * Calculate service price based on pricing rules
 */
const calculateServicePrice = async (serviceId, deviceType = null, brandId = null, brand = null) => {
  try {
    // Get base service price
    const [services] = await db.query(
      'SELECT basePrice FROM Service WHERE id = ? AND deletedAt IS NULL',
      [serviceId]
    );
    
    if (!services.length) {
      throw new Error('Service not found');
    }
    
    const basePrice = parseFloat(services[0].basePrice) || 0;
    
    // Get applicable pricing rules (most specific first)
    let whereClause = 'serviceId = ? AND deletedAt IS NULL AND isActive = 1';
    const params = [serviceId];
    
    // Build query for most specific rule
    const rulesSql = `
      SELECT *
      FROM ServicePricingRule
      WHERE ${whereClause}
      ORDER BY 
        CASE 
          WHEN deviceType = ? AND brandId = ? THEN 1
          WHEN deviceType = ? AND brand IS NOT NULL THEN 2
          WHEN deviceType = ? THEN 3
          WHEN brandId = ? THEN 4
          WHEN brand IS NOT NULL THEN 5
          ELSE 6
        END,
        priority DESC,
        id ASC
      LIMIT 1
    `;
    
    const ruleParams = [
      ...params,
      deviceType || '',
      brandId || 0,
      deviceType || '',
      deviceType || '',
      brandId || 0
    ];
    
    const [rules] = await db.query(rulesSql, ruleParams);
    
    // If no specific rule, return base price
    if (!rules.length) {
      return basePrice;
    }
    
    const rule = rules[0];
    let finalPrice = basePrice;
    
    // Apply pricing rule
    if (rule.pricingType === 'multiplier') {
      finalPrice = basePrice * parseFloat(rule.value);
    } else if (rule.pricingType === 'fixed') {
      finalPrice = parseFloat(rule.value);
    } else if (rule.pricingType === 'percentage') {
      finalPrice = basePrice * (1 + parseFloat(rule.value) / 100);
    }
    
    // Apply min/max constraints
    if (rule.minPrice !== null && finalPrice < parseFloat(rule.minPrice)) {
      finalPrice = parseFloat(rule.minPrice);
    }
    if (rule.maxPrice !== null && finalPrice > parseFloat(rule.maxPrice)) {
      finalPrice = parseFloat(rule.maxPrice);
    }
    
    return parseFloat(finalPrice.toFixed(2));
    
  } catch (error) {
    console.error('Error calculating service price:', error);
    // Return base price as fallback
    const [services] = await db.query(
      'SELECT basePrice FROM Service WHERE id = ? AND deletedAt IS NULL',
      [serviceId]
    );
    return services.length ? parseFloat(services[0].basePrice) || 0 : 0;
  }
};

/**
 * Get all pricing rules for a service
 */
const getServicePricingRules = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { isActive } = req.query;
    
    let whereClause = 'serviceId = ? AND deletedAt IS NULL';
    const params = [serviceId];
    
    if (isActive !== undefined) {
      const active = ['1', 'true', 'TRUE', 'yes'].includes(String(isActive));
      whereClause += ' AND isActive = ?';
      params.push(active ? 1 : 0);
    }
    
    const sql = `
      SELECT *
      FROM ServicePricingRule
      WHERE ${whereClause}
      ORDER BY priority DESC, id ASC
    `;
    
    const [rows] = await db.query(sql, params);
    
    res.json({
      success: true,
      rules: rows
    });
    
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Get pricing rule by ID
 */
const getPricingRuleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT *
      FROM ServicePricingRule
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [rows] = await db.query(sql, [id]);
    
    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found',
        message: 'قاعدة التسعير غير موجودة'
      });
    }
    
    res.json({
      success: true,
      rule: rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Create a new pricing rule
 */
const createPricingRule = async (req, res) => {
  try {
    const {
      serviceId,
      deviceType,
      brandId,
      brand,
      pricingType = 'multiplier',
      value,
      minPrice,
      maxPrice,
      isActive = true,
      priority = 0
    } = req.body;
    
    // Validate service exists
    const [service] = await db.query(
      'SELECT id FROM Service WHERE id = ? AND deletedAt IS NULL',
      [serviceId]
    );
    
    if (!service.length) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
        message: 'الخدمة غير موجودة'
      });
    }
    
    const sql = `
      INSERT INTO ServicePricingRule 
      (serviceId, deviceType, brandId, brand, pricingType, value, minPrice, maxPrice, isActive, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(sql, [
      serviceId,
      deviceType || null,
      brandId || null,
      brand || null,
      pricingType,
      value,
      minPrice || null,
      maxPrice || null,
      isActive,
      priority || 0
    ]);
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'تم إنشاء قاعدة التسعير بنجاح',
      rule: {
        id: result.insertId,
        serviceId,
        deviceType,
        brandId,
        brand,
        pricingType,
        value,
        minPrice,
        maxPrice,
        isActive,
        priority: priority || 0
      }
    });
    
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Update a pricing rule
 */
const updatePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      deviceType,
      brandId,
      brand,
      pricingType,
      value,
      minPrice,
      maxPrice,
      isActive,
      priority
    } = req.body;
    
    // Check if rule exists
    const [existingRule] = await db.query(
      'SELECT serviceId FROM ServicePricingRule WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (!existingRule.length) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found',
        message: 'قاعدة التسعير غير موجودة'
      });
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (deviceType !== undefined) {
      updateFields.push('deviceType = ?');
      updateValues.push(deviceType || null);
    }
    
    if (brandId !== undefined) {
      updateFields.push('brandId = ?');
      updateValues.push(brandId || null);
    }
    
    if (brand !== undefined) {
      updateFields.push('brand = ?');
      updateValues.push(brand || null);
    }
    
    if (pricingType !== undefined) {
      updateFields.push('pricingType = ?');
      updateValues.push(pricingType);
    }
    
    if (value !== undefined) {
      updateFields.push('value = ?');
      updateValues.push(value);
    }
    
    if (minPrice !== undefined) {
      updateFields.push('minPrice = ?');
      updateValues.push(minPrice || null);
    }
    
    if (maxPrice !== undefined) {
      updateFields.push('maxPrice = ?');
      updateValues.push(maxPrice || null);
    }
    
    if (isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(isActive);
    }
    
    if (priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(priority);
    }
    
    // Always update updatedAt
    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    const sql = `
      UPDATE ServicePricingRule
      SET ${updateFields.join(', ')}
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [result] = await db.query(sql, updateValues);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found',
        message: 'قاعدة التسعير غير موجودة'
      });
    }
    
    res.json({
      success: true,
      message: 'تم تحديث قاعدة التسعير بنجاح'
    });
    
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Delete a pricing rule (soft delete)
 */
const deletePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      UPDATE ServicePricingRule
      SET deletedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [result] = await db.query(sql, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found',
        message: 'قاعدة التسعير غير موجودة'
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف قاعدة التسعير بنجاح'
    });
    
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Calculate price endpoint
 */
const calculatePrice = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { deviceType, brandId, brand } = req.query;
    
    const price = await calculateServicePrice(serviceId, deviceType, brandId, brand);
    
    res.json({
      success: true,
      price: price
    });
    
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

module.exports = {
  getServicePricingRules,
  getPricingRuleById,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  calculatePrice,
  calculateServicePrice // Export for use in other modules
};



/**
 * Calculate service price based on pricing rules
 */
const calculateServicePrice = async (serviceId, deviceType = null, brandId = null, brand = null) => {
  try {
    // Get base service price
    const [services] = await db.query(
      'SELECT basePrice FROM Service WHERE id = ? AND deletedAt IS NULL',
      [serviceId]
    );
    
    if (!services.length) {
      throw new Error('Service not found');
    }
    
    const basePrice = parseFloat(services[0].basePrice) || 0;
    
    // Get applicable pricing rules (most specific first)
    let whereClause = 'serviceId = ? AND deletedAt IS NULL AND isActive = 1';
    const params = [serviceId];
    
    // Build query for most specific rule
    const rulesSql = `
      SELECT *
      FROM ServicePricingRule
      WHERE ${whereClause}
      ORDER BY 
        CASE 
          WHEN deviceType = ? AND brandId = ? THEN 1
          WHEN deviceType = ? AND brand IS NOT NULL THEN 2
          WHEN deviceType = ? THEN 3
          WHEN brandId = ? THEN 4
          WHEN brand IS NOT NULL THEN 5
          ELSE 6
        END,
        priority DESC,
        id ASC
      LIMIT 1
    `;
    
    const ruleParams = [
      ...params,
      deviceType || '',
      brandId || 0,
      deviceType || '',
      deviceType || '',
      brandId || 0
    ];
    
    const [rules] = await db.query(rulesSql, ruleParams);
    
    // If no specific rule, return base price
    if (!rules.length) {
      return basePrice;
    }
    
    const rule = rules[0];
    let finalPrice = basePrice;
    
    // Apply pricing rule
    if (rule.pricingType === 'multiplier') {
      finalPrice = basePrice * parseFloat(rule.value);
    } else if (rule.pricingType === 'fixed') {
      finalPrice = parseFloat(rule.value);
    } else if (rule.pricingType === 'percentage') {
      finalPrice = basePrice * (1 + parseFloat(rule.value) / 100);
    }
    
    // Apply min/max constraints
    if (rule.minPrice !== null && finalPrice < parseFloat(rule.minPrice)) {
      finalPrice = parseFloat(rule.minPrice);
    }
    if (rule.maxPrice !== null && finalPrice > parseFloat(rule.maxPrice)) {
      finalPrice = parseFloat(rule.maxPrice);
    }
    
    return parseFloat(finalPrice.toFixed(2));
    
  } catch (error) {
    console.error('Error calculating service price:', error);
    // Return base price as fallback
    const [services] = await db.query(
      'SELECT basePrice FROM Service WHERE id = ? AND deletedAt IS NULL',
      [serviceId]
    );
    return services.length ? parseFloat(services[0].basePrice) || 0 : 0;
  }
};

/**
 * Get all pricing rules for a service
 */
const getServicePricingRules = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { isActive } = req.query;
    
    let whereClause = 'serviceId = ? AND deletedAt IS NULL';
    const params = [serviceId];
    
    if (isActive !== undefined) {
      const active = ['1', 'true', 'TRUE', 'yes'].includes(String(isActive));
      whereClause += ' AND isActive = ?';
      params.push(active ? 1 : 0);
    }
    
    const sql = `
      SELECT *
      FROM ServicePricingRule
      WHERE ${whereClause}
      ORDER BY priority DESC, id ASC
    `;
    
    const [rows] = await db.query(sql, params);
    
    res.json({
      success: true,
      rules: rows
    });
    
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Get pricing rule by ID
 */
const getPricingRuleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT *
      FROM ServicePricingRule
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [rows] = await db.query(sql, [id]);
    
    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found',
        message: 'قاعدة التسعير غير موجودة'
      });
    }
    
    res.json({
      success: true,
      rule: rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Create a new pricing rule
 */
const createPricingRule = async (req, res) => {
  try {
    const {
      serviceId,
      deviceType,
      brandId,
      brand,
      pricingType = 'multiplier',
      value,
      minPrice,
      maxPrice,
      isActive = true,
      priority = 0
    } = req.body;
    
    // Validate service exists
    const [service] = await db.query(
      'SELECT id FROM Service WHERE id = ? AND deletedAt IS NULL',
      [serviceId]
    );
    
    if (!service.length) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
        message: 'الخدمة غير موجودة'
      });
    }
    
    const sql = `
      INSERT INTO ServicePricingRule 
      (serviceId, deviceType, brandId, brand, pricingType, value, minPrice, maxPrice, isActive, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(sql, [
      serviceId,
      deviceType || null,
      brandId || null,
      brand || null,
      pricingType,
      value,
      minPrice || null,
      maxPrice || null,
      isActive,
      priority || 0
    ]);
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'تم إنشاء قاعدة التسعير بنجاح',
      rule: {
        id: result.insertId,
        serviceId,
        deviceType,
        brandId,
        brand,
        pricingType,
        value,
        minPrice,
        maxPrice,
        isActive,
        priority: priority || 0
      }
    });
    
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Update a pricing rule
 */
const updatePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      deviceType,
      brandId,
      brand,
      pricingType,
      value,
      minPrice,
      maxPrice,
      isActive,
      priority
    } = req.body;
    
    // Check if rule exists
    const [existingRule] = await db.query(
      'SELECT serviceId FROM ServicePricingRule WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
    
    if (!existingRule.length) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found',
        message: 'قاعدة التسعير غير موجودة'
      });
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (deviceType !== undefined) {
      updateFields.push('deviceType = ?');
      updateValues.push(deviceType || null);
    }
    
    if (brandId !== undefined) {
      updateFields.push('brandId = ?');
      updateValues.push(brandId || null);
    }
    
    if (brand !== undefined) {
      updateFields.push('brand = ?');
      updateValues.push(brand || null);
    }
    
    if (pricingType !== undefined) {
      updateFields.push('pricingType = ?');
      updateValues.push(pricingType);
    }
    
    if (value !== undefined) {
      updateFields.push('value = ?');
      updateValues.push(value);
    }
    
    if (minPrice !== undefined) {
      updateFields.push('minPrice = ?');
      updateValues.push(minPrice || null);
    }
    
    if (maxPrice !== undefined) {
      updateFields.push('maxPrice = ?');
      updateValues.push(maxPrice || null);
    }
    
    if (isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(isActive);
    }
    
    if (priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(priority);
    }
    
    // Always update updatedAt
    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    const sql = `
      UPDATE ServicePricingRule
      SET ${updateFields.join(', ')}
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [result] = await db.query(sql, updateValues);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found',
        message: 'قاعدة التسعير غير موجودة'
      });
    }
    
    res.json({
      success: true,
      message: 'تم تحديث قاعدة التسعير بنجاح'
    });
    
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Delete a pricing rule (soft delete)
 */
const deletePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      UPDATE ServicePricingRule
      SET deletedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND deletedAt IS NULL
    `;
    
    const [result] = await db.query(sql, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found',
        message: 'قاعدة التسعير غير موجودة'
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف قاعدة التسعير بنجاح'
    });
    
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

/**
 * Calculate price endpoint
 */
const calculatePrice = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { deviceType, brandId, brand } = req.query;
    
    const price = await calculateServicePrice(serviceId, deviceType, brandId, brand);
    
    res.json({
      success: true,
      price: price
    });
    
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'خطأ في الخادم',
      details: error.message
    });
  }
};

module.exports = {
  getServicePricingRules,
  getPricingRuleById,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  calculatePrice,
  calculateServicePrice // Export for use in other modules
};


