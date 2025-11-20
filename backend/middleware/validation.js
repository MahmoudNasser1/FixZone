// backend/middleware/validation.js
// Validation Middleware using Joi

const Joi = require('joi');

/**
 * Validate request data against schema
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Request property to validate (body, params, query)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Show all errors
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'خطأ في البيانات المدخلة',
        errors
      });
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const commonSchemas = {
  // ID validation
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'المعرف يجب أن يكون رقم',
      'number.positive': 'المعرف يجب أن يكون موجب',
      'any.required': 'المعرف مطلوب'
    }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  // Search
  search: Joi.string().max(100).allow('', null),

  // Date
  date: Joi.date().iso(),

  // Price
  price: Joi.number().min(0).precision(2),

  // Quantity
  quantity: Joi.number().integer().min(0)
};

/**
 * Inventory Item Validation Schemas
 */
const inventorySchemas = {
  // Create item
  createItem: Joi.object({
    name: Joi.string().max(100).required()
      .messages({
        'string.empty': 'اسم الصنف مطلوب',
        'string.max': 'اسم الصنف يجب ألا يزيد عن 100 حرف'
      }),
    
    sku: Joi.string().max(50).optional()
      .messages({
        'string.max': 'رمز الصنف يجب ألا يزيد عن 50 حرف'
      }),
    
    barcode: Joi.string().max(100).optional(),
    partNumber: Joi.string().max(100).optional(),
    
    brand: Joi.string().max(100).optional(),
    model: Joi.string().max(100).optional(),
    
    categoryId: Joi.number().integer().positive().optional(),
    
    condition: Joi.string().valid('new', 'used', 'refurbished', 'damaged').default('new'),
    
    purchasePrice: Joi.number().min(0).precision(2).required()
      .messages({
        'number.base': 'سعر الشراء يجب أن يكون رقم',
        'number.min': 'سعر الشراء يجب أن يكون موجب',
        'any.required': 'سعر الشراء مطلوب'
      }),
    
    sellingPrice: Joi.number().min(0).precision(2).required()
      .when('purchasePrice', {
        is: Joi.exist(),
        then: Joi.number().greater(Joi.ref('purchasePrice'))
          .messages({
            'number.greater': 'سعر البيع يجب أن يكون أكبر من سعر الشراء'
          })
      })
      .messages({
        'number.base': 'سعر البيع يجب أن يكون رقم',
        'number.min': 'سعر البيع يجب أن يكون موجب',
        'any.required': 'سعر البيع مطلوب'
      }),
    
    unit: Joi.string().max(20).default('قطعة'),
    
    minStockLevel: Joi.number().integer().min(0).default(0),
    maxStockLevel: Joi.number().integer().min(0).default(1000),
    reorderPoint: Joi.number().integer().min(0).default(10),
    reorderQuantity: Joi.number().integer().min(0).default(50),
    
    leadTimeDays: Joi.number().integer().min(0).default(7),
    warrantyPeriodDays: Joi.number().integer().min(0).default(90),
    
    preferredVendorId: Joi.number().integer().positive().optional(),
    
    description: Joi.string().max(1000).optional(),
    weight: Joi.number().min(0).precision(2).optional(),
    dimensions: Joi.string().max(100).optional(),
    location: Joi.string().max(100).optional(),
    image: Joi.string().max(255).optional(),
    notes: Joi.string().max(1000).optional(),
    
    customFields: Joi.object().optional(),
    
    isActive: Joi.boolean().default(true)
  }),

  // Update item (all fields optional)
  updateItem: Joi.object({
    name: Joi.string().max(100).optional(),
    sku: Joi.string().max(50).optional(),
    barcode: Joi.string().max(100).optional(),
    partNumber: Joi.string().max(100).optional(),
    brand: Joi.string().max(100).optional(),
    model: Joi.string().max(100).optional(),
    categoryId: Joi.number().integer().positive().optional(),
    condition: Joi.string().valid('new', 'used', 'refurbished', 'damaged').optional(),
    purchasePrice: Joi.number().min(0).precision(2).optional(),
    sellingPrice: Joi.number().min(0).precision(2).optional(),
    unit: Joi.string().max(20).optional(),
    minStockLevel: Joi.number().integer().min(0).optional(),
    maxStockLevel: Joi.number().integer().min(0).optional(),
    reorderPoint: Joi.number().integer().min(0).optional(),
    reorderQuantity: Joi.number().integer().min(0).optional(),
    leadTimeDays: Joi.number().integer().min(0).optional(),
    warrantyPeriodDays: Joi.number().integer().min(0).optional(),
    preferredVendorId: Joi.number().integer().positive().allow(null).optional(),
    description: Joi.string().max(1000).allow('', null).optional(),
    weight: Joi.number().min(0).precision(2).allow(null).optional(),
    dimensions: Joi.string().max(100).allow('', null).optional(),
    location: Joi.string().max(100).allow('', null).optional(),
    image: Joi.string().max(255).allow('', null).optional(),
    notes: Joi.string().max(1000).allow('', null).optional(),
    customFields: Joi.object().allow(null).optional(),
    isActive: Joi.boolean().optional()
  }).min(1), // At least one field must be present

  // Get items query
  getItems: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).allow('', null).optional(),
    category: Joi.number().integer().positive().optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    condition: Joi.string().valid('new', 'used', 'refurbished', 'damaged').optional(),
    lowStock: Joi.boolean().optional(),
    warehouseId: Joi.number().integer().positive().optional(),
    sortBy: Joi.string().valid('name', 'sku', 'category', 'purchasePrice', 'sellingPrice', 'createdAt').default('name'),
    sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('asc')
  })
};

/**
 * Stock Movement Validation Schemas
 */
const stockMovementSchemas = {
  // Create movement
  createMovement: Joi.object({
    type: Joi.string().valid('IN', 'OUT', 'TRANSFER').required()
      .messages({
        'any.only': 'نوع الحركة يجب أن يكون IN أو OUT أو TRANSFER',
        'any.required': 'نوع الحركة مطلوب'
      }),
    
    inventoryItemId: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'معرف الصنف غير صحيح',
        'number.base': 'معرف الصنف يجب أن يكون رقم',
        'any.required': 'معرف الصنف مطلوب'
      }),
    
    quantity: Joi.number().integer().min(1).required()
      .messages({
        'number.min': 'الكمية يجب أن تكون على الأقل 1',
        'number.base': 'الكمية يجب أن تكون رقم صحيح',
        'any.required': 'الكمية مطلوبة'
      }),
    
    fromWarehouseId: Joi.number().integer().positive().allow(null).optional()
      .when('type', {
        is: Joi.string().valid('OUT', 'TRANSFER'),
        then: Joi.required()
          .messages({
            'any.required': 'المخزن المصدر مطلوب لحركات OUT و TRANSFER'
          })
      })
      .messages({
        'number.positive': 'معرف المخزن المصدر غير صحيح',
        'number.base': 'معرف المخزن المصدر يجب أن يكون رقم'
      }),
    
    toWarehouseId: Joi.number().integer().positive().allow(null).optional()
      .when('type', {
        is: Joi.string().valid('IN', 'TRANSFER'),
        then: Joi.required()
          .messages({
            'any.required': 'المخزن المستقبل مطلوب لحركات IN و TRANSFER'
          })
      })
      .messages({
        'number.positive': 'معرف المخزن المستقبل غير صحيح',
        'number.base': 'معرف المخزن المستقبل يجب أن يكون رقم'
      }),
    
    notes: Joi.string().max(2000).allow('', null).optional()
      .messages({
        'string.max': 'الملاحظات يجب ألا تزيد عن 2000 حرف'
      })
  }),

  // Update movement
  updateMovement: Joi.object({
    type: Joi.string().valid('IN', 'OUT', 'TRANSFER').optional()
      .messages({
        'any.only': 'نوع الحركة يجب أن يكون IN أو OUT أو TRANSFER'
      }),
    
    inventoryItemId: Joi.number().integer().positive().optional()
      .messages({
        'number.positive': 'معرف الصنف غير صحيح',
        'number.base': 'معرف الصنف يجب أن يكون رقم'
      }),
    
    quantity: Joi.number().integer().min(1).optional()
      .messages({
        'number.min': 'الكمية يجب أن تكون على الأقل 1',
        'number.base': 'الكمية يجب أن تكون رقم صحيح'
      }),
    
    fromWarehouseId: Joi.number().integer().positive().allow(null).optional()
      .messages({
        'number.positive': 'معرف المخزن المصدر غير صحيح',
        'number.base': 'معرف المخزن المصدر يجب أن يكون رقم'
      }),
    
    toWarehouseId: Joi.number().integer().positive().allow(null).optional()
      .messages({
        'number.positive': 'معرف المخزن المستقبل غير صحيح',
        'number.base': 'معرف المخزن المستقبل يجب أن يكون رقم'
      }),
    
    notes: Joi.string().max(2000).allow('', null).optional()
      .messages({
        'string.max': 'الملاحظات يجب ألا تزيد عن 2000 حرف'
      })
  }),

  // Get movements query
  getMovements: Joi.object({
    page: Joi.number().integer().min(1).default(1).optional()
      .messages({
        'number.min': 'رقم الصفحة يجب أن يكون على الأقل 1',
        'number.base': 'رقم الصفحة يجب أن يكون رقم'
      }),
    
    limit: Joi.number().integer().min(1).max(100).default(50).optional()
      .messages({
        'number.min': 'عدد العناصر يجب أن يكون على الأقل 1',
        'number.max': 'عدد العناصر يجب ألا يزيد عن 100',
        'number.base': 'عدد العناصر يجب أن يكون رقم'
      }),
    
    type: Joi.string().valid('IN', 'OUT', 'TRANSFER').optional()
      .messages({
        'any.only': 'نوع الحركة يجب أن يكون IN أو OUT أو TRANSFER'
      }),
    
    inventoryItemId: Joi.number().integer().positive().optional()
      .messages({
        'number.positive': 'معرف الصنف غير صحيح',
        'number.base': 'معرف الصنف يجب أن يكون رقم'
      }),
    
    warehouseId: Joi.number().integer().positive().optional()
      .messages({
        'number.positive': 'معرف المخزن غير صحيح',
        'number.base': 'معرف المخزن يجب أن يكون رقم'
      }),
    
    startDate: Joi.date().iso().optional()
      .messages({
        'date.base': 'تاريخ البداية غير صحيح'
      }),
    
    endDate: Joi.date().iso().optional()
      .messages({
        'date.base': 'تاريخ النهاية غير صحيح'
      }),
    
    sort: Joi.string().valid('createdAt', 'quantity', 'type', 'itemName').default('createdAt').optional()
      .messages({
        'any.only': 'حقل الترتيب غير صحيح'
      }),
    
    sortDir: Joi.string().valid('ASC', 'DESC').default('DESC').optional()
      .messages({
        'any.only': 'اتجاه الترتيب يجب أن يكون ASC أو DESC'
      }),
    
    q: Joi.string().max(255).allow('').optional()
      .messages({
        'string.max': 'نص البحث يجب ألا يزيد عن 255 حرف'
      })
  })
};

/**
 * Vendor Validation Schemas
 */
const vendorSchemas = {
  // Create vendor
  createVendor: Joi.object({
    name: Joi.string().max(100).required()
      .messages({
        'string.empty': 'اسم المورد مطلوب',
        'any.required': 'اسم المورد مطلوب'
      }),
    
    contactPerson: Joi.string().max(100).optional(),
    
    phone: Joi.string().max(20).required()
      .messages({
        'string.empty': 'رقم الهاتف مطلوب',
        'any.required': 'رقم الهاتف مطلوب'
      }),
    
    email: Joi.string().email().max(100).allow('', null).optional(),
    
    address: Joi.string().max(500).optional(),
    taxNumber: Joi.string().max(50).optional(),
    
    paymentTerms: Joi.string().valid('cash', 'net15', 'net30', 'net45', 'net60').default('net30'),
    creditLimit: Joi.number().min(0).precision(2).default(0),
    
    website: Joi.string().uri().max(255).allow('', null).optional(),
    country: Joi.string().max(100).default('Egypt'),
    city: Joi.string().max(100).optional(),
    
    notes: Joi.string().max(1000).allow('', null).optional(),
    status: Joi.string().valid('active', 'inactive', 'blocked').default('active')
  }),

  // Update vendor
  updateVendor: Joi.object({
    name: Joi.string().max(100).optional(),
    contactPerson: Joi.string().max(100).optional(),
    phone: Joi.string().max(20).optional(),
    email: Joi.string().email().max(100).allow('', null).optional(),
    address: Joi.string().max(500).optional(),
    taxNumber: Joi.string().max(50).optional(),
    paymentTerms: Joi.string().valid('cash', 'net15', 'net30', 'net45', 'net60').optional(),
    creditLimit: Joi.number().min(0).precision(2).optional(),
    website: Joi.string().uri().max(255).allow('', null).optional(),
    country: Joi.string().max(100).optional(),
    city: Joi.string().max(100).optional(),
    notes: Joi.string().max(1000).allow('', null).optional(),
    status: Joi.string().valid('active', 'inactive', 'blocked').optional()
  })
};

/**
 * Vendor Payment Validation Schemas
 */
const vendorPaymentSchemas = {
  // Create vendor payment
  createVendorPayment: Joi.object({
    purchaseOrderId: Joi.number().integer().positive().allow(null).optional(),
    amount: Joi.number().positive().precision(2).required()
      .messages({
        'number.positive': 'المبلغ يجب أن يكون أكبر من صفر',
        'any.required': 'المبلغ مطلوب'
      }),
    paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'check', 'credit_card').default('cash'),
    paymentDate: Joi.date().iso().required()
      .messages({
        'date.base': 'تاريخ الدفع غير صحيح',
        'any.required': 'تاريخ الدفع مطلوب'
      }),
    referenceNumber: Joi.string().max(100).allow('', null).optional(),
    bankName: Joi.string().max(100).allow('', null).optional(),
    checkNumber: Joi.string().max(50).allow('', null).optional(),
    notes: Joi.string().max(1000).allow('', null).optional(),
    status: Joi.string().valid('pending', 'completed', 'cancelled').default('pending')
  }),

  // Update vendor payment
  updateVendorPayment: Joi.object({
    amount: Joi.number().positive().precision(2).optional(),
    paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'check', 'credit_card').optional(),
    paymentDate: Joi.date().iso().optional(),
    referenceNumber: Joi.string().max(100).allow('', null).optional(),
    bankName: Joi.string().max(100).allow('', null).optional(),
    checkNumber: Joi.string().max(50).allow('', null).optional(),
    notes: Joi.string().max(1000).allow('', null).optional(),
    status: Joi.string().valid('pending', 'completed', 'cancelled').optional()
  }),

  // Update payment status
  updatePaymentStatus: Joi.object({
    status: Joi.string().valid('pending', 'completed', 'cancelled').required()
      .messages({
        'any.required': 'حالة الدفع مطلوبة',
        'any.only': 'حالة الدفع يجب أن تكون: pending, completed, أو cancelled'
      })
  }),

  // Get vendor payments query
  getVendorPayments: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('pending', 'completed', 'cancelled').allow('', null).optional(),
    paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'check', 'credit_card').allow('', null).optional(),
    dateFrom: Joi.date().iso().allow('', null).optional(),
    dateTo: Joi.date().iso().allow('', null).optional()
  }),

  // Get vendor payment stats query
  getVendorPaymentStats: Joi.object({
    year: Joi.number().integer().min(2000).max(2100).optional(),
    month: Joi.number().integer().min(1).max(12).optional()
  })
};

/**
 * Customer Validation Schemas
 */
const customerSchemas = {
  // Create customer
  createCustomer: Joi.object({
    name: Joi.string().min(2).max(100).trim().required()
      .messages({
        'string.empty': 'اسم العميل مطلوب',
        'string.min': 'اسم العميل يجب أن يكون على الأقل 2 أحرف',
        'string.max': 'اسم العميل يجب ألا يزيد عن 100 حرف',
        'any.required': 'اسم العميل مطلوب'
      }),
    
    phone: Joi.string().min(5).max(30).trim().required()
      .messages({
        'string.empty': 'رقم الهاتف مطلوب',
        'string.min': 'رقم الهاتف يجب أن يكون على الأقل 5 أحرف',
        'string.max': 'رقم الهاتف يجب ألا يزيد عن 30 حرف',
        'any.required': 'رقم الهاتف مطلوب'
      }),
    
    email: Joi.string().email().max(100).allow('', null).optional()
      .messages({
        'string.email': 'البريد الإلكتروني غير صحيح',
        'string.max': 'البريد الإلكتروني يجب ألا يزيد عن 100 حرف'
      }),
    
    address: Joi.string().max(500).allow('', null).optional()
      .messages({
        'string.max': 'العنوان يجب ألا يزيد عن 500 حرف'
      }),
    
    companyId: Joi.number().integer().positive().allow(null).optional(),
    
    customFields: Joi.object().optional()
  }),

  // Update customer
  updateCustomer: Joi.object({
    name: Joi.string().min(2).max(100).trim().optional()
      .messages({
        'string.min': 'اسم العميل يجب أن يكون على الأقل 2 أحرف',
        'string.max': 'اسم العميل يجب ألا يزيد عن 100 حرف'
      }),
    
    phone: Joi.string().min(5).max(30).trim().optional()
      .messages({
        'string.min': 'رقم الهاتف يجب أن يكون على الأقل 5 أحرف',
        'string.max': 'رقم الهاتف يجب ألا يزيد عن 30 حرف'
      }),
    
    email: Joi.string().email().max(100).allow('', null).optional()
      .messages({
        'string.email': 'البريد الإلكتروني غير صحيح',
        'string.max': 'البريد الإلكتروني يجب ألا يزيد عن 100 حرف'
      }),
    
    address: Joi.string().max(500).allow('', null).optional()
      .messages({
        'string.max': 'العنوان يجب ألا يزيد عن 500 حرف'
      }),
    
    companyId: Joi.number().integer().positive().allow(null).optional(),
    
    customFields: Joi.object().optional()
  }).min(1), // At least one field must be present

  // Get customers query
  getCustomers: Joi.object({
    q: Joi.string().max(100).allow('', null).optional(),
    page: Joi.number().integer().min(0).default(0),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    isActive: Joi.boolean().optional(),
    hasDebt: Joi.boolean().optional(),
    sort: Joi.string().valid('id', 'name', 'phone', 'email', 'createdAt', 'updatedAt', 'outstandingBalance', 'isActive').optional(),
    sortDir: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('desc')
  }),

  // Search customers query
  searchCustomers: Joi.object({
    q: Joi.string().min(1).max(100).required()
      .messages({
        'string.empty': 'كلمة البحث مطلوبة',
        'any.required': 'كلمة البحث مطلوبة'
      }),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20)
  })
};

/**
 * Warehouse Validation Schemas
 */
const warehouseSchemas = {
  // Create warehouse
  createWarehouse: Joi.object({
    name: Joi.string().max(100).required()
      .messages({
        'string.empty': 'اسم المخزن مطلوب',
        'any.required': 'اسم المخزن مطلوب'
      }),
    
    location: Joi.string().max(255).optional(),
    branchId: Joi.number().integer().positive().optional(),
    managerId: Joi.number().integer().positive().optional(),
    
    type: Joi.string().valid('main', 'branch', 'temporary', 'virtual').default('branch'),
    capacity: Joi.number().min(0).precision(2).optional(),
    
    address: Joi.string().max(500).optional(),
    phone: Joi.string().max(20).optional(),
    email: Joi.string().email().max(100).allow('', null).optional(),
    
    isActive: Joi.boolean().default(true)
  }),

  // Update warehouse
  updateWarehouse: Joi.object({
    name: Joi.string().max(100).optional(),
    location: Joi.string().max(255).allow('', null).optional(),
    branchId: Joi.number().integer().positive().allow(null).optional(),
    managerId: Joi.number().integer().positive().allow(null).optional(),
    type: Joi.string().valid('main', 'branch', 'temporary', 'virtual').optional(),
    capacity: Joi.number().min(0).precision(2).allow(null).optional(),
    address: Joi.string().max(500).allow('', null).optional(),
    phone: Joi.string().max(20).allow('', null).optional(),
    email: Joi.string().email().max(100).allow('', null).optional(),
    isActive: Joi.boolean().optional()
  }).min(1)
};

/**
 * Service Validation Schemas
 */
const serviceSchemas = {
  // Create service
  createService: Joi.object({
    name: Joi.string().min(3).max(100).trim().required()
      .messages({
        'string.empty': 'اسم الخدمة مطلوب',
        'string.min': 'اسم الخدمة يجب أن يكون على الأقل 3 أحرف',
        'string.max': 'اسم الخدمة يجب ألا يزيد عن 100 حرف',
        'any.required': 'اسم الخدمة مطلوب'
      }),
    
    description: Joi.string().max(1000).allow('', null).optional()
      .messages({
        'string.max': 'الوصف يجب ألا يزيد عن 1000 حرف'
      }),
    
    basePrice: Joi.number().positive().precision(2).required()
      .messages({
        'number.base': 'السعر الأساسي يجب أن يكون رقم',
        'number.positive': 'السعر الأساسي يجب أن يكون أكبر من صفر',
        'any.required': 'السعر الأساسي مطلوب'
      }),
    
    category: Joi.string().max(50).allow('', null).optional()
      .messages({
        'string.max': 'الفئة يجب ألا تزيد عن 50 حرف'
      }),
    
    categoryId: Joi.number().integer().positive().allow(null).optional(),
    
    estimatedDuration: Joi.number().integer().min(0).allow(null).optional()
      .messages({
        'number.base': 'المدة المقدرة يجب أن تكون رقم',
        'number.min': 'المدة المقدرة يجب أن تكون صفر أو أكبر'
      }),
    
    isActive: Joi.boolean().default(true)
  }),

  // Update service
  updateService: Joi.object({
    name: Joi.string().min(3).max(100).trim().optional()
      .messages({
        'string.min': 'اسم الخدمة يجب أن يكون على الأقل 3 أحرف',
        'string.max': 'اسم الخدمة يجب ألا يزيد عن 100 حرف'
      }),
    
    description: Joi.string().max(1000).allow('', null).optional()
      .messages({
        'string.max': 'الوصف يجب ألا يزيد عن 1000 حرف'
      }),
    
    basePrice: Joi.number().positive().precision(2).optional()
      .messages({
        'number.base': 'السعر الأساسي يجب أن يكون رقم',
        'number.positive': 'السعر الأساسي يجب أن يكون أكبر من صفر'
      }),
    
    category: Joi.string().max(50).allow('', null).optional()
      .messages({
        'string.max': 'الفئة يجب ألا تزيد عن 50 حرف'
      }),
    
    categoryId: Joi.number().integer().positive().allow(null).optional(),
    
    estimatedDuration: Joi.number().integer().min(0).allow(null).optional()
      .messages({
        'number.base': 'المدة المقدرة يجب أن تكون رقم',
        'number.min': 'المدة المقدرة يجب أن تكون صفر أو أكبر'
      }),
    
    isActive: Joi.boolean().optional()
  }).min(1), // At least one field must be present

  // Get services query
  getServices: Joi.object({
    q: Joi.string().max(100).allow('', null).optional(),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(200).default(20),
    limit: Joi.number().integer().min(1).max(200).optional(),
    offset: Joi.number().integer().min(0).optional(),
    sortBy: Joi.string().valid('id', 'name', 'basePrice', 'isActive', 'createdAt', 'updatedAt', 'serviceName').optional(),
    sortDir: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('asc'),
    isActive: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false', '1', '0', 'yes', 'no')
    ).optional(),
    category: Joi.string().max(50).allow('', null).optional(),
    categoryId: Joi.number().integer().positive().optional()
  })
};

/**
 * Expense Validation Schemas
 */
const expenseSchemas = {
  // Get expenses query
  getExpenses: Joi.object({
    categoryId: Joi.number().integer().positive().optional(),
    vendorId: Joi.number().integer().positive().optional(),
    invoiceId: Joi.number().integer().positive().optional(),
    repairId: Joi.number().integer().positive().optional(),
    branchId: Joi.number().integer().positive().optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    q: Joi.string().max(200).allow('', null).optional()
  }),

  // Create expense
  createExpense: Joi.object({
    categoryId: Joi.number().integer().positive().required()
      .messages({
        'any.required': 'فئة المصروف مطلوبة',
        'number.positive': 'فئة المصروف غير صحيحة',
        'number.base': 'فئة المصروف يجب أن تكون رقم'
      }),
    
    vendorId: Joi.number().integer().positive().allow(null).optional()
      .messages({
        'number.positive': 'معرف المورد غير صحيح',
        'number.base': 'معرف المورد يجب أن يكون رقم'
      }),
    
    amount: Joi.number().min(0).precision(2).required()
      .messages({
        'number.min': 'المبلغ يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'المبلغ يجب أن يكون رقم',
        'any.required': 'المبلغ مطلوب'
      }),
    
    description: Joi.string().max(1000).allow('', null).optional()
      .messages({
        'string.max': 'الوصف يجب ألا يزيد عن 1000 حرف'
      }),
    
    expenseDate: Joi.date().iso().required()
      .messages({
        'date.base': 'تاريخ المصروف غير صحيح (يجب أن يكون بصيغة ISO: YYYY-MM-DD)',
        'date.format': 'تاريخ المصروف غير صحيح (يجب أن يكون بصيغة: YYYY-MM-DD)',
        'any.required': 'تاريخ المصروف مطلوب'
      }),
    
    invoiceId: Joi.number().integer().positive().allow(null).optional()
      .messages({
        'number.positive': 'معرف الفاتورة غير صحيح',
        'number.base': 'معرف الفاتورة يجب أن يكون رقم'
      }),
    
    receiptUrl: Joi.string().uri().max(500).allow('', null).optional()
      .messages({
        'string.uri': 'رابط الإيصال غير صحيح (يجب أن يبدأ بـ http:// أو https://)',
        'string.max': 'رابط الإيصال يجب ألا يزيد عن 500 حرف'
      }),
    
    notes: Joi.string().max(2000).allow('', null).optional()
      .messages({
        'string.max': 'الملاحظات يجب ألا تزيد عن 2000 حرف'
      }),
    
    repairId: Joi.number().integer().positive().allow(null).optional()
      .messages({
        'number.positive': 'معرف طلب الإصلاح غير صحيح',
        'number.base': 'معرف طلب الإصلاح يجب أن يكون رقم'
      }),
    
    branchId: Joi.number().integer().positive().allow(null).optional()
      .messages({
        'number.positive': 'معرف الفرع غير صحيح',
        'number.base': 'معرف الفرع يجب أن يكون رقم'
      })
  }),

  // Update expense
  updateExpense: Joi.object({
    categoryId: Joi.number().integer().positive().optional()
      .messages({
        'number.positive': 'فئة المصروف غير صحيحة',
        'number.base': 'فئة المصروف يجب أن تكون رقم'
      }),
    vendorId: Joi.number().integer().positive().allow(null).optional()
      .messages({
        'number.positive': 'معرف المورد غير صحيح',
        'number.base': 'معرف المورد يجب أن يكون رقم'
      }),
    amount: Joi.number().min(0).precision(2).optional()
      .messages({
        'number.min': 'المبلغ يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'المبلغ يجب أن يكون رقم'
      }),
    description: Joi.string().max(1000).allow('', null).optional()
      .messages({
        'string.max': 'الوصف يجب ألا يزيد عن 1000 حرف'
      }),
    expenseDate: Joi.date().iso().optional()
      .messages({
        'date.base': 'تاريخ المصروف غير صحيح (يجب أن يكون بصيغة ISO: YYYY-MM-DD)',
        'date.format': 'تاريخ المصروف غير صحيح'
      }),
    invoiceId: Joi.number().integer().positive().allow(null).optional()
      .messages({
        'number.positive': 'معرف الفاتورة غير صحيح',
        'number.base': 'معرف الفاتورة يجب أن يكون رقم'
      }),
    receiptUrl: Joi.string().uri().max(500).allow('', null).optional()
      .messages({
        'string.uri': 'رابط الإيصال غير صحيح',
        'string.max': 'رابط الإيصال يجب ألا يزيد عن 500 حرف'
      }),
    notes: Joi.string().max(2000).allow('', null).optional()
      .messages({
        'string.max': 'الملاحظات يجب ألا تزيد عن 2000 حرف'
      }),
    repairId: Joi.number().integer().positive().allow(null).optional()
      .messages({
        'number.positive': 'معرف طلب الإصلاح غير صحيح',
        'number.base': 'معرف طلب الإصلاح يجب أن يكون رقم'
      }),
    branchId: Joi.number().integer().positive().allow(null).optional()
      .messages({
        'number.positive': 'معرف الفرع غير صحيح',
        'number.base': 'معرف الفرع يجب أن يكون رقم'
      })
  }),

  // Get expense stats query
  getExpenseStats: Joi.object({
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().optional(),
    categoryId: Joi.number().integer().positive().optional()
  })
};

/**
 * Expense Category Validation Schemas
 */
const expenseCategorySchemas = {
  // Create expense category
  createExpenseCategory: Joi.object({
    name: Joi.string().min(2).max(100).trim().required()
      .messages({
        'string.empty': 'اسم الفئة مطلوب',
        'string.min': 'اسم الفئة يجب أن يكون على الأقل حرفين',
        'any.required': 'اسم الفئة مطلوب'
      })
  }),

  // Update expense category
  updateExpenseCategory: Joi.object({
    name: Joi.string().min(2).max(100).trim().required()
      .messages({
        'string.empty': 'اسم الفئة مطلوب',
        'string.min': 'اسم الفئة يجب أن يكون على الأقل حرفين',
        'any.required': 'اسم الفئة مطلوب'
      })
  })
};

/**
 * Quotation Validation Schemas
 */
const quotationSchemas = {
  // Get quotations query
  getQuotations: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('PENDING', 'SENT', 'APPROVED', 'REJECTED').optional(),
    repairRequestId: Joi.number().integer().positive().optional(),
    q: Joi.string().max(200).allow('', null).optional(),
    sort: Joi.string().valid('id', 'status', 'totalAmount', 'taxAmount', 'createdAt', 'updatedAt', 'sentAt', 'responseAt').default('createdAt'),
    sortDir: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('DESC'),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().optional()
  }),

  // Create quotation
  createQuotation: Joi.object({
    status: Joi.string().valid('PENDING', 'SENT', 'APPROVED', 'REJECTED').default('PENDING')
      .messages({
        'any.only': 'الحالة يجب أن تكون واحدة من: PENDING, SENT, APPROVED, REJECTED',
        'any.required': 'الحالة مطلوبة'
      }),
    totalAmount: Joi.number().min(0).precision(2).required()
      .messages({
        'number.min': 'المبلغ الإجمالي يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'المبلغ الإجمالي يجب أن يكون رقم',
        'any.required': 'المبلغ الإجمالي مطلوب'
      }),
    taxAmount: Joi.number().min(0).precision(2).default(0).optional()
      .messages({
        'number.min': 'مبلغ الضريبة يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'مبلغ الضريبة يجب أن يكون رقم'
      }),
    notes: Joi.string().max(2000).allow('', null).optional()
      .messages({
        'string.max': 'الملاحظات يجب ألا تزيد عن 2000 حرف'
      }),
    sentAt: Joi.date().iso().allow(null).optional()
      .messages({
        'date.base': 'تاريخ الإرسال غير صحيح (يجب أن يكون بصيغة ISO: YYYY-MM-DDTHH:mm:ss)',
        'date.format': 'تاريخ الإرسال غير صحيح'
      }),
    responseAt: Joi.date().iso().allow(null).optional()
      .messages({
        'date.base': 'تاريخ الرد غير صحيح (يجب أن يكون بصيغة ISO: YYYY-MM-DDTHH:mm:ss)',
        'date.format': 'تاريخ الرد غير صحيح'
      }),
    repairRequestId: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'معرف طلب الإصلاح غير صحيح',
        'number.base': 'معرف طلب الإصلاح يجب أن يكون رقم',
        'any.required': 'معرف طلب الإصلاح مطلوب'
      }),
    currency: Joi.string().max(10).default('EGP').optional()
      .messages({
        'string.max': 'العملة يجب ألا تزيد عن 10 أحرف'
      })
  }),

  // Update quotation
  updateQuotation: Joi.object({
    status: Joi.string().valid('PENDING', 'SENT', 'APPROVED', 'REJECTED').optional()
      .messages({
        'any.only': 'الحالة يجب أن تكون واحدة من: PENDING, SENT, APPROVED, REJECTED'
      }),
    totalAmount: Joi.number().min(0).precision(2).optional()
      .messages({
        'number.min': 'المبلغ الإجمالي يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'المبلغ الإجمالي يجب أن يكون رقم'
      }),
    taxAmount: Joi.number().min(0).precision(2).optional()
      .messages({
        'number.min': 'مبلغ الضريبة يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'مبلغ الضريبة يجب أن يكون رقم'
      }),
    notes: Joi.string().max(2000).allow('', null).optional()
      .messages({
        'string.max': 'الملاحظات يجب ألا تزيد عن 2000 حرف'
      }),
    sentAt: Joi.date().iso().allow(null).optional()
      .messages({
        'date.base': 'تاريخ الإرسال غير صحيح',
        'date.format': 'تاريخ الإرسال غير صحيح'
      }),
    responseAt: Joi.date().iso().allow(null).optional()
      .messages({
        'date.base': 'تاريخ الرد غير صحيح',
        'date.format': 'تاريخ الرد غير صحيح'
      }),
    repairRequestId: Joi.number().integer().positive().optional()
      .messages({
        'number.positive': 'معرف طلب الإصلاح غير صحيح',
        'number.base': 'معرف طلب الإصلاح يجب أن يكون رقم'
      }),
    currency: Joi.string().max(10).optional()
      .messages({
        'string.max': 'العملة يجب ألا تزيد عن 10 أحرف'
      })
  })
};

/**
 * Quotation Item Validation Schemas
 */
const quotationItemSchemas = {
  // Get quotation items query
  getQuotationItems: Joi.object({
    quotationId: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'معرف العرض السعري غير صحيح',
        'number.base': 'معرف العرض السعري يجب أن يكون رقم',
        'any.required': 'معرف العرض السعري مطلوب'
      })
  }),

  // Create quotation item
  createQuotationItem: Joi.object({
    description: Joi.string().max(255).required()
      .messages({
        'string.empty': 'الوصف مطلوب',
        'string.max': 'الوصف يجب ألا يزيد عن 255 حرف',
        'any.required': 'الوصف مطلوب'
      }),
    quantity: Joi.number().integer().min(1).required()
      .messages({
        'number.min': 'الكمية يجب أن تكون على الأقل 1',
        'number.base': 'الكمية يجب أن تكون رقم صحيح',
        'any.required': 'الكمية مطلوبة'
      }),
    unitPrice: Joi.number().min(0).precision(2).required()
      .messages({
        'number.min': 'سعر الوحدة يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'سعر الوحدة يجب أن يكون رقم',
        'any.required': 'سعر الوحدة مطلوب'
      }),
    totalPrice: Joi.number().min(0).precision(2).optional()
      .messages({
        'number.min': 'السعر الإجمالي يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'السعر الإجمالي يجب أن يكون رقم'
      }),
    quotationId: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'معرف العرض السعري غير صحيح',
        'number.base': 'معرف العرض السعري يجب أن يكون رقم',
        'any.required': 'معرف العرض السعري مطلوب'
      })
  }),

  // Update quotation item
  updateQuotationItem: Joi.object({
    description: Joi.string().max(255).optional()
      .messages({
        'string.max': 'الوصف يجب ألا يزيد عن 255 حرف'
      }),
    quantity: Joi.number().integer().min(1).optional()
      .messages({
        'number.min': 'الكمية يجب أن تكون على الأقل 1',
        'number.base': 'الكمية يجب أن تكون رقم صحيح'
      }),
    unitPrice: Joi.number().min(0).precision(2).optional()
      .messages({
        'number.min': 'سعر الوحدة يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'سعر الوحدة يجب أن يكون رقم'
      }),
    totalPrice: Joi.number().min(0).precision(2).optional()
      .messages({
        'number.min': 'السعر الإجمالي يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'السعر الإجمالي يجب أن يكون رقم'
      }),
    quotationId: Joi.number().integer().positive().optional()
      .messages({
        'number.positive': 'معرف العرض السعري غير صحيح',
        'number.base': 'معرف العرض السعري يجب أن يكون رقم'
      })
  })
};

/**
 * Payment Validation Schemas (Invoice Payments)
 */
const paymentSchemas = {
  // Create payment
  createPayment: Joi.object({
    amount: Joi.number().positive().precision(2).required()
      .messages({
        'number.positive': 'المبلغ يجب أن يكون أكبر من صفر',
        'number.base': 'المبلغ يجب أن يكون رقم',
        'any.required': 'المبلغ مطلوب'
      }),
    paymentMethod: Joi.string().valid('cash', 'card', 'bank_transfer', 'check', 'other').required()
      .messages({
        'any.only': 'طريقة الدفع يجب أن تكون واحدة من: cash, card, bank_transfer, check, other',
        'any.required': 'طريقة الدفع مطلوبة'
      }),
    invoiceId: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'معرف الفاتورة غير صحيح',
        'number.base': 'معرف الفاتورة يجب أن يكون رقم',
        'any.required': 'معرف الفاتورة مطلوب'
      }),
    createdBy: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'معرف المستخدم غير صحيح',
        'number.base': 'معرف المستخدم يجب أن يكون رقم',
        'any.required': 'معرف المستخدم مطلوب'
      }),
    currency: Joi.string().max(10).default('EGP').optional()
      .messages({
        'string.max': 'العملة يجب ألا تزيد عن 10 أحرف'
      }),
    paymentDate: Joi.date().iso().optional()
      .messages({
        'date.base': 'تاريخ الدفع غير صحيح',
        'date.format': 'تاريخ الدفع غير صحيح'
      }),
    referenceNumber: Joi.string().max(100).allow('', null).optional()
      .messages({
        'string.max': 'رقم المرجع يجب ألا يزيد عن 100 حرف'
      }),
    notes: Joi.string().max(2000).allow('', null).optional()
      .messages({
        'string.max': 'الملاحظات يجب ألا تزيد عن 2000 حرف'
      })
  }),

  // Update payment
  updatePayment: Joi.object({
    amount: Joi.number().positive().precision(2).optional()
      .messages({
        'number.positive': 'المبلغ يجب أن يكون أكبر من صفر',
        'number.base': 'المبلغ يجب أن يكون رقم'
      }),
    paymentMethod: Joi.string().valid('cash', 'card', 'bank_transfer', 'check', 'other').optional()
      .messages({
        'any.only': 'طريقة الدفع يجب أن تكون واحدة من: cash, card, bank_transfer, check, other'
      }),
    paymentDate: Joi.date().iso().optional()
      .messages({
        'date.base': 'تاريخ الدفع غير صحيح',
        'date.format': 'تاريخ الدفع غير صحيح'
      }),
    referenceNumber: Joi.string().max(100).allow('', null).optional()
      .messages({
        'string.max': 'رقم المرجع يجب ألا يزيد عن 100 حرف'
      }),
    notes: Joi.string().max(2000).allow('', null).optional()
      .messages({
        'string.max': 'الملاحظات يجب ألا تزيد عن 2000 حرف'
      })
  }),

  // Get payments query
  getPayments: Joi.object({
    page: Joi.number().integer().min(1).default(1).optional()
      .messages({
        'number.min': 'رقم الصفحة يجب أن يكون على الأقل 1',
        'number.base': 'رقم الصفحة يجب أن يكون رقم'
      }),
    limit: Joi.number().integer().min(1).max(100).default(10).optional()
      .messages({
        'number.min': 'عدد العناصر يجب أن يكون على الأقل 1',
        'number.max': 'عدد العناصر يجب ألا يزيد عن 100',
        'number.base': 'عدد العناصر يجب أن يكون رقم'
      }),
    dateFrom: Joi.date().iso().optional()
      .messages({
        'date.base': 'تاريخ البداية غير صحيح'
      }),
    dateTo: Joi.date().iso().optional()
      .messages({
        'date.base': 'تاريخ النهاية غير صحيح'
      }),
    paymentMethod: Joi.string().valid('cash', 'card', 'bank_transfer', 'check', 'other').allow('', null).optional()
      .messages({
        'any.only': 'طريقة الدفع يجب أن تكون واحدة من: cash, card, bank_transfer, check, other'
      }),
    customerId: Joi.number().integer().positive().optional()
      .messages({
        'number.positive': 'معرف العميل غير صحيح',
        'number.base': 'معرف العميل يجب أن يكون رقم'
      }),
    invoiceId: Joi.number().integer().positive().optional()
      .messages({
        'number.positive': 'معرف الفاتورة غير صحيح',
        'number.base': 'معرف الفاتورة يجب أن يكون رقم'
      })
  }),

  // Get payment stats query
  getPaymentStats: Joi.object({
    dateFrom: Joi.date().iso().optional()
      .messages({
        'date.base': 'تاريخ البداية غير صحيح'
      }),
    dateTo: Joi.date().iso().optional()
      .messages({
        'date.base': 'تاريخ النهاية غير صحيح'
      })
  }),

  // Get payment by invoice ID
  getPaymentsByInvoice: commonSchemas.id,

  // Get payment by ID params
  getPaymentById: Joi.object({
    id: commonSchemas.id
  }),

  // Delete payment params
  deletePayment: Joi.object({
    id: commonSchemas.id
  })
};

/**
 * Purchase Order Validation Schemas
 */
const purchaseOrderSchemas = {
  // Get purchase orders query
  getPurchaseOrders: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(100).allow('', null).optional(),
    status: Joi.string().valid('draft', 'pending', 'sent', 'confirmed', 'received', 'cancelled', 'approved').allow('', null).optional(),
    vendorId: Joi.number().integer().positive().allow('', null).optional(),
    approvalStatus: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').allow('', null).optional(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'approvalDate', 'totalAmount', 'vendorName').default('createdAt'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
  }),

  // Get purchase order by ID params
  getPurchaseOrderById: Joi.object({
    id: commonSchemas.id
  }),

  // Create purchase order
  createPurchaseOrder: Joi.object({
    status: Joi.string().valid('draft', 'pending', 'sent', 'confirmed', 'received', 'cancelled', 'approved').default('draft'),
    vendorId: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'معرف المورد يجب أن يكون موجب',
        'any.required': 'معرف المورد مطلوب'
      }),
    orderNumber: Joi.string().max(50).allow('', null).optional(),
    orderDate: Joi.date().iso().required()
      .messages({
        'date.base': 'تاريخ الطلب غير صحيح',
        'any.required': 'تاريخ الطلب مطلوب'
      }),
    expectedDeliveryDate: Joi.date().iso().allow(null).optional(),
    notes: Joi.string().max(2000).allow('', null).optional(),
    approvalStatus: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').default('PENDING'),
    items: Joi.array().min(1).required()
      .items(
        Joi.object({
          inventoryItemId: Joi.number().integer().positive().required()
            .messages({
              'number.positive': 'معرف الصنف يجب أن يكون موجب',
              'any.required': 'معرف الصنف مطلوب'
            }),
          quantity: Joi.number().integer().min(1).required()
            .messages({
              'number.min': 'الكمية يجب أن تكون أكبر من صفر',
              'any.required': 'الكمية مطلوبة'
            }),
          unitPrice: Joi.number().min(0).precision(2).required()
            .messages({
              'number.min': 'سعر الوحدة يجب أن يكون أكبر من أو يساوي صفر',
              'any.required': 'سعر الوحدة مطلوب'
            }),
          notes: Joi.string().max(500).allow('', null).optional()
        })
      )
      .messages({
        'array.min': 'يجب إضافة عنصر واحد على الأقل',
        'any.required': 'العناصر مطلوبة'
      })
  }),

  // Update purchase order
  updatePurchaseOrder: Joi.object({
    status: Joi.string().valid('draft', 'pending', 'sent', 'confirmed', 'received', 'cancelled', 'approved').optional(),
    vendorId: Joi.number().integer().positive().optional(),
    orderNumber: Joi.string().max(50).allow('', null).optional(),
    orderDate: Joi.date().iso().optional(),
    expectedDeliveryDate: Joi.date().iso().allow(null).optional(),
    notes: Joi.string().max(2000).allow('', null).optional(),
    approvalStatus: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional(),
    approvedById: Joi.number().integer().positive().allow(null).optional(),
    approvalDate: Joi.date().iso().allow(null).optional(),
    items: Joi.array().min(1).optional()
      .items(
        Joi.object({
          inventoryItemId: Joi.number().integer().positive().required(),
          quantity: Joi.number().integer().min(1).required(),
          unitPrice: Joi.number().min(0).precision(2).required(),
          notes: Joi.string().max(500).allow('', null).optional()
        })
      )
  }),

  // Approve purchase order
  approvePurchaseOrder: Joi.object({
    approvedById: Joi.number().integer().positive().optional(),
    approvalDate: Joi.date().iso().optional()
  }),

  // Reject purchase order
  rejectPurchaseOrder: Joi.object({
    approvedById: Joi.number().integer().positive().optional(),
    approvalDate: Joi.date().iso().optional()
  }),

  // Delete purchase order params
  deletePurchaseOrder: Joi.object({
    id: commonSchemas.id
  })
};

/**
 * Invoice Validation Schemas
 */
const invoiceSchemas = {
  // Get invoices query
  getInvoices: Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20).optional(),
    repairRequestId: Joi.number().integer().positive().optional(),
    customerId: Joi.number().integer().positive().optional(),
    vendorId: Joi.number().integer().positive().optional(),
    invoiceType: Joi.string().valid('sale', 'purchase').optional(),
    status: Joi.string().valid('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled').optional(),
    search: Joi.string().max(100).allow('', null).optional()
  }),

  // Get invoice by ID params
  getInvoiceById: commonSchemas.id,

  // Create invoice
  createInvoice: Joi.object({
    repairRequestId: Joi.number().integer().positive().allow(null).optional(),
    customerId: Joi.number().integer().positive().allow(null).optional(),
    vendorId: Joi.number().integer().positive().allow(null).optional(),
    invoiceType: Joi.string().valid('sale', 'purchase').default('sale').required()
      .messages({
        'any.only': 'نوع الفاتورة يجب أن يكون sale أو purchase',
        'any.required': 'نوع الفاتورة مطلوب'
      }),
    totalAmount: Joi.number().min(0).precision(2).required()
      .messages({
        'number.min': 'المبلغ الإجمالي يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'المبلغ الإجمالي يجب أن يكون رقم',
        'any.required': 'المبلغ الإجمالي مطلوب'
      }),
    amountPaid: Joi.number().min(0).precision(2).default(0).optional()
      .messages({
        'number.min': 'المبلغ المدفوع يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'المبلغ المدفوع يجب أن يكون رقم'
      }),
    status: Joi.string().valid('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled').default('draft').optional(),
    currency: Joi.string().max(10).default('EGP').optional(),
    taxAmount: Joi.number().min(0).precision(2).default(0).optional()
      .messages({
        'number.min': 'مبلغ الضريبة يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'مبلغ الضريبة يجب أن يكون رقم'
      }),
    notes: Joi.string().max(2000).allow('', null).optional(),
    dueDate: Joi.date().iso().allow(null).optional()
  }).custom((value, helpers) => {
    // Validate: لفواتير البيع، يجب تحديد إما repairRequestId أو customerId
    if (value.invoiceType === 'sale') {
      if (!value.repairRequestId && !value.customerId) {
        return helpers.error('custom.saleRequiresCustomer');
      }
    }
    // Validate: لفواتير الشراء، يجب تحديد vendorId
    if (value.invoiceType === 'purchase') {
      if (!value.vendorId) {
        return helpers.error('custom.purchaseRequiresVendor');
      }
    }
    return value;
  }).messages({
    'custom.saleRequiresCustomer': 'لفواتير البيع: يجب تحديد إما طلب إصلاح (repairRequestId) أو عميل (customerId)',
    'custom.purchaseRequiresVendor': 'لفواتير الشراء: يجب تحديد مورد (vendorId)'
  }),

  // Update invoice
  updateInvoice: Joi.object({
    repairRequestId: Joi.number().integer().positive().allow(null).optional(),
    customerId: Joi.number().integer().positive().allow(null).optional(),
    vendorId: Joi.number().integer().positive().allow(null).optional(),
    invoiceType: Joi.string().valid('sale', 'purchase').optional(),
    totalAmount: Joi.number().min(0).precision(2).optional()
      .messages({
        'number.min': 'المبلغ الإجمالي يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'المبلغ الإجمالي يجب أن يكون رقم'
      }),
    amountPaid: Joi.number().min(0).precision(2).optional()
      .messages({
        'number.min': 'المبلغ المدفوع يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'المبلغ المدفوع يجب أن يكون رقم'
      }),
    status: Joi.string().valid('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled').optional(),
    currency: Joi.string().max(10).optional(),
    taxAmount: Joi.number().min(0).precision(2).optional()
      .messages({
        'number.min': 'مبلغ الضريبة يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'مبلغ الضريبة يجب أن يكون رقم'
      }),
    notes: Joi.string().max(2000).allow('', null).optional(),
    dueDate: Joi.date().iso().allow(null).optional()
  }),

  // Delete invoice params
  deleteInvoice: commonSchemas.id,

  // Get invoice by repair ID params
  getInvoiceByRepairId: Joi.object({
    repairId: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'معرف طلب الإصلاح غير صحيح',
        'any.required': 'معرف طلب الإصلاح مطلوب'
      })
  }),

  // Create invoice from repair params
  createInvoiceFromRepair: Joi.object({
    repairId: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'معرف طلب الإصلاح غير صحيح',
        'any.required': 'معرف طلب الإصلاح مطلوب'
      })
  }),

  // Invoice Item schemas
  addInvoiceItem: Joi.object({
    // invoiceId comes from params, not body
    itemType: Joi.string().valid('service', 'part', 'other').required()
      .messages({
        'any.only': 'نوع العنصر يجب أن يكون service أو part أو other',
        'any.required': 'نوع العنصر مطلوب'
      }),
    serviceId: Joi.number().integer().positive().allow(null).optional(),
    inventoryItemId: Joi.number().integer().positive().allow(null).optional(),
    description: Joi.string().max(500).required()
      .messages({
        'string.max': 'الوصف يجب ألا يزيد عن 500 حرف',
        'any.required': 'الوصف مطلوب'
      }),
    quantity: Joi.number().integer().min(1).required()
      .messages({
        'number.min': 'الكمية يجب أن تكون على الأقل 1',
        'number.base': 'الكمية يجب أن تكون رقم صحيح',
        'any.required': 'الكمية مطلوبة'
      }),
    unitPrice: Joi.number().min(0).precision(2).required()
      .messages({
        'number.min': 'سعر الوحدة يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'سعر الوحدة يجب أن يكون رقم',
        'any.required': 'سعر الوحدة مطلوب'
      }),
    totalPrice: Joi.number().min(0).precision(2).optional()
      .messages({
        'number.min': 'السعر الإجمالي يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'السعر الإجمالي يجب أن يكون رقم'
      }),
    notes: Joi.string().max(500).allow('', null).optional()
  }).custom((value, helpers) => {
    // Validate: إذا كان itemType = 'service'، يجب تحديد serviceId
    if (value.itemType === 'service' && !value.serviceId) {
      return helpers.error('custom.serviceRequiresServiceId');
    }
    // Validate: إذا كان itemType = 'part'، يجب تحديد inventoryItemId
    if (value.itemType === 'part' && !value.inventoryItemId) {
      return helpers.error('custom.partRequiresItemId');
    }
    return value;
  }).messages({
    'custom.serviceRequiresServiceId': 'لعناصر الخدمة: يجب تحديد معرف الخدمة (serviceId)',
    'custom.partRequiresItemId': 'لعناصر القطع: يجب تحديد معرف الصنف (inventoryItemId)'
  }),

  // Update invoice item
  updateInvoiceItem: Joi.object({
    description: Joi.string().max(500).optional()
      .messages({
        'string.max': 'الوصف يجب ألا يزيد عن 500 حرف'
      }),
    quantity: Joi.number().integer().min(1).optional()
      .messages({
        'number.min': 'الكمية يجب أن تكون على الأقل 1',
        'number.base': 'الكمية يجب أن تكون رقم صحيح'
      }),
    unitPrice: Joi.number().min(0).precision(2).optional()
      .messages({
        'number.min': 'سعر الوحدة يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'سعر الوحدة يجب أن يكون رقم'
      }),
    totalPrice: Joi.number().min(0).precision(2).optional()
      .messages({
        'number.min': 'السعر الإجمالي يجب أن يكون أكبر من أو يساوي صفر',
        'number.base': 'السعر الإجمالي يجب أن يكون رقم'
      }),
    notes: Joi.string().max(500).allow('', null).optional()
  }),

  // Delete invoice item params
  deleteInvoiceItem: Joi.object({
    id: commonSchemas.id,
    itemId: commonSchemas.id
  })
};

module.exports = {
  validate,
  commonSchemas,
  inventorySchemas,
  stockMovementSchemas,
  vendorSchemas,
  vendorPaymentSchemas,
  warehouseSchemas,
  serviceSchemas,
  customerSchemas,
  expenseSchemas,
  expenseCategorySchemas,
  quotationSchemas,
  quotationItemSchemas,
  paymentSchemas,
  purchaseOrderSchemas,
  invoiceSchemas
};

