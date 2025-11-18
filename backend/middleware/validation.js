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
    movementType: Joi.string().valid(
      'in', 'out', 'transfer_out', 'transfer_in', 
      'adjustment', 'reserve', 'unreserve', 'write_off',
      'return_from_customer', 'return_to_vendor'
    ).required()
      .messages({
        'any.only': 'نوع الحركة غير صحيح',
        'any.required': 'نوع الحركة مطلوب'
      }),
    
    inventoryItemId: Joi.number().integer().positive().required()
      .messages({
        'any.required': 'معرف الصنف مطلوب'
      }),
    
    warehouseId: Joi.number().integer().positive().required()
      .messages({
        'any.required': 'معرف المخزن مطلوب'
      }),
    
    toWarehouseId: Joi.number().integer().positive().optional()
      .when('movementType', {
        is: Joi.string().valid('transfer_out', 'transfer_in'),
        then: Joi.required()
          .messages({
            'any.required': 'المخزن المستقبل مطلوب للنقل'
          })
      }),
    
    quantity: Joi.number().integer().min(1).required()
      .messages({
        'number.min': 'الكمية يجب أن تكون على الأقل 1',
        'any.required': 'الكمية مطلوبة'
      }),
    
    unitCost: Joi.number().min(0).precision(2).optional(),
    totalCost: Joi.number().min(0).precision(2).optional(),
    
    referenceType: Joi.string().max(50).optional(),
    referenceId: Joi.number().integer().positive().optional(),
    
    batchNumber: Joi.string().max(50).optional(),
    expiryDate: Joi.date().optional(),
    
    notes: Joi.string().max(500).optional()
  }),

  // Get movements query
  getMovements: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    warehouseId: Joi.number().integer().positive().optional(),
    itemId: Joi.number().integer().positive().optional(),
    movementType: Joi.string().optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().optional(),
    referenceType: Joi.string().max(50).optional()
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
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50)
  }),

  // Create expense
  createExpense: Joi.object({
    categoryId: Joi.number().integer().positive().required()
      .messages({
        'any.required': 'فئة المصروف مطلوبة',
        'number.positive': 'فئة المصروف غير صحيحة'
      }),
    
    vendorId: Joi.number().integer().positive().allow(null).optional(),
    
    amount: Joi.number().min(0).precision(2).required()
      .messages({
        'number.min': 'المبلغ يجب أن يكون أكبر من أو يساوي صفر',
        'any.required': 'المبلغ مطلوب'
      }),
    
    description: Joi.string().max(1000).allow('', null).optional(),
    
    expenseDate: Joi.date().iso().required()
      .messages({
        'date.base': 'تاريخ المصروف غير صحيح',
        'any.required': 'تاريخ المصروف مطلوب'
      }),
    
    invoiceId: Joi.number().integer().positive().allow(null).optional(),
    
    receiptUrl: Joi.string().uri().max(500).allow('', null).optional(),
    
    notes: Joi.string().max(2000).allow('', null).optional()
  }),

  // Update expense
  updateExpense: Joi.object({
    categoryId: Joi.number().integer().positive().optional(),
    vendorId: Joi.number().integer().positive().allow(null).optional(),
    amount: Joi.number().min(0).precision(2).optional(),
    description: Joi.string().max(1000).allow('', null).optional(),
    expenseDate: Joi.date().iso().optional(),
    invoiceId: Joi.number().integer().positive().allow(null).optional(),
    receiptUrl: Joi.string().uri().max(500).allow('', null).optional(),
    notes: Joi.string().max(2000).allow('', null).optional()
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
  expenseCategorySchemas
};

